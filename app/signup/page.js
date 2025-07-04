"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [yearOfReception, setYearOfReception] = useState("");
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, school, yearOfReception }),
    });

    if (res.ok) {
      alert("Signup successful! You can now log in.");
      router.push("/login");
    } else {
      const text = await res.text();
      alert(text);
    }
  };

  // Generate year options from 1980 to current year
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let year = currentYear; year >= 1980; year--) {
    yearOptions.push(year);
  }

  return (
    <form onSubmit={handleSignup} className="space-y-4 max-w-sm mx-auto mt-10">
      <h1 className="text-xl font-bold">Sign Up</h1>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="border p-2 w-full"
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="border p-2 w-full"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="border p-2 w-full"
      />
      <input
        type="text"
        placeholder="School"
        value={school}
        onChange={(e) => setSchool(e.target.value)}
        required
        className="border p-2 w-full"
      />
      <div className="w-full">
        <select
          value={yearOfReception}
          onChange={(e) => setYearOfReception(e.target.value)}
          className="border p-2 w-full"
          required
        >
          <option value="">Year of Reception</option>
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="bg-green-500 text-white px-4 py-2">Sign Up</button>
    </form>
  );
}