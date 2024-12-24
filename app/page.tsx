"use client";

import { UserButton, SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { createUserData } from "@/lib/supabase";

function UserProfile() {
  const { user } = useUser();

  useEffect(() => {
    async function initializeUserData() {
      if (user?.id) {
        console.log('Initializing user data for:', user.id);
        const result = await createUserData({
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          imageUrl: user.imageUrl,
          emailVerified: user.emailAddresses[0]?.verification.status === 'verified'
        });
        console.log('User data initialization result:', result);
      }
    }
    initializeUserData();
  }, [user]);

  return (
    <div className="flex items-center gap-4">
      <p className="text-lg">Welcome back!</p>
      <UserButton afterSignOutUrl="/" />
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