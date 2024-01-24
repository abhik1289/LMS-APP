require("dotenv").config();
import { Response, json } from "express";
import { IUser } from "../models/user.model";
import { redis } from "./redis";

interface ITokenOptions {
  expires: Date;
  httpOnly: boolean;
  //   maxAge: number;
  secure?: boolean;
  //   sameSite: "lax" | "strict" | "none" | undefined;
}
export const AccessTokenOption: ITokenOptions = {
  expires: new Date(Date.now() + 5 * 60 * 60 * 1000),
  secure: true,
  httpOnly: true,
};
export const RefreshTokenOption: ITokenOptions = {
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  secure: true,
  httpOnly: true,
};
export const sendToken = (user: IUser, statusCode: number, res: Response) => {
  const accessToken = user.signAccessToken();
  const refreshToken = user.signRefreshToken();
  redis.set(user._id, JSON.stringify(user));
  
  if (process.env.NODE_ENV === "production") {
    AccessTokenOption.secure = true;
  }
  res.cookie("access_token", accessToken, AccessTokenOption);
  res.cookie("refresh_token", refreshToken, RefreshTokenOption);
  res.status(statusCode).json({
    success: true,
    user: user,
    accessToken,
  });
};
