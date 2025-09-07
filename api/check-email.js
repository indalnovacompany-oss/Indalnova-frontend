import mongoose from "mongoose";

const CONNECTION_STRING = "mongodb+srv://indalnova:1LpW2CMG1MHEpuca@cluster0.05abfqy.mongodb.net/?retryWrites=true&w=majority";
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(CONNECTION_STRING);
  isConnected = true;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ available: false, message: "Method not allowed" });
  }

  try {
    await connectDB();

    const email = req.body.email?.toLowerCase();
    if (!email) return res.status(400).json({ available: false, message: "Email required" });

    const userSchema = new mongoose.Schema({
      name: String,
      email: { type: String, unique: true },
      password: String,
      phone: String
    });

    const User = mongoose.models.User || mongoose.model("User", userSchema);

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(200).json({ available: false, message: "Email already in use" });
    } else {
      return res.status(200).json({ available: true });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ available: false, message: "Server error" });
  }
}
