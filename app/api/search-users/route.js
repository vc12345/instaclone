import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req) {
  const query = new URL(req.url).searchParams.get("query");
  const session = await getServerSession(authOptions);

  if (!query || !session) {
    return new Response(JSON.stringify([]), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const client = await clientPromise;
  const db = client.db("instaclone");
  
  // Get the current user's school
  const currentUser = await db.collection("users").findOne(
    { email: session.user.email },
    { projection: { school: 1 } }
  );
  
  if (!currentUser || !currentUser.school) {
    return new Response(JSON.stringify([]), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Find users with the same school and matching the search query
  const users = await db
    .collection("users")
    .find({ 
      name: { $regex: query, $options: "i" },
      school: currentUser.school
    })
    .project({ name: 1, username: 1, image: 1 })
    .limit(5)
    .toArray();

  return new Response(JSON.stringify(users), {
    headers: { "Content-Type": "application/json" },
  });
}