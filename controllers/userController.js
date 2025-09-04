const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

// Create new user (Register)
const createUser = async (req, res) => {
  try {
    const { name, email, username, password, userType = 'admin' } = req.body;

    // Basic validation
    if (!name || !email || !username || !password) {
      return res.status(400).json({ message: 'All fields are required: name, email, username, password' });
    }

    // Check if email or username already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email or Username already exists.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = await User.create({
      name,
      email,
      username,
      password: hashedPassword,
      userType,
    });

    res.status(201).json({
      message: 'Admin registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        userType: user.userType
      }
    });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ message: 'Email/Username and Password are required.' });
    }

    // Find user by email or username
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password.' });
    }

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        userType: user.userType
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all users
const getUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createUser, loginUser, getUsers };
