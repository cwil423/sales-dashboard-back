require('dotenv').config();

const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  // const token = req.header('x-auth-token');
  const { token } = req.cookies;

  // Check for token
  if (!token) res.status(401);

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Add user from payload
    req.user = decoded;
    next();
  } catch (e) {
    res.status(400);
  }
}

module.exports = auth;
