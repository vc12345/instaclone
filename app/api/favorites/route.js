import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Fetch user's favorites
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const client = await clientPromise;
  const db = client.db("instaclone");
  
  // Check if we need to include posts
  const url = new URL(req.url);
  const includePosts = url.searchParams.get("includePosts") === "true";
  
  if (includePosts) {
    // Get list of favorited usernames
    const favorites = await db
      .collection("favorites")
      .find({ userEmail: session.user.email })
      .toArray();
    
    const favoritedUsernames = favorites.map(fav => fav.favoritedUsername);
    
    console.log(`Found ${favoritedUsernames.length} favorites for ${session.user.email}`);
    
    if (favoritedUsernames.length === 0) {
      return new Response(JSON.stringify({ favorites: [], posts: [] }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Get posts from favorited users that have been released
    const posts = await db
      .collection("posts")
      .find({
        username: { $in: favoritedUsernames },
        publicReleaseTime: { $lte: new Date() }
      })
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log(`Found ${posts.length} posts from favorited users`);
    
    return new Response(JSON.stringify({ favorites, posts }), {
      headers: { "Content-Type": "application/json" },
    });
  } else {
    // Just return favorites
    const favorites = await db
      .collection("favorites")
      .find({ userEmail: session.user.email })
      .toArray();

    return new Response(JSON.stringify(favorites), {
      headers: { "Content-Type": "application/json" },
    });
  }
}

// POST - Add a favorite
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { username } = await req.json();

  const client = await clientPromise;
  const db = client.db("instaclone");

  // Check if user exists
  const user = await db.collection("users").findOne({ username });
  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  // Check if already favorited
  const existing = await db.collection("favorites").findOne({
    userEmail: session.user.email,
    favoritedUsername: username,
  });

  if (existing) {
    return new Response("Already favorited", { status: 400 });
  }

  // Add favorite
  await db.collection("favorites").insertOne({
    userEmail: session.user.email,
    favoritedUsername: username,
    createdAt: new Date(),
  });

  return new Response("Success", { status: 200 });
}

// DELETE - Remove a favorite
export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { username } = await req.json();

  const client = await clientPromise;
  const db = client.db("instaclone");

  await db.collection("favorites").deleteOne({
    userEmail: session.user.email,
    favoritedUsername: username,
  });

  return new Response("Success", { status: 200 });
}