const express = require('express');
const { upload, uploadFiles, uploadEpisodes } = require('../controllers/movieController');

const router = express.Router();

// Handle the file upload for horizontalBanner, verticalBanner, and trailer with different keys
router.post('/upload', upload.fields([
  { name: 'horizontalBanner', maxCount: 1 },
  { name: 'verticalBanner', maxCount: 1 },
  { name: 'trailer', maxCount: 1 },
]), uploadFiles);

router.post('/uploadEpisode', upload.fields([
    { name: 'horizontalBanner', maxCount: 1 },
    { name: 'verticalBanner', maxCount: 1 },
    { name: 'trailer', maxCount: 1 },
  ]), uploadEpisodes);



module.exports = router;
