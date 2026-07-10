import jwt from 'jsonwebtoken';

/**
 * Generates a signed JWT for the given user id.
 * @param {string} id - MongoDB ObjectId of the user
 * @returns {string} signed JWT
 */
const generateToken = (user) => {
  const payload = typeof user === 'object'
    ? { id: user._id, role: user.role }
    : { id: user };

  return jwt.sign(payload, process.env.JWT_SECRET || 'supersecretjwtkey12345!', {
    expiresIn: '30d',
  });
};

export default generateToken;
