import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("instaclone");

    // Get distinct schools from allowedEmails collection instead of users
    const schools = await db.collection("allowedEmails").distinct("school");
    
    // Sort alphabetically
    schools.sort();

    return new Response(JSON.stringify(schools), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching schools:", error);
    return new Response(JSON.stringify([]), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}