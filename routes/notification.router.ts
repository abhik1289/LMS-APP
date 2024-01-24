import express from "express";
import { authorizedRoll, isAuthenticate } from "../middleware/auth";
import { getALLNotifications, updateNotification } from "../controllers/notification.contrller";

const notificationRouter = express.Router();
notificationRouter.get(
  "/get-notification",
  isAuthenticate,
  authorizedRoll("admin"),
  getALLNotifications
);
notificationRouter.put(
  "/update-notification/:id",
  isAuthenticate,
  authorizedRoll("admin"),
  updateNotification
);


export default notificationRouter;
