import clientPromise from "@/lib/mongodb";
import cloudinary from "@/lib/cloudinary";

export async function POST(req) {
  const data = await req.formData();
  const file = data.get("image");

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const result = await cloudinary.uploader.upload_stream({}, async (error, result) => {
    if (error) throw error;

    const client = await clientPromise;
    const db = client.db("instagram");

    await db.collection("posts").insertOne({
      caption: data.get("caption"),
      imageUrl: result.secure_url,
      createdAt: new Date()
    });
  });

  const readable = require("stream").Readable.from(buffer);
  readable.pipe(result);

  return new Response("Success", { status: 200 });
}
