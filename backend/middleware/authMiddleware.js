const jwt = require("jsonwebtoken");

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET must be configured in production");
    }
    return "dev_jwt_secret";
  }
  return secret;
};

function authMiddleware(req, res, next) {
  const authHeader = (req.header("Authorization") || "").trim();
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  let token = String(bearerMatch ? bearerMatch[1] : authHeader)
    .trim()
    .replace(/^"|"$/g, "");
  token = token.replace(/^Bearer\s+/i, "").trim();

  if (!token || token === "null" || token === "undefined") {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

const exported = authMiddleware;
exported.authMiddleware = authMiddleware;
exported.getJwtSecret = getJwtSecret;
module.exports = exported;
