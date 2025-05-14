"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [yearOfReception, setYearOfReception] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Generate year options from 1980 to current year
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let year = currentYear; year >= 1980; year--) {
    yearOptions.push(year);
  }

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, school, yearOfReception }),
      });

      if (res.ok) {
        // Redirect to login page on successful signup
        router.push("/?login=true");
      } else {
        const errorText = await res.text();
        setError(errorText || "Signup failed. Please try again.");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Sign Up</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter your name"
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter your email"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Create a password"
          />
        </div>
        
        <div>
          <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-1">
            School
          </label>
          <input
            id="school"
            type="text"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter your school"
          />
        </div>
        
        <div>
          <label htmlFor="yearOfReception" className="block text-sm font-medium text-gray-700 mb-1">
            Year of Reception
          </label>
          <select
            id="yearOfReception"
            value={yearOfReception}
            onChange={(e) => setYearOfReception(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select year</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded-md font-medium ${
            isLoading
              ? "bg-green-300 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600"
          } text-white transition duration-200`}
        >
          {isLoading ? "Signing up..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}