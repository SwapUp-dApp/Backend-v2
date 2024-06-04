"use strict";

require("dotenv/config");
var _express = _interopRequireDefault(require("express"));
var _bodyParser = _interopRequireDefault(require("body-parser"));
var _index = _interopRequireDefault(require("./api/routes/index.js"));
var _expressRateLimit = _interopRequireDefault(require("express-rate-limit"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
//preload all the environment values

const app = (0, _express.default)();
const port = process.env.PORT || 3000;

//parse application/json and look for raw text
app.use(_bodyParser.default.json());
app.use(_bodyParser.default.urlencoded({
  extended: true
}));
app.use(_bodyParser.default.text());
app.use(_bodyParser.default.json({
  type: 'application/json'
}));

/**
 * Adding headers to our requests.
 */
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH");
    return res.status(200).json({});
  }
  next();
});

/* apply rate limit */

const apiLimiter = (0, _expressRateLimit.default)({
  windowMs: (process.env.API_RATE_WINDOW || 15) * 60 * 1000,
  // 15 minutes
  max: process.env.API_RATE_LIMIT || 100,
  // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
});

app.use("/api", apiLimiter, _index.default);
app.listen(port);
app.use((req, res, next) => {
  const error = Error("Not found");
  res.statusCode = 404;
  res.send({
    error: error.message
  });
});
console.log('SwapUp RESTful API server started on: ' + port);
//# sourceMappingURL=server.js.map