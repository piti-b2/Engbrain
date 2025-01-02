"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

// Debug function
const debug = (...args: any[]) => {
  // Try multiple console methods
  try {
    console.log(...args);
  } catch (e) {
    try {
      console.debug(...args);
    } catch (e) {
      // If all else fails, try alert for critical errors
      if (args[0]?.includes('ERROR:')) {
        alert(args.join(' '));
      }
    }
  }
};

export default function UserProfile() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastApiCall, setLastApiCall] = useState<string | null>(null);

  debug('UserProfile: Component rendered', {
    isLoaded,
    isSignedIn,
    userId: user?.id,
    userEmail: user?.emailAddresses?.[0]?.emailAddress
  });

  useEffect(() => {
    debug('UserProfile: useEffect triggered', {
      isLoaded,
      isSignedIn,
      userId: user?.id
    });

    if (!isLoaded) {
      debug('UserProfile: Clerk not loaded yet');
      return;
    }

    if (!isSignedIn || !user?.id) {
      debug('UserProfile: No signed in user');
      return;
    }

    async function initUser() {
      setLoading(true);
      setError(null);
      
      try {
        if (!user) {
          debug('UserProfile: No user found');
          return;
        }
        debug('UserProfile: Initializing user:', user.id);
        
        // Get primary email
        const email = user.emailAddresses?.[0]?.emailAddress;
        if (!email) {
          debug('WARNING: No email found for user');
        }
        
        // Get user name
        const name = user.firstName 
          ? `${user.firstName} ${user.lastName || ''}`.trim() 
          : user.username || undefined;
        
        debug('UserProfile: Calling API with data:', {
          userId: user.id,
          email,
          name
        });

        const response = await fetch('/api/user/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            email,
            name,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          debug('ERROR: API Error Response:', errorData);
          throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        debug('UserProfile: API Response:', data);
        setLastApiCall(new Date().toISOString());
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize user data';
        debug('ERROR: Failed to initialize user:', errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    initUser();
  }, [isLoaded, isSignedIn, user]);

  // Debug panel
  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white/80 rounded shadow-lg text-sm">
      <div>Status: {loading ? 'Loading...' : error ? 'Error' : 'Ready'}</div>
      {error && <div className="text-red-500">Error: {error}</div>}
      <div className="text-xs text-gray-500">
        User ID: {user?.id || 'None'}
        <br />
        Email: {user?.emailAddresses?.[0]?.emailAddress || 'None'}
        <br />
        Loaded: {isLoaded ? 'Yes' : 'No'}
        <br />
        Signed In: {isSignedIn ? 'Yes' : 'No'}
        <br />
        Last API Call: {lastApiCall || 'Never'}
      </div>
    </div>
  );
}
