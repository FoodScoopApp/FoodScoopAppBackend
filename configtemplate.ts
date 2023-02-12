export const config = {
  PORT: process.env.NODE_ENV ?
    8080 : // Production
    80, // Development
  MONGOURI: process.env.NODE_ENV ? 
    "" : // Production
    "mongodb://127.0.0.1:27017/foodscoop", // Development
};

export default config;
