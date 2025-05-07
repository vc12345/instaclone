import clientPromise from "@/lib/mongodb";
import cloudinary from "@/lib/cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

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
    const stream = cloudinary.uploader.upload_stream((error, result) => {
      if (error) reject(error);
      else resolve(result);
    });

    const readable = require("stream").Readable.from(buffer);
    readable.pipe(stream);
  });

  const client = await clientPromise;
  const db = client.db("instagram");

  await db.collection("posts").insertOne({
    caption: data.get("caption"),
    imageUrl: uploadResult.secure_url,
    createdAt: new Date(),
    userEmail: session.user.email, // 👈 important!
  });

  return new Response("Success", { status: 200 });
}


