import mongoose from "mongoose";
import axios from "axios";

const OTPSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 5, // The document will be automatically deleted after 5 minutes of its creation time
  },
});

// Define a function to send emails
async function sendVerificationPhone(phone, otp) {
  try {
    // const mailResponse = await mailSender(
    // 	email,
    // 	"Verification Email",
    // 	emailTemplate(otp)
    // );
    // console.log("Email sent successfully: ", mailResponse.response);
    // console.log("sendVerificationPhone phone, otp", phone, otp);
    const url = `https://2factor.in/API/V1/${process.env.TWO_FACTOR_KEY}/SMS/${phone}/${otp}/GOGEN-OTP`;
    const phoneOtpSender = await axios.get(
      url
    );
    // console.log("url", url);
    // console.log("OTP sent successfully: ", phoneOtpSender.data);
  } catch (error) {
    console.log("Error occurred while sending phone: ", error);
    throw error;
  }
}

// Define a post-save hook to send email after the document has been saved
OTPSchema.post("save", async function (doc) {
  console.log("New document saved to database", this);

  // Only send an email when a new document is created
  // if(process.env.ENV === 'production'){
    await sendVerificationPhone(this.phone, this.otp);
  // }
});

export const OTP = mongoose.model("OTP", OTPSchema);

