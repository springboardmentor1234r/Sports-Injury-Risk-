import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500);
    return next(new Error('Server misconfiguration: JWT secret is missing'));
  }

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, secret);

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        res.status(404);
        return next(new Error('User not found'));
      }
      return next();
    } catch (error) {
      res.status(401);
      return next(new Error('Not authorized, token failed'));
    }
  }

  if (!token) {
    res.status(401);
    return next(new Error('Not authorized, no token'));
  }
};
