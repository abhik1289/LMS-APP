import express from "express";
import {
  activeUser,
  addCourse,
  deleteUser,
  getUserInfo,
  getUsers,
  logOutUser,
  loginUser,
  registrationUser,
  socailAuth,
  updateAccessToken,
  updateAvatar,
  updateInfo,
  updatePassword,
  updateUserRole,
} from "../controllers/user.controller";
import { authorizedRoll, isAuthenticate } from "../middleware/auth";
// import { getUser } from "../services/user.services";
const Userrouter = express.Router();

Userrouter.post("/registration", registrationUser);
Userrouter.post("/active-user", activeUser);
Userrouter.post("/login", loginUser);
Userrouter.get("/logout", logOutUser);
Userrouter.get("/refresh", updateAccessToken);
Userrouter.get("/me", isAuthenticate, getUserInfo);
Userrouter.post("/socal_auth", socailAuth);
Userrouter.put("/update_user", isAuthenticate, updateInfo);

Userrouter.put("/update_user_password", isAuthenticate, updatePassword);
Userrouter.put("/update_user_avatar", isAuthenticate, updateAvatar);
Userrouter.put("/buy_course", isAuthenticate, addCourse);
Userrouter.get("/get_user", isAuthenticate, authorizedRoll("admin"), getUsers);
Userrouter.put(
  "/udate_user_role",
  isAuthenticate,
  authorizedRoll("admin"),
  updateUserRole
);
Userrouter.delete(
  "/delete_user",
  isAuthenticate,
  authorizedRoll("admin"),
  deleteUser
);
export default Userrouter;
