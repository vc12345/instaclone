import clientPromise from "@/lib/mongodb";
import Link from "next/link";
import { ObjectId } from "mongodb";
import Header from "@/components/Header";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import FavoriteButton from "@/components/FavoriteButton";
import Image from "next/image";

export default async function UserProfile({ params, searchParams }) {
  try {
    const { username } = params;
    const currentPage = parseInt(searchParams.page) || 1;
    const POSTS_PER_PAGE = 9; // Instagram shows 3 posts per row, 3 rows

    const client = await clientPromise;
    const db = client.db("instaclone");
    
    // Fetch user by username
    const user = await db.collection("users").findOne({ username });
    if (!user) {
      return (
        <>
          <Header />
          <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
            <p className="text-xl mb-4">User not found.</p>
            <Link href="/" className="text-blue-500 font-medium">
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
      <div className="bg-gray-50 min-h-screen">
        <Header />
        
        {/* Profile Header */}
        <div className="max-w-4xl mx-auto pt-8 px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center md:items-start mb-8">
            {/* Profile Picture */}
            <div className="w-24 h-24 md:w-36 md:h-36 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 mb-4 md:mb-0 md:mr-8">
              {user.image ? (
                <img 
                  src={user.image} 
                  alt={username} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500 text-2xl font-bold">
                  {username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            {/* Profile Info */}
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center mb-4">
                <h1 className="text-xl font-semibold mr-4">{username}</h1>
                {session?.user?.username && session.user.username !== username && (
                  <FavoriteButton 
                    username={username} 
                    initialIsFavorited={isFavorited} 
                  />
                )}
              </div>
              
              <div className="flex space-x-6 mb-4">
                <div className="text-center md:text-left">
                  <span className="font-semibold">{totalPosts}</span> posts
                </div>
                {/* Could add followers/following counts here */}
              </div>
              
              <div>
                <h2 className="font-semibold">{user.name || username}</h2>
                {user.school && (
                  <p className="text-gray-600">{user.school}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Post Grid */}
          <div className="border-t border-gray-200 pt-6">
            {posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 border-2 border-black rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-light mb-1">No Posts Yet</h3>
                <p className="text-gray-500">When {username} shares photos, you'll see them here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 md:gap-4">
                {posts.map((post) => (
                  <div key={post._id.toString()} className="aspect-square relative overflow-hidden bg-gray-100">
                    <img 
                      src={post.imageUrl} 
                      alt={post.caption} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 pb-8">
              <div className="flex items-center space-x-4">
                {currentPage > 1 && (
                  <Link
                    href={`?page=${currentPage - 1}`}
                    className="text-blue-500 font-medium"
                  >
                    Previous
                  </Link>
                )}
                <span className="text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
                {currentPage < totalPages && (
                  <Link
                    href={`?page=${currentPage + 1}`}
                    className="text-blue-500 font-medium"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Profile page error:", error);
    return (
      <div className="bg-gray-50 min-h-screen">
        <Header />
        <div className="max-w-4xl mx-auto pt-8 px-4 flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-red-500 mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-4">We encountered an error loading this profile.</p>
          <div className="bg-gray-100 p-4 rounded-md mb-6 max-w-lg overflow-auto">
            <pre className="text-sm">{error.message}</pre>
          </div>
          <Link href="/" className="text-blue-500 font-medium">
            Go back to home
          </Link>
        </div>
      </div>
    );
  }
}