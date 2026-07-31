import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { successResponse } from '../utils/apiResponse.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * @desc    Authenticate user via Google ID Token (Login/Register)
 * @route   POST /api/auth/google-login
 * @access  Public
 */
export const googleLogin = async (req, res, next) => {
  try {
    const { token, role } = req.body;

    if (!token) {
      res.status(400);
      throw new Error('Google ID token is required');
    }

    // Verify Google ID Token
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (verifyError) {
      res.status(401);
      throw new Error('Invalid Google token');
    }

    const payload = ticket.getPayload();
    if (!payload) {
      res.status(401);
      throw new Error('Invalid token payload');
    }

    // Ensure email is verified by Google
    if (!payload.email_verified) {
      res.status(400);
      throw new Error('Google account email is not verified');
    }

    const email = payload.email.toLowerCase();
    const googleId = payload.sub;
    const name = payload.name;
    const profilePicture = payload.picture;

    // Search user by email
    let user = await User.findOne({ email });

    if (user) {
      // If user exists but is a local account, link Google details
      let updated = false;
      if (user.provider === 'local') {
        user.googleId = googleId;
        user.provider = 'google';
        updated = true;
      }
      if (profilePicture && !user.profilePicture) {
        user.profilePicture = profilePicture;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    } else {
      // Create a new user since no account exists with this email
      user = await User.create({
        name,
        email,
        googleId,
        provider: 'google',
        profilePicture,
        role: role || 'athlete',
      });
    }

    // Return authentication response in identical format
    res.status(200).json(successResponse({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user),
    }));
  } catch (error) {
    next(error);
  }
};
