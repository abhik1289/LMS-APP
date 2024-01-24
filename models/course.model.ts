import mongoose, { Document, Model, Schema } from "mongoose";
import { IUser } from "./user.model";

interface IComment extends Document {
  user: IUser;
  question: string;
  questionReplies?: IComment[];
}
interface IReplay extends Document {
  user: IUser;
  comment: string;
}
interface Ireview extends Document {
  user: IUser;
  rating: number;
  comment: string;
  commentReplies: IReplay[];
}

interface Ilink extends Document {
  title: string;
  url: string;
}

interface ICourseData extends Document {
  title: string;
  description: string;
  videoUrl: string;
  videoThumnail: object;
  videoSection: string;
  videoLength: number;
  videoPlayer: string;
  links: Ilink[];
  suggestion: string;
  question: IComment[];
}

interface ICourse extends Document {
  name: string;
  description?: string;
  price: number;
  extimatedPrice?: number;
  thumnail: object;
  tags: string;
  level: string;
  demoUrl: string;
  benifits: { title: String }[];
  prerequisites: { title: String }[];
  review: Ireview[];
  courseData: ICourseData[];
  rating: number;
  purchased?: number;
}

const reviewSchema = new Schema<Ireview>({
  user: Object,
  rating: {
    type: Number,
    default: 0,
  },
  comment: String,
  commentReplies:[Object]
});

const linkSchema = new Schema<Ilink>({
  title: String,
  url: String,
});

const commentSchema = new Schema<IComment>({
  user: Object,
  question: String,
  // rating:Number,
  questionReplies: [Object],
});

const courseDataSchema = new Schema<ICourseData>({
  title: String,
  description: String,
  videoUrl: String,
  videoThumnail: Object,
  videoSection: String,
  videoLength: Number,
  videoPlayer: String,
  links: [linkSchema],
  suggestion: String,
  question: [commentSchema],
});

const courseSchema = new Schema<ICourse>({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  extimatedPrice: {
    type: Number,
  },
  thumnail: {
    public_id: {
      // required: true, 
      type: String,
    },
    url: {
      // required: true, 
      type: String,
    },
  },
  tags: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    required: true,
  },
  demoUrl: {
    type: String,
    required: true,
  },
  benifits: [{ title: String }],
  prerequisites: [{ title: String }],
  review: [reviewSchema],
  courseData: [courseDataSchema],
  rating: {
    type: Number,
    default: 0,
  },
  purchased: {
    type: Number,
    default: 0,
  },
});

const courseModel = mongoose.model("course", courseSchema);
export default courseModel;
