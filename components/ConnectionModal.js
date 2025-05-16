"use client";
import { useState } from 'react';

export default function ConnectionModal({ username, school, onClose, onConnect }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleConnect = async () => {
    setIsSubmitting(true);
    try {
      await onConnect();
    } catch (error) {
      console.error("Error sending connection request:", error);
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold mb-4">Connect with {username}</h3>
        <p className="text-gray-600 mb-6">
          {username} is from {school || "another school"}. Click &quot;Connect&quot; to reach out.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConnect}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-70"
          >
            {isSubmitting ? "Connecting..." : "Connect"}
          </button>
        </div>
      </div>
    </div>
  );
}

