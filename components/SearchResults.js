"use client";
import { useState } from 'react';
import Link from 'next/link';
import ConnectionModal from './ConnectionModal';

export default function SearchResults({ results, currentUserSchool }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const handleUserClick = (user) => {
    // If user is from a different school, show the modal
    if (user.school && currentUserSchool && user.school !== currentUserSchool) {
      setSelectedUser(user);
      setShowModal(true);
      return;
    }
    
    // Otherwise, navigate to their profile
    window.location.href = `/user/${user.username}`;
  };
  
  const handleConnect = async () => {
    if (!selectedUser) return;
    
    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: selectedUser.username })
      });
      
      if (!res.ok) {
        throw new Error('Failed to send connection request');
      }
    } catch (error) {
      console.error('Error connecting with user:', error);
    }
  };
  
  return (
    <div>
      <ul className="divide-y divide-gray-200">
        {results.map(user => (
          <li key={user.username} className="py-3">
            <div 
              onClick={() => handleUserClick(user)}
              className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded-md"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-bold mr-3">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{user.username}</p>
                {user.school && (
                  <p className="text-sm text-gray-500">School: {user.school}</p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      
      {showModal && selectedUser && (
        <ConnectionModal
          username={selectedUser.username}
          school={selectedUser.school}
          onClose={() => setShowModal(false)}
          onConnect={handleConnect}
        />
      )}
    </div>
  );
}