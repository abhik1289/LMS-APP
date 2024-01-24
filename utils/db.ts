import mongoose from "mongoose";
require("dotenv").config();

const dbUrl: string = process.env.db_url || "";

const connectDb = async () => {
  try {
    await mongoose.connect(dbUrl).then((response: any) => {
      console.log("Database connected successfully");
    });
  } catch (error: any) {
    console.log(error.message);
    setTimeout(connectDb, 5000);
  }
};

export default connectDb;
