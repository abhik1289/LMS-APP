import mongoose, { Document, Model, Schema } from "mongoose";

interface FAQItem extends Document {
  question: string;
  answer: string;
}
interface Category extends Document {
  title: string;
}

interface BannerImage extends Document {
  public_id: string;
  url: string;
}
interface Layout extends Document {
  type: string;
  faq: FAQItem[];
  categories: Category[];
  banner: {
    title: string;
    subTitle: string;
    image: BannerImage;
  };
}
const faqSchema = new Schema<FAQItem>({
  question: { type: String },
  answer: { type: String },
});
const categorySchema = new Schema<Category>({
  title: { type: String },
});
const bannerSchema = new Schema<BannerImage>({
  public_id: { type: String },
  url: { type: String },
});

const layoutSchema = new Schema<Layout>({
  type: {
    type: String,
  },
  faq: [faqSchema],
  categories: [categorySchema],
  banner: {
    image: bannerSchema,
    title: { type: String },
    subTitle: { type: String },
  },
});

const layoutModel = mongoose.model<Layout>("layout", layoutSchema);
export default layoutModel;
