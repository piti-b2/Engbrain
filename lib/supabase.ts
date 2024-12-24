import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl) throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
if (!supabaseAnonKey) throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')

// Don't show connection message
console.log = function() {};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-disable-logging': 'true'
    }
  }
})

export type Profile = {
  user_id: string;
  email: string;
  tier: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at?: string;
}

export type CustomerDetails = {
  user_id: string;
  first_name: string;
  last_name: string;
  display_name?: string;
  email: string;
  phone_number?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  date_of_birth?: Date;
  gender?: string;
  profile_picture_url?: string;
  registration_date?: string;
  last_login?: string;
  subscription_status?: string;
  customer_notes?: string;
  preferred_language?: string;
  is_verified?: boolean;
  marketing_consent?: boolean;
  timezone?: string;
  last_modified?: string;
}

// Function to get user profile
export async function getProfile(userId: string): Promise<Profile | null> {
  console.log('Getting profile for user:', userId);
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    console.log('Profile found:', data);
    return data as Profile;
  } catch (err) {
    console.error('Exception in getProfile:', err);
    return null;
  }
}

// Function to update user profile
export async function updateProfile(profile: Partial<Profile> & { user_id: string }): Promise<Profile | null> {
  console.log('Updating profile:', profile);
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating profile:', error);
      return null;
    }

    console.log('Profile updated:', data);
    return data as Profile;
  } catch (err) {
    console.error('Exception in updateProfile:', err);
    return null;
  }
}

// Function to create initial user profile
export async function createProfile(profile: { 
  user_id: string;
  email: string;
}): Promise<Profile | null> {
  console.log('Creating profile:', profile);
  
  try {
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', profile.user_id)
      .maybeSingle();

    if (existingProfile) {
      console.log('Profile already exists:', existingProfile);
      return existingProfile as Profile;
    }

    const newProfile = {
      user_id: profile.user_id,
      email: profile.email,
      tier: "free",
      stripe_customer_id: null,
      stripe_subscription_id: null
    };

    console.log('Attempting to insert profile:', newProfile);
    const { data, error } = await supabase
      .from('profiles')
      .insert([newProfile])
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error creating profile:', error);
      throw error; // Throw error to be caught in createUserData
    }
    
    console.log('Profile created successfully:', data);
    return data as Profile;
  } catch (err) {
    console.error('Exception in createProfile:', err);
    throw err; // Re-throw to be handled in createUserData
  }
}

// Function to get customer details
export async function getCustomerDetails(userId: string): Promise<CustomerDetails | null> {
  console.log('Getting customer details for user:', userId);
  
  try {
    const { data, error } = await supabase
      .from('customer_details')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching customer details:', error);
      return null;
    }

    console.log('Customer details found:', data);
    return data as CustomerDetails;
  } catch (err) {
    console.error('Exception in getCustomerDetails:', err);
    return null;
  }
}

// Function to update customer details
export async function updateCustomerDetails(details: Partial<CustomerDetails> & { user_id: string }): Promise<CustomerDetails | null> {
  console.log('Updating customer details:', details);
  
  try {
    const { data, error } = await supabase
      .from('customer_details')
      .upsert(details)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating customer details:', error);
      return null;
    }

    console.log('Customer details updated:', data);
    return data as CustomerDetails;
  } catch (err) {
    console.error('Exception in updateCustomerDetails:', err);
    return null;
  }
}

// Function to create initial customer details
export async function createCustomerDetails(details: { 
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture_url?: string;
  is_verified?: boolean;
}): Promise<CustomerDetails | null> {
  console.log('Creating customer details:', details);
  
  try {
    // Check if customer details already exist
    const { data: existingDetails } = await supabase
      .from('customer_details')
      .select('*')
      .eq('user_id', details.user_id)
      .maybeSingle();

    if (existingDetails) {
      console.log('Customer details already exist:', existingDetails);
      return existingDetails as CustomerDetails;
    }

    const newCustomerDetails = {
      user_id: details.user_id,
      first_name: details.first_name,
      last_name: details.last_name,
      email: details.email,
      display_name: `${details.first_name} ${details.last_name}`,
      profile_picture_url: details.profile_picture_url,
      is_verified: details.is_verified || false,
      registration_date: new Date().toISOString(),
    };

    console.log('Attempting to insert customer details:', newCustomerDetails);
    const { data, error } = await supabase
      .from('customer_details')
      .insert([newCustomerDetails])
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error creating customer details:', error);
      throw error;
    }

    console.log('Customer details created successfully:', data);
    return data as CustomerDetails;
  } catch (err) {
    console.error('Exception in createCustomerDetails:', err);
    throw err;
  }
}

// Function to create both profile and customer details
export async function createUserData(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl?: string;
  emailVerified?: boolean;
}): Promise<{ profile: Profile | null; customerDetails: CustomerDetails | null }> {
  console.log('Creating user data for:', user);

  try {
    // Step 1: Create or get profile
    let profile = await getProfile(user.id);
    
    if (!profile) {
      console.log('Profile not found, creating new profile...');
      try {
        profile = await createProfile({
          user_id: user.id,
          email: user.email
        });
      } catch (error) {
        console.error('Error creating profile:', error);
        throw new Error('Failed to create profile');
      }
    }

    // Ensure profile exists before proceeding
    if (!profile) {
      throw new Error('Profile creation failed');
    }

    // Step 2: Create or get customer details
    let customerDetails = await getCustomerDetails(user.id);
    
    if (!customerDetails) {
      console.log('Customer details not found, creating new customer details...');
      try {
        customerDetails = await createCustomerDetails({
          user_id: user.id,
          first_name: user.firstName,
          last_name: user.lastName,
          email: user.email,
          profile_picture_url: user.imageUrl,
          is_verified: user.emailVerified
        });
      } catch (error: unknown) {
        console.error('Error creating customer details:', error);
        // Check for foreign key constraint error
        if (error && typeof error === 'object' && 'code' in error && error.code === '23503') {
          throw new Error('Profile must exist before creating customer details');
        }
        throw new Error('Failed to create customer details');
      }
    }

    // Ensure customer details exists
    if (!customerDetails) {
      throw new Error('Customer details creation failed');
    }

    return { profile, customerDetails };
  } catch (error) {
    console.error('Error in createUserData:', error);
    throw error;
  }
}
