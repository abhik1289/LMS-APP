import { app } from "./app";
import connectDb from "./utils/db";
import { v2 as cloudinary } from "cloudinary";
require("dotenv").config();

// setup cloudinary
cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.cloud_secret,
  // secure: true,
  
});

app.listen(process.env.PORT, () => {
  console.log("Server listening on port " + process.env.PORT);
  connectDb();
});
// console.log("first")
