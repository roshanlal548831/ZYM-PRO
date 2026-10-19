import AuditLog from '../models/AuditLog.js';

export default function auditAdminAction(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  res.once('finish', () => {
    if (res.statusCode < 200 || res.statusCode >= 400 || !req.user) return;
    AuditLog.create({
      actor: req.user.id,
      action: `${req.method} ${req.baseUrl}${req.route?.path || req.path}`,
      method: req.method,
      resource: req.baseUrl,
      resourceId: req.params.id,
      responseStatus: res.statusCode,
      ip: req.ip,
      userAgent: req.get('user-agent')
    }).catch(() => {});
  });
  next();
}
