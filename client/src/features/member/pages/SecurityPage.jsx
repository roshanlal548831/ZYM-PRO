import { useGetProfileQuery } from "../../api/gymApi.js";
import { useChangePasswordMutation, useResendPhoneOtpMutation, useVerifyPhoneOtpMutation } from "../../auth/authApi.js";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { getErrorMessage } from "../../../utils/errorUtils.js";
import { Button, Field, PageHeading } from "../../../components/common/UI.jsx";
import { z } from "zod";
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: z.string().min(8, 'Use at least 8 characters').max(128),
  confirmPassword: z.string()
}).refine(value => value.newPassword === value.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match'
});
export function SecurityPage() {
  const {
    data: profile
  } = useGetProfileQuery();
  const [changePassword, {
    isLoading: isChanging
  }] = useChangePasswordMutation();
  const [resend, {
    isLoading: isSending
  }] = useResendPhoneOtpMutation();
  const [verifyPhone, {
    isLoading: isVerifying
  }] = useVerifyPhoneOtpMutation();
  const [otp, setOtp] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors
    }
  } = useForm({
    resolver: zodResolver(passwordSchema)
  });
  async function submitPassword({
    currentPassword,
    newPassword
  }) {
    try {
      const response = await changePassword({
        currentPassword,
        newPassword
      }).unwrap();
      toast.success(response.message);
      reset();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }
  async function sendPhoneCode() {
    try {
      const response = await resend().unwrap();
      toast.success(response.message);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }
  async function submitPhoneCode(event) {
    event.preventDefault();
    try {
      const response = await verifyPhone({
        otp
      }).unwrap();
      toast.success(response.message);
      setOtp('');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }
  return <div className="page-enter"><PageHeading eyebrow="Account" title="Security" detail="Manage your password and verified phone number." /><div className="grid gap-5 xl:grid-cols-2"><section className="border border-neutral-200 bg-white p-5 md:p-7"><h2 className="text-2xl font-semibold">Change password</h2><form className="mt-5 grid gap-4" onSubmit={handleSubmit(submitPassword)}><Field label="Current password" type="password" autoComplete="current-password" error={errors.currentPassword?.message} {...register('currentPassword')} /><Field label="New password" type="password" autoComplete="new-password" error={errors.newPassword?.message} {...register('newPassword')} /><Field label="Confirm new password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} /><p className="text-xs text-neutral-500">Changing your password signs you out of current sessions.</p><Button className="w-fit" type="submit" disabled={isChanging}>{isChanging ? 'Updating...' : 'Update password'}</Button></form></section>
      <section className="border border-neutral-200 bg-white p-5 md:p-7"><h2 className="text-2xl font-semibold">Phone verification</h2><p className="mt-2 text-sm text-neutral-600">{profile?.phone ? `${profile.phone} Â· ${profile.isPhoneVerified ? 'verified' : 'not verified'}` : 'Add a phone number in your profile first.'}</p>{profile?.phone && !profile.isPhoneVerified && <><Button className="mt-5" variant="outline" disabled={isSending} onClick={sendPhoneCode}>{isSending ? 'Sending...' : 'Send verification code'}</Button><form className="mt-5 grid gap-4" onSubmit={submitPhoneCode}><Field label="6-digit code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={event => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} /><Button className="w-fit" type="submit" disabled={isVerifying || otp.length !== 6}>{isVerifying ? 'Verifying...' : 'Verify phone'}</Button></form></>}</section></div></div>;
}

