require("dotenv").config();
import nodemailer, { Transport } from "nodemailer";
import ejs from "ejs";
import path from "path";

interface EmailOptions {
  email: string;
  subject: string;
  template: string;
  data: {
    [key: string]: any;
  };
}
const account = process.env;
const transporter = nodemailer.createTransport({
  host: account.SMPT_HOST,
  port: parseInt(account.SMPT_PORT || "587"),
  service: account.SMTP_SERVICE, // e.g., 'gmail'
  auth: {
    user: account.SMTP_USER,
    pass: account.SMTP_PASS,
  },
});
const sendMail = async (options: EmailOptions): Promise<void> => {
  const { email, subject, template, data } = options;
  const templatePath = path.join(__dirname, "../mails", template);
  const html: string = await ejs.renderFile(templatePath, data);
  const mailOptions = {
    from: account.SMTP_USER,
    to: email,
    subject,
    html,
  };
  await transporter.sendMail(mailOptions);
};


export default sendMail;