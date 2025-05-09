"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Header() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchTerm.trim()) {
        const res = await fetch(`/api/search-users?query=${searchTerm}`);
        const users = await res.json();
        setResults(users);
      } else {
        setResults([]);
      }
    }, 300); // debounce

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  return (
    <header className="flex flex-col items-start gap-2 p-4 border-b">
      <div className="flex items-center justify-between w-full">
        <Link href="/" className="text-lg font-bold text-blue-600">
          Go to Homepage
        </Link>

        {session ? (
          <div className="flex items-center gap-4">
            <span className="text-sm">Hi, {session.user.name}</span>
            <button onClick={() => signOut()} className="text-red-500 underline">
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-blue-500 underline">
              Login
            </Link>
            <Link href="/signup" className="text-blue-500 underline">
              Sign Up
            </Link>
            <button onClick={() => signIn("google")} className="text-blue-600 underline">
              Login with Google
            </button>
          </div>
        )}
      </div>

      <div className="relative w-full max-w-sm">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search users by name"
          className="border p-2 w-full rounded"
        />
        {results.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border shadow z-10">
            {results.map((user) => (
              <Link
                key={user.username}
                href={`/${user.username}`}
                className="block px-4 py-2 hover:bg-gray-100"
              >
                {user.name} ({user.username})
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
