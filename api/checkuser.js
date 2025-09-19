import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI;  // Add this in Vercel > Project Settings > Environment Variables
let client;
let clientPromise;

if (!clientPromise) {
  client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  clientPromise = client.connect();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, phone } = req.body;

    if (!email) {
      return res.status(200).json({ exists: false });
    }

    const conn = await clientPromise;
    const db = conn.db("test");            // ✅ your DB name
    const users = db.collection("users");  // ✅ your collection

    // check by email + phone if provided, otherwise just email
    const query = phone ? { email, phone } : { email };
    const user = await users.findOne(query);

    return res.status(200).json({ exists: !!user });
  } catch (err) {
    console.error("MongoDB error:", err);
    return res.status(500).json({ error: "Database error" });
  }
}

