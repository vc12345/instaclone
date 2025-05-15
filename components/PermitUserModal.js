"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { generateAcademicYears } from "@/lib/utils";

export default function PermitUserModal({ isOpen, onClose }) {
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [school, setSchool] = useState("");
  const [customSchool, setCustomSchool] = useState("");
  const [yearOfReception, setYearOfReception] = useState("");
  const [schools, setSchools] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Generate academic year options (YYYY/YY format)
  const academicYears = generateAcademicYears(1980);

  // Fetch distinct schools
  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const finalSchool = school === "other" ? customSchool : school;
      
      const res = await fetch("/api/permit-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          school: finalSchool,
          yearOfReception,
          referringUsername: session?.user?.username,
        }),
      });

      if (res.ok) {
        setMessage("Permission Granted");
        setEmail("");
        setSchool("");
        setCustomSchool("");
        setYearOfReception("");
      } else {
        const data = await res.json();
        setError(data.message || "Failed to grant permission");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Permit New User</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              {message}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter email address"
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
              <div>
                <label htmlFor="customSchool" className="block text-sm font-medium text-gray-700 mb-1">
                  Enter School Name
                </label>
                <input
                  id="customSchool"
                  type="text"
                  value={customSchool}
                  onChange={(e) => setCustomSchool(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter school name"
                />
              </div>
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
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              } text-white transition duration-200`}
            >
              {isLoading ? "Processing..." : "Give Permission"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}