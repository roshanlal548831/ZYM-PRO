import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createServer } from 'node:http';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';
import { io as createSocketClient } from 'socket.io-client';

const imageServiceMocks = vi.hoisted(() => ({
  uploadImage: vi.fn(),
  deletePreviousImage: vi.fn()
}));

vi.mock('../src/services/notificationService.js', () => ({
  notifyEmail: vi.fn().mockResolvedValue({}),
  notifyWhatsApp: vi.fn().mockResolvedValue({}),
  deliverNotification: vi.fn().mockResolvedValue({})
}));
vi.mock('../src/utils/generateOtp.js', () => ({ default: () => '123456' }));
vi.mock('../src/services/imageService.js', () => imageServiceMocks);

import app from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import User from '../src/models/User.js';
import MembershipPlan from '../src/models/MembershipPlan.js';
import Membership from '../src/models/Membership.js';
import Payment from '../src/models/Payment.js';
import Trainer from '../src/models/Trainer.js';
import WorkoutPlan from '../src/models/WorkoutPlan.js';
import Enquiry from '../src/models/Enquiry.js';
import AuditLog from '../src/models/AuditLog.js';
import { closeRealtimeServer, initializeRealtimeServer } from '../src/services/realtimeService.js';

let mongo;
let admin;
let realtimeServer;
let realtimeUrl;

async function createMember(email = 'member@example.com', phone) {
  const agent = request.agent(app);
  await agent.post('/api/v1/auth/register').send({ name: 'Gym Member', email, phone, password: 'secure-password-123' }).expect(201);
  await agent.post('/api/v1/auth/verify-email-otp').send({ email, otp: '123456' }).expect(200);
  return { agent, email };
}

function csrfFrom(response) {
  const cookie = response.headers['set-cookie'].find((item) => item.startsWith('csrfToken='));
  return cookie.split(';')[0].split('=')[1];
}

async function login(email, password) {
  const agent = request.agent(app);
  const response = await agent.post('/api/v1/auth/login').send({ email, password }).expect(200);
  const cookies = response.headers['set-cookie'].map((cookie) => cookie.split(';')[0]).join('; ');
  return { agent, csrf: csrfFrom(response), cookies };
}

function connectSocket(cookies) {
  const socket = createSocketClient(realtimeUrl, {
    transports: ['websocket'],
    extraHeaders: cookies ? { Cookie: cookies } : {},
    reconnection: false,
    timeout: 3000,
  });
  return new Promise((resolve, reject) => {
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', (error) => {
      socket.close();
      reject(error);
    });
  });
}

function nextRealtimeChange(socket) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Realtime event was not received')), 3000);
    socket.once('data:changed', (event) => {
      clearTimeout(timeout);
      resolve(event);
    });
  });
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await connectDatabase(mongo.getUri());
  realtimeServer = createServer(app);
  initializeRealtimeServer(realtimeServer);
  await new Promise((resolve) => realtimeServer.listen(0, '127.0.0.1', resolve));
  realtimeUrl = `http://127.0.0.1:${realtimeServer.address().port}`;
});

beforeEach(async () => {
  imageServiceMocks.uploadImage.mockReset();
  imageServiceMocks.deletePreviousImage.mockReset();
  await Promise.all(mongoose.connection.collections ? Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})) : []);
  admin = await User.create({
    name: 'Gym Admin', email: 'admin@example.com', password: await bcrypt.hash('admin-password-123', 12),
    role: 'admin', isEmailVerified: true, isActive: true
  });
});

afterAll(async () => {
  await closeRealtimeServer();
  await disconnectDatabase();
  await mongo?.stop();
});

