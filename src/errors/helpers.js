import logger from "../logger";

export const handleError = (res, err, message) => {
  const status = err.status || 500;
  const logMessage = `${message}: -> ${err.message || err}`;

  logger.error(logMessage); // Log the error using Winston

  res.status(status).json({
    success: false,
    status: status,
    message: logMessage,
  });
};
