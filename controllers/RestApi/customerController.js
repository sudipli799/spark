const { Customer, Post, Song, Follow, Comment, PostLike } = require('../../models/RestApi/customerModel');
const argon2 = require('argon2');
const s3 = require('../../utils/s3');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create new user (Register)
const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, password, gender, token } = req.body;

    if (!name || !email || !phone || !password || !gender) {
      return res.status(400).json({ message: 'All fields are required: name, email, phone, gender' });
    }

    const existingCustomer = await Customer.findOne({ $or: [{ email }, { phone }] }).lean();

    if (existingCustomer) {
      if (existingCustomer.email === email) {
        return res.status(400).json({ message: 'Email already exists.' });
      }
      if (existingCustomer.phone === phone) {
        return res.status(400).json({ message: 'Phone number already exists.' });
      }
    }

    const hashedPassword = await argon2.hash(password);

    const newCustomer = await Customer.create({
      name,
      email,
      phone,
      password: hashedPassword,
      gender,
      token,
      profileImage:'https://cdn-icons-png.flaticon.com/512/1160/1160865.png',
      role: null, // default values
      subscription_plan: 1,
      account_status: 1,
      customer_status: 1,
    });

    return res.status(201).json({
      status: true,
      // msg: 'Customer added successfully!',
      customer_detail: {
        customer_id: newCustomer._id,
        customer_name: newCustomer.name,
        customer_email: newCustomer.email,
        customer_phone: newCustomer.phone,
        role: newCustomer.role,
        subscription_plan: newCustomer.subscription_plan,
        account_status: newCustomer.account_status,
        customer_status: newCustomer.customer_status,
        otp: 1234, // Replace with actual OTP logic if needed
      },
    });

  } catch (error) {
    console.error('createCustomer error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const checknumber = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ status: false, message: 'Phone number is required.' });
    }

    const existingCustomer = await Customer.findOne({ phone }).lean();

    if (existingCustomer) {
      // Phone number already exists
      return res.status(200).json({
        status: false,
        otp: ''
      });
    } else {
      // Phone number is new, generate OTP (static here)
      const otp = 1234;

      return res.status(200).json({
        status: true,
        otp: otp
      });
    }

  } catch (error) {
    console.error('checknumber error:', error);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};




// Login API
const loginCustomer = async (req, res) => {
  try {
    const { phone, password, token } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ status: false, message: 'Phone & Password are required.' });
    }

    const customer = await Customer.findOne({ phone });
    if (!customer) {
      return res.status(404).json({ status: false, message: 'User not found.' });
    }

    const isMatch = await argon2.verify(customer.password, password);
    if (!isMatch) {
      return res.status(401).json({ status: false, message: 'Invalid password.' });
    }

    if (token) {
      await Customer.findByIdAndUpdate(customer._id, { token });
    }

    return res.status(200).json({
      status: true,
      customer_detail: {
        customer_id: customer._id,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        otp: 1234,
      },
    });

  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const customerId = req.params.id;

    const customer = await Customer.findById(customerId).select('-password -token');
    if (!customer) {
      return res.status(404).json({ status: false, message: 'Customer not found' });
    }

    const [totalFollowers, totalFollowing] = await Promise.all([
      Follow.countDocuments({ my_id: customerId }),
      Follow.countDocuments({ follow_id: customerId })
    ]);

    const [imagePosts, videoPosts] = await Promise.all([
      Post.find({ customer_id: customerId, type: 'Image', post_type: 'post' }).sort({ createdAt: -1 }),
      Post.find({ customer_id: customerId, type: 'Video', post_type: 'reel' }).sort({ createdAt: -1 })
    ]);

    // 🔁 Replace image array with only the first image in imagePosts
    const processedImagePosts = imagePosts.map(post => {
      const postObj = post.toObject();
      return {
        ...postObj,
        image: Array.isArray(postObj.image) && postObj.image.length > 0 ? postObj.image[0] : null,
        images: postObj.image || []  // keep full array as `images`
      };
    });

    

    res.status(200).json({
      status: true,
      customer,
      followers: totalFollowers,
      following: totalFollowing,
      posts: {
        image: processedImagePosts,
        // imageRaw: imagePosts, 
        video: videoPosts
      }
    });

  } catch (error) {
    console.error('getProfile error:', error);
    res.status(500).json({ status: false, message: error.message });
  }
};


