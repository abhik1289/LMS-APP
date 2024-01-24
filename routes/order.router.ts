import express from "express";
import { authorizedRoll, isAuthenticate } from "../middleware/auth";
import { createOrder, getOrders } from "../controllers/order.controller";

const orderRouter = express.Router();

orderRouter.post("/new-order", isAuthenticate, createOrder);
orderRouter.get(
    "/get_all_order",
    isAuthenticate,
    authorizedRoll("admin"),
    getOrders
  );
export default orderRouter;
