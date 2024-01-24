import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import layoutModel from "../models/layout.model";
import { v2 as cloudinary } from "cloudinary";
export const createLayout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type } = req.body;
    const isTypeExists = await layoutModel.findOne({ type });
    if (isTypeExists) {
      return next(new ErrorHandler(`${type} already exists`, 401));
    }

    if (type == "Banner") {
      const { image, title, subTitle } = req.body;
      // upload image
      const uploadImage = await cloudinary.uploader.upload(image, {
        folder: "layout",
      });
      let banner = {
        image: {
          public_id: uploadImage.public_id,
          url: uploadImage.secure_url,
        },
        title,
        subTitle,
      };
      await layoutModel.create(banner);
    }
    if (type == "FAQ") {
      const { faq } = req.body;
      const faqItems = await Promise.all(
        faq.map(async (item: any) => {
          return {
            question: item.question,
            answer: item.answer,
          };
        })
      );
      await layoutModel.create({
        type: "FAQ",
        faq: faqItems,
      });
    }
    if (type == "Categories") {
      const { categories } = req.body;
      const CategoriesItem = await Promise.all(
        categories.map(async (item: any) => {
          return {
            title: item.title,
          };
        })
      );
      await layoutModel.create({
        categories: CategoriesItem,
        type: "Categories",
      });
    }
    res.status(200).json({
      success: true,
      message: "Layout created successfully",
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// edit layout

export const Editlayout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type } = req.body;
    // if (isTypeExists) {
    //   return next(new ErrorHandler(`${type} already exists`, 401));
    // }

    if (type == "Banner") {
      const bannerData = await layoutModel.findOne({ type: "Banner" });
      if (!bannerData) {
        return next(new ErrorHandler("Invalid", 401));
      }
      if (bannerData) {
        await cloudinary.uploader.destroy(bannerData.image.public_id);
      }
      const { image, title, subTitle } = req.body;
      // upload image
      const uploadImage = await cloudinary.uploader.upload(image, {
        folder: "layout",
      });
      let banner = {
        image: {
          public_id: uploadImage.public_id,
          url: uploadImage.secure_url,
        },
        title,
        subTitle,
      };
      await layoutModel.findByIdAndUpdate(bannerData._id, { banner });
    }
    if (type == "FAQ") {
      const { faq } = req.body;
      const faqData = await layoutModel.findOne({ type: "FAQ" });

      const faqItems = await Promise.all(
        faq.map(async (item: any) => {
          return {
            question: item.question,
            answer: item.answer,
          };
        })
      );
      await layoutModel.findByIdAndUpdate(faqData?._id, {
        type: "FAQ",
        faq: faqItems,
      });
    }
    if (type == "Categories") {
      const categoriesData = await layoutModel.findOne({ type: "Categories" });

      const { categories } = req.body;
      const CategoriesItem = await Promise.all(
        categories.map(async (item: any) => {
          return {
            title: item.title,
          };
        })
      );
      await layoutModel.findByIdAndUpdate(categoriesData?._id, {
        categories: CategoriesItem,
        type: "Categories",
      });
    }
    res.status(200).json({
      success: true,
      message: "Layout updated successfully",
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

export const getlayout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type } = req.body;
    const layout = await layoutModel.findOne({ type });
    res.status(200).json({ success: true, layout });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};