const uploadFiles = async (req, res) => {
  console.log('Incoming files:', req.files);
console.log('Incoming body:', req.body);
  try {
    if (!req.files || !req.files.image || req.files.image.length === 0) {
      return res.status(400).json({ message: 'You must upload at least one image.' });
    }

    const images = req.files.image;

    const uploadFileToS3 = async (file) => {
      const fileExt = path.extname(file.originalname);
      const fileName = `${uuidv4()}-image${fileExt}`;

      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      const data = await s3.upload(params).promise();
      return data.Location;
    };

    // Upload all images in parallel and get array of URLs
    const imageUrls = await Promise.all(images.map(file => uploadFileToS3(file)));

    const { customer_id, detail, type, location, song } = req.body;

    const newPost = new Post({
      customer_id,
      detail,
      post_type:'post',
      image: imageUrls,  // Save array of image URLs
      song,
      type,
      location
    });

    const savedPost = await newPost.save();

    res.status(200).json({
      status: true,
      message: 'Post uploaded and saved successfully',
      post: savedPost,
    });

  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Failed to upload files', error: error.message });
  }
};

const uploadReel = async (req, res) => {
  console.log('Incoming files:', req.files);
  console.log('Incoming body:', req.body);

  try {
    if (!req.files || !req.files.image || req.files.image.length === 0) {
      return res.status(400).json({ message: 'You must upload at least one image.' });
    }

    const images = req.files.image;
    const thumbnail = req.files.thumbnail?.[0]; // Access the first thumbnail if provided

    const uploadFileToS3 = async (file, label = 'image') => {
      const fileExt = path.extname(file.originalname);
      const fileName = `${uuidv4()}-${label}${fileExt}`;

      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      const data = await s3.upload(params).promise();
      return data.Location;
    };

    // Upload all images in parallel
    const imageUrls = await Promise.all(images.map(file => uploadFileToS3(file, 'image')));

    // Upload the thumbnail if it exists
    let thumbnailUrl = null;
    if (thumbnail) {
      thumbnailUrl = await uploadFileToS3(thumbnail, 'thumbnail');
    }

    const { customer_id, detail, type, location, song } = req.body;

    const newPost = new Post({
      customer_id,
      detail,
      post_type:'reel',
      image: imageUrls,
      thumbnail: thumbnailUrl,  // ✅ Save thumbnail URL
      song,
      type,
      location
    });

    const savedPost = await newPost.save();

    res.status(200).json({
      status: true,
      message: 'Post uploaded and saved successfully',
      post: savedPost,
    });

  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Failed to upload files', error: error.message });
  }
};


const uploadStory = async (req, res) => {
  console.log('Incoming files:', req.files);
  console.log('Incoming body:', req.body);

  try {
    if (!req.files || !req.files.image || req.files.image.length === 0) {
      return res.status(400).json({ message: 'You must upload at least one image.' });
    }

    const images = req.files.image;
    const thumbnail = req.files.thumbnail?.[0]; // Access the first thumbnail if provided

    const uploadFileToS3 = async (file, label = 'image') => {
      const fileExt = path.extname(file.originalname);
      const fileName = `${uuidv4()}-${label}${fileExt}`;

      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      const data = await s3.upload(params).promise();
      return data.Location;
    };

    // Upload all images in parallel
    const imageUrls = await Promise.all(images.map(file => uploadFileToS3(file, 'image')));

    // Upload the thumbnail if it exists
    let thumbnailUrl = null;
    if (thumbnail) {
      thumbnailUrl = await uploadFileToS3(thumbnail, 'thumbnail');
    }

    const { customer_id, detail, type, location, song } = req.body;

    const newPost = new Post({
      customer_id,
      detail,
      post_type:'story',
      image: imageUrls,
      thumbnail: thumbnailUrl,  // ✅ Save thumbnail URL
      song,
      type,
      location
    });

    const savedPost = await newPost.save();

    res.status(200).json({
      status: true,
      message: 'Post uploaded and saved successfully',
      post: savedPost,
    });

  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Failed to upload files', error: error.message });
  }
};



