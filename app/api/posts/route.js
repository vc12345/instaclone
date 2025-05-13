import clientPromise from "@/lib/mongodb";
import cloudinary from "@/lib/cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { ObjectId } from "mongodb";

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
          { effect: "blur:800" },              // More noticeable blur
          { effect: "saturation:-50" },        // Reduce saturation by 50%
          { effect: "brightness:-15" },        // More noticeable brightness reduction
          { effect: "contrast:-10" },          // Reduce contrast
          { effect: "vignette:30" },           // Add subtle vignette effect
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

  await db.collection("posts").insertOne({
    caption: data.get("caption"),
    imageUrl: uploadResult.secure_url,
    createdAt: new Date(),
    username: session.user.username,
    userEmail: session.user.email,
  });

  return new Response("Success", { status: 200 });
}

// GET = Fetch all posts
export async function GET() {
  const client = await clientPromise;
  const db = client.db("instaclone");

  const posts = await db
    .collection("posts")
    .find({})
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