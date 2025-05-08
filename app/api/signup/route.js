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

  // Generate a camelCase username from the name
  const baseUsername = toCamelCase(name);
  let username = baseUsername;
  let count = 1;

  // Ensure the username is unique
  while (await db.collection("users").findOne({ username })) {
    username = `${baseUsername}${count}`;
    count++;
  }

  // Hash the password
  const hashed = await bcrypt.hash(password, 10);

  // Create the new user in the database
  await db.collection("users").insertOne({
    email,
    password: hashed,
    name,
    username, // Add the generated username
    createdAt: new Date(),
  });

  return new Response("User created", { status: 201 });
}

