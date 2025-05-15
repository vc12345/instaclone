import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { 
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { email, school, yearOfReception, referringUsername } = await req.json();

  // Validate inputs
  if (!email || !school || !yearOfReception) {
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
    yearOfReception,
    referringUsername,
    createdAt: new Date()
  });

  return new Response(JSON.stringify({ message: "Permission granted" }), { 
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}