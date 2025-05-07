import clientPromise from "@/lib/mongodb";
import cloudinary from "@/lib/cloudinary";

// Handle POST (upload) and GET (fetch posts)
export async function POST(req) {
  const data = await req.formData();
  const file = data.get("image");
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({}, async (error, result) => {
      if (error) reject(error);

      const client = await clientPromise;
      const db = client.db("instagram");

      await db.collection("posts").insertOne({
        caption: data.get("caption"),
        imageUrl: result.secure_url,
        createdAt: new Date(),
      });

      resolve(result);
    });

    require("stream").Readable.from(buffer).pipe(stream);
  });

  return new Response("Success", { status: 200 });
}

export async function GET() {
  const client = await clientPromise;
  const db = client.db("instagram");
  const posts = await db.collection("posts").find({}).sort({ createdAt: -1 }).toArray();

  return Response.json(posts);
}

