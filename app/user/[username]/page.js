import clientPromise from "@/lib/mongodb";
import Link from "next/link";
import { ObjectId } from "mongodb";
import Header from "@/components/Header";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


export default async function UserProfile({ params, searchParams }) {
  const { username } = params;
  const currentPage = parseInt(searchParams.page) || 1;
  const POSTS_PER_PAGE = 3;

  const client = await clientPromise;
  const db = client.db("instaclone");


  
  // Fetch user by username
  const user = await db.collection("users").findOne({ username });
  if (!user)
    return (
      <>
        <Header />
        <div>
          <p>User not found.</p>
          <Link href="/" className="text-blue-500 underline">
            Go back to home
          </Link>
        </div>
      </>
    );

  let isFavorited = false;
  const session = await getServerSession(authOptions);

  // Check only if logged in AND session includes email + username
  if (
    session?.user?.email &&
    session.user?.username &&
    session.user.username !== username
  ) {
    const favorite = await db.collection("favorites").findOne({
      userEmail: session.user.email,
      favoritedUsername: username,
    });
    isFavorited = !!favorite;
  }

  
  // Count total posts - use username instead of email
  const totalPosts = await db
    .collection("posts")
    .countDocuments({ username });

  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);

  // Fetch paginated posts - use username instead of email
  const posts = await db
    .collection("posts")
    .find({ username })
    .sort({ createdAt: -1 })
    .skip((currentPage - 1) * POSTS_PER_PAGE)
    .limit(POSTS_PER_PAGE)
    .toArray();

  return (
    <>
      <Header />

      {session?.user?.username && session.user.username !== username && (
        <form
          method="POST"
          action={`/api/favorites`}
          onSubmit={async (e) => {
            e.preventDefault();
            await fetch("/api/favorites", {
              method: isFavorited ? "DELETE" : "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username }),
            });
            location.reload(); // reload to reflect change
          }}
        >
          <button type="submit" className="text-blue-500 underline">
            {isFavorited ? "Remove from Favorites" : "Add to Favorites"}
          </button>
        </form>
      )}


      <div>
        <h1 className="text-xl font-bold mb-4">Posts by {user.name || username}</h1>
        {user.school && (
          <p className="text-gray-600 mb-4">School: {user.school}</p>
        )}

        {posts.length === 0 && <p>No posts yet.</p>}

        {posts.map((post) => (
          <div key={post._id} className="mb-6">
            <img src={post.imageUrl} alt={post.caption} className="w-full max-w-sm" />
            <p>{post.caption}</p>
          </div>
        ))}

        {totalPages > 1 && (
          <div className="flex gap-4 mt-4">
            {currentPage > 1 && (
              <Link
                href={`?page=${currentPage - 1}`}
                className="text-blue-500 underline"
              >
                Previous
              </Link>
            )}
            <span>
              Page {currentPage} of {totalPages}
            </span>
            {currentPage < totalPages && (
              <Link
                href={`?page=${currentPage + 1}`}
                className="text-blue-500 underline"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}