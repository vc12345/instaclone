import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const client = await clientPromise;
  const db = client.db("instaclone");

  // Get distinct schools from users collection
  const schools = await db.collection("users").distinct("school");
  
  // Sort alphabetically
  schools.sort();

  return new Response(JSON.stringify(schools), {
    headers: { "Content-Type": "application/json" },
  });
}