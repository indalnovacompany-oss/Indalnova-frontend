// /api/otpModel.js
import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  otp: { type: String, required: true },
  expires: { type: Date, required: true },
});

export default mongoose.models.OTP || mongoose.model("OTP", otpSchema);
