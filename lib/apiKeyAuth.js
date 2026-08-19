export default function apiKeyAuth(req, res, next) {
  const apiKey = process.env.API_KEY || '';
  if (!apiKey) return next(); // if no API_KEY set, do not enforce (useful for dev)

  const provided = req.header('x-api-key') || req.query.api_key || '';
  if (provided && provided === apiKey) return next();
  return res.status(401).json({ success: false, message: 'Unauthorized' });
}
