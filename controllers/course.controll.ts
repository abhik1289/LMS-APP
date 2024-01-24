import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { v2 as cloudinary } from "cloudinary";
import { createCourse, getAllCourseServices } from "../services/course.services";
import courseModel from "../models/course.model";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import notificationModel from "../models/notification.model";
import cron from "node-cron";
export const uploadCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;
    const thumnail = data.thumnail;
    if (thumnail) {
      const cloudUpload = await cloudinary.uploader.upload(thumnail, {
        folder: "courses",
      });
      data.thumnail = {
        public_id: cloudUpload.public_id,
        url: cloudUpload.secure_url,
      };
    }
    createCourse(data, res);
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

export const editCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;
    const thumnail = data.thumnail;
    if (thumnail) {
      await cloudinary.uploader.destroy(thumnail.public_id);
      const cloudUpload = await cloudinary.uploader.upload(thumnail, {
        folder: "courses",
      });
      data.thumnail = {
        public_id: cloudUpload.public_id,
        url: cloudUpload.secure_url,
      };
    }
    const courseId = req.params.id;
    console.log(courseId, data);
    const course = await courseModel.findByIdAndUpdate(
      courseId,
      { $set: data }, // Make sure data contains the fields you want to update
      { new: true }
    );

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};
export const getSingleCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const isExist = await redis.get(req.params.id);
    if (isExist) {
      const data = JSON.parse(isExist);
      res.status(200).json({
        success: true,
        courseData: isExist,
      });
    } else {
      const courseData = await courseModel
        .findById(req.params.id)
        .select(
          "-courseData.videoUrl -courseData.links -courseData.suggestion -courseData.question"
        );
      await redis.set(req.params.id, JSON.stringify(courseData),"EX",604800);
      res.status(200).json({
        success: true,
        courseData: isExist,
      });
    }
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

export const getAllCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const isExist = await redis.get("allCourses");
    if (isExist) {
      const data = JSON.parse(isExist);
      res.status(200).json({
        success: true,
        courseData: data,
      });
    } else {
      const courseData = await courseModel
        .find()
        .select(
          "-courseData.videoUrl -courseData.links -courseData.suggestion -courseData.question"
        );
      await redis.set("allCourses", JSON.stringify(courseData));
      res.status(200).json({
        success: true,
        courseData,
      });
    }
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// get user course list --only for valid user

export const getCourseByuser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const getUserCourses = req.user?.courses;
    const courseId = req.params.courseId;

    const courseExists = getUserCourses?.find(
      (course: any) => course._id.toString() === courseId
    );
    if (!courseExists) {
      return next(
        new ErrorHandler("Your are not aligable to access this course", 401)
      );
    }
    const course = await courseModel.findById(courseId);
    const content = course?.courseData;
    res.status(200).json({ success: true, content });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// add question in courses
interface IAddQuestionData {
  question: string;
  courseID: string;
  contentID: string;
}
export const addQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { question, courseID, contentID } = req.body as IAddQuestionData;
    const course = await courseModel.findById(courseID);
    if (!mongoose.Types.ObjectId.isValid(contentID)) {
      return next(new ErrorHandler("Invalid content Id", 401));
    }
    const courseContent = course?.courseData?.find((item: any) =>
      item._id.equals(contentID)
    );
    if (!courseContent) {
      return next(new ErrorHandler("Invalid content Id", 401));
    }
    const newQuestions: any = {
      user: req.user,
      question,
      questionReplies: [],
    };
    courseContent?.question.push(newQuestions);
    await notificationModel.create({
      title: "New Question received",
      message: `You have new question in ${courseContent.title}`,
      userId: req.user?._id,
    });
    await course?.save();
    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {}
};
interface IAddAnswerData {
  answer: string;
  courseID: string;
  contentID: string;
  questionID: string;
}

