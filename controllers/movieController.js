const s3 = require('../utils/s3');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const {Movie, Episode} = require('../models/movieModel'); // Import the Movie model

// Set up multer for in-memory file storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadFiles = async (req, res) => {
  try {
    if (!req.files || !req.files.horizontalBanner || !req.files.verticalBanner || !req.files.trailer) {
      return res.status(400).json({ message: 'You must upload three files: horizontalBanner, verticalBanner, and trailer.' });
    }
    const { horizontalBanner, verticalBanner, trailer } = req.files;
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
    const horizontalBannerUrl = await uploadFileToS3(horizontalBanner, 'horizontalBanner');
    const verticalBannerUrl = await uploadFileToS3(verticalBanner, 'verticalBanner');
    const trailerUrl = await uploadFileToS3(trailer, 'trailer');

    const { title, category, type, duration, artists, director, year, location, detail } = req.body;

    const newMovie = new Movie({
      title,
      category,
      type,
      duration,
      artists,
      director,
      year,
      location,
      detail,
      horizontalBanner: horizontalBannerUrl,
      verticalBanner: verticalBannerUrl,
      trailer: trailerUrl,
    });

    const savedMovie = await newMovie.save();

    res.status(200).json({
      message: 'Movie uploaded and saved successfully',
      movie: savedMovie,
    });

  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Failed to upload files', error: error.message });
  }
};

const uploadEpisodes = async (req, res) => {
    try {
      if (!req.files || !req.files.horizontalBanner || !req.files.verticalBanner || !req.files.trailer) {
        return res.status(400).json({ message: 'You must upload three files: horizontalBanner, verticalBanner, and trailer.' });
      }
      const { horizontalBanner, verticalBanner, trailer } = req.files;
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
      const horizontalBannerUrl = await uploadFileToS3(horizontalBanner, 'horizontalBanner');
      const verticalBannerUrl = await uploadFileToS3(verticalBanner, 'verticalBanner');
      const trailerUrl = await uploadFileToS3(trailer, 'trailer');
  
      const { title, movieID, duration, detail } = req.body;
  
      const newEpisode = new Episode({
        title,
        movieID,
        duration,
        detail,
        horizontalBanner: horizontalBannerUrl,
        verticalBanner: verticalBannerUrl,
        trailer: trailerUrl,
      });
  
      const savedEpisode = await newEpisode.save();
  
      res.status(200).json({
        message: 'Movie uploaded and saved successfully',
        movie: savedEpisode,
      });
  
    } catch (error) {
      console.error('Upload Error:', error);
      res.status(500).json({ message: 'Failed to upload files', error: error.message });
    }
  };



module.exports = { upload, uploadFiles, uploadEpisodes};
