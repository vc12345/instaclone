// app/user/[email]/page.js
import clientPromise from "@/lib/mongodb";

export default async function UserPostsPage({ params }) {
  const { email } = params;
  const client = await clientPromise;
  const db = client.db("instaclone");

  const posts = await db
    .collection("posts")
    .find({ userEmail: email })
    .sort({ createdAt: -1 })
    .toArray();

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Posts by {email}</h1>
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
