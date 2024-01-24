import { NextFunction, Response, Request } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { IOrder } from "../models/order.model";
import userModel from "../models/user.model";
import { getAllOrdersServices, newOrder } from "../services/order.services";
import courseModel from "../models/course.model";
import sendMail from "../utils/sendMail";
import ejs from "ejs";
import path from "path";
import notificationModel from "../models/notification.model";
import { getAllCourseServices } from "../services/course.services";
export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { courseId, payment_info } = req.body as IOrder;
    const user = await userModel.findById(req.user?._id);
    const existingCourse = user?.courses.some(
      (course: any) => course._id === courseId
    );
    if (existingCourse) {
      return next(new ErrorHandler("You already purchased this course", 401));
    } else {
      const course = await courseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("course does not exists", 401));
      }
      let data: any = {
        userId: user?._id,
        courseId: courseId,
      };
      user?.courses.push(course._id);
      if (course) {
        course?.purchased ? (course.purchased += 1) : course.purchased;
        await course.save();
      }
      await notificationModel.create({
        userId: user?._id,
        title: "New Order",
        message: `You have have a new order from ${course.name}`,
      });
      newOrder(data, res);
      // send Mail to user
      const mailOptions = {
        courseName: course.name,
        platformName: "Elearning Platform",
        price: course.price,
        buyingDate: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      };
      await ejs.renderFile(
        path.join(__dirname, "../mails/order-confirmation.ejs"),
        mailOptions
      );
      if (user) {
        await sendMail({
          email: user.email,
          subject: "Course Order Details",
          data: mailOptions,
          template: "order-confirmation.ejs",
        });
      }
    }
    // send notification to user

    await user?.save();
    return res.status(200).json({ success: true });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};
export const getOrders = (req: Request, res: Response,next: NextFunction) => {
  try {
    getAllOrdersServices(res);
  } catch (error:any) {
    return next(new ErrorHandler(error.message, 401));
  }
}