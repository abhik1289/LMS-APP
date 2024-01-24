import mongoose, { Document, Model, Schema } from "mongoose";

export interface INotification {
  status: string;
  message: string;
  userId: string;
  title: string;
}

const notificationSchema = new Schema<INotification>({
  title: { type: String, required: true },
  userId: { type: String, required: true },
  status: { type: String, required: true, default: "unseen" },
  message: { type: String, required: true },
});

const notificationModel = mongoose.model("notification", notificationSchema);

export default notificationModel;
