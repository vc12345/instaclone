// app/api/favorites/route.js
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json([], { status: 401 });

  const client = await clientPromise;
  const db = client.db("instaclone");
  const favorites = await db
    .collection("favorites")
    .find({ userEmail: session.user.email })
    .toArray();

  const usernames = favorites.map((fav) => fav.favoritedUsername);
  const users = await db
    .collection("users")
    .find({ username: { $in: usernames } })
    .toArray();

  return Response.json(users);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { username } = await req.json();
  const client = await clientPromise;
  const db = client.db("instaclone");

  await db.collection("favorites").updateOne(
    { userEmail: session.user.email, favoritedUsername: username },
    { $set: { favoritedAt: new Date() } },
    { upsert: true }
  );

  return Response.json({ success: true });
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { username } = await req.json();
  const client = await clientPromise;
  const db = client.db("instaclone");

  await db.collection("favorites").deleteOne({
    userEmail: session.user.email,
    favoritedUsername: username,
  });

  return Response.json({ success: true });
}
