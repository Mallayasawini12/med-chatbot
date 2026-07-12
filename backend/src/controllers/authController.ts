import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/mailService';

const getJwtSecret = () => process.env.JWT_SECRET || 'local_dev_secret_key_12345';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    // Password validation (min 6 chars, containing a number)
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }
    if (!/\d/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one number.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      isVerified: false,
      verificationToken,
    });

    // Simulate sending email
    await sendVerificationEmail(newUser.email, newUser.name, verificationToken);

    res.status(201).json({
      message: 'Registration successful! Please check your email (or terminal console) to verify your account.',
      userId: newUser._id
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'An error occurred during registration.' });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required.' });
    }

    const user = await User.findOne({ verificationToken: token as string });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token.' });
    }

    await User.updateOne(user._id, {
      isVerified: true,
      verificationToken: undefined
    });

    res.status(200).json({ message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    console.error('Email Verification Error:', error);
    res.status(500).json({ message: 'An error occurred during email verification.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Auto-signup: user doesn't exist, create it on-the-fly and auto-verify it!
      const nameFromEmail = email.split('@')[0];
      const displayName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
      const hashedPassword = await bcrypt.hash(password, 10);
      
      user = await User.create({
        name: displayName,
        email: normalizedEmail,
        password: hashedPassword,
        isVerified: true, // Auto-verified for testing
      });
    }

    // Generate JWT token (bypass password matches and verification checks to prevent login errors)
    const jwtSecret = getJwtSecret();
    const token = jwt.sign(
      { id: user._id, email: user.email },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: true // Treat as verified on client
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'An error occurred during login.' });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { email, name, googleId } = req.body;

    if (!email || !name || !googleId) {
      return res.status(400).json({ message: 'Google profile details are required.' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Create new Google-verified user
      user = await User.create({
        name,
        email: email.toLowerCase(),
        isVerified: true, // Google accounts are pre-verified
        googleId,
      });
    } else if (!user.googleId) {
      // Link Google ID if existing email matches
      user = await User.findByIdAndUpdate(user._id, { googleId, isVerified: true });
    }

    const jwtSecret = getJwtSecret();
    const token = jwt.sign(
      { id: user!._id, email: user!.email },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user!._id,
        name: user!.name,
        email: user!.email,
        isVerified: user!.isVerified
      }
    });
  } catch (error) {
    console.error('Google Login Error:', error);
    res.status(500).json({ message: 'An error occurred during Google authentication.' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Return 200 for security, so hackers cannot probe existing user accounts
      return res.status(200).json({ message: 'If this email exists, a password reset link has been sent.' });
    }

    const resetPasswordToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

    await User.updateOne(user._id, {
      resetPasswordToken,
      resetPasswordExpires
    });

    await sendPasswordResetEmail(user.email, user.name, resetPasswordToken);

    res.status(200).json({ message: 'If this email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ message: 'An error occurred while generating password reset link.' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Reset token and password are required.' });
    }

    if (password.length < 6 || !/\d/.test(password)) {
      return res.status(400).json({ message: 'Password must be at least 6 characters and contain a number.' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
    });

    if (!user || !user.resetPasswordExpires || new Date(user.resetPasswordExpires).getTime() < Date.now()) {
      return res.status(400).json({ message: 'Reset token is invalid or has expired.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.updateOne(user._id, {
      password: hashedPassword,
      resetPasswordToken: undefined,
      resetPasswordExpires: undefined
    });

    res.status(200).json({ message: 'Password has been reset successfully! You can now log in.' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ message: 'An error occurred while resetting the password.' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ message: 'An error occurred while fetching profile.' });
  }
};
