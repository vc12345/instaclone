import clientPromise from "@/lib/mongodb";
import Link from "next/link";
import { ObjectId } from "mongodb";
import Header from "@/components/Header";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import FavoriteButton from "@/components/FavoriteButton";
import Image from "next/image";
import LayoutToggleServer from "@/components/LayoutToggleServer";
import { postVisibility, layoutSettings } from "@/lib/config";
import LikeButton from "@/components/LikeButton";
import FakeLikeCounter from "@/components/FakeLikeCounter";

export default async function UserProfile({ params, searchParams }) {
  try {
    const { username } = params;
    const currentPage = parseInt(searchParams.page) || 1;
    const layout = searchParams.layout || layoutSettings.defaultLayout;
    const selectedImageId = searchParams.image || null;
    const POSTS_PER_PAGE = layout === 'grid' ? 9 : 3;

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
    let isOwnProfile = false;
    
    try {
      session = await getServerSession(authOptions);
      
      // Check if this is the user's own profile
      isOwnProfile = session?.user?.username === username;
      
      // Check only if logged in AND session includes email + username
      if (
        session?.user?.email &&
        session.user?.username &&
        !isOwnProfile
      ) {
        const favorite = await db.collection("favorites").findOne({
          userEmail: session.user.email,
          favoritedUsername: username,
        });
        isFavorited = !!favorite;

        // Record this profile view if not viewing own profile
        // Only record when the page loads, not during interactions
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/viewing-history`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ viewedUsername: username }),
          cache: 'no-store'
        });
      }
    } catch (sessionError) {
      console.error("Session error:", sessionError);
      // Continue without session data
    }
    
    // Fetch posts directly from the database
    let posts = [];
    try {
      // Build query based on whether viewing own profile
      let query = { username };
      
      // Always apply release time check, even for own profile
      query.publicReleaseTime = { $lte: new Date() };
      
      // Fetch posts from database directly
      posts = await db
        .collection("posts")
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();
      
      // Log for debugging
      console.log(`Fetched ${posts.length} posts for ${username}, own profile: ${isOwnProfile}`);
    } catch (dbError) {
      console.error("Error fetching posts:", dbError);
    }

    // Count total posts and calculate pagination
    const totalPosts = posts.length;
    const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
    
    // Apply pagination
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    const paginatedPosts = posts.slice(start, start + POSTS_PER_PAGE);

    // Find selected image index if an image ID is provided
    let selectedImageIndex = -1;
    if (selectedImageId) {
      selectedImageIndex = paginatedPosts.findIndex(post => post._id.toString() === selectedImageId);
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      });
    };

    // Check if a post is scheduled for future release
    const isScheduledPost = (post) => {
      if (!post.publicReleaseTime) return false;
      return new Date(post.publicReleaseTime) > new Date();
    };

    // Get the next release time for display
    const nextReleaseTime = new Date();
    if (postVisibility.useGMT) {
      nextReleaseTime.setUTCHours(postVisibility.releaseHour, postVisibility.releaseMinute, 0, 0);
    } else {
      nextReleaseTime.setHours(postVisibility.releaseHour, postVisibility.releaseMinute, 0, 0);
    }
    if (nextReleaseTime < new Date()) {
      nextReleaseTime.setDate(nextReleaseTime.getDate() + 1);
    }
    const formattedReleaseTime = postVisibility.useGMT 
      ? `${nextReleaseTime.toUTCString().split(' ')[4]} GMT` 
      : nextReleaseTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    return (
      <div className="bg-gray-50 min-h-screen">
        <Header />
        
        {/* Profile Header */}
        <div className="max-w-4xl mx-auto pt-8 px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center md:items-start mb-8">
            {/* Profile Picture */}
            <div className="w-24 h-24 md:w-36 md:h-36 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 mb-4 md:mb-0 md:mr-8">
              {user.image ? (
                <Image 
                  src={user.image} 
                  alt={username} 
                  width={144}
                  height={144}
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
                {session?.user?.username && !isOwnProfile && (
                  <FavoriteButton 
                    username={username} 
                    initialIsFavorited={isFavorited} 
                  />
                )}
              </div>
              
              <div className="space-y-1">
                <h2 className="font-semibold">{user.name || username}</h2>
                {user.school && (
                  <p className="text-gray-600">School: {user.school}</p>
                )}
                {user.yearOfReception && (
                  <p className="text-gray-600">Year of Reception: {user.yearOfReception}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Release time info for own profile */}
          {isOwnProfile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-500 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-blue-800">
                  <span className="font-medium">Post Release Schedule:</span> New posts become publicly visible at {formattedReleaseTime} daily.
                </p>
              </div>
            </div>
          )}
          
          {/* Layout Toggle and Post Grid */}
          <div className="border-t border-gray-200 pt-6">
            {paginatedPosts.length > 0 && (
              <div className="mb-6">
                <LayoutToggleServer currentLayout={layout} username={username} />
              </div>
            )}
            
            {paginatedPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 border-2 border-black rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175a2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-light mb-1">No Posts Yet</h3>
                <p className="text-gray-500">When {username} shares photos, you&apos;ll see them here.</p>
              </div>
            ) : layout === 'grid' ? (
              <div className="grid grid-cols-3 gap-1 md:gap-4">
                {paginatedPosts.map((post) => (
                  <Link
                    key={post._id.toString()}
                    href={`/user/${username}?layout=${layout}&page=${currentPage}&image=${post._id.toString()}`}
                    className="aspect-square relative overflow-hidden bg-gray-100 cursor-pointer"
                  >
                    <Image 
                      src={post.imageUrl} 
                      alt={post.caption || "Post image"}
                      fill
                      sizes="(max-width: 768px) 33vw, 300px"
                      className={`object-cover ${isOwnProfile && isScheduledPost(post) ? 'opacity-60' : ''}`}
                    />
                    {isOwnProfile && isScheduledPost(post) && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                        Scheduled
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {paginatedPosts.map((post) => (
                  <div key={post._id.toString()} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <div className="flex items-center p-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 mr-2 flex-shrink-0">
                        <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500 font-bold">
                          {username.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <span className="font-medium">{username}</span>
                      <span className="ml-auto text-xs text-gray-500">{formatDate(post.createdAt)}</span>
                    </div>
                    
                    <Link
                      href={`/user/${username}?layout=${layout}&page=${currentPage}&image=${post._id.toString()}`}
                      className="block relative w-full h-[500px] cursor-pointer"
                    >
                      <Image 
                        src={post.imageUrl} 
                        alt={post.caption || "Post image"} 
                        fill
                        sizes="(max-width: 768px) 100vw, 800px"
                        className={`object-cover ${isOwnProfile && isScheduledPost(post) ? 'opacity-60' : ''}`}
                      />
                      {isOwnProfile && isScheduledPost(post) && (
                        <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full font-medium">
                          Scheduled for {new Date(post.publicReleaseTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      )}
                    </Link>
                    
                    <div className="p-3">
                      <div className="flex items-center mb-2">
                        {session && (
                          <LikeButton postId={post._id.toString()} />
                        )}
                        <div className="ml-2">
                          <FakeLikeCounter postId={post._id.toString()} />
                        </div>
                      </div>
                      <p className="mb-2">
                        <span className="font-medium mr-2">{username}</span>
                        {post.caption}
                      </p>
                    </div>
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
                    href={`?page=${currentPage - 1}&layout=${layout}`}
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
                    href={`?page=${currentPage + 1}&layout=${layout}`}
                    className="text-blue-500 font-medium"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Image Popup */}
        {selectedImageIndex >= 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
            <div className="relative w-full max-w-4xl h-[80vh]">
              <Link
                href={`/user/${username}?layout=${layout}&page=${currentPage}`}
                className="absolute top-4 right-4 bg-white bg-opacity-50 rounded-full p-2 hover:bg-opacity-70"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Link>
              
              {selectedImageIndex > 0 && (
                <Link
                  href={`/user/${username}?layout=${layout}&page=${currentPage}&image=${paginatedPosts[selectedImageIndex - 1]._id.toString()}`}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 rounded-full p-2 z-10 hover:bg-opacity-70"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </Link>
              )}
              
              <div className="relative h-full w-full">
                <Image 
                  src={paginatedPosts[selectedImageIndex].imageUrl} 
                  alt={paginatedPosts[selectedImageIndex].caption || "Post image"} 
                  fill
                  className="object-contain"
                />
              </div>
              
              {selectedImageIndex < paginatedPosts.length - 1 && (
                <Link
                  href={`/user/${username}?layout=${layout}&page=${currentPage}&image=${paginatedPosts[selectedImageIndex + 1]._id.toString()}`}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 rounded-full p-2 z-10 hover:bg-opacity-70"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              )}
              
              <div className="absolute bottom-4 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
                <p className="font-medium">{username}</p>
                <p className="text-sm">{paginatedPosts[selectedImageIndex].caption}</p>
              </div>
            </div>
          </div>
        )}
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