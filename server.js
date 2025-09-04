const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const movieRoutes = require('./routes/movieRoutes');
const customerRoutes = require('./routes/RestApi/customerRoutes');


dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api', userRoutes);

// Home Route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// app.use('/api/movies', movieRoutes);
app.use('/api', movieRoutes);


// RestApi

app.use('/RestApi', customerRoutes);

// RestApi End

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
