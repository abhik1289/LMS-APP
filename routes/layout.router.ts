import express from "express";
import { authorizedRoll, isAuthenticate } from "../middleware/auth";
import {
  Editlayout,
  createLayout,
  getlayout,
} from "../controllers/layout.contrller";

const layoutRouter = express.Router();

layoutRouter.post(
  "/create-layout",
  isAuthenticate,
  authorizedRoll("admin"),
  createLayout
);
layoutRouter.put(
  "/edit-layout",
  isAuthenticate,
  authorizedRoll("admin"),
  Editlayout
);
layoutRouter.get(
  "/get-layout",
  isAuthenticate,
  authorizedRoll("admin"),
  getlayout
);

export default layoutRouter;
