import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import Header from "@/components/Header";

export default async function MyFavoritesPage() {
  const session = await getServerSession(authOptions);
  const client = await clientPromise;
  const db = client.db("instaclone");

  if (!session) return <p>Please log in to view favorites.</p>;

  const user = await db.collection("users").findOne({ email: session.user.email });

  const favorites = await db
    .collection("users")
    .find({ username: { $in: user.favorites || [] } })
    .toArray();

  return (
    <>
      <Header />
      <div>
        <h1 className="text-xl font-bold mb-4">My Favorite Users</h1>
        {favorites.length === 0 ? (
          <p>No favorites yet.</p>
        ) : (
          <table className="table-auto border-collapse border border-gray-300">
            <thead>
              <tr>
                <th className="border px-4 py-2">Username</th>
                <th className="border px-4 py-2">Name</th>
              </tr>
            </thead>
            <tbody>
              {favorites.map((fav) => (
                <tr key={fav._id}>
                  <td className="border px-4 py-2">{fav.username}</td>
                  <td className="border px-4 py-2">{fav.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
