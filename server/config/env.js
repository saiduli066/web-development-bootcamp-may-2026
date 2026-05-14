import dotenv from "dotenv";

dotenv.config();

const required = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

const numberValue = (key, fallback) => {
  const raw = process.env[key];
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid number environment variable: ${key}`);
  }
  return parsed;
};

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: numberValue("PORT", 5000),
  MONGO_URI: required("MONGO_URI"),
  CLIENT_ORIGIN: required("CLIENT_ORIGIN"),
  JWT_SECRET: required("JWT_SECRET"),
  JWT_REFRESH_SECRET: required("JWT_REFRESH_SECRET"),
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  CLOUDINARY_CLOUD_NAME: required("CLOUDINARY_CLOUD_NAME"),
  CLOUDINARY_API_KEY: required("CLOUDINARY_API_KEY"),
  CLOUDINARY_API_SECRET: required("CLOUDINARY_API_SECRET"),
  RATE_LIMIT_WINDOW_MS: numberValue("RATE_LIMIT_WINDOW_MS", 60000),
  RATE_LIMIT_MAX: numberValue("RATE_LIMIT_MAX", 200),
  AUTH_RATE_LIMIT_MAX: numberValue("AUTH_RATE_LIMIT_MAX", 20),
};

export { env };
