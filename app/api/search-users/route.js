import clientPromise from "@/lib/mongodb";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || query.trim() === "") {
    return new Response(JSON.stringify([]), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const client = await clientPromise;
  const db = client.db("instaclone");

  const users = await db
    .collection("users")
    .find({ name: { $regex: query, $options: "i" } })
    .limit(10)
    .project({ name: 1, username: 1, _id: 0 })
    .toArray();

  return new Response(JSON.stringify(users), {
    headers: { "Content-Type": "application/json" },
  });
}
