import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { successResponse } from '../utils/apiResponse.js';

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedRole = typeof role === 'string' ? role.trim().toLowerCase() : '';

    // Basic input validation
    if (!name || !email || !password || !normalizedRole) {
      res.status(400);
      throw new Error('Please provide name, email, password, and role');
    }

    if (!['athlete', 'coach'].includes(normalizedRole)) {
      res.status(400);
      throw new Error('Role must be either athlete or coach');
    }

    // Check for duplicate email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409);
      throw new Error('An account with that email already exists');
    }

    // Create user (password is hashed by the pre-save hook)
    const user = await User.create({ name, email, password, role: normalizedRole });

    res.status(201).json(successResponse({
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

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Authenticate user & return token
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    // Explicitly select password (excluded by default via `select: false`)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

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

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get currently authenticated user profile
// @route   GET /api/auth/me
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    // req.user is set by the protect middleware (full document, no password)
    const user = req.user;
    res.status(200).json(successResponse({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    }));
  } catch (error) {
    next(error);
  }
};
