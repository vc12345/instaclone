import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Fetch permitted users
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { 
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const client = await clientPromise;
    const db = client.db("instaclone");

    // Get permitted users, sorted by creation date (newest first)
    const permittedUsers = await db.collection("allowedEmails")
      .find({ referringUsername: session.user.username })
      .sort({ createdAt: -1 })
      .toArray();

    return new Response(JSON.stringify(permittedUsers), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching permitted users:", error);
    return new Response(JSON.stringify({ message: "Failed to fetch permitted users" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// POST - Add new permitted user
export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { 
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { email, school, referringUsername } = await req.json();

  // Validate inputs
  if (!email || !school) {
    return new Response(JSON.stringify({ message: "Missing required fields" }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const client = await clientPromise;
  const db = client.db("instaclone");

  // Check if email already exists in allowedEmails
  const existingPermission = await db.collection("allowedEmails").findOne({ email });
  if (existingPermission) {
    return new Response(JSON.stringify({ message: "Email already has permission" }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Add email to allowedEmails collection
  await db.collection("allowedEmails").insertOne({
    email,
    school,
    referringUsername,
    createdAt: new Date()
  });

  return new Response(JSON.stringify({ message: "Permission granted" }), { 
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}