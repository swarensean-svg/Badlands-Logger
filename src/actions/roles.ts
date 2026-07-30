'use server';

import { createClient } from '../lib/supabaseServer';

export interface ElevateRoleResult {
  success: boolean;
  message?: string;
  updatedProfile?: {
    id: string;
    email: string;
    full_name: string;
    role: 'member' | 'coach' | 'admin';
  };
  error?: string;
}

/**
 * Next.js Server Action: Elevates a Member to a Coach
 * 
 * Security Enforcement:
 * 1. Verifies the session of the active authenticated user.
 * 2. Checks `public.profiles` to ensure the requester possesses the 'admin' role.
 * 3. Updates the target profile's role from 'member' to 'coach'.
 * 
 * @param targetUserId - UUID of the member profile to elevate to coach
 */
export async function elevateMemberToCoach(targetUserId: string): Promise<ElevateRoleResult> {
  try {
    const supabase = createClient();

    // 1. Get authenticated user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // If no real auth session exists (e.g. in preview mode), fallback to checking requester profile
    let requesterId = user?.id;

    if (authError || !requesterId) {
      // Return structured response or simulate for demo
      return {
        success: false,
        error: 'Authentication required. You must be signed in as an Admin to perform this action.',
      };
    }

    // 2. Query requester's profile to verify Admin permissions
    const { data: requesterProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', requesterId)
      .single();

    if (profileError || !requesterProfile) {
      return {
        success: false,
        error: 'Failed to verify admin authorization. Profile record not found.',
      };
    }

    if (requesterProfile.role !== 'admin') {
      return {
        success: false,
        error: 'Forbidden: Only administrators can elevate member roles.',
      };
    }

    // 3. Verify target user exists and is a member
    const { data: targetProfile, error: targetError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('id', targetUserId)
      .single();

    if (targetError || !targetProfile) {
      return {
        success: false,
        error: 'Target user profile not found.',
      };
    }

    if (targetProfile.role === 'coach') {
      return {
        success: false,
        error: 'User is already a Coach.',
      };
    }

    if (targetProfile.role === 'admin') {
      return {
        success: false,
        error: 'User is an Administrator and cannot be downgraded via this action.',
      };
    }

    // 4. Perform elevation update in PostgreSQL database
    const { data: updatedData, error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'coach', updated_at: new Date().toISOString() })
      .eq('id', targetUserId)
      .select('id, email, full_name, role')
      .single();

    if (updateError) {
      return {
        success: false,
        error: `Database update failed: ${updateError.message}`,
      };
    }

    return {
      success: true,
      message: `Successfully elevated ${updatedData.full_name} (${updatedData.email}) to Coach role!`,
      updatedProfile: updatedData as ElevateRoleResult['updatedProfile'],
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'An unexpected server error occurred.',
    };
  }
}
