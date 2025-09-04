const express = require('express');
// const { createUser, getUsers, loginUser } = require('../controllers/userController');
const { upload, checknumber, createCustomer, loginCustomer, getProfile, getHome, postlike, uploadFiles, uploadSong, uploadStory, uploadReel, getSongs, follow, followBack, addCommentOrReply, getCommentsWithReplies} = require('../../controllers/RestApi/customerController');
// const { createCustomer, loginCustomer} = require('../../controllers/RestApi/customerController');


const router = express.Router();

router.post('/register', createCustomer);
router.post('/login', loginCustomer);
router.post('/checknumber', checknumber);
router.get('/profile/:id', getProfile)
router.get('/home/:id', getHome)
router.post('/follow', follow);
router.get('/follow_back/:id', followBack);
router.post('/comment', addCommentOrReply);
router.get('/comment/:post_id', getCommentsWithReplies);
router.get('/song', getSongs);
router.get('/like', postlike)

router.post('/post', upload.fields([
  { name: 'image', maxCount: 10 }
]), uploadFiles);

router.post('/reel', upload.fields([
  { name: 'image', maxCount: 10 },
  { name: 'thumbnail', maxCount: 1 }
]), uploadReel);

router.post('/story', upload.fields([
  { name: 'image', maxCount: 10 },
  { name: 'thumbnail', maxCount: 1 }
]), uploadStory);

router.post('/song', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'song', maxCount: 1 }
]), uploadSong);

module.exports = router;
