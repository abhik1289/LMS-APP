import { Request, Response, NextFunction } from "express";
import courseModel from "../models/course.model";

export const createCourse = async (data: any, res: Response) => {
  try {
    const course = await courseModel.create(data);
    res.status(200).json({ success: true, course });
  } catch (error) {}
};

export const getAllCourseServices = async (res: Response) => {
  const courses = await courseModel.find().sort({ createAt: -1 });
  console.log(courses)
  res.status(200).json({ success: true, courses });
};
