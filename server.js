const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const path = require('path');
const fileUpload = require('express-fileupload');
const errorHandler = require('./middlewares/error');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');

// Load routes
const categories = require('./routes/categories');
const products = require('./routes/products');
const auth = require('./routes/auth');
const users = require('./routes/users');
const reviews = require('./routes/reviews');

// Load environment variables
dotenv.config({ path: './config/config.env' });

// Connect to DB
connectDB();

const app = express();

// // Use body parser
// app.use(express.json());

// parse application/json
app.use(bodyParser.json())

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))

// Cookie parser
app.use(cookieParser());

// Use middlewares
if (process.env.NODE_ENV == 'development') app.use(morgan('dev'));

// File uploading
app.use(fileUpload());

// Sanitize req datas - Nosql injection
app.use(mongoSanitize());

// Adding headers for protection
app.use(helmet());

// Prevent xss attacks
app.use(xss());

// Request rate limitter - DDos attack
const limiter = rateLimit({
  windowMs: 1000 * 60 * 10,
  max: 100,
});

app.use(limiter);

// Http parameter pollution attack
app.use(hpp());

// var corsOptions = 
//   {
//     "origin": "*",
//     "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
//     "preflightContinue": true,
//     "optionsSuccessStatus": 200,
//     "allowedHeaders": "Content-Type, Authorization",
//     "maxAge": 600
//   }

// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*");
//   next();
// });

// var corsOptions = {
//   "origin": "*",
//   "credentials": true,
//    "origin": true
// }

// Enable CORS
app.use(cors());

// Set static folder
app.use(express.static(path.join(__dirname, '/public')));

// Use routes
app.use('/api/v1/categories', categories);
app.use('/api/v1/products', products);
app.use('/api/v1/auth', auth);
app.use('/api/v1/users', users);
app.use('/api/v1/reviews', reviews);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on PORT ${PORT}`.yellow.bold
  )
);

process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red.bold);
  //Close and exit server
  server.close(() => process.exit(1));
});
