const mongoose = require('mongoose');
// const Movie = require('./movieModel');

const generateSimpleId = () => {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, ''); // ISO format without dashes, colons, and dots
    const randomString = Math.random().toString(36).substring(2, 8); // Random 6 character string
    return `movie-${timestamp}-${randomString}`;
  };
  
// Movie Schema to define the structure of the movie data in MongoDB
const movieSchema = new mongoose.Schema({
  movieID: { type: String, default: generateSimpleId },
  title: String,
  category: String,
  type: String,
  duration: Number,
  horizontalBanner: String,
  verticalBanner: String,
  trailer: String,
  artists: String,
  director: String,
  year: Number,
  location: String,
  detail: String,
  status: { type: Number, default: 1 },
  isDeleted: { type: Number, default: 0 }
}, { timestamps: true });

const Movie = mongoose.model('VZ_movie', movieSchema, 'VZ_movie');

const episodeSchema = new mongoose.Schema({
  movieID: String,
  title: String,
  duration: Number,
  horizontalBanner: String,
  verticalBanner: String,
  trailer: String,
  detail: String,
  status: { type: Number, default: 1 },
  isDeleted: { type: Number, default: 0 }
}, { timestamps: true });

// Create a movie model based on the schema
const Episode = mongoose.model('VZ_episode', episodeSchema, 'VZ_episode');

module.exports = {Episode, Movie};
