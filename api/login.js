import mongoose from "mongoose";

// MongoDB connection string from Vercel environment variable
const CONNECTION_STRING = process.env.MONGO_URI;

// Connect to MongoDB if not already connected
if (!mongoose.connection.readyState) {
  await mongoose.connect(CONNECTION_STRING);
}

// Define a simple User schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    try {
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (user.password !== password) {
        return res.status(401).json({ message: "Incorrect password" });
      }

      // Login success
      return res.status(200).json({ message: "Login successful" });
    } catch (err) {
      return res.status(500).json({ message: "Server error", error: err.message });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
