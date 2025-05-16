"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Search from "@/components/Search";

export default function SearchPage() {
  const { data: session, status } = useSession();
  const [currentUserSchool, setCurrentUserSchool] = useState(null);
  
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (session?.user?.email) {
        try {
          const res = await fetch("/api/users/me");
          const data = await res.json();
          setCurrentUserSchool(data.school);
        } catch (error) {
          console.error("Error fetching user details:", error);
        }
      }
    };
    
    fetchUserDetails();
  }, [session]);
  
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
    return (
      <div className="bg-gray-50 min-h-screen">
        <Header />
        <div className="max-w-4xl mx-auto pt-8 px-4">
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <h2 className="text-xl font-medium mb-4">Please log in to search for users</h2>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      <div className="max-w-4xl mx-auto pt-8 px-4 pb-16">
        <h1 className="text-2xl font-bold mb-6">Search Users</h1>
        <Search currentUserSchool={currentUserSchool} />
      </div>
    </div>
  );
}