describe('auth and access control', () => {
  it('validates registration, verifies OTP, signs in, and logs out', async () => {
    const invalid = await request(app).post('/api/v1/auth/register').send({ email: 'bad' }).expect(400);
    expect(invalid.body.success).toBe(false);
    const account = await createMember();
    await account.agent.get('/api/v1/auth/me').expect(200);
    await request(app).post('/api/v1/auth/register').send({
      name: 'Duplicate Member', email: account.email, password: 'secure-password-123'
    }).expect(409);
    const resend = await request(app).post('/api/v1/auth/resend-otp').send({
      email: 'unknown@example.com', purpose: 'signup'
    }).expect(200);
    expect(resend.body).toMatchObject({ success: true, data: {} });
    const loginResult = await login(account.email, 'secure-password-123');
    await loginResult.agent.get('/api/v1/auth/me').expect(200);
    await loginResult.agent.post('/api/v1/auth/logout').set('X-CSRF-Token', loginResult.csrf).expect(200);
    await loginResult.agent.get('/api/v1/auth/me').expect(401);
  });

  it('keeps forgot-password responses generic and revokes sessions after reset', async () => {
    const account = await createMember();
    const signedIn = await login(account.email, 'secure-password-123');
    await request(app).post('/api/v1/auth/forgot-password').send({ identifier: account.email }).expect(200);
    await request(app).post('/api/v1/auth/forgot-password').send({ identifier: 'missing@example.com' }).expect(200);
    const verified = await request(app).post('/api/v1/auth/verify-reset-otp').send({ identifier: account.email, otp: '123456' }).expect(200);
    const resetCookie = verified.headers['set-cookie'].find((item) => item.startsWith('resetToken=')).split(';')[0];
    await request(app).post('/api/v1/auth/reset-password').set('Cookie', resetCookie).send({ password: 'new-secure-password-456' }).expect(200);
    await signedIn.agent.get('/api/v1/auth/me').expect(401);
    await login(account.email, 'new-secure-password-456');
  });

  it('verifies a member phone and supports password reset by verified phone', async () => {
    const account = await createMember('phone@example.com', '+919876543210');
    const signedIn = await login(account.email, 'secure-password-123');
    await signedIn.agent.post('/api/v1/auth/resend-phone-otp').set('X-CSRF-Token', signedIn.csrf).send({}).expect(200);
    await signedIn.agent.post('/api/v1/auth/verify-phone-otp').set('X-CSRF-Token', signedIn.csrf).send({ otp: '123456' }).expect(200);
    await request(app).post('/api/v1/auth/forgot-password').send({ identifier: '+919876543210' }).expect(200);
    const verified = await request(app).post('/api/v1/auth/verify-reset-otp').send({ identifier: '+919876543210', otp: '123456' }).expect(200);
    const resetCookie = verified.headers['set-cookie'].find((item) => item.startsWith('resetToken=')).split(';')[0];
    await request(app).post('/api/v1/auth/reset-password').set('Cookie', resetCookie).send({ password: 'phone-reset-password-789' }).expect(200);
    await login(account.email, 'phone-reset-password-789');
  });

  it('blocks member access to admin APIs and protects private resources by owner', async () => {
    const first = await createMember('first@example.com');
    const second = await createMember('second@example.com');
    const firstLogin = await login(first.email, 'secure-password-123');
    await firstLogin.agent.get('/api/v1/admin/dashboard').expect(403);
    const plan = await MembershipPlan.create({ name: 'Monthly', price: 1000, durationDays: 30 });
    const membership = await firstLogin.agent.post('/api/v1/memberships').set('X-CSRF-Token', firstLogin.csrf).send({ planId: String(plan._id) }).expect(201);
    const adminLogin = await login('admin@example.com', 'admin-password-123');
    const payment = await adminLogin.agent.post('/api/v1/payments').set('X-CSRF-Token', adminLogin.csrf).send({
      memberId: String((await User.findOne({ email: first.email }))._id), membershipId: membership.body.data.membership._id,
      amount: 1000, method: 'cash'
    }).expect(201);
    const secondLogin = await login(second.email, 'secure-password-123');
    await secondLogin.agent.get(`/api/v1/payments/${payment.body.data.payment._id}`).expect(403);
    await expect(Membership.findById(membership.body.data.membership._id)).resolves.toMatchObject({ status: 'active', paymentStatus: 'paid' });
    await adminLogin.agent.get('/api/v1/admin/dashboard').expect(200);
    await adminLogin.agent.get('/api/v1/payments?page=1&limit=10&status=paid').expect(200);

    await MembershipPlan.updateOne({ _id: plan._id }, { $set: { price: 1500 } });
    const renewal = await firstLogin.agent.post(`/api/v1/memberships/${membership.body.data.membership._id}/renew`).set('X-CSRF-Token', firstLogin.csrf).send({}).expect(201);
    expect(renewal.body.data.membership.amountDue).toBe(1500);
    expect(new Date(renewal.body.data.membership.startDate).getTime()).toBe(new Date(membership.body.data.membership.endDate).getTime());
    await firstLogin.agent.post(`/api/v1/memberships/${membership.body.data.membership._id}/renew`).set('X-CSRF-Token', firstLogin.csrf).send({}).expect(409);
    const renewedPayment = await adminLogin.agent.post('/api/v1/payments').set('X-CSRF-Token', adminLogin.csrf).send({
      memberId: String((await User.findOne({ email: first.email }))._id), membershipId: renewal.body.data.membership._id, amount: 1500, method: 'upi'
    }).expect(201);
    expect(renewedPayment.body.data.payment.status).toBe('paid');
    await adminLogin.agent.post(`/api/v1/payments/${renewedPayment.body.data.payment._id}/refund`).set('X-CSRF-Token', adminLogin.csrf).send({ reason: 'Member requested a refund' }).expect(200);
    const refunded = await Payment.findById(renewedPayment.body.data.payment._id);
    expect(refunded.statusHistory.map((entry) => entry.status)).toEqual(['pending', 'paid', 'refunded']);
  });

  it('rejects duplicate confirmation and records payment history', async () => {
    await createMember();
    const member = await User.findOne({ email: 'member@example.com' });
    const plan = await MembershipPlan.create({ name: 'Monthly', price: 1200, durationDays: 30 });
    const membership = await Membership.create({ user: member._id, membershipPlan: plan._id, amountDue: plan.price, startDate: new Date(Date.now() - 60_000), endDate: new Date(Date.now() + 30 * 86400_000), createdBy: member._id });
    const administrator = await login('admin@example.com', 'admin-password-123');
    const result = await administrator.agent.post('/api/v1/payments').set('X-CSRF-Token', administrator.csrf).send({ memberId: String(member._id), membershipId: String(membership._id), amount: 1200, method: 'upi' }).expect(201);
    const paymentId = result.body.data.payment._id;
    expect(result.body.data.payment.receiptNumber).toMatch(/^ZYM-/);
    await administrator.agent.patch(`/api/v1/payments/${paymentId}/confirm`).set('X-CSRF-Token', administrator.csrf).expect(409);
    const saved = await Payment.findById(paymentId);
    expect(saved.statusHistory.map((entry) => entry.status)).toEqual(['pending', 'paid']);
  });

  it('returns a healthy public endpoint and safely handles unknown routes', async () => {
    await request(app).get('/api/v1/health').expect(200);
    const missing = await request(app).get('/api/v1/not-a-route').expect(404);
    expect(missing.body).toMatchObject({ success: false, message: 'Route not found', errors: [] });
  });

  it('checks authentication and role requirements across protected route families', async () => {
    const protectedRoutes = [
      ['get', '/api/v1/auth/me'],
      ['post', '/api/v1/auth/resend-phone-otp'],
      ['post', '/api/v1/auth/verify-phone-otp'],
      ['post', '/api/v1/auth/logout'],
      ['patch', '/api/v1/auth/change-password'],
      ['get', '/api/v1/users/me'],
      ['patch', '/api/v1/users/me'],
      ['post', '/api/v1/membership-plans'],
      ['patch', `/api/v1/membership-plans/${new mongoose.Types.ObjectId()}`],
      ['delete', `/api/v1/membership-plans/${new mongoose.Types.ObjectId()}`],
      ['post', '/api/v1/memberships'],
      ['get', '/api/v1/memberships/my'],
      ['get', '/api/v1/memberships'],
      ['patch', `/api/v1/memberships/${new mongoose.Types.ObjectId()}/status`],
      ['post', `/api/v1/memberships/${new mongoose.Types.ObjectId()}/renew`],
      ['post', '/api/v1/payments'],
      ['get', '/api/v1/payments/my'],
      ['get', '/api/v1/payments'],
      ['get', `/api/v1/payments/${new mongoose.Types.ObjectId()}`],
      ['patch', `/api/v1/payments/${new mongoose.Types.ObjectId()}/confirm`],
      ['post', `/api/v1/payments/${new mongoose.Types.ObjectId()}/refund`],
      ['post', '/api/v1/trainers'],
      ['patch', `/api/v1/trainers/${new mongoose.Types.ObjectId()}`],
      ['delete', `/api/v1/trainers/${new mongoose.Types.ObjectId()}`],
      ['get', '/api/v1/enquiries'],
      ['patch', `/api/v1/enquiries/${new mongoose.Types.ObjectId()}`],
      ['get', '/api/v1/workouts/my'],
      ['post', '/api/v1/workouts'],
      ['patch', `/api/v1/workouts/${new mongoose.Types.ObjectId()}`],
      ['delete', `/api/v1/workouts/${new mongoose.Types.ObjectId()}`],
      ['get', '/api/v1/admin/dashboard'],
      ['get', '/api/v1/admin/members'],
      ['patch', `/api/v1/admin/members/${new mongoose.Types.ObjectId()}/status`],
      ['get', '/api/v1/admin/payments/summary'],
      ['get', '/api/v1/admin/memberships/expiring'],
      ['get', '/api/v1/admin/enquiries'],
      ['patch', `/api/v1/admin/enquiries/${new mongoose.Types.ObjectId()}`],
      ['get', '/api/v1/admin/notifications'],
      ['get', '/api/v1/notifications']
    ];
    for (const [method, path] of protectedRoutes) await request(app)[method](path).expect(401);

    await request(app).get('/api/v1/membership-plans').expect(200);
    await request(app).get('/api/v1/trainers').expect(200);

    const member = await createMember('role-check@example.com');
    const signedIn = await login(member.email, 'secure-password-123');
    const adminOnlyRoutes = [
      ['get', '/api/v1/memberships'],
      ['get', '/api/v1/payments'],
      ['post', '/api/v1/payments'],
      ['get', '/api/v1/enquiries'],
      ['get', '/api/v1/admin/dashboard'],
      ['get', '/api/v1/admin/members'],
      ['get', '/api/v1/admin/payments/summary'],
      ['get', '/api/v1/admin/memberships/expiring'],
      ['get', '/api/v1/admin/enquiries'],
      ['get', '/api/v1/admin/notifications'],
      ['get', '/api/v1/notifications']
    ];
    for (const [method, path] of adminOnlyRoutes) {
      const req = signedIn.agent[method](path);
      if (method !== 'get') req.set('X-CSRF-Token', signedIn.csrf);
      await req.expect(403);
    }
  });

  it('covers membership plan and trainer reads, validation, CRUD and missing resources', async () => {
    const member = await createMember('catalog-member@example.com');
    const memberLogin = await login(member.email, 'secure-password-123');
    await memberLogin.agent.post('/api/v1/membership-plans').set('X-CSRF-Token', memberLogin.csrf).send({}).expect(403);
    await request(app).post('/api/v1/membership-plans').send({}).expect(401);

    const adminLogin = await login('admin@example.com', 'admin-password-123');
    await request(app).get('/api/v1/membership-plans').expect(200);
    const plan = await adminLogin.agent.post('/api/v1/membership-plans').set('X-CSRF-Token', adminLogin.csrf).send({
      name: 'Quarterly', price: 2500, durationDays: 90, features: ['Gym access']
    }).expect(201);
    await adminLogin.agent.post('/api/v1/membership-plans').set('X-CSRF-Token', adminLogin.csrf).send({
      name: 'x', price: -1, durationDays: 0
    }).expect(400);
    const planId = plan.body.data.plan._id;
    await adminLogin.agent.patch(`/api/v1/membership-plans/${planId}`).set('X-CSRF-Token', adminLogin.csrf).send({ price: 2700 }).expect(200);
    await adminLogin.agent.patch('/api/v1/membership-plans/not-an-id').set('X-CSRF-Token', adminLogin.csrf).send({ price: 2700 }).expect(400);
    await adminLogin.agent.patch(`/api/v1/membership-plans/${new mongoose.Types.ObjectId()}`).set('X-CSRF-Token', adminLogin.csrf).send({ price: 2700 }).expect(404);
    await adminLogin.agent.delete(`/api/v1/membership-plans/${planId}`).set('X-CSRF-Token', adminLogin.csrf).expect(200);

    await request(app).get('/api/v1/trainers').expect(200);
    const trainer = await adminLogin.agent.post('/api/v1/trainers').set('X-CSRF-Token', adminLogin.csrf).send({
      name: 'Taylor Coach', specialization: 'Strength training', experienceYears: 8
    }).expect(201);
    await adminLogin.agent.post('/api/v1/trainers').set('X-CSRF-Token', adminLogin.csrf).send({
      name: 'T', specialization: 'Strength', experienceYears: -1
    }).expect(400);
    const trainerId = trainer.body.data.trainer._id;
    await adminLogin.agent.patch(`/api/v1/trainers/${trainerId}`).set('X-CSRF-Token', adminLogin.csrf).send({ experienceYears: 9 }).expect(200);
    await adminLogin.agent.patch(`/api/v1/trainers/${new mongoose.Types.ObjectId()}`).set('X-CSRF-Token', adminLogin.csrf).send({ experienceYears: 9 }).expect(404);
    await adminLogin.agent.delete(`/api/v1/trainers/${trainerId}`).set('X-CSRF-Token', adminLogin.csrf).expect(200);
    await expect(Trainer.findById(trainerId)).resolves.toMatchObject({ isActive: false });
  });

  it('covers member profile and password updates including conflict and invalid input', async () => {
    const first = await createMember('profile-one@example.com', '+919876543210');
    await createMember('profile-two@example.com', '+919876543211');
    const signedIn = await login(first.email, 'secure-password-123');

    await request(app).get('/api/v1/users/me').expect(401);
    await signedIn.agent.get('/api/v1/users/me').expect(200);
    await signedIn.agent.patch('/api/v1/users/me').set('X-CSRF-Token', signedIn.csrf).send({ name: 'Updated Member' }).expect(200);
    await signedIn.agent.patch('/api/v1/users/me').set('X-CSRF-Token', signedIn.csrf).send({ phone: '+919876543211' }).expect(409);
    await signedIn.agent.patch('/api/v1/users/me').set('X-CSRF-Token', signedIn.csrf).send({ role: 'admin' }).expect(400);
    await signedIn.agent.patch('/api/v1/users/me').set('X-CSRF-Token', signedIn.csrf).send({}).expect(400);

    await signedIn.agent.patch('/api/v1/auth/change-password').set('X-CSRF-Token', signedIn.csrf).send({
      currentPassword: 'incorrect-password', newPassword: 'updated-password-123'
    }).expect(400);
    await signedIn.agent.patch('/api/v1/auth/change-password').set('X-CSRF-Token', signedIn.csrf).send({
      currentPassword: 'secure-password-123', newPassword: 'updated-password-123'
    }).expect(200);
    await signedIn.agent.get('/api/v1/auth/me').expect(401);
    await login(first.email, 'updated-password-123');
  });

  it('uploads profile and trainer images and removes replaced or deactivated assets', async () => {
    const member = await createMember('image-profile@example.com');
    const memberLogin = await login(member.email, 'secure-password-123');
    const profile = await User.findOne({ email: member.email });
    await User.updateOne({ _id: profile._id }, { $set: { profileImage: 'https://res.cloudinary.com/demo/image/upload/v1/zym/profiles/old.png', profileImagePublicId: 'zym/profiles/old' } });
    imageServiceMocks.uploadImage.mockResolvedValueOnce({ url: 'https://res.cloudinary.com/demo/image/upload/v1/zym/profiles/new.png', publicId: 'zym/profiles/new' });

    const updatedProfile = await memberLogin.agent.patch('/api/v1/users/me')
      .set('X-CSRF-Token', memberLogin.csrf)
      .attach('image', Buffer.from('fake image'), { filename: 'profile.png', contentType: 'image/png' })
      .expect(200);
    expect(updatedProfile.body.data.user.profileImage).toContain('/zym/profiles/new.png');
    expect(updatedProfile.body.data.user.profileImagePublicId).toBeUndefined();
    expect(imageServiceMocks.uploadImage).toHaveBeenCalledWith(expect.any(Buffer), 'zym/profiles');
    expect(imageServiceMocks.deletePreviousImage).toHaveBeenCalledWith('zym/profiles/old', expect.stringContaining('/zym/profiles/old.png'), 'zym/profiles/new');
    await expect(User.findById(profile._id).select('+profileImagePublicId')).resolves.toMatchObject({ profileImagePublicId: 'zym/profiles/new' });

    const adminLogin = await login('admin@example.com', 'admin-password-123');
    imageServiceMocks.uploadImage.mockResolvedValueOnce({ url: 'https://res.cloudinary.com/demo/image/upload/v1/zym/trainers/coach.png', publicId: 'zym/trainers/coach' });
    const created = await adminLogin.agent.post('/api/v1/trainers')
      .set('X-CSRF-Token', adminLogin.csrf)
      .field('name', 'Image Coach')
      .field('specialization', 'Strength training')
      .field('experienceYears', '5')
      .attach('image', Buffer.from('fake image'), { filename: 'coach.png', contentType: 'image/png' })
      .expect(201);
    const trainerId = created.body.data.trainer._id;
    expect(created.body.data.trainer.imagePublicId).toBeUndefined();
    expect(await Trainer.findById(trainerId).select('+imagePublicId')).toMatchObject({ imagePublicId: 'zym/trainers/coach' });

    await adminLogin.agent.delete(`/api/v1/trainers/${trainerId}`).set('X-CSRF-Token', adminLogin.csrf).expect(200);
    expect(imageServiceMocks.deletePreviousImage).toHaveBeenLastCalledWith('zym/trainers/coach', expect.stringContaining('/zym/trainers/coach.png'));
    const deactivatedTrainer = await Trainer.findById(trainerId).select('+imagePublicId');
    expect(deactivatedTrainer.isActive).toBe(false);
    expect(deactivatedTrainer.imageUrl).toBeUndefined();
    expect(deactivatedTrainer.imagePublicId).toBeUndefined();
  });

  it('covers public enquiry creation and administrator enquiry workflows', async () => {
    await request(app).post('/api/v1/enquiries').send({
      name: 'Visitor One', email: 'visitor@example.com', phone: '+919876543219', message: 'Please share trial details'
    }).expect(201);
    await request(app).post('/api/v1/enquiries').send({ name: 'X', email: 'bad', phone: '12', message: 'Hi' }).expect(400);
    const enquiry = await Enquiry.findOne({ email: 'visitor@example.com' });
    const adminLogin = await login('admin@example.com', 'admin-password-123');
    await adminLogin.agent.get('/api/v1/enquiries').expect(200);
    await adminLogin.agent.get('/api/v1/admin/enquiries').expect(200);
    await adminLogin.agent.patch(`/api/v1/enquiries/${enquiry.id}`).set('X-CSRF-Token', adminLogin.csrf).send({ status: 'contacted' }).expect(200);
    await adminLogin.agent.patch(`/api/v1/admin/enquiries/${enquiry.id}`).set('X-CSRF-Token', adminLogin.csrf).send({ status: 'closed' }).expect(200);
    await adminLogin.agent.patch(`/api/v1/enquiries/${new mongoose.Types.ObjectId()}`).set('X-CSRF-Token', adminLogin.csrf).send({ status: 'closed' }).expect(404);
    await adminLogin.agent.patch(`/api/v1/enquiries/${enquiry.id}`).set('X-CSRF-Token', adminLogin.csrf).send({ status: 'invalid' }).expect(400);
  });

  it('covers member membership lifecycle and administrator membership controls', async () => {
    const member = await createMember('membership-lifecycle@example.com');
    const memberLogin = await login(member.email, 'secure-password-123');
    const adminLogin = await login('admin@example.com', 'admin-password-123');
    const plan = await MembershipPlan.create({ name: 'Annual', price: 9000, durationDays: 365 });

    await memberLogin.agent.post('/api/v1/memberships').set('X-CSRF-Token', memberLogin.csrf).send({ planId: 'invalid' }).expect(400);
    await memberLogin.agent.post('/api/v1/memberships').set('X-CSRF-Token', memberLogin.csrf).send({ planId: String(new mongoose.Types.ObjectId()) }).expect(404);
    const created = await memberLogin.agent.post('/api/v1/memberships').set('X-CSRF-Token', memberLogin.csrf).send({ planId: String(plan._id) }).expect(201);
    await memberLogin.agent.post('/api/v1/memberships').set('X-CSRF-Token', memberLogin.csrf).send({ planId: String(plan._id) }).expect(409);
    await memberLogin.agent.get('/api/v1/memberships/my').expect(200);
    await adminLogin.agent.get('/api/v1/memberships').expect(200);

    const membershipId = created.body.data.membership._id;
    await adminLogin.agent.patch(`/api/v1/memberships/${membershipId}/status`).set('X-CSRF-Token', adminLogin.csrf).send({ status: 'active' }).expect(409);
    await adminLogin.agent.patch(`/api/v1/memberships/${membershipId}/status`).set('X-CSRF-Token', adminLogin.csrf).send({ status: 'cancelled' }).expect(200);
    await adminLogin.agent.patch(`/api/v1/memberships/${membershipId}/status`).set('X-CSRF-Token', adminLogin.csrf).send({ status: 'bad' }).expect(400);
    await adminLogin.agent.patch(`/api/v1/memberships/${new mongoose.Types.ObjectId()}/status`).set('X-CSRF-Token', adminLogin.csrf).send({ status: 'cancelled' }).expect(409);
  });

  it('covers workout assignment, member visibility, administrator updates and missing resources', async () => {
    const member = await createMember('workout-member@example.com');
    const memberRecord = await User.findOne({ email: member.email });
    const memberLogin = await login(member.email, 'secure-password-123');
    const adminLogin = await login('admin@example.com', 'admin-password-123');
    await memberLogin.agent.get('/api/v1/workouts/my').expect(200);

    await adminLogin.agent.post('/api/v1/workouts').set('X-CSRF-Token', adminLogin.csrf).send({
      title: 'x', difficulty: 'expert', exercises: []
    }).expect(400);
    await adminLogin.agent.post('/api/v1/workouts').set('X-CSRF-Token', adminLogin.csrf).send({
      title: 'Strength basics', difficulty: 'beginner', assignedTo: String(admin._id),
      exercises: [{ name: 'Squat', sets: 3, reps: '10', restSeconds: 60 }]
    }).expect(400);
    const created = await adminLogin.agent.post('/api/v1/workouts').set('X-CSRF-Token', adminLogin.csrf).send({
      title: 'Strength basics', difficulty: 'beginner', assignedTo: String(memberRecord._id),
      exercises: [{ name: 'Squat', sets: 3, reps: '10', restSeconds: 60 }]
    }).expect(201);
    const workoutId = created.body.data.workout._id;
    const visible = await memberLogin.agent.get('/api/v1/workouts/my').expect(200);
    expect(visible.body.data.items.map((item) => item._id)).toContain(workoutId);
    await adminLogin.agent.patch(`/api/v1/workouts/${workoutId}`).set('X-CSRF-Token', adminLogin.csrf).send({ title: 'Strength plan' }).expect(200);
    await adminLogin.agent.patch(`/api/v1/workouts/${new mongoose.Types.ObjectId()}`).set('X-CSRF-Token', adminLogin.csrf).send({ title: 'Strength plan' }).expect(404);
    await adminLogin.agent.delete(`/api/v1/workouts/${workoutId}`).set('X-CSRF-Token', adminLogin.csrf).expect(200);
    await expect(WorkoutPlan.findById(workoutId)).resolves.toMatchObject({ isActive: false });
  });

  it('covers administrator dashboard, member status, payment summaries and notification lists', async () => {
    const member = await createMember('admin-read-member@example.com');
    const memberRecord = await User.findOne({ email: member.email });
    const adminLogin = await login('admin@example.com', 'admin-password-123');

    await adminLogin.agent.get('/api/v1/admin/dashboard').expect(200);
    await adminLogin.agent.get('/api/v1/admin/members').expect(200);
    await adminLogin.agent.get('/api/v1/admin/payments/summary?from=not-a-date').expect(400);
    await adminLogin.agent.get('/api/v1/admin/payments/summary').expect(200);
    await adminLogin.agent.get('/api/v1/admin/memberships/expiring').expect(200);
    await adminLogin.agent.get('/api/v1/admin/notifications').expect(200);
    await adminLogin.agent.get('/api/v1/notifications').expect(200);

    await adminLogin.agent.patch(`/api/v1/admin/members/${memberRecord.id}/status`).set('X-CSRF-Token', adminLogin.csrf).send({ isActive: false }).expect(200);
    await request(app).post('/api/v1/auth/login').send({ email: member.email, password: 'secure-password-123' }).expect(403);
    await adminLogin.agent.patch(`/api/v1/admin/members/${memberRecord.id}/status`).set('X-CSRF-Token', adminLogin.csrf).send({ isActive: 'no' }).expect(400);
    await adminLogin.agent.patch(`/api/v1/admin/members/${new mongoose.Types.ObjectId()}/status`).set('X-CSRF-Token', adminLogin.csrf).send({ isActive: true }).expect(404);
  });

  it('surfaces audit-log persistence failures without changing the successful API response', async () => {
    const adminLogin = await login('admin@example.com', 'admin-password-123');
    const createAuditLog = vi.spyOn(AuditLog, 'create').mockRejectedValueOnce(new Error('test-only persistence failure'));
    const logError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await adminLogin.agent.post('/api/v1/trainers').set('X-CSRF-Token', adminLogin.csrf).send({
      name: 'Audit Test Coach', specialization: 'Mobility', experienceYears: 4
    }).expect(201);
    await new Promise((resolve) => setImmediate(resolve));
    expect(logError).toHaveBeenCalledWith('Admin audit log persistence failed:', 'Error');

    createAuditLog.mockRestore();
    logError.mockRestore();
  });

  it('covers payment history, validation and missing payment responses without contacting a payment provider', async () => {
    const member = await createMember('payment-coverage@example.com');
    const memberRecord = await User.findOne({ email: member.email });
    const memberLogin = await login(member.email, 'secure-password-123');
    const adminLogin = await login('admin@example.com', 'admin-password-123');
    const plan = await MembershipPlan.create({ name: 'Payment plan', price: 1100, durationDays: 30 });
    const membership = await Membership.create({
      user: memberRecord._id, membershipPlan: plan._id, amountDue: plan.price,
      startDate: new Date(Date.now() - 60_000), endDate: new Date(Date.now() + 30 * 86400_000), createdBy: memberRecord._id
    });

    await memberLogin.agent.get('/api/v1/payments/my').expect(200);
    await adminLogin.agent.post('/api/v1/payments').set('X-CSRF-Token', adminLogin.csrf).send({
      memberId: String(memberRecord._id), membershipId: String(membership._id), amount: 1, method: 'cash'
    }).expect(400);
    await adminLogin.agent.post('/api/v1/payments').set('X-CSRF-Token', adminLogin.csrf).send({
      memberId: String(memberRecord._id), membershipId: String(membership._id), amount: 1100, method: 'cash'
    }).expect(201);
    await memberLogin.agent.get('/api/v1/payments/my').expect(200);
    await adminLogin.agent.get('/api/v1/payments?page=invalid').expect(400);
    await adminLogin.agent.get(`/api/v1/payments/${new mongoose.Types.ObjectId()}`).expect(404);
    await adminLogin.agent.patch(`/api/v1/payments/${new mongoose.Types.ObjectId()}/confirm`).set('X-CSRF-Token', adminLogin.csrf).expect(404);
    await adminLogin.agent.post(`/api/v1/payments/${new mongoose.Types.ObjectId()}/refund`).set('X-CSRF-Token', adminLogin.csrf).send({ reason: 'Member requested refund' }).expect(409);
    await adminLogin.agent.post(`/api/v1/payments/${new mongoose.Types.ObjectId()}/refund`).set('X-CSRF-Token', adminLogin.csrf).send({ reason: 'x' }).expect(400);
  });
});

