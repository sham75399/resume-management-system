const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    console.log('📝 REGISTRATION ATTEMPT:', req.body);

    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'Please provide all required fields' 
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ 
        message: 'User already exists with this email' 
      });
    }

    // Create user
    console.log('✅ Creating new user...');
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'recruiter'
    });

    console.log('✅ USER CREATED SUCCESSFULLY:', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token
    });

  } catch (error) {
    console.error('❌ REGISTRATION ERROR:', error.message);
    res.status(500).json({ 
      message: 'Server error during registration',
      error: error.message 
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    console.log('🔑 LOGIN ATTEMPT:', req.body.email);

    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Please provide email and password' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    
    console.log('👤 User found:', user ? 'Yes' : 'No');

    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    console.log('🔐 Password match:', isPasswordMatch ? 'Yes' : 'No');

    if (!isPasswordMatch) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    // Generate token
    const token = generateToken(user._id);

    console.log('✅ LOGIN SUCCESSFUL:', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token
    });

  } catch (error) {
    console.error('❌ LOGIN ERROR:', error.message);
    res.status(500).json({ 
      message: 'Server error during login',
      error: error.message 
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('❌ PROFILE ERROR:', error.message);
    res.status(500).json({ 
      message: 'Server error fetching profile' 
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (user) {
      user.name = name || user.name;
      user.email = email || user.email;
      
      const updatedUser = await user.save();
      
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        token: generateToken(updatedUser._id)
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('❌ UPDATE PROFILE ERROR:', error.message);
    res.status(500).json({ 
      message: 'Server error updating profile' 
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
    
  } catch (error) {
    console.error('❌ CHANGE PASSWORD ERROR:', error.message);
    res.status(500).json({ 
      message: 'Server error changing password' 
    });
  }
};

// @desc    Logout user (optional - client side only)
// @route   POST /api/auth/logout
// @access  Private
const logout = (req, res) => {
  // JWT tokens are stateless, so logout is handled client-side
  res.json({ message: 'Logged out successfully' });
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout
};