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

  const data = await req.formData();
  const file = data.get("image");

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        transformation: [
          { width: 1280, crop: "limit" },      // Resize if too wide
          { effect: "blur:300" },              // More noticeable blur
          { effect: "saturation:-30" },        // Reduce saturation by 50%
          { effect: "brightness:-10" },        // More noticeable brightness reduction
          { effect: "contrast:-10" },          // Reduce contrast
          { quality: "auto:eco" },             // Smart compression
          { fetch_format: "auto" }             // Convert to WebP or JPEG
        ],
        folder: "instaclone"                   // Organize in a folder
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
    caption: data.get("caption"),
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
    remainingUploads: uploadLimits.dailyLimit - (todayPostsCount + 1)
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
  
  const client = await clientPromise;
  const db = client.db("instaclone");

  let query = {};
  
  // TEMPORARILY DISABLED: Release time check for public profiles
  // Only apply release time filter if not viewing a specific user profile
  if (!username) {
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

  // Return with pagination metadata
  return NextResponse.json(
    {
      posts,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
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