describe('realtime updates', () => {
  it('allows public connections but rejects invalid session cookies', async () => {
    const publicSocket = await connectSocket('');
    try {
      await expect(connectSocket('accessToken=invalid-token')).rejects.toThrow('Authentication required');
    } finally {
      publicSocket.disconnect();
    }
  });

  it('notifies admins of enquiries and admins plus the member of membership/payment changes', async () => {
    const memberAccount = await createMember('realtime-member@example.com');
    const memberLogin = await login(memberAccount.email, 'secure-password-123');
    const adminLogin = await login('admin@example.com', 'admin-password-123');
    const adminSocket = await connectSocket(adminLogin.cookies);
    const memberSocket = await connectSocket(memberLogin.cookies);

    try {
      const enquiryEvent = nextRealtimeChange(adminSocket);
      await request(app).post('/api/v1/enquiries').send({
        name: 'Realtime Visitor', email: 'realtime-visitor@example.com', phone: '+919876543210',
        message: 'I would like a trial session', enquiryType: 'trial'
      }).expect(201);
      expect((await enquiryEvent).tags).toEqual(expect.arrayContaining(['Enquiries', 'Dashboard']));

      const plan = await MembershipPlan.create({ name: 'Realtime plan', price: 1200, durationDays: 30 });
      const adminMembershipEvent = nextRealtimeChange(adminSocket);
      const memberMembershipEvent = nextRealtimeChange(memberSocket);
      const membershipResponse = await memberLogin.agent.post('/api/v1/memberships')
        .set('X-CSRF-Token', memberLogin.csrf).send({ planId: String(plan._id) }).expect(201);
      expect((await adminMembershipEvent).tags).toEqual(expect.arrayContaining(['Memberships', 'Dashboard']));
      expect((await memberMembershipEvent).tags).toEqual(expect.arrayContaining(['Memberships', 'Dashboard']));

      const member = await User.findOne({ email: memberAccount.email });
      const adminPaymentEvent = nextRealtimeChange(adminSocket);
      const memberPaymentEvent = nextRealtimeChange(memberSocket);
      await adminLogin.agent.post('/api/v1/payments').set('X-CSRF-Token', adminLogin.csrf).send({
        memberId: String(member._id), membershipId: membershipResponse.body.data.membership._id,
        amount: 1200, method: 'cash'
      }).expect(201);
      expect((await adminPaymentEvent).tags).toEqual(expect.arrayContaining(['Payments', 'Memberships', 'Dashboard']));
      expect((await memberPaymentEvent).tags).toEqual(expect.arrayContaining(['Payments', 'Memberships', 'Dashboard']));
    } finally {
      adminSocket.disconnect();
      memberSocket.disconnect();
    }
  });
});