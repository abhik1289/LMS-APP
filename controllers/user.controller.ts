require("dotenv").config();
import { Request, Response, NextFunction, json } from "express";
import catchAsyncError from "../middleware/catchAsyncerror";
import userModel, { IUser } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import ejs from "ejs";
import path from "path";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import sendMail from "../utils/sendMail";
import { AccessTokenOption, RefreshTokenOption, sendToken } from "../utils/jwt";
import { redis } from "../utils/redis";
import { getAllUserServices, getUser } from "../services/user.services";
import cloudinary from "cloudinary";
import courseModel from "../models/course.model";
// import ErrorHandler from "./../utils/ErrorHandler";
interface IUserRegestationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export const registrationUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password } = req.body;
    const isEmailExists = await userModel.findOne({ email: email });
    if (isEmailExists) {
      return next(new ErrorHandler("Email already exists", 400));
    }
    const user: IUserRegestationBody = {
      name,
      email,
      password,
    };
    const activationToken = crateActivationToken(user);
    const activationCode = activationToken.activationCode;
    const data = {
      name: user.name,
      activationCode,
    };
    const html = await ejs.renderFile(
      path.join(__dirname, "../mails/active-mail.ejs"),
      data
    );
    try {
      await sendMail({
        email: user.email,
        subject: "Email Activation",
        template: "active-mail.ejs",
        data,
      });
      res.status(200).json({
        message: `Email send on: ${user.email}.Check it`,
        token: activationToken.token,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
  }
};
interface IActivationToken {
  token: string;
  activationCode: string;
}
const crateActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.SECRET_KEY as Secret,
    {
      expiresIn: "1h",
    }
  );
  return { token, activationCode };
};

//activate user

interface IActivationRequest {
  activation_code: string;
  activation_token: string;
}
// actic=vate user
export const activeUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { activation_code, activation_token } =
      req.body as IActivationRequest;
    const newUser: {
      user: IUser;
      activation_code: string;
      activationCode: string;
    } = jwt.verify(activation_token, process.env.SECRET_KEY as string) as {
      user: IUser;
      activation_code: string;
      activationCode: string;
    };
    // console.log(newUser);

    // const { activation_code: activationCode } = newUser;

    if (newUser.activationCode !== activation_code) {
      return next(new ErrorHandler("Invalid activation code", 401));
    }
    const { name, email, password } = newUser.user;
    const existsUser = await userModel.findOne({ email: email });
    if (existsUser) {
      return next(new ErrorHandler("Your email already exists", 404));
    }
    const user = await userModel.create({
      name: name,
      email: email,
      password: password,
    });
    res.status(200).json({ user, saved: true });
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};
interface IloginInterface {
  email: string;
  password: string;
}
// loginuser
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body as IloginInterface;
    if (!email || !password) {
      return next(new ErrorHandler("Please enter your email or password", 401));
    }
    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      return next(new ErrorHandler("Invalid email or password", 401));
    }
    const isPwdMatch = await user.comparePassword(password);
    if (!isPwdMatch) {
      return next(new ErrorHandler("Invalid password", 401));
    }
    sendToken(user, 200, res);
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};
// logout user
export const logOutUser = (req: Request, res: Response, next: NextFunction) => {
  try {
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    const userID = req.user?._id || "";
    redis.del(userID);
    res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};
// update access token
export const updateAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refresh_token = req.cookies.refresh_token as string;
    const msg = "Token not found";
    if (!refresh_token) {
      return next(new ErrorHandler(msg, 401));
    }
    const decode = jwt.verify(
      refresh_token,
      process.env.REFRESH_SCRET_KEY as string
    ) as JwtPayload;
    const session = await redis.get(decode.id as string);
    if (!session) {
      return next(new ErrorHandler("For login access this resourses", 401));
    }
    const user = JSON.parse(session);
    const accessToken = jwt.sign(
      { id: user._id },
      process.env.ACCESS_SECRET_KEY as string,
      {
        expiresIn: "1h",
      }
    );
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_SCRET_KEY as string,
      {
        expiresIn: "30d",
      }
    );
    req.user = user;
    res.cookie("access_token", accessToken, AccessTokenOption);
    res.cookie("refresh_token", refreshToken, RefreshTokenOption);
    await redis.set(user._id, JSON.stringify(user._id),"EX",604800); // expires in 7 days
    res.status(200).json({
      success: true,
      accessToken,
    });
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};
// get user data
export const getUserInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;
    await getUser(userId, res);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};
