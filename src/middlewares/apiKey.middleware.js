export const apiKeyMiddleware = (req, res, next) => {
  const configuredApiKey = process.env.API_KEY;
  console.log("configuredApiKey", configuredApiKey,process.env);
  if (!configuredApiKey) {
    return res.internalServerError({ message: "API key is not configured on server" });
  }

  const incomingKey = req.headers["x-api-key"] || req.query.apiKey || req.query.api_key;
  if (!incomingKey || incomingKey !== configuredApiKey) {
    return res.unAuthorized({ message: "Invalid or missing API key" });
  }

  next();
};


