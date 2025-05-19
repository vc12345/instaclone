import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req) {
  const url = new URL(req.url);
  const query = url.searchParams.get("query");
  const directUsername = url.searchParams.get("directUsername");
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response(JSON.stringify([]), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const client = await clientPromise;
  const db = client.db("instaclone");
  
  // Direct username lookup (with @ symbol)
  if (directUsername) {
    const username = directUsername.startsWith('@') ? directUsername.substring(1) : directUsername;
    
    const user = await db.collection("users").findOne(
      { username },
      { projection: { name: 1, username: 1, image: 1 } }
    );
    
    if (user) {
      return new Response(JSON.stringify([user]), {
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json" },
      });
    }
  }
  
  // Regular search
  if (!query) {
    return new Response(JSON.stringify([]), {
      headers: { "Content-Type": "application/json" },
    });
  }

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
  // Exclude the current user from results
  const users = await db
    .collection("users")
    .find({ 
      name: { $regex: query, $options: "i" },
      school: currentUser.school,
      email: { $ne: session.user.email } // Exclude current user
    })
    .project({ name: 1, username: 1, image: 1 })
    .limit(5)
    .toArray();

  return new Response(JSON.stringify(users), {
    headers: { "Content-Type": "application/json" },
  });
}