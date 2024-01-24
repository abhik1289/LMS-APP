import userModel from "../models/user.model";
import { Response } from "express";
import { redis } from "../utils/redis";

// get all user by ID

export const getUser = async (id: string, res: Response) => {
  const userJson = await redis.get(id);

  if (userJson) {
    const user = JSON.parse(userJson);
    return res.status(200).json({
      success: true,
      user,
    });
  }
};

// get all user
export const getAllUserServices = async (res: Response) => {
  const users = await userModel.find().sort({ createAt: -1 });
  res.status(200).json({ success: true, users });
};
