import clientPromise from "@/lib/mongodb";
import cloudinary from "@/lib/cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { ObjectId } from "mongodb";
import { postVisibility } from "@/lib/config";

export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
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

  const client = await clientPromise;
  const db = client.db("instaclone");

  // Calculate the next public release time
  const now = new Date();
  const releaseDate = new Date(now);
  
  // Set the release time to the configured hour and minute
  releaseDate.setHours(postVisibility.releaseHour, postVisibility.releaseMinute, 0, 0);
  
  // If current time is past today's release time, set release for tomorrow
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

  return new Response("Success", { status: 200 });
}

// GET = Fetch all posts
export async function GET(req) {
  const session = await getServerSession(authOptions);
  const url = new URL(req.url);
  const viewingOwnProfile = url.searchParams.get("viewingOwnProfile") === "true";
  
  const client = await clientPromise;
  const db = client.db("instaclone");

  let query = {};
  
  // If not viewing own profile, only show posts that have reached their public release time
  if (!viewingOwnProfile) {
    query = {
      publicReleaseTime: { $lte: new Date() }
    };
  }
  
  // If a specific username is provided, filter by that username
  const username = url.searchParams.get("username");
  if (username) {
    // If viewing own profile, show all posts
    if (viewingOwnProfile && session?.user?.username === username) {
      query = { username };
    } else {
      // Otherwise, show only publicly released posts for this user
      query = {
        username,
        publicReleaseTime: { $lte: new Date() }
      };
    }
  }

  const posts = await db
    .collection("posts")
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  return new Response(JSON.stringify(posts), {
    headers: { "Content-Type": "application/json" },
  });
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