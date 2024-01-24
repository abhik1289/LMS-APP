import { Redis } from "ioredis";
require("dotenv").config();

const redisCliend = () => {
  if (process.env.redisUrl) {
    console.log("Redis connected");
    return process.env.redisUrl;
  }
  throw new Error("Redis not connected");
};
export const redis = new Redis(redisCliend());