const follow = async (req, res) => {
  try {
    const { my_id, follow_id } = req.body;

    if (!my_id || !follow_id) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const follow = await Follow.create({
      my_id,
      follow_id
    });

    res.status(201).json({
      message: 'Followed successfully',
      follow: {
        id: follow._id
      }
    });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const followBack = async (req, res) => {
  try {
    const followId = req.params.id;

    const follow_b = await Follow.findById(followId);
    if (!follow_b) {
      return res.status(404).json({ status: false, message: 'Follow record not found' });
    }

    await Follow.findByIdAndUpdate(follow_b._id, { follow_back: 1 });

    const follow = await Follow.create({
      my_id: follow_b.follow_id,
      follow_id: follow_b.my_id,
      follow_back: 1
    });

    res.status(200).json({
      status: true,
      msg: "Record Updated"
    });

  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

const addCommentOrReply = async (req, res) => {
  try {
    const { post_id, user_id, comment_text, parent_comment_id } = req.body;

    if (!post_id || !user_id || !comment_text) {
      return res.status(400).json({ status: false, message: 'post_id, user_id, and comment_text are required.' });
    }

    const newComment = await Comment.create({
      post_id,
      user_id,
      comment_text,
      parent_comment_id: parent_comment_id || null
    });

    // If it's a reply, increase the reply_count of the parent comment
    if (parent_comment_id) {
      await Comment.findByIdAndUpdate(parent_comment_id, { $inc: { reply_count: 1 } });
    }

    return res.status(201).json({
      status: true,
      message: parent_comment_id ? 'Reply added successfully' : 'Comment added successfully',
      comment: newComment
    });

  } catch (error) {
    console.error('addCommentOrReply error:', error);
    res.status(500).json({ status: false, message: 'Internal Server Error' });
  }
};

const getCommentsWithReplies = async (req, res) => {
  try {
    const { post_id } = req.params;
    const currentUserId = req.user?._id || req.user?.id; // logged-in user id

    if (!post_id) {
      return res
        .status(400)
        .json({ status: false, message: "post_id is required" });
    }

    // Recursive function to build nested replies
    const buildReplyTree = async (parentId) => {
      const replies = await Comment.find({
        parent_comment_id: parentId,
        is_deleted: 0,
      })
        .sort({ createdAt: -1 })
        .lean();

      const replyTree = [];

      for (let reply of replies) {
        // find user
        const user = await Customer.findById(reply.user_id).lean();
        const nestedReplies = await buildReplyTree(reply._id);

        replyTree.push({
          ...reply,
          name:
                  String(user._id) === String(currentUserId) ? "You" : user.name,
                profileImage: user.profileImage || "https://i.pravatar.cc/100",
          
          replies: nestedReplies,
        });
      }

      return replyTree;
    };

    const topLevelComments = await Comment.find({
      post_id,
      parent_comment_id: null,
      is_deleted: 0,
    })
      .sort({ createdAt: -1 })
      .lean();

    const commentTree = [];

    for (let comment of topLevelComments) {
      const user = await Customer.findById(comment.user_id).lean();
      const replies = await buildReplyTree(comment._id);

      commentTree.push({
        ...comment,
        name:
                String(user._id) === String(currentUserId) ? "You" : user.name,
              profileImage: user.profileImage || "https://i.pravatar.cc/100",
        
        replies,
      });
    }


    return res.status(200).json({
      status: true,
      comments: commentTree,
    });
  } catch (error) {
    console.error("getCommentsWithReplies error:", error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

const postlike = async (req, res) => {
  try {
    const { my_id, post_id } = req.body;

    if (!my_id || !post_id) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if already exists
    const existingLike = await PostLike.findOne({ my_id, post_id });

    if (existingLike) {
      // Already liked → remove it (unlike)
      await PostLike.deleteOne({ _id: existingLike._id });

      // Count remaining likes
      const likeCount = await PostLike.countDocuments({ post_id });

      return res.status(200).json({
        success: true,
        message: "Unliked successfully",
        isLiked: false,
        likeCount,
      });
    } else {
      // Not liked → create new like
      await PostLike.create({ my_id, post_id });

      // Count updated likes
      const likeCount = await PostLike.countDocuments({ post_id });

      return res.status(201).json({
        success: true,
        message: "Liked successfully",
        isLiked: true,
        likeCount,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



const uploadSong = async (req, res) => {
  try {
    if (!req.files || !req.files.image || !req.files.song) {
      return res.status(400).json({ message: 'You must upload both image and song files.' });
    }

    const { image, song } = req.files;

    const uploadFileToS3 = async (file, type) => {
      const fileExt = path.extname(file[0].originalname);
      const fileName = `${uuidv4()}-${type}${fileExt}`;

      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        Body: file[0].buffer,
        ContentType: file[0].mimetype,
      };

      const data = await s3.upload(params).promise();
      return data.Location;
    };

    const imageUrl = await uploadFileToS3(image, 'image');
    const songUrl = await uploadFileToS3(song, 'song');

    const { artist, detail, title, location } = req.body;

    const newSong = new Song({
      artist,
      detail,
      image: imageUrl,
      song: songUrl,
      title,
      location
    });

    const savedSong = await newSong.save();

    res.status(200).json({
      message: 'Post uploaded and saved successfully',
      post: savedSong,
    });

  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Failed to upload files', error: error.message });
  }
};

const getSongs = async (req, res) => {
  try {
    const songs = await Song.find({}).sort({ createdAt: -1 });

    res.status(200).json({
      status: true,
      songs
    });

  } catch (error) {
    console.error('getSongs error:', error);
    res.status(500).json({ status: false, message: error.message });
  }
};

const getHome = async (req, res) => {
  try {
    const myId = req.params.id;

    // Helper function to add user + like + comment info
    const enrichPost = async (post) => {
      const user = await Customer.findById(post.customer_id)
        .select("name profileImage")
        .lean();

      const [likeCount, commentCount, isLiked] = await Promise.all([
        PostLike.countDocuments({ post_id: post._id }),
        Comment.countDocuments({ post_id: post._id, is_deleted: 0 }),
        PostLike.exists({ post_id: post._id, my_id: myId }), // 👈 check if myId liked
      ]);

      return {
        ...post,
        image: Array.isArray(post.image) ? post.image[0] : post.image,
        images: post.image,
        user_name: user?.name || "",
        user_profileImage: user?.profileImage || "",
        likeCount,
        commentCount,
        isLiked: isLiked ? 1 : 0, // 👈 add like status
      };
    };

    // 1. STATUS LIST
    const statusUsers = await Customer.find({})
      .select("_id name profileImage")
      .lean();

    const statusList = await Promise.all(
      statusUsers.map(async (user) => {
        const latestStatus = await Post.findOne({
          customer_id: user._id,
          post_type: "story",
        })
          .sort({ createdAt: -1 })
          .lean();

        if (!latestStatus) return null;

        const [likeCount, commentCount, isLiked] = await Promise.all([
          PostLike.countDocuments({ post_id: latestStatus._id }),
          Comment.countDocuments({ post_id: latestStatus._id, is_deleted: 0 }),
          PostLike.exists({ post_id: latestStatus._id, customer_id: myId }),
        ]);

        return {
          _id: user._id,
          name: user.name,
          profileImage: user.profileImage,
          post_id: latestStatus._id,
          likeCount,
          commentCount,
          isLiked: isLiked ? 1 : 0, // 👈 status like info
        };
      })
    );

    const filteredStatuses = statusList.filter(Boolean);

    // 2. 10 LATEST POSTS
    const recentPosts = await Post.find({ post_type: "post" })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const postsWithUser = await Promise.all(recentPosts.map(enrichPost));

    // 3. SUGGESTED USERS
    const followingIds = await Follow.find({ my_id: myId }).distinct("follow_id");
    const suggestedUsers = await Customer.find({
      _id: { $nin: [...followingIds, myId] },
    })
      .select("_id name profileImage")
      .limit(10)
      .lean();

    // 4. RANDOM POSTS
    const randomPosts = await Post.aggregate([
      { $match: { post_type: "post" } },
      { $sample: { size: 10 } },
    ]);

    const randomPostsWithUser = await Promise.all(randomPosts.map(enrichPost));

    // 5. REELS
    const reels = await Post.find({ type: "Video", post_type: "reel" })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const reelsWithUser = await Promise.all(reels.map(enrichPost));

    // 6. More posts
    const morePosts = await Post.find({ post_type: { $in: ["post", "reel"] } })
      .sort({ createdAt: -1 })
      .skip(1)
      .limit(10)
      .lean();

    const morePostsWithUser = await Promise.all(morePosts.map(enrichPost));

    // 7. Final batch
    const finalPosts = await Post.find({ post_type: { $in: ["post", "reel"] } })
      .sort({ createdAt: -1 })
      .skip(1)
      .limit(10)
      .lean();

    const finalPostsWithUser = await Promise.all(finalPosts.map(enrichPost));

    // ✅ Final Response
    res.status(200).json({
      status: true,
      statusList: filteredStatuses,
      recentPosts: postsWithUser,
      suggestedUsers,
      randomPosts: randomPostsWithUser,
      reels: reelsWithUser,
      morePosts: morePostsWithUser,
      finalPosts: finalPostsWithUser,
    });
  } catch (error) {
    console.error("getHome error:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};





module.exports = {
  checknumber,
  createCustomer,
  loginCustomer,
  getProfile,
  uploadFiles,
  uploadSong,
  uploadReel,
  uploadStory,
  getSongs,
  upload,
  follow,
  followBack,
  addCommentOrReply,
  getCommentsWithReplies,
  getHome,
  postlike
};
