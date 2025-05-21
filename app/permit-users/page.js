"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { generateAcademicYears } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

// Function to format school name properly
const formatSchoolName = (name) => {
  if (!name) return "";
  
  // Remove apostrophes
  let formatted = name.replace(/'/g, "");
  
  // Convert to proper case (capitalize first letter of each word)
  formatted = formatted.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  
  // Replace "Saint" with "St"
  formatted = formatted.replace(/\bSaint\b/gi, "St");
  
  return formatted;
};

export default function PermitUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [school, setSchool] = useState("");
  const [customSchool, setCustomSchool] = useState("");
  const [schoolPostcode, setSchoolPostcode] = useState("");
  const [postcodeError, setPostcodeError] = useState("");
  const [schools, setSchools] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [permittedUsers, setPermittedUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

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

  // Fetch permitted users
  const fetchPermittedUsers = useCallback(async () => {
    if (!session?.user?.email) return;
    
    setIsLoadingUsers(true);
    try {
      const res = await fetch("/api/permit-user");
      if (res.ok) {
        const data = await res.json();
        setPermittedUsers(data);
      } else {
        console.error("Failed to fetch permitted users:", res.status);
      }
    } catch (error) {
      console.error("Error fetching permitted users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (session) {
      fetchPermittedUsers();
    }
  }, [session, fetchPermittedUsers]);

  // Handle postcode change with validation
  const handlePostcodeChange = (e) => {
    const value = e.target.value.toUpperCase();
    setSchoolPostcode(value);
    
    if (value.length > 4) {
      setPostcodeError("Please enter only the first part of the postcode (max 4 characters)");
    } else {
      setPostcodeError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    
    // Validate postcode
    if (school === "other" && schoolPostcode.length > 4) {
      setPostcodeError("Please enter only the first part of the postcode (max 4 characters)");
      return;
    }
    
    setIsLoading(true);

    try {
      // Format school name with postcode if custom school
      let finalSchool;
      if (school === "other") {
        const formattedSchoolName = formatSchoolName(customSchool);
        finalSchool = `${formattedSchoolName} (${schoolPostcode.toUpperCase()})`;
      } else {
        finalSchool = school;
      }
      
      const res = await fetch("/api/permit-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          school: finalSchool,
          referringUsername: session?.user?.username,
        }),
      });

      if (res.ok) {
        setMessage("Permission Granted");
        setEmail("");
        setSchool("");
        setCustomSchool("");
        setSchoolPostcode("");
        fetchPermittedUsers(); // Refresh the list
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

  // Redirect if not logged in
  if (status === "loading") {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Header />
        <div className="max-w-4xl mx-auto pt-8 px-4 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push("/");
    return null;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      <div className="max-w-4xl mx-auto pt-8 px-4 pb-16">
        <h1 className="text-2xl font-bold mb-6">Permit New Users</h1>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4">Grant Permission</h2>
          
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
              <>
                <div>
                  <label htmlFor="customSchool" className="block text-sm font-medium text-gray-700 mb-1">
                    School Name
                  </label>
                  <input
                    id="customSchool"
                    type="text"
                    value={customSchool}
                    onChange={(e) => setCustomSchool(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="eg. St Christopher's"
                  />
                </div>
                
                <div>
                  <label htmlFor="schoolPostcode" className="block text-sm font-medium text-gray-700 mb-1">
                    School Postcode (first part only)
                  </label>
                  <input
                    id="schoolPostcode"
                    type="text"
                    value={schoolPostcode}
                    onChange={handlePostcodeChange}
                    required
                    maxLength={4}
                    className={`w-full border ${postcodeError ? 'border-red-300' : 'border-gray-300'} rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    placeholder="eg. NW3"
                  />
                  {postcodeError && (
                    <p className="mt-1 text-sm text-red-600">{postcodeError}</p>
                  )}
                </div>
              </>
            )}

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

        {/* Permitted Users List */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Previously Permitted Users</h2>
          
          {isLoadingUsers ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : permittedUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No users have been permitted yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      School
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {permittedUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.school}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt, { hour: undefined, minute: undefined })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}