"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ConnectionsSection() {
  const [connections, setConnections] = useState({ sent: [], received: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/connections');
        
        if (!res.ok) {
          throw new Error('Failed to fetch connections');
        }
        
        const data = await res.json();
        setConnections({
          sent: data.sent || [],
          received: data.received || []
        });
      } catch (err) {
        console.error('Error fetching connections:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConnections();
  }, []);

  const handleAccept = async (senderUsername) => {
    try {
      const res = await fetch('/api/connections', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ senderUsername }),
      });

      if (!res.ok) {
        throw new Error('Failed to accept connection request');
      }

      // Update the connection status locally
      setConnections(prev => ({
        ...prev,
        received: prev.received.map(conn => 
          conn.senderUsername === senderUsername 
            ? { ...conn, status: 'connected' } 
            : conn
        )
      }));
    } catch (err) {
      console.error('Error accepting connection request:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-20 bg-gray-100 rounded mb-2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
        <p>Error loading connections: {error}</p>
      </div>
    );
  }

  if (connections.sent.length === 0 && connections.received.length === 0) {
    return null; // Don't show anything if no connections
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">From Another School</h2>
      
      <div className="mb-4">
        <div className="flex border-b border-gray-200">
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'received'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('received')}
          >
            They Reached Out ({connections.received.length})
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'sent'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('sent')}
          >
            You Reached Out ({connections.sent.length})
          </button>
        </div>
      </div>
      
      {activeTab === 'received' && (
        <div className="space-y-4">
          {connections.received.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No incoming connection requests</p>
          ) : (
            connections.received.map((conn) => (
              <div key={conn.senderUsername} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-b-0">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-200 mr-3 flex-shrink-0">
                    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500 font-bold">
                      {conn.senderUsername.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <Link href={conn.status === 'connected' ? `/user/${conn.senderUsername}` : '#'} className="font-medium hover:underline">
                      {conn.senderUsername}
                    </Link>
                    {conn.senderSchool && (
                      <p className="text-xs text-gray-500">School: {conn.senderSchool}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {conn.status === 'connected' 
                        ? 'Connected - You can view each other\'s profiles' 
                        : 'Wants to connect with you'}
                    </p>
                  </div>
                </div>
                {conn.status === 'pending' && (
                  <button
                    onClick={() => handleAccept(conn.senderUsername)}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-sm py-1 px-3 rounded"
                  >
                    Connect
                  </button>
                )}
                {conn.status === 'connected' && (
                  <span className="text-green-500 text-sm">Connected</span>
                )}
              </div>
            ))
          )}
        </div>
      )}
      
      {activeTab === 'sent' && (
        <div className="space-y-3">
          {connections.sent.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No outgoing connection requests</p>
          ) : (
            connections.sent.map((conn) => (
              <div key={conn.receiverUsername} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-200 mr-2 flex-shrink-0">
                    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500 font-bold">
                      {conn.receiverUsername.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <Link 
                      href={conn.status === 'connected' ? `/user/${conn.receiverUsername}` : '#'} 
                      className="font-medium hover:underline"
                    >
                      {conn.receiverUsername}
                    </Link>
                    {conn.receiverSchool && (
                      <p className="text-xs text-gray-500">School: {conn.receiverSchool}</p>
                    )}
                  </div>
                </div>
                <span className={`text-xs ${conn.status === 'connected' ? 'text-green-500' : 'text-gray-500'}`}>
                  {conn.status === 'connected' ? 'Connected' : 'Pending'}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}