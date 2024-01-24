import ErrorHandler from "../utils/ErrorHandler";
import { Request, Response, NextFunction, json } from "express";

export const ErrorMidleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.status = err.status || 500;
  err.message = err.message || "Internal Server Error";

  //   wrong mongo id
  if (err.name === "CasteError") {
    const msg = `Resource not found. Invalid: ${err.path}`;
    err = new ErrorHandler(msg, 400);
  }

  //   duplicate key error
  if (err.name === 10000) {
    const msg = `Duplicate key ${Object.keys(err.keys)}`;
    err = new ErrorHandler(msg, 400);
  }
  //   wrong jwt error
  if (err.name === "InvalidJwtToken") {
    const msg = `Your jwt token is invalid`;
    err = new ErrorHandler(msg, 400);
  }
  //   jwt expired
  if (err.name === "ExpiredJwtToken") {
    const msg = `Your jwt token is expired`;
    err = new ErrorHandler(msg, 400);
  }
  res.status(err.status).json({
    success: false,
    message: err.message,
  });
};
