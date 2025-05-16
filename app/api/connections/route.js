import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET - Fetch user's connection requests
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const client = await clientPromise;
  const db = client.db("instaclone");
  
  // Get connections sent by the current user
  const sentConnections = await db
    .collection("connections")
    .find({ 
      senderEmail: session.user.email,
    })
    .toArray();
  
  // Get connections received by the current user
  const receivedConnections = await db
    .collection("connections")
    .find({ 
      receiverUsername: session.user.username,
    })
    .toArray();
  
  // Get user details for received connections
  const senderUsernames = receivedConnections.map(conn => conn.senderUsername);
  const senderDetails = await db
    .collection("users")
    .find({ username: { $in: senderUsernames } })
    .toArray();
  
  // Combine sender details with connection requests
  const receivedConnectionsWithDetails = receivedConnections.map(conn => {
    const sender = senderDetails.find(user => user.username === conn.senderUsername);
    return {
      ...conn,
      senderSchool: sender?.school || null,
      senderName: sender?.name || sender?.username
    };
  });

  return NextResponse.json({
    sent: sentConnections,
    received: receivedConnectionsWithDetails
  });
}

// POST - Send a connection request
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { username } = await req.json();
  
  const client = await clientPromise;
  const db = client.db("instaclone");

  // Check if user exists
  const targetUser = await db.collection("users").findOne({ username });
  if (!targetUser) {
    return new Response(JSON.stringify({ error: "User not found" }), { 
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  // Get current user's details
  const currentUser = await db.collection("users").findOne({ email: session.user.email });
  
  // Check if already connected or has pending request
  const existingConnection = await db.collection("connections").findOne({
    senderEmail: session.user.email,
    receiverUsername: username
  });

  if (existingConnection) {
    return new Response(JSON.stringify({ error: "Connection request already sent" }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  // Check if mutual connection already exists
  const mutualConnection = await db.collection("connections").findOne({
    senderUsername: username,
    receiverUsername: session.user.username
  });
  
  // Create connection status
  const status = mutualConnection ? "connected" : "pending";
  
  // Create connection request
  await db.collection("connections").insertOne({
    senderEmail: session.user.email,
    senderUsername: session.user.username,
    receiverUsername: username,
    receiverEmail: targetUser.email,
    senderSchool: currentUser?.school || null,
    receiverSchool: targetUser?.school || null,
    status,
    createdAt: new Date()
  });
  
  // If mutual, update the other connection to connected
  if (mutualConnection && mutualConnection.status === "pending") {
    await db.collection("connections").updateOne(
      { _id: mutualConnection._id },
      { $set: { status: "connected" } }
    );
  }

  return new Response(JSON.stringify({ status }), { 
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

// PUT - Accept a connection request
export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { senderUsername } = await req.json();
  
  const client = await clientPromise;
  const db = client.db("instaclone");
  
  // Find the connection request
  const connectionRequest = await db.collection("connections").findOne({
    senderUsername,
    receiverUsername: session.user.username,
    status: "pending"
  });
  
  if (!connectionRequest) {
    return new Response(JSON.stringify({ error: "Connection request not found" }), { 
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  // Update connection status
  await db.collection("connections").updateOne(
    { _id: connectionRequest._id },
    { $set: { status: "connected" } }
  );
  
  // Check if there's a mutual connection and update it too
  const mutualConnection = await db.collection("connections").findOne({
    senderUsername: session.user.username,
    receiverUsername: senderUsername
  });
  
  if (mutualConnection) {
    await db.collection("connections").updateOne(
      { _id: mutualConnection._id },
      { $set: { status: "connected" } }
    );
  }
  
  return new Response(JSON.stringify({ status: "connected" }), { 
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}