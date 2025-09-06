import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const CONNECTION_STRING = "mongodb+srv://indalnova:1LpW2CMG1MHEpuca@cluster0.05abfqy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(CONNECTION_STRING);
  isConnected = true;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await connectDB();

    const { email, password } = req.body;

    // Define schema and model
    const userSchema = new mongoose.Schema({
      name: String,
      email: { type: String, unique: true },
      password: String,
      phone: String,
      address: String
    });

    const User = mongoose.models.User || mongoose.model("User", userSchema);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    return res.status(200).json({ success: true, message: "Logged in successfully", user: { name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
