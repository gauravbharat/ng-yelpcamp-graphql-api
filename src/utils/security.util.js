const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const mongodb = require('mongodb');

exports.generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECTRE, { expiresIn: '7 days' });
};

exports.getUserId = (request, requireAuth = true) => {
  // For Queries or Mutations, take from req.headers. 
  // For Subscriptions, from connection.context
  const header = request.req
    ? request.req.headers.authorization
    : request.connection.context.Authorization;

  if (header) {
    const token = header.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECTRE);
    if(!decoded || !decoded.userId) {
      throw new Error('Authentication required')
    }

    return mongodb.ObjectID(decoded.userId);
  }

  if (requireAuth) throw new Error('Authentication required');

  return null;
};

exports.hashPassword = (password) => {
  if (password.length < 8) {
    throw new Error('Password must be 8 characters or longer.');
  }

  return bcryptjs.hash(password, 10);
};

exports.matchPassword = (sendPassword, storedPassword) => {
  return bcryptjs.compare(sendPassword, storedPassword);
};