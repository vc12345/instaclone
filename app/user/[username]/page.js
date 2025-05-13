import clientPromise from "@/lib/mongodb";
import Link from "next/link";
import { ObjectId } from "mongodb";
import Header from "@/components/Header";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import FavoriteButton from "@/components/FavoriteButton";

export default async function UserProfile({ params, searchParams }) {
  try {
    const { username } = params;
    const currentPage = parseInt(searchParams.page) || 1;
    const POSTS_PER_PAGE = 3;

    const client = await clientPromise;
    const db = client.db("instaclone");
    
    // Fetch user by username
    const user = await db.collection("users").findOne({ username });
    if (!user) {
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
    }

    let isFavorited = false;
    let session = null;
    
    try {
      session = await getServerSession(authOptions);
      
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
    } catch (sessionError) {
      console.error("Session error:", sessionError);
      // Continue without session data
    }
    
    // Use a safe query that doesn't depend on potentially missing fields
    const postsQuery = { 
      $or: [
        { username },
        { userEmail: user.email }
      ]
    };

    // Count total posts with error handling
    let totalPosts = 0;
    let totalPages = 1;
    try {
      totalPosts = await db
        .collection("posts")
        .countDocuments(postsQuery);
      
      totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
    } catch (countError) {
      console.error("Error counting posts:", countError);
    }

    // Fetch paginated posts with error handling
    let posts = [];
    try {
      posts = await db
        .collection("posts")
        .find(postsQuery)
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * POSTS_PER_PAGE)
        .limit(POSTS_PER_PAGE)
        .toArray();
    } catch (fetchError) {
      console.error("Error fetching posts:", fetchError);
    }

    return (
      <>
        <Header />

        {session?.user?.username && session.user.username !== username && (
          <div className="mb-4">
            <FavoriteButton 
              username={username} 
              initialIsFavorited={isFavorited} 
            />
          </div>
        )}

        <div>
          <h1 className="text-xl font-bold mb-4">Posts by {user.name || username}</h1>
          {user.school && (
            <p className="text-gray-600 mb-4">School: {user.school}</p>
          )}

          {posts.length === 0 && <p>No posts yet.</p>}

          {posts.map((post) => (
            <div key={post._id.toString()} className="mb-6">
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
  } catch (error) {
    console.error("Profile page error:", error);
    return (
      <>
        <Header />
        <div>
          <h1>Something went wrong</h1>
          <p>We encountered an error loading this profile.</p>
          <pre>{error.message}</pre>
          <Link href="/" className="text-blue-500 underline">
            Go back to home
          </Link>
        </div>
      </>
    );
  }
}