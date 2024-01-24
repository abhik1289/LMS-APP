import { Request, Response, NextFunction, json } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import ErrorHandler from "../utils/ErrorHandler";
import { redis } from "../utils/redis";

export const isAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const access_token = req.cookies.access_token;
  if (!access_token) return next(new ErrorHandler("Token not found", 400));
  const decode = jwt.verify(
    access_token,
    process.env.ACCESS_SECRET_KEY as string
  ) as JwtPayload;
  if (!decode) {
    return next(new ErrorHandler("access_token not valid", 401));
  }
  const user = await redis.get(decode.id);
  if (!user) {
    return next(new ErrorHandler("User not found", 401));
  }
  req.user = JSON.parse(user);
  next();
};

export const authorizedRoll = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role || "")) {
      return next(
        new ErrorHandler(
          `Role: ${req.user?.role} is not allowed to access this resources`,
          401
        )
      );
    }
    next();
  };
};
