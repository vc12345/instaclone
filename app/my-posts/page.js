import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";

export default async function MyPostsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <p>You must be logged in to see your posts.</p>;
  }

  const client = await clientPromise;
  const db = client.db("instagram");

  const posts = await db
    .collection("posts")
    .find({ userEmail: session.user.email })
    .sort({ createdAt: -1 })
    .toArray();

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">My Posts</h1>
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
