"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import { viewingHistory } from "@/lib/config";

export default function ViewingHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Redirect if not logged in
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    // Fetch viewing history
    if (session?.user?.email) {
      fetchViewingHistory();
    }
  }, [session, status, router]);

  const fetchViewingHistory = async () => {
    try {
      const res = await fetch("/api/viewing-history");
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
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Today, " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return "Yesterday, " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
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
            Last {viewingHistory.maxAgeDays} days
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
              Profiles you view will appear here.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {history.map((item) => (
                <li key={item._id} className="p-4 hover:bg-gray-50">
                  <Link href={`/user/${item.viewedUsername}`} className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-gray-200 mr-4 flex-shrink-0 overflow-hidden">
                      {item.viewedUserImage ? (
                        <div className="relative w-full h-full">
                          <Image 
                            src={item.viewedUserImage} 
                            alt={item.viewedUsername}
                            fill
                            sizes="48px"
                            className="object-cover" 
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500 font-bold">
                          {item.viewedUsername.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-medium">{item.viewedUsername}</h3>
                      {item.viewedUserName !== item.viewedUsername && (
                        <p className="text-sm text-gray-500">{item.viewedUserName}</p>
                      )}
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