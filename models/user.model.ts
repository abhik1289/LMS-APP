require("dotenv").config();
import jwt from "jsonwebtoken";
import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";

const emailRegex: RegExp = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export interface IUser extends Document {
  name: string;
  email: string;
  activationCode: string;
  isVerified: boolean;
  role: string;
  password: string;
  avatar: {
    public_id: string;
    url: string;
  };
  courses: Array<{ courseId: String }>;
  comparePassword: (password: string) => Promise<boolean>;
  signAccessToken: () => string;
  signRefreshToken: () => string;
}

const userSchema: Schema<IUser> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      validate: {
        validator: function (value: string) {
          return emailRegex.test(value);
        },
        message: "Please enter your valid mail",
      },
      unique: true,
    },
    password: {
      type: String,
      minlength: [6, "Enter minimum 6 length"],
      select: false,
    },
    role: {
      type: String,
      default: "user",
    },
    avatar: {
      public_id: String,
      url: String,
    },
    isVerified: {
      default: false,
      type: Boolean,
    },
    courses: [{ courseId: String }],
  },
  { timestamps: true }
);

// hash password
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.signAccessToken = function () {
  return jwt.sign({ id: this._id }, process.env.ACCESS_SECRET_KEY || "", {
    expiresIn: "5m",
  });
};
userSchema.methods.signRefreshToken = function () {
  return jwt.sign({ id: this._id }, process.env.REFRESH_SCRET_KEY || "", {
    expiresIn: "30d",
  });
};
// compare password

userSchema.methods.comparePassword = async function (
  enterPassword: string
): Promise<boolean> {
  try {
    const isMatch: boolean = await bcrypt.compare(enterPassword, this.password);
    return isMatch;
  } catch (error) {
    // Handle error, such as logging or returning false
    return false;
  }
};
const userModel: Model<IUser> = mongoose.model("User", userSchema);

export default userModel;
