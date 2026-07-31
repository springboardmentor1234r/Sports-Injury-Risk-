import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { successResponse } from '../utils/apiResponse.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_REQUEST_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const RESET_REQUEST_MESSAGE = 'If an account exists for that email, a verification code has been sent.';

const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');
const clearResetOtp = (user) => {
  user.resetOtp = undefined;
  user.resetOtpExpires = undefined;
  user.resetOtpAttempts = undefined;
  user.resetOtpRequestedAt = undefined;
};

const createMailer = () => nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendResetOtpEmail = async (email, otp) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email service is not configured');
  }

  await createMailer().sendMail({
    from: `KineGuard AI <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your KineGuard AI password reset code',
    html: `<div style="font-family:Arial,sans-serif;background:#fff7ed;padding:32px;color:#1f2937"><div style="max-width:560px;margin:auto;background:#ffffff;border:1px solid #fdba74;border-radius:18px;overflow:hidden"><div style="background:linear-gradient(90deg,#f97316,#ea580c);padding:24px;color:#ffffff"><h1 style="margin:0;font-size:24px">KineGuard AI</h1><p style="margin:8px 0 0">Sports Injury Risk Detection</p></div><div style="padding:30px"><h2 style="margin-top:0">Password reset verification</h2><p>Use the verification code below to reset your password. It expires in <strong>10 minutes</strong>.</p><div style="margin:24px 0;padding:18px;text-align:center;background:#fff7ed;border:1px dashed #fdba74;border-radius:12px;font-size:30px;font-weight:700;letter-spacing:8px;color:#ea580c">${otp}</div><p style="font-size:14px;color:#4b5563">For your security, never share this code. If you did not request a password reset, you can safely ignore this email.</p></div><div style="padding:18px 30px;background:#fff7ed;color:#4b5563;font-size:12px">Please do not reply to this automated email.</div></div></div>`,
  });
};

const getResetUser = (email) => User.findOne({ email: email.toLowerCase() }).select('+password +resetOtp +resetOtpExpires +resetOtpAttempts +resetOtpRequestedAt');

const validatePassword = (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);

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

export const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      res.status(400);
      throw new Error('Please provide a valid email address');
    }

    const user = await getResetUser(email);
    if (!user) return res.status(200).json(successResponse(null, RESET_REQUEST_MESSAGE));

    if (user.resetOtpRequestedAt && Date.now() - user.resetOtpRequestedAt.getTime() < OTP_REQUEST_COOLDOWN_MS) {
      return res.status(429).json({ success: false, message: 'Please wait before requesting another OTP.' });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    user.resetOtp = hashOtp(otp);
    user.resetOtpExpires = new Date(Date.now() + OTP_EXPIRY_MS);
    user.resetOtpAttempts = 0;
    user.resetOtpRequestedAt = new Date();
    await user.save({ validateBeforeSave: false });

    try {
      await sendResetOtpEmail(user.email, otp);
    } catch (emailError) {
      clearResetOtp(user);
      await user.save({ validateBeforeSave: false });
      throw emailError;
    }

    return res.status(200).json(successResponse(null, RESET_REQUEST_MESSAGE));
  } catch (error) {
    next(error);
  }
};

export const verifyResetOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !/^\S+@\S+\.\S+$/.test(email) || !/^\d{6}$/.test(otp || '')) {
      res.status(400);
      throw new Error('Please provide a valid email and 6-digit code');
    }

    const user = await getResetUser(email);
    if (!user || !user.resetOtp || !user.resetOtpExpires || user.resetOtpExpires.getTime() <= Date.now()) {
      if (user?.resetOtp) { clearResetOtp(user); await user.save({ validateBeforeSave: false }); }
      res.status(400);
      throw new Error('This code is invalid or has expired. Request a new code.');
    }

    if (user.resetOtpAttempts >= MAX_OTP_ATTEMPTS) {
      clearResetOtp(user);
      await user.save({ validateBeforeSave: false });
      res.status(400);
      throw new Error('Too many incorrect attempts. Request a new code.');
    }

    if (!crypto.timingSafeEqual(Buffer.from(user.resetOtp, 'hex'), Buffer.from(hashOtp(otp), 'hex'))) {
      user.resetOtpAttempts += 1;
      if (user.resetOtpAttempts >= MAX_OTP_ATTEMPTS) clearResetOtp(user);
      await user.save({ validateBeforeSave: false });
      res.status(400);
      throw new Error(user.resetOtpAttempts ? 'Incorrect verification code.' : 'Too many incorrect attempts. Request a new code.');
    }

    return res.status(200).json(successResponse(null, 'Code verified successfully.'));
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !/^\S+@\S+\.\S+$/.test(email) || !/^\d{6}$/.test(otp || '')) {
      res.status(400);
      throw new Error('Please provide a valid email and 6-digit code');
    }
    if (!validatePassword(password || '')) {
      res.status(400);
      throw new Error('Password must contain at least 8 characters, including uppercase, lowercase, number, and special character.');
    }

    const user = await getResetUser(email);
    if (!user || !user.resetOtp || !user.resetOtpExpires || user.resetOtpExpires.getTime() <= Date.now() || user.resetOtpAttempts >= MAX_OTP_ATTEMPTS || !crypto.timingSafeEqual(Buffer.from(user.resetOtp, 'hex'), Buffer.from(hashOtp(otp), 'hex'))) {
      if (user?.resetOtp && user.resetOtpExpires?.getTime() <= Date.now()) { clearResetOtp(user); await user.save({ validateBeforeSave: false }); }
      res.status(400);
      throw new Error('This code is invalid or has expired. Request a new code.');
    }

    user.password = password;
    clearResetOtp(user);
    await user.save();
    return res.status(200).json(successResponse(null, 'Password reset successfully. Please sign in with your new password.'));
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
