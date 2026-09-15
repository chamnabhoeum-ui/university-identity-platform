require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// ---------- JWT Verification Middleware ----------
function verifyToken(requiredRole) {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ message: 'Token expired' });
        }
        return res.status(401).json({ message: 'Invalid token' });
      }

      if (decoded.role !== requiredRole) {
        return res.status(403).json({ message: `Access denied: requires ${requiredRole} role` });
      }

      req.user = decoded;
      next();
    });
  };
}

// ---------- Public Routes (no token needed) ----------
app.use('/register', createProxyMiddleware({
  target: 'http://localhost:5001',
  changeOrigin: true,
  pathRewrite: {
    '^/': '/register/',
  },
}));

app.use('/auth', createProxyMiddleware({
  target: 'http://localhost:5002',
  changeOrigin: true,
  pathRewrite: {
    '^/': '/auth/',
  },
}));

// ---------- Protected Routes ----------
// NOTE: the "on.proxyReq" hook below forwards the caller's decoded identity
// (from the JWT) to the downstream service as headers, so Admin/User
// services know exactly who is calling without re-verifying the token.
app.use('/admin', verifyToken('admin'), createProxyMiddleware({
  target: 'http://localhost:5003',
  changeOrigin: true,
  pathRewrite: {
    '^/': '/admin/',
  },
  on: {
    proxyReq: (proxyReq, req) => {
      if (req.user) {
        proxyReq.setHeader('x-user-emailid', req.user.emailid);
        proxyReq.setHeader('x-user-role', req.user.role);
      }
    },
  },
}));

app.use('/user', verifyToken('user'), createProxyMiddleware({
  target: 'http://localhost:5004',
  changeOrigin: true,
  pathRewrite: {
    '^/': '/user/',
  },
  on: {
    proxyReq: (proxyReq, req) => {
      if (req.user) {
        proxyReq.setHeader('x-user-emailid', req.user.emailid);
        proxyReq.setHeader('x-user-role', req.user.role);
      }
    },
  },
}));

app.get('/', (req, res) => {
  res.send('API Gateway is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🌐 API Gateway running on port ${PORT}`);
});
