"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { 
  Profile, 
  CustomerDetails,
  getProfile, 
  updateProfile, 
  getCustomerDetails,
  updateCustomerDetails,
  createUserData 
} from "@/lib/supabase";

export function ProfileForm() {
  const { user } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      console.log('User from Clerk:', user);
      
      if (user?.id && user?.primaryEmailAddress?.emailAddress) {
        console.log('Checking data for user:', user.id);
        
        // Try to get existing profile and customer details
        let profileData = await getProfile(user.id);
        let customerData = await getCustomerDetails(user.id);
        console.log('Existing profile:', profileData);
        console.log('Existing customer details:', customerData);
        
        // If no data exists, create both
        if (!profileData || !customerData) {
          console.log('Creating new user data...');
          const result = await createUserData({
            id: user.id,
            email: user.primaryEmailAddress.emailAddress,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            imageUrl: user.imageUrl,
            emailVerified: user.emailAddresses[0]?.verification.status === 'verified'
          });
          profileData = result.profile;
          customerData = result.customerDetails;
          console.log('New user data created:', result);
        }

        setProfile(profileData);
        setCustomerDetails(customerData);
      } else {
        console.log('Missing user data:', { 
          id: user?.id, 
          email: user?.primaryEmailAddress?.emailAddress 
        });
      }
      setLoading(false);
    }
    loadUserData();
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!profile || !customerDetails) {
    return <div>No user data found</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">User Profile</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Profile Data</h3>
          <div className="space-y-2">
            <div>
              <span className="font-medium">User ID:</span> {profile.user_id}
            </div>
            <div>
              <span className="font-medium">Email:</span> {profile.email}
            </div>
            <div>
              <span className="font-medium">Tier:</span> {profile.tier}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Customer Details</h3>
          <div className="space-y-2">
            <div>
              <span className="font-medium">Name:</span> {customerDetails.display_name}
            </div>
            <div>
              <span className="font-medium">Email:</span> {customerDetails.email}
            </div>
            <div>
              <span className="font-medium">Registration Date:</span>{" "}
              {new Date(customerDetails.registration_date || "").toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Verified:</span>{" "}
              {customerDetails.is_verified ? "Yes" : "No"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
