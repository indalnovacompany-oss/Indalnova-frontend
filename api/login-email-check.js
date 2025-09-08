// /api/login-email-check.js
import mongoose from "mongoose";

const CONNECTION_STRING =
  process.env.MONGO_URI ||
  "mongodb+srv://indalnova:1LpW2CMG1MHEpuca@cluster0.05abfqy.mongodb.net/?retryWrites=true&w=majority";

let isConnected = false;

// Connect to MongoDB
async function connectDB() {
  if (isConnected) return;
  if (mongoose.connection.readyState >= 1) {
    isConnected = true;
    return;
  }
  await mongoose.connect(CONNECTION_STRING, { maxPoolSize: 10 });
  isConnected = true;
}

// User model
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: { type: String, unique: true },
  address: Object,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

// Clean phone number to 10 digits
function cleanPhone(phone) {
  phone = phone.replace(/\D/g, "");
  if (phone.startsWith("91") && phone.length > 10) phone = phone.slice(2);
  if (phone.startsWith("0") && phone.length > 10) phone = phone.slice(1);
  return phone;
}

// API handler
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await connectDB();
    const { email } = req.body;

    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(200).json({ exists: false });
    }

    // Return only the phone for OTP sending
    return res.status(200).json({
      exists: true,
      phone: cleanPhone(user.phone)
    });

  } catch (err) {
    console.error("login-email-check error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
