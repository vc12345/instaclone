// app/my-favorites/page.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import Link from "next/link";

export default async function MyFavoritesPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return (
      <div>
        <p>You must be logged in to view your favorites.</p>
        <Link href="/login" className="text-blue-500 underline">
          Login
        </Link>
      </div>
    );
  }

  const client = await clientPromise;
  const db = client.db("instaclone");

  const favorites = await db
    .collection("favorites")
    .find({ userEmail: session.user.email })
    .toArray();

  const usernames = favorites.map((f) => f.favoritedUsername);
  const users = await db
    .collection("users")
    .find({ username: { $in: usernames } })
    .toArray();

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">My Favorite Users</h1>
      {users.length === 0 ? (
        <p>You haven&apos;t favorited anyone yet.</p>
      ) : (
        <table className="table-auto border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border px-4 py-2">Name</th>
              <th className="border px-4 py-2">Username</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.username}>
                <td className="border px-4 py-2">{user.name}</td>
                <td className="border px-4 py-2">
                  <Link href={`/${user.username}`} className="text-blue-500 underline">
                    {user.username}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
