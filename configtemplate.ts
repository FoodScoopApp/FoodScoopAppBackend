export const config = {
  PORT: 8080,
  MONGOURI: process.env.NODE_ENV ? 
    "" : // Production
    "mongodb://127.0.0.1:27017/foodscoop", // Development
  EXPO_API_KEY: "",
};

export default config;
