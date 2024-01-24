require("dotenv").config();
import express, { NextFunction, Request, Response } from "express";
export const app = express();
import { ErrorMidleware } from "./middleware/error";
import cors from "cors";
import cookieParser from "cookie-parser";
import Userrouter from "./routes/user.router";
import courseRouter from "./routes/course.router";
import orderRouter from "./routes/order.router";
import notificationRouter from "./routes/notification.router";
import layoutRouter from "./routes/layout.router";
//body parser
app.use(express.json({ limit: "50mb" }));

//cookie parser
app.use(cookieParser());

// for cors
app.use(
  cors({
    origin: process.env.ORIGIN,
  })
);

//main routers
app.use("/api/v1", Userrouter);
app.use("/api/v1", courseRouter);
app.use("/api/v1", orderRouter);
app.use("/api/v1", notificationRouter);
app.use("/api/v1", layoutRouter);




//testapi
app.get("/test", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    success: true,
    message: "Test successful",
  });
});

//unknown root
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  let err = new Error(`The ${req.originalUrl} not found`);
  req.statusCode = 404;
  next(err);
});
