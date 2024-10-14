import "dotenv/config"; //preload all the environment values

import express from 'express';
import bodyParser from 'body-parser';
import apiRouter from './api/routes/index.js';

const app = express();
const port = process.env.PORT || 3000;
const apiPayloadLimit = `${process.env.API_PAYLOAD_LIMIT || 200}kb`;

//parse application/json and look for raw text
app.use(bodyParser.json({ limit: apiPayloadLimit }));
app.use(bodyParser.urlencoded({ extended: true, limit: apiPayloadLimit }));
app.use(bodyParser.text({ limit: apiPayloadLimit }));
app.use(bodyParser.json({ type: 'application/json', limit: apiPayloadLimit }));

/**
 * Adding headers to our requests.
 */
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH");
    return res.status(200).json({});
  }
  next();
});

/* apply rate limit */
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: (process.env.API_RATE_WINDOW || 15) * 60 * 1000, // 15 minutes
  max: process.env.API_RATE_LIMIT || 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use("/api", apiLimiter, apiRouter);
app.listen(port);

app.use((req, res, next) => {
  const error = Error("Not found");
  res.statusCode = 404;
  res.send({ error: error.message });
});

console.log('SwapUp RESTful API server started on: ' + port);