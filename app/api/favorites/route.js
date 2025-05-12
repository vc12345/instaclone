import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json([], { status: 401 });

  const client = await clientPromise;
  const db = client.db("instaclone");
  const favorites = await db
    .collection("favorites")
    .find({ userEmail: session.user.email })
    .toArray();

  return Response.json(favorites);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { username, name } = await req.json();
  const client = await clientPromise;
  const db = client.db("instaclone");

  await db.collection("favorites").updateOne(
    { userEmail: session.user.email, username },
    { $set: { username, name } },
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
    username,
  });

  return Response.json({ success: true });
}
