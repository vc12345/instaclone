import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { viewingHistory } from "@/lib/config";

// GET - Fetch viewing history
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "outgoing"; // "outgoing" or "incoming"
  
  const client = await clientPromise;
  const db = client.db("instaclone");

  // Calculate the cutoff date (7 days ago or as configured)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - viewingHistory.maxAgeDays);

  let history = [];
  
  if (type === "outgoing") {
    // Profiles viewed by the current user
    history = await db
      .collection("viewingHistory")
      .find({ 
        viewerUsername: session.user.username,
        viewedAt: { $gte: cutoffDate }
      })
      .sort({ viewedAt: -1 })
      .limit(viewingHistory.maxEntries)
      .toArray();
  } else {
    // Users who viewed the current user's profile
    const viewerRecords = await db
      .collection("viewingHistory")
      .find({ 
        viewedUsername: session.user.username,
        viewedAt: { $gte: cutoffDate }
      })
      .sort({ viewedAt: -1 })
      .limit(viewingHistory.maxEntries)
      .toArray();
    
    // Fetch viewer school information
    for (const record of viewerRecords) {
      const viewer = await db.collection("users").findOne(
        { username: record.viewerUsername },
        { projection: { school: 1 } }
      );
      
      if (viewer) {
        record.viewerSchool = viewer.school || "";
      }
    }
    
    history = viewerRecords;
  }

  return new Response(JSON.stringify(history), {
    headers: { "Content-Type": "application/json" },
  });
}

// POST - Record a profile view
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { viewedUsername } = await req.json();
  
  // Don't record views of your own profile
  if (session.user.username === viewedUsername) {
    return new Response("Own profile", { status: 200 });
  }

  const client = await clientPromise;
  const db = client.db("instaclone");

  // Check if the viewed user exists
  const viewedUser = await db.collection("users").findOne({ username: viewedUsername });
  if (!viewedUser) {
    return new Response("User not found", { status: 404 });
  }

  // Record the view
  await db.collection("viewingHistory").insertOne({
    viewerUsername: session.user.username,
    viewedUsername,
    viewedAt: new Date()
  });

  return new Response("Success", { status: 200 });
}