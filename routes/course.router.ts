import express from "express";
import { authorizedRoll, isAuthenticate } from "../middleware/auth";
import {
  addAnswer,
  addQuestion,
  addReplayToCourse,
  addReview,
  editCourse,
  getAllCourse,
  getSingleCourse,
  uploadCourse,getCourse, deleteCourse
} from "../controllers/course.controll";
const courseRouter = express.Router();

courseRouter.post(
  "/create-course",
  isAuthenticate,
  authorizedRoll("admin"),
  uploadCourse
);
courseRouter.put(
  "/update-course/:id",
  isAuthenticate,
  authorizedRoll("admin"),
  editCourse
);
courseRouter.get("/get_course_wtp/:id", getSingleCourse);
courseRouter.get("/get_courses", getAllCourse);
courseRouter.get("/get_course_content/:courseId", isAuthenticate, getAllCourse);
courseRouter.put("/add_questions", isAuthenticate, addQuestion);
courseRouter.put("/add_answer", isAuthenticate, addAnswer);
courseRouter.put("/add_review/:courseId", isAuthenticate, addReview);
courseRouter.put(
  "/addReplay_to_review",
  isAuthenticate,
  authorizedRoll("admin"),
  addReplayToCourse
);
courseRouter.get(
  "/getCourses",
  isAuthenticate,
  authorizedRoll("admin"),
  getCourse
);
courseRouter.delete(
  "/delete_course",
  isAuthenticate,
  authorizedRoll("admin"),
  deleteCourse
);
export default courseRouter;
