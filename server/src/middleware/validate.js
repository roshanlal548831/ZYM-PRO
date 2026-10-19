import ApiError from '../utils/ApiError.js';

export default function validate(schemas) {
  return function validateRequest(req, res, next) {
    const issues = [];
    for (const key of ['body', 'params', 'query']) {
      const schema = schemas.shape?.[key] || schemas[key];
      if (!schema) continue;
      const result = schema.safeParse(req[key]);
      if (!result.success) {
        issues.push(...result.error.issues.map((issue) => ({
          field: `${key}.${issue.path.join('.')}`,
          message: issue.message
        })));
      } else {
        if (key === 'query') {
          req.validatedQuery = result.data;
        } else {
          req[key] = result.data;
        }
      }
    }
    if (issues.length) return next(new ApiError(400, 'Request validation failed', issues));
    next();
  };
}