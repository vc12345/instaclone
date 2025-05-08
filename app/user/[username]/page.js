import clientPromise from "@/lib/mongodb";

export default async function UserProfile({ params }) {
  const { username } = params;
  const client = await clientPromise;
  const db = client.db("instaclone");

  // Fetch user by username
  const user = await db.collection("users").findOne({ username });
  if (!user) return (
    <div>
      <p>User not found.</p>
      <a href="/" className="text-blue-500 underline">Go back to home</a>
    </div>
  );

  // Fetch posts based on user email
  const posts = await db
    .collection("posts")
    .find({ userEmail: user.email })
    .sort({ createdAt: -1 })
    .toArray();

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Posts by {user.name || username}</h1>
      {posts.length === 0 && <p>No posts yet.</p>}
      {posts.map((post) => (
        <div key={post._id} className="mb-6">
          <img src={post.imageUrl} alt={post.caption} className="w-full max-w-sm" />
          <p>{post.caption}</p>
        </div>
      ))}
    </div>
  );
}

