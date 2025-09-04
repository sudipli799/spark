const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    userType: {
      type: String,
      enum: ['admin', 'user', 'moderator'],
      default: 'user'
    }
  }, { timestamps: true });

  const User = mongoose.model('VZ_admin', userSchema, 'VZ_admin');


module.exports = User;
