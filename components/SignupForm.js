"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { generateAcademicYears } from "@/lib/utils";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [schoolPostcode, setSchoolPostcode] = useState("");
  const [yearOfReception, setYearOfReception] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [schools, setSchools] = useState([]);
  const router = useRouter();

  // Generate academic year options (YYYY/YY format) - limited to 10
  const academicYears = generateAcademicYears(1980, null, 10);

  // Fetch distinct schools
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const res = await fetch("/api/schools");
        const data = await res.json();
        setSchools(data);
      } catch (error) {
        console.error("Error fetching schools:", error);
      }
    };
    fetchSchools();
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    // Format school name with postcode if custom school
    const finalSchool = school === "other" 
      ? `${schoolName} (${schoolPostcode})` 
      : school;
    
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          password, 
          name, 
          school: finalSchool, 
          yearOfReception 
        }),
      });

      if (res.ok) {
        // Auto-login after successful signup
        const signInResult = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (signInResult?.error) {
          setError("Account created but login failed. Please try logging in manually.");
          router.push("/?login=true");
        } else {
          // Redirect to home page after successful login
          router.push("/");
          router.refresh();
        }
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
          <select
            id="school"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select school</option>
            {schools.map((school) => (
              <option key={school} value={school}>
                {school}
              </option>
            ))}
            <option value="other">School not in list</option>
          </select>
        </div>
        
        {school === "other" && (
          <>
            <div>
              <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-1">
                School Name
              </label>
              <input
                id="schoolName"
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="eg. St Christopher's"
              />
            </div>
            
            <div>
              <label htmlFor="schoolPostcode" className="block text-sm font-medium text-gray-700 mb-1">
                School Postcode
              </label>
              <input
                id="schoolPostcode"
                type="text"
                value={schoolPostcode}
                onChange={(e) => setSchoolPostcode(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="eg. NW3"
              />
            </div>
          </>
        )}
        
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
            <option value="">Select academic year</option>
            {academicYears.map((year) => (
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