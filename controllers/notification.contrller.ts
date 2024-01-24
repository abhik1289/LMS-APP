import { NextFunction, Response, Request } from "express";
import notificationModel from "../models/notification.model";
import ErrorHandler from "../utils/ErrorHandler";

export const getALLNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const notifications = await notificationModel.find().sort({
      createdAt: -1,
    });
    if (notifications) {
      res.status(200).json({
        success: true,
        notifications,
      });
    }
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 401));
  }
};

export const updateNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const notification = await notificationModel.findById(req.params.id);
    if (!notification) {
      return next(new ErrorHandler("Not find any Notification", 404));
    }
    notification.status = "read";
    await notification.save();
    const notifications = await notificationModel.find().sort({
      createdAt: -1,
    });
    return res.status(200).json({ sucess: true, notifications });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 401));
  }
};
