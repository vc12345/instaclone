import clientPromise from "@/lib/mongodb";
import cloudinary from "@/lib/cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { postVisibility, uploadLimits } from "@/lib/config";
import { NextResponse } from "next/server";

// Cache control headers for better performance
const cacheHeaders = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300"
};

export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const client = await clientPromise;
  const db = client.db("instaclone");

  // Check daily upload limit
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow
  
  // Count posts created by this user today
  const todayPostsCount = await db.collection("posts").countDocuments({
    userEmail: session.user.email,
    createdAt: { 
      $gte: today,
      $lt: tomorrow
    }
  });

  // If user has reached the daily limit, return an error
  if (todayPostsCount >= uploadLimits.dailyLimit) {
    return new Response(
      JSON.stringify({ 
        error: "Daily upload limit reached", 
        message: `You've reached your daily limit of ${uploadLimits.dailyLimit} posts. Please delete an existing post before uploading a new one.`,
        dailyLimit: uploadLimits.dailyLimit,
        todayUploads: todayPostsCount
      }), 
      { 
        status: 429, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
  
  // Check total posts limit
  const totalPostsCount = await db.collection("posts").countDocuments({
    userEmail: session.user.email
  });
  
  // Check if user has reached the total posts limit
  const isAtTotalLimit = totalPostsCount >= uploadLimits.maxTotalPosts;
  
  // If at limit, check if the request includes confirmation to delete oldest post
  const formData = await req.formData();
  const confirmDeleteOldest = formData.get("confirmDeleteOldest") === "true";
  
  if (isAtTotalLimit && !confirmDeleteOldest) {
    return new Response(
      JSON.stringify({ 
        error: "Total posts limit reached", 
        message: `You've reached the maximum of ${uploadLimits.maxTotalPosts} posts. Uploading a new post will delete your oldest post.`,
        requiresConfirmation: true,
        totalLimit: uploadLimits.maxTotalPosts,
        currentTotal: totalPostsCount
      }), 
      { 
        status: 409, // Conflict
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
  
  // If at limit and confirmed, delete the oldest post
  if (isAtTotalLimit && confirmDeleteOldest) {
    const oldestPost = await db.collection("posts")
      .find({ userEmail: session.user.email })
      .sort({ createdAt: 1 })
      .limit(1)
      .toArray();
      
    if (oldestPost.length > 0) {
      await db.collection("posts").deleteOne({ _id: oldestPost[0]._id });
    }
  }

  const file = formData.get("image");

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        transformation: [
          { width: 1600, height: 1200, crop: "limit" },  // Resize to max 1600x1200 like WhatsApp
          { quality: 50 },                               // Lower quality (50 out of 100)
          { fetch_format: "jpg" },                       // Force JPEG format for consistent compression
          { strip: "all" }                               // Strip all metadata (EXIF, etc.)
        ],
        folder: "instaclone"                             // Organize in a folder
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    const readable = require("stream").Readable.from(buffer);
    readable.pipe(stream);
  });

  // Calculate the next public release time
  const now = new Date();
  const releaseDate = new Date(now);
  
  // Set the release time to the configured hour and minute in GMT
  if (postVisibility.useGMT) {
    // Use GMT time
    releaseDate.setUTCHours(postVisibility.releaseHour, postVisibility.releaseMinute, 0, 0);
  } else {
    // Use local time (legacy behavior)
    releaseDate.setHours(postVisibility.releaseHour, postVisibility.releaseMinute, 0, 0);
  }
  
  // If current time is past today's release time, set release for tomorrow
  // This ensures posts uploaded after 6:00 PM are scheduled for the next day
  if (now > releaseDate) {
    releaseDate.setDate(releaseDate.getDate() + 1);
  }

  await db.collection("posts").insertOne({
    caption: formData.get("caption"),
    imageUrl: uploadResult.secure_url,
    createdAt: now,                // When the post was actually created
    publicReleaseTime: releaseDate, // When the post becomes publicly visible
    username: session.user.username,
    userEmail: session.user.email,
  });

  return new Response(JSON.stringify({
    success: true,
    dailyLimit: uploadLimits.dailyLimit,
    todayUploads: todayPostsCount + 1,
    remainingUploads: uploadLimits.dailyLimit - (todayPostsCount + 1),
    totalPosts: isAtTotalLimit ? totalPostsCount : totalPostsCount + 1,
    maxTotalPosts: uploadLimits.maxTotalPosts,
    oldestDeleted: isAtTotalLimit && confirmDeleteOldest
  }), { 
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

// GET = Fetch all posts
export async function GET(req) {
  const session = await getServerSession(authOptions);
  const url = new URL(req.url);
  const username = url.searchParams.get("username");
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;
  
  // Debug info
  console.log("API Request:", {
    url: req.url,
    username,
    session: session?.user?.username,
    time: new Date().toISOString()
  });
  
  const client = await clientPromise;
  const db = client.db("instaclone");

  // Check if viewing own profile to determine if we should show scheduled posts
  const viewingOwnProfile = url.searchParams.get("viewingOwnProfile") === "true";
  
  let query = {};
  
  // Only apply release time filter if not viewing own profile
  if (!viewingOwnProfile) {
    query.publicReleaseTime = { $lte: new Date() };
  }
  
  // If a specific username is provided, filter by that username
  if (username) {
    query.username = username;
  }

  // Get total count for pagination
  const totalCount = await db.collection("posts").countDocuments(query);

  // Fetch posts with pagination
  const posts = await db
    .collection("posts")
    .find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  // Debug info about the query and results
  console.log("Query:", JSON.stringify(query));
  console.log("Found posts:", posts.length);
  
  // Return with pagination metadata
  return NextResponse.json(
    {
      posts,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      },
      debug: {
        query,
        timestamp: new Date().toISOString(),
        username: username || "none"
      }
    },
    { headers: cacheHeaders }
  );
}

// DELETE = Remove a post
export async function DELETE(req) {
  const { id } = await req.json();

  const client = await clientPromise;
  const db = client.db("instaclone");

  const result = await db.collection("posts").deleteOne({ _id: new ObjectId(id) });

  return new Response(JSON.stringify({ success: result.deletedCount === 1 }), {
    headers: { "Content-Type": "application/json" },
  });
}

// GET daily upload stats
export async function HEAD(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const client = await clientPromise;
  const db = client.db("instaclone");

  // Check daily upload limit
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow
  
  // Count posts created by this user today
  const todayPostsCount = await db.collection("posts").countDocuments({
    userEmail: session.user.email,
    createdAt: { 
      $gte: today,
      $lt: tomorrow
    }
  });

  return new Response(null, { 
    status: 200,
    headers: { 
      "X-Daily-Limit": uploadLimits.dailyLimit.toString(),
      "X-Today-Uploads": todayPostsCount.toString(),
      "X-Remaining-Uploads": Math.max(0, uploadLimits.dailyLimit - todayPostsCount).toString()
    }
  });
}