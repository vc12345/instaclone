import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const client = await clientPromise;
  const db = client.db("instaclone");
  
  const user = await db.collection("users").findOne({ email: session.user.email });
  
  if (!user) {
    return new Response("User not found", { status: 404 });
  }
  
  // Return only necessary fields
  return NextResponse.json({
    username: user.username,
    name: user.name,
    email: user.email,
    school: user.school
  });
}