export const addAnswer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // : string;
    const { answer, courseID, contentID, questionID } =
      req.body as IAddAnswerData;
    const course = await courseModel.findById(courseID);
    if (!mongoose.Types.ObjectId.isValid(contentID)) {
      return next(new ErrorHandler("Invalid content Id", 401));
    }
    const courseContent: any = course?.courseData?.find((item: any) =>
      item._id.equals(contentID)
    );
    if (!courseContent) {
      return next(new ErrorHandler("Invalid content Id", 401));
    }
    const question = courseContent?.question.find((item: any) => {
      console.log(item._id);

      return item._id.equals(questionID);
    });
    if (!question) {
      return next(new ErrorHandler("Invalid question id", 401));
    }
    const newAnswer: any = {
      user: req.user,
      answer,
    };
    question?.questionReplies?.push(newAnswer);
    await course?.save();
    if (req.user?._id === question?.user?._id) {
      await notificationModel.create({
        title: "New Question replay received",
        message: `You have new question replay in ${courseContent.title}`,
        userId: req.user?._id,
      });
    } else {
      const data = {
        username: question?.user?.name,
        reply: answer,
        question: question.question,
      };

      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/replay-user.ejs"),
        data
      );
      try {
        await sendMail({
          email: question.user.email,
          subject: "Question Replies",
          template: "replay-user.ejs",
          data,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
    res.status(200).json({
      success: true,
      course,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

interface IAddReviewdata {
  review: string;
  rating: number;
  courseId: string;
}

export const addReview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const courseList = req.user?.courses;
    const courseId = req.params.courseId;
    // console.log(req.user)
    const courseExits = courseList?.some(
      (item: any) => item.courseId === courseId
    );
    console.log(courseExits);
    if (!courseExits) {
      return next(
        new ErrorHandler("You are not eligible to add a review", 401)
      );
    }
    const course = await courseModel.findById(courseId);
    if (!course) {
      return next(new ErrorHandler("Wrong course id", 401));
    }
    const { review, rating } = req.body as IAddReviewdata;
    const reviewData: any = {
      user: req.user,
      rating,
      comment: review,
    };
    course?.review.push(reviewData);
    let avg = 0;
    course?.review.forEach((review) => {
      avg += review.rating;
    });
    if (course) {
      course.rating = avg / course.review.length;
    }

    course?.save();
    const notification = {
      title: "New review received",
      message: `${req.user?.name} has given review on ${course.name}`,
    };
    // send notification
    res.status(200).json({
      success: true,
      course,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};
interface IAddReplayToCourse {
  comment: string;
  courseId: string;
  reviewId: string;
}
export const addReplayToCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { comment, courseId, reviewId } = req.body as IAddReplayToCourse;

    // findCourse
    const course = await courseModel.findById(courseId);
    if (!course) {
      return next(new ErrorHandler("Course not found", 401));
    }

    const findReview = course.review.find(
      (rev: any) => rev._id.toString() == reviewId
    );
    if (!findReview) {
      return next(new ErrorHandler("Review not found", 402));
    }

    if (!findReview.commentReplies) {
      findReview.commentReplies = [];
    }
    const data: any = {
      user: req.user,
      comment,
    };
    // console.log(course.review.commentReplies)
    findReview.commentReplies.push(data);
    await course.save();
    return res.status(200).json({ course });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};
export const getCourse = (req: Request, res: Response,next: NextFunction) => {
  try {
    // console.log(req)
    getAllCourseServices(res);
  } catch (error:any) {
    return next(new ErrorHandler(error.message, 401));
  }
}
cron.schedule("0 0 0 * * *", async () => {
  const thirdDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await notificationModel.deleteMany({
    status: "read",
    createdAt: {$lt:thirdDaysAgo},
  });
});
export const deleteCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { courseId } = req.body;
    const getCourse = await courseModel.findById(courseId);
    if (!getCourse) {
      return next(new ErrorHandler("Course not found", 401));
    }
    await courseModel.deleteOne({_id:courseId});
    res.status(200).json({ success: true, message: "cousre deleted" });

  } catch (error: any) {
    return next(new ErrorHandler(error.message, 401));
  }
};