interface ISocalBody {
  email: string;
  avatar: string;
  name: string;
}
export const socailAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, name, avatar } = req.body as ISocalBody;
    const findUser = await userModel.findOne({ email });
    if (!findUser) {
      const user = await userModel.create({ email, name, avatar });
      sendToken(user, 200, res);
    } else {
      sendToken(findUser, 200, res);
    }
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};
interface IUserUpdate {
  name?: string;
  email?: string;
}
// update username and mail
export const updateInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email } = req.body as IUserUpdate;
    const userID = req.user?._id;
    const user = await userModel.findById(userID);
    if (user && email) {
      const isExists = await userModel.findOne({ email });
      if (isExists) {
        return next(new ErrorHandler("Your email alrady exits", 401));
      }
      user.email = email;
    }
    if (name && user) {
      user.name = name;
    }
    await user?.save();
    await redis.set(userID, JSON.stringify(user));
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

interface IupdatePassword {
  oldPassword: string;
  newPassword: string;
}
//update password
export const updatePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { oldPassword, newPassword } = req.body as IupdatePassword;
    const userId = req.user?._id;
    const findUser = await userModel.findById(userId).select("+password");
    // console.log(findUser)
    if (findUser?.password === undefined) {
      return next(new ErrorHandler("Invalid User password", 401));
    }
    const isMatch = await findUser.comparePassword(oldPassword);
    if (!isMatch) return next(new ErrorHandler("Wrong Password", 402));
    findUser.password = newPassword;
    await findUser.save();
    await redis.set(userId, JSON.stringify(findUser));
    res.status(200).json({
      success: true,
      user: findUser,
    });
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};
interface IUpdatePwd {
  avatar: string;
}
export const updateAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { avatar } = req.body as IUpdatePwd;
    const userId = req.user?._id;
    const user = await userModel.findById(userId);
    // if user avatar exits
    if (avatar && user) {
      // get this and delete
      if (user?.avatar?.public_id) {
        await cloudinary.v2.uploader.destroy(user?.avatar?.public_id);
        const cloudUpload = await cloudinary.v2.uploader.upload(avatar, {
          folder: "/avatars",
          width: 150,
        });
        user.avatar = {
          public_id: cloudUpload.public_id,
          url: cloudUpload.url,
        };
      } else {
        const cloudUpload = await cloudinary.v2.uploader.upload(avatar, {
          folder: "/avatars",
          width: 150,
        });
        console.log("the result is ------------------>", cloudUpload);
        user.avatar = {
          public_id: cloudUpload.public_id,
          url: cloudUpload.url,
        };
      }
    }
    await user?.save();
    await redis.set(userId, JSON.stringify(user));
  } catch (error: any) {
    console.log("The error is:------------>", error);
    return next(new ErrorHandler(error.message, 500));
  }
};

interface IAddCourse {
  courseId: string;
}
export const addCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { courseId } = req.body as IAddCourse;
    const existingCourse = courseModel.findById(courseId);
    if (!existingCourse) {
      return next(new ErrorHandler("Course not found", 401));
    }
    // console.log();
    const getUser = await userModel.findById(req.user?._id);
    if (!getUser) {
      return next(new ErrorHandler("Invalid User", 401));
    }
    const findCourse = getUser.courses.find((courseID: any) => {
      courseID.courseId === courseId;
    });
    if (!findCourse) {
      let data = {
        courseId: courseId,
      };
      getUser.courses.push(data);
    } else {
      return next(new ErrorHandler("You already buy this course", 401));
    }

    await getUser.save();
    res.status(200).send({ getUser });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 401));
  }
};

export const getUsers = (req: Request, res: Response, next: NextFunction) => {
  try {
    getAllUserServices(res);
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 401));
  }
};
export const updateUserRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, role } = req.body;
    const getUser = await userModel.findById(userId);
    if (!getUser) {
      return next(new ErrorHandler("User not found", 401));
    }
    getUser.role = role;
    await getUser.save();
    res.status(200).json({ success: true, message: "User role updated" });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 401));
  }
};
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.body;
    const getUser = await userModel.findById(userId);
    if (!getUser) {
      return next(new ErrorHandler("User not found", 401));
    }
    await userModel.deleteOne({ _id: userId });
    // await redis.del({userId})
    await redis.del(userId);
    res.status(200).json({ success: true, message: "User deleted" });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 401));
  }
};
