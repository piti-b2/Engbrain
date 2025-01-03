"use client";

import { UserButton, SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";
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

async function createOrUpdateUser(userId: string, email: string | undefined, name: string | undefined) {
  debug('Frontend: Creating/updating user:', { userId, email, name });
  try {
    const response = await fetch('/api/user/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
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
    debug('Frontend: API Response:', data);
    return true;
  } catch (error) {
    debug('ERROR: Frontend Error:', error);
    throw error;
  }
}

function UserProfile() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

        await createOrUpdateUser(user.id, email, name);
        debug('UserProfile: User initialized successfully');
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

  // Always render status for debugging
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
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-gradient-to-b from-yellow-300 via-yellow-200 to-white">
      <div className="flex flex-col items-center gap-8 w-full max-w-md">
        <img 
          src="/images/logo.png" 
          alt="Logo" 
          className="w-64 h-64 object-contain mb-4"
        />
        <h1 className="text-4xl font-bold text-center">Welcome to Engbrain</h1>
        <p className="text-xl text-gray-600 text-center">ยินดีต้อนรับสู่อิงเบรน</p>
        
        <SignedIn>
          <UserProfile />
          <UserButton afterSignOutUrl="/" />
        </SignedIn>

        <SignedOut>
          <div className="flex flex-col items-center gap-4">
            <p className="text-lg">Please sign in to continue</p>
            <SignInButton mode="modal">
              <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                Sign In
              </button>
            </SignInButton>
          </div>
        </SignedOut>
      </div>
    </main>
  );
}