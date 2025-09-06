import mongoose from "mongoose";

const CONNECTION_STRING = process.env.MONGO_URI;

let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(CONNECTION_STRING);
  isConnected = true;
}

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  address: String,
  landmark: String,
  city: String,
  state: String,
  pincode: String
});
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default async function handler(req, res) {
  // ---- CORS ----
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });

  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: "Email is required" });

  await connectDB();

  try {
    const user = await User.findOne({ email });

    if (!user) {
      // No user found → indicate guest flow
      return res.status(200).json({ success: true, isGuest: true, message: "User not found, please enter full details" });
    }

    // User exists → return address details
    return res.status(200).json({ success: true, isGuest: false, user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
