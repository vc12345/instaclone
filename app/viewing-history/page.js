"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { viewingHistory } from "@/lib/config";

export default function ViewingHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("outgoing");
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Redirect if not logged in
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    // Fetch viewing history
    if (session?.user?.username) {
      fetchViewingHistory(activeTab);
    }
  }, [session, status, router, activeTab]);

  const fetchViewingHistory = async (type) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/viewing-history?type=${type}`);
      if (!res.ok) throw new Error("Failed to fetch viewing history");
      
      const data = await res.json();
      setHistory(data);
    } catch (error) {
      console.error("Error fetching viewing history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    // Format in GMT/UTC
    return date.toUTCString();
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Header />
        <div className="max-w-2xl mx-auto pt-8 px-4 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      <div className="max-w-2xl mx-auto pt-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Viewing History</h1>
          <div className="text-sm text-gray-500">
            {currentTime.toUTCString()}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "outgoing"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("outgoing")}
            >
              Profiles You Viewed
            </button>
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "incoming"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("incoming")}
            >
              Who Viewed Your Profile
            </button>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-400 mb-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-xl font-light mb-1">No Viewing History</h3>
            <p className="text-gray-500">
              {activeTab === "outgoing" 
                ? "Profiles you view will appear here." 
                : "Users who viewed your profile will appear here."}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {history.map((item) => (
                <li key={item._id} className="p-4 hover:bg-gray-50">
                  <Link 
                    href={`/user/${activeTab === "outgoing" ? item.viewedUsername : item.viewerUsername}`} 
                    className="flex items-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-200 mr-4 flex-shrink-0 overflow-hidden">
                      <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500 font-bold">
                        {(activeTab === "outgoing" ? item.viewedUsername : item.viewerUsername)?.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-medium">
                        {activeTab === "outgoing" ? item.viewedUsername : item.viewerUsername}
                        {activeTab === "incoming" && item.viewerSchool && (
                          <span className="font-normal text-sm text-gray-500 ml-2">
                            ({item.viewerSchool})
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {activeTab === "outgoing" ? (
                          "Viewed by you"
                        ) : (
                          <>
                            <Link href={`/user/${item.viewerUsername}`} className="text-blue-600 hover:underline">
                              {item.viewerUsername}
                            </Link>
                            {" viewed your profile"}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(item.viewedAt)}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}