import mongoose from "mongoose";

const CONNECTION_STRING = "your_mongo_connection_string";

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(CONNECTION_STRING);
  isConnected = true;
}

// User Schema
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
  await connectDB();

  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });

  const { name, email, phone, address, landmark, city, state, pincode } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      // Update existing address
      user.name = name;
      user.phone = phone;
      user.address = address;
      user.landmark = landmark;
      user.city = city;
      user.state = state;
      user.pincode = pincode;
      await user.save();
    } else {
      // Create new user
      user = new User({ name, email, phone, address, landmark, city, state, pincode });
      await user.save();
    }

    res.status(200).json({ success: true, message: "Address saved successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}
