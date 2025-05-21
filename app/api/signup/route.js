// app/api/signup/route.js
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcrypt";

// Function to generate camelCased username from a name
function toCamelCase(name) {
  return name
    .toLowerCase()
    .replace(/[^a-zA-Z0-9 ]/g, "") // remove special chars
    .split(" ")
    .filter(Boolean)
    .map((word, index) =>
      index === 0 ? word : word[0].toUpperCase() + word.slice(1)
    )
    .join("");
}

export async function POST(req) {
  const { email, password, name, username, school } = await req.json();
  const client = await clientPromise;
  const db = client.db("instaclone");

  // Check if email is allowed and school matches
  const allowed = await db.collection("allowedEmails").findOne({ 
    email,
    school
  });
  
  if (!allowed) {
    return new Response("Email is not allowed to register, or school name does not match.", { status: 403 });
  }

  // Check if email already exists
  const existingEmail = await db.collection("users").findOne({ email });
  if (existingEmail) {
    return new Response("Email already exists. Please note: each child requires a distinct email address.", { status: 400 });
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
    createdAt: new Date(),
  });

  return new Response("User created", { status: 201 });
}