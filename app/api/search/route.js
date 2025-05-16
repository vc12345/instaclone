import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(req.url);
  const query = url.searchParams.get("q");
  
  if (!query) {
    return NextResponse.json([]);
  }
  
  const client = await clientPromise;
  const db = client.db("instaclone");
  
  // Search for users by username or name
  const users = await db.collection("users").find({
    $or: [
      { username: { $regex: query, $options: "i" } },
      { name: { $regex: query, $options: "i" } }
    ]
  }).limit(10).toArray();
  
  // Don't include the current user in results
  const filteredUsers = users.filter(user => user.username !== session.user.username);
  
  // Return only necessary fields
  const results = filteredUsers.map(user => ({
    username: user.username,
    name: user.name,
    school: user.school
  }));
  
  return NextResponse.json(results);
}