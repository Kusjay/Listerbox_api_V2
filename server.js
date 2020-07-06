const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const colors = require('colors');
const fileupload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');
const errorHandler = require('./middleware/error');
const connectDB = require('./config/db');

// Load env vars
dotenv.config({ path: './config/config.env' });

// Connect to database
connectDB();

// Route files
const auth = require('./routes/auth');
const users = require('./routes/users');
const profiles = require('./routes/profiles');
const tasks = require('./routes/tasks');
const requests = require('./routes/requests');
const reviews = require('./routes/reviews');
const payments = require('./routes/payments');
const payouts = require('./routes/payouts');

const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// File uploading
app.use(fileupload());

// // Sanitize data
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Rate limiting
// const limiter = rateLimit({
//   windowsMs: 10 * 60 * 1000, // 10 mins
//   max: 100
// });

// app.use(limiter);

// Prevent http param pollution
app.use(hpp());

// Enable CORS
app.use(cors());

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Mount routers
app.use('/api/v2/auth', auth);
app.use('/api/v2/users', users);
app.use('/api/v2/profiles', profiles);
app.use('/api/v2/tasks', tasks);
app.use('/api/v2/requests', requests);
app.use('/api/v2/reviews', reviews);
app.use('/api/v2/payments', payments);
app.use('/api/v2/payouts', payouts);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on ${PORT}`.yellow.bold
  )
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.messgae}`.red);
  // Close server & exit process
  server.close(() => process.exit(1));
});
