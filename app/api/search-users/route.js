import clientPromise from "@/lib/mongodb";

export async function GET(req) {
  const query = new URL(req.url).searchParams.get("query");

  if (!query) {
    return new Response(JSON.stringify([]), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const client = await clientPromise;
  const db = client.db("instaclone");

  const users = await db
    .collection("users")
    .find({ name: { $regex: query, $options: "i" } })
    .project({ name: 1, username: 1 })
    .limit(5)
    .toArray();

  return new Response(JSON.stringify(users), {
    headers: { "Content-Type": "application/json" },
  });
}

