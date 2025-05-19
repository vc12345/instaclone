// app/api/signup/route.js
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcrypt";

export async function POST(req) {
  const { email, password, name, username, school, yearOfReception } = await req.json();
  const client = await clientPromise;
  const db = client.db("instaclone");

  // Check if email is allowed
  const allowed = await db.collection("allowedEmails").findOne({ email });
  if (!allowed) {
    return new Response("Email is not allowed to register, or school name / reception year does not match referrer's input.", { status: 403 });
  }

  // Verify that either school or yearOfReception matches the allowed values
  const schoolMatches = allowed.school === school;
  const yearMatches = allowed.yearOfReception.toString() === yearOfReception.toString();
  
  if (!schoolMatches && !yearMatches) {
    return new Response("School or year of reception does not match your invitation.", { status: 403 });
  }

  // Check if email already exists
  const existingEmail = await db.collection("users").findOne({ email });
  if (existingEmail) {
    return new Response("Email already exists", { status: 400 });
  }

  // Check if username already exists
  const existingUsername = await db.collection("users").findOne({ username });
  if (existingUsername) {
    return new Response("Username already taken", { status: 400 });
  }

  // Hash the password
  const hashed = await bcrypt.hash(password, 10);

  // Create the new user in the database
  await db.collection("users").insertOne({
    email,
    password: hashed,
    name,
    username,
    school,
    yearOfReception,
    createdAt: new Date(),
  });

  return new Response("User created", { status: 201 });
}