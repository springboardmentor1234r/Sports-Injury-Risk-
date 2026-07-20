import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never return password in queries by default
    },
    role: {
      type: String,
      enum: ['athlete', 'coach'],
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

// ── Hash password before saving ──────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  // Only hash if the password field was modified (handles updates too)
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance method: verify a plain-text password against the hash ────────────
userSchema.methods.matchPassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
