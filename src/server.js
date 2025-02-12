import "dotenv/config"; //preload all the environment values

import express from 'express';
import bodyParser from 'body-parser';
import apiRouter from './api/routes/index.js';
import rateLimit from 'express-rate-limit';
import Environment from "./config/index.js";
import logger from "./logger/index.js";
import { handleError, CustomError } from "./errors";

const app = express();
const port = Environment.PORT || 8080;

export const apiPayloadLimit = `${Environment.API_PAYLOAD_LIMIT || 500}kb`;

//parse application/json and look for raw text
app.use(bodyParser.json({ limit: apiPayloadLimit }));
app.use(bodyParser.urlencoded({ extended: true, limit: apiPayloadLimit }));
app.use(bodyParser.text({ limit: apiPayloadLimit }));
app.use(bodyParser.json({ type: 'application/json', limit: apiPayloadLimit }));

// Get allowed origins from environment variable
const allowedOrigins = Environment.ACCESS_CONTROL_ALLOWED_ORIGINS ? Environment.ACCESS_CONTROL_ALLOWED_ORIGINS.split(',') : [];

/**
 * Adding headers to our requests.
 */
app.use((req, res, next) => {
  try {
    const origin = req.headers.origin;

    // Allow all origins if ALLOWED_ORIGINS is set to '*'
    if (allowedOrigins.includes('*')) {
      res.header("Access-Control-Allow-Origin", '*');
    }
    // Check if the request origin is in the allowed origins list
    else if (allowedOrigins.includes(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    // Deny access if the origin is not allowed
    else {
      logger.warn(`Blocked request from unauthorized origin: ${origin}`);
      throw new CustomError(403, "Origin not allowed");
    }

    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );

    if (req.method === "OPTIONS") {
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH");
      return res.status(200).json({});
    }

    next();

  } catch (error) {
    handleError(res, error, "***CORS_ACCESS error");
  }
});

/* apply rate limit */
const apiLimiter = rateLimit({
  windowMs: (Environment.API_RATE_WINDOW || 15) * 60 * 1000, // 15 minutes
  max: Environment.API_RATE_LIMIT || 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Logging middleware to track all requests
app.use((req, res, next) => {
  logger.info(`Received request: ${req.method} ${req.url}`);
  next();
});


app.use("/api", apiLimiter, apiRouter);

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: `Welcome!, The '${Environment.ENVIRONMENT_KEY.toUpperCase()}' SwapUp API Server is running on PORT:${port}`
  });
});

app.listen(port, () => {
  logger.info(`SwapUp RESTful API ${Environment.ENVIRONMENT_KEY} server started on PORT:${port}`);
});

app.use((req, res, next) => {
  try {
    throw new CustomError(404, "Route does not exist");
  } catch (error) {
    handleError(res, error, "***not_found error");
  }
});

// // Handle uncaught errors (optional but useful for catching runtime errors)
// app.use((err, req, res, next) => {
//   logger.error(`Uncaught Error - ${req.method} ${req.url} - ${err.message}`);
//   handleError(res, err, "Unexpected error occurred");
// });