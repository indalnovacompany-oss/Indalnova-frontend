import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const CONNECTION_STRING = "mongodb+srv://indalnova:1LpW2CMG1MHEpuca@cluster0.05abfqy.mongodb.net/?retryWrites=true&w=majority";
let isConnected = false;

async function connectDB() {
  if (!isConnected) {
    await mongoose.connect(CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true });
    isConnected = true;
  }
}

// Schema defined inline
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  password: String,
  address: {
    name: String,
    phone: String,
    address: String,
    landmark: String,
    city: String,
    state: String,
    pincode: String,
  },
  cart: { type: Array, default: [] },
  orders: { type: Array, default: [] },
});

let User;
try {
  User = mongoose.model("User");
} catch {
  User = mongoose.model("User", userSchema);
}

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ success: false, message: "Method not allowed" });

  await connectDB();

  const { name, email, phone, password, address, landmark, city, state, pincode, cart } = req.body;

  // Validate mandatory fields
  if (!name || !email || !phone || !address || !city || !state || !pincode) {
    return res.status(400).json({ success: false, message: "All details are required" });
  }

  try {
    let user = await User.findOne({ email });

    if (user) {
      // Existing user → update address & cart
      user.address = { name, phone, address, landmark, city, state, pincode };
      if (cart) user.cart = cart;
      await user.save();
      return res.status(200).json({ success: true, message: "Existing user found, address updated", user });
    } else {
      // New user → password is required
      if (!password) {
        return res.status(400).json({ success: false, message: "Password is required for new user" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await User.create({
        name,
        email,
        phone,
        password: hashedPassword,
        address: { name, phone, address, landmark, city, state, pincode },
        cart: cart || [],
        orders: [],
      });

      return res.status(200).json({ success: true, message: "New user created", user: newUser });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
