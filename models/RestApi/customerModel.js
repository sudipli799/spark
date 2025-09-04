const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    age: { type: Number, default: 0 },
    bio: { type: String, default: '' },
    website: { type: String, default: 0 },
    lockaccount: { type: Boolean, default: false },
    interests: { type: [String], default: [] },
    profileImage: { type: String, default: '' },
    token: { type: String, default: '' },
    wallet: { type: Number, default: 0 },
    subscription: { type: Number, default: 1 },
    date_profile: { type: Number, default: 0 },
    start_date: { type: Date, default: Date.now },
    end_date: { type: Date, default: Date.now },
    customer_status: { type: Number, default: 1 },
    customer_isDeleted: { type: Number, default: 0 },
    status: { type: Number, default: 1}
    
  }, { timestamps: true });

  const Customer = mongoose.model('VZ_customer', customerSchema, 'VZ_customer');
  

  const postSchema = new mongoose.Schema({
    customer_id: String,
    image: [String],
    song: String,
    detail: String,
    type: String,
    thumbnail: String,
    post_type: String,
    location: String,
    status: { type: Number, default: 1 },
    isDeleted: { type: Number, default: 0 }
  }, { timestamps: true });
  
  const Post = mongoose.model('VZ_post', postSchema, 'VZ_post');
  


  
  const songSchema = new mongoose.Schema({
    artist: String,
    image: String,
    song: String,
    detail: String,
    title: String,
    location: String,
    status: { type: Number, default: 1 },
    isDeleted: { type: Number, default: 0 }
  }, { timestamps: true });
  
  const Song = mongoose.model('VZ_song', songSchema, 'VZ_song');


  

  const followSchema = new mongoose.Schema({
    my_id: String,
    follow_id: String,
    follow_date: { type: Date, default: Date.now },
    follow_back: { type: Number, default: 0},
    status: { type: Number, default: 1 },
    isDeleted: { type: Number, default: 0 }
  }, { timestamps: true });
  
  const Follow = mongoose.model('VZ_follow', followSchema, 'VZ_follow');

  const PostLikeSchema = new mongoose.Schema({
    my_id: String,
    post_id: String,
    like_date: { type: Date, default: Date.now },
    status: { type: Number, default: 1 },
    isDeleted: { type: Number, default: 0 }
  }, { timestamps: true });
  
  const PostLike = mongoose.model('VZ_like', PostLikeSchema, 'VZ_like');


  const commentSchema = new mongoose.Schema({
  post_id: { type: String, required: true },             // Post ID
  user_id: { type: String, required: true },             // Commenting user ID
  parent_comment_id: { type: String, default: null },    // Null if it's a top-level comment, else it's a reply
  comment_text: { type: String, required: true },        // Comment or reply content
  like_count: { type: Number, default: 0 },
  reply_count: { type: Number, default: 0 },             // Optional: count of direct replies
  status: { type: Number, default: 1 },                  // 1 = active, 0 = hidden/inactive
  is_deleted: { type: Number, default: 0 },              // 1 = deleted (soft delete), 0 = visible
  comment_date: { type: Date, default: Date.now },
}, { timestamps: true });

commentSchema.index({ post_id: 1 });
commentSchema.index({ parent_comment_id: 1 });

const Comment = mongoose.model('VZ_comment', commentSchema, 'VZ_comment');
  


module.exports = {Customer, Post, Follow, Comment, Song, PostLike};
