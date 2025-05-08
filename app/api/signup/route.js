// app/api/signup/route.js
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcrypt";

export async function POST(req) {
  const { email, password, name } = await req.json();
  const client = await clientPromise;
  const db = client.db("instaclone");

  // Check if email is allowed
  const allowed = await db.collection("allowedEmails").findOne({ email });
  if (!allowed) {
    return new Response("Email is not allowed to register.", { status: 403 });
  }

  // Check if already registered
  const existing = await db.collection("users").findOne({ email });
  if (existing) {
    return new Response("Email already exists", { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);
  await db.collection("users").insertOne({ email, password: hashed, name });

  return new Response("User created", { status: 201 });
  
}

