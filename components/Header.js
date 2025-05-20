"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Header() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDirectSearch, setIsDirectSearch] = useState(false);
  const searchRef = useRef(null);
  const menuRef = useRef(null);
  const router = useRouter();

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Check if search term is a direct username lookup
  useEffect(() => {
    setIsDirectSearch(searchTerm.startsWith('@') && searchTerm.length > 1);
  }, [searchTerm]);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchTerm.trim() && session) {
        // Regular search
        if (!isDirectSearch) {
          const res = await fetch(`/api/search-users?query=${searchTerm}`);
          const users = await res.json();
          setResults(users);
        }
      } else {
        setResults([]);
      }
    }, 300); // debounce

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, session, isDirectSearch]);

  // Handle direct username search
  const handleDirectSearch = async () => {
    if (!isDirectSearch || !searchTerm.trim()) return;
    
    const username = searchTerm.substring(1); // Remove @ symbol
    const res = await fetch(`/api/search-users?directUsername=${username}`);
    const users = await res.json();
    
    if (users.length > 0) {
      // User exists, navigate to their profile
      router.push(`/user/${users[0].username}`);
      setSearchTerm("");
      setShowSearch(false);
    } else {
      // User doesn't exist, clear search
      setSearchTerm("");
    }
  };

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchend", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchend", handleClickOutside);
    };
  }, []);

  // Record profile view and navigate to profile
  const handleProfileClick = async (username, e) => {
    e.preventDefault(); // Prevent default link behavior
    
    if (session?.user?.email && username !== session.user.username) {
      try {
        await fetch("/api/viewing-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ viewedUsername: username }),
        });
      } catch (error) {
        console.error("Error recording profile view:", error);
      }
    }
    
    setShowSearch(false);
    router.push(`/user/${username}`);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link href="/" className="text-xl font-bold italic">
            <span className="bg-gradient-to-r from-orange-200 via-pink-200 to-blue-200 text-transparent bg-clip-text">immie</span>
          </Link>
        </div>

        {/* GMT Time */}
        <div className="hidden md:block text-xs text-gray-500">
          {currentTime.toUTCString()}
        </div>

        {/* Search - Only shown to logged in users */}
        {session && (
          <div className="relative hidden md:block" ref={searchRef}>
            <div className="relative flex">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSearch(true);
                }}
                onFocus={() => setShowSearch(true)}
                placeholder={isDirectSearch ? "Enter exact username..." : "User search"}
                className="bg-gray-100 rounded-lg py-1 px-3 text-sm w-64 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isDirectSearch) {
                    e.preventDefault();
                    handleDirectSearch();
                  }
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setResults([]);
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  ✕
                </button>
              )}
              {isDirectSearch && (
                <button
                  onClick={handleDirectSearch}
                  className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                >
                  Go
                </button>
              )}
            </div>
            {showSearch && results.length > 0 && !isDirectSearch && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-80 overflow-y-auto">
                {results.map((user) => (
                  <a
                    key={user.username}
                    href={`/user/${user.username}`}
                    className="flex items-center px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    onClick={(e) => handleProfileClick(user.username, e)}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-200 mr-3 flex-shrink-0 overflow-hidden">
                      {user.image ? (
                        <div className="relative w-full h-full">
                          <Image 
                            src={user.image} 
                            alt="" 
                            fill
                            sizes="32px"
                            className="object-cover" 
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500 font-bold">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      {user.name && <p className="font-medium">{user.name}</p>}
                      <p className="text-sm text-gray-500">@{user.username}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex items-center space-x-5">
          {session && (
            <>
              <Link href="/" className="text-gray-800 hover:text-black">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              </Link>
              <Link href="/my-posts" className="text-gray-800 hover:text-black">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Link>
              <Link href="/my-favorites" className="text-gray-800 hover:text-black">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </Link>
            </>
          )}

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            {session ? (
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0"
              >
                {session.user.image ? (
                  <div className="relative w-full h-full">
                    <Image 
                      src={session.user.image} 
                      alt="" 
                      fill
                      sizes="32px"
                      className="object-cover" 
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500 font-bold">
                    {session.user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
              </button>
            ) : (
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="text-gray-800 hover:text-black"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            )}

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                {session ? (
                  <>
                    <Link 
                      href={`/user/${session.user.username}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowMenu(false)}
                    >
                      Profile
                    </Link>
                    <Link 
                      href="/permit-users"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowMenu(false)}
                    >
                      Permit New User
                    </Link>
                    <Link 
                      href="/viewing-history"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowMenu(false)}
                    >
                      Viewing History
                    </Link>
                    <button
                      onClick={() => {
                        signOut({ callbackUrl: '/' });
                        setShowMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Log Out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        signIn();
                        setShowMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Log In
                    </button>
                    <Link
                      href="/signup"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowMenu(false)}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>
      </div>
      
      {/* Mobile Search - Only shown to logged in users */}
      {session && (
        <div className="md:hidden px-4 pb-3">
          <div className="relative flex">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSearch(true);
              }}
              onFocus={() => setShowSearch(true)}
              placeholder={isDirectSearch ? "Enter exact username..." : "Search"}
              className="bg-gray-100 rounded-lg py-1 px-3 text-sm w-full focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isDirectSearch) {
                  e.preventDefault();
                  handleDirectSearch();
                }
              }}
            />
            {isDirectSearch && (
              <button
                onClick={handleDirectSearch}
                className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                Go
              </button>
            )}
          </div>
          {showSearch && results.length > 0 && !isDirectSearch && (
            <div className="absolute left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10 max-h-80 overflow-y-auto">
              {results.map((user) => (
                <a
                  key={user.username}
                  href={`/user/${user.username}`}
                  className="flex items-center px-4 py-3 hover:bg-gray-50 border-b border-gray-100 active:bg-gray-100"
                  onClick={(e) => handleProfileClick(user.username, e)}
                  onTouchEnd={(e) => {
                    e.preventDefault(); // Prevent default touch behavior
                    handleProfileClick(user.username, e);
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 mr-3 flex-shrink-0">
                    {user.image ? (
                      <div className="relative w-full h-full">
                        <Image 
                          src={user.image} 
                          alt="" 
                          fill
                          sizes="32px"
                          className="object-cover" 
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500 font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    {user.name && <p className="font-medium">{user.name}</p>}
                    <p className="text-sm text-gray-500">@{user.username}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mobile GMT Time */}
      <div className="md:hidden text-center text-xs text-gray-500 pb-1">
        {currentTime.toUTCString()}
      </div>
    </header>
  );
}