"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function UserSearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.length === 0) {
        setResults([]);
        return;
      }

      fetch(`/api/search-users?q=${query}`)
        .then((res) => res.json())
        .then((data) => setResults(data));
    }, 300); // debounce input

    return () => clearTimeout(delayDebounce);
  }, [query]);

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <input
        type="text"
        placeholder="Search users by name..."
        className="w-full p-2 border rounded"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {results.length > 0 && (
        <ul className="bg-white border mt-2 rounded shadow">
          {results.map((user) => (
            <li key={user.username} className="p-2 border-b last:border-none">
              <Link href={`/user/${user.username}`} className="text-blue-600 hover:underline">
                {user.name} (@{user.username})
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
