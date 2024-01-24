import { Response } from "express";
import orderModel from "../models/order.model";

export const newOrder = async (data: any, res: Response) => {
  await orderModel.create(data);
};
export const getAllOrdersServices = async (res: Response) => {
  const orders = await orderModel.find().sort({ createAt: -1 });
  res.status(200).json({ success: true, orders });
};
