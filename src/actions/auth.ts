'use server';

import { createClient } from '../lib/supabaseServer';

export interface AuthActionResult {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    email: string;
  };
  profile?: {
    id: string;
    email: string;
    full_name: string;
    role: 'member' | 'coach' | 'admin';
    is_public: boolean;
  };
  error?: string;
}

/**
 * Server Action: Register a new Gym Member via Supabase Auth & link to public.profiles table
 */
export async function signUpAction({
  firstName,
  lastName,
  email,
  password,
}: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<AuthActionResult> {
  try {
    const trimmedFirstName = firstName?.trim();
    const trimmedLastName = lastName?.trim();
    const trimmedEmail = email?.trim()?.toLowerCase();

    // 1. Validation checks
    if (!trimmedFirstName || !trimmedLastName) {
      return { success: false, error: 'First name and last name are required.' };
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const fullName = `${trimmedFirstName} ${trimmedLastName}`;
    const supabase = createClient();

    // 2. Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password: password,
      options: {
        data: {
          first_name: trimmedFirstName,
          last_name: trimmedLastName,
          full_name: fullName,
        },
      },
    });

    if (authError || !authData?.user?.id) {
      return {
        success: false,
        error: authError?.message || 'Signup failed. Unable to create user session.',
      };
    }

    const userId = authData.user.id;

    // 3. Crucial Database Linking: Insert profile record into public.profiles
    const profilePayload = {
      id: userId,
      email: trimmedEmail,
      full_name: fullName,
      role: 'member',
      is_public: true,
      benchmark_prs: {},
      barbell_prs: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: createdProfile, error: profileError } = await supabase
      .from('profiles')
      .upsert([profilePayload], { onConflict: 'id' })
      .select('id, email, full_name, role, is_public')
      .single();

    if (profileError) {
      return {
        success: false,
        error: `Account created in Auth, but profile setup failed in database: ${profileError.message}`,
      };
    }

    const finalProfile = createdProfile || profilePayload;

    return {
      success: true,
      message: `Account created successfully! Welcome to Athlete Core, ${fullName}.`,
      user: {
        id: userId,
        email: trimmedEmail,
      },
      profile: finalProfile as AuthActionResult['profile'],
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'An unexpected error occurred during signup.',
    };
  }
}

/**
 * Server Action: Log in returning member via Supabase Auth
 */
export async function loginAction({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<AuthActionResult> {
  try {
    const trimmedEmail = email?.trim()?.toLowerCase();

    if (!trimmedEmail || !password) {
      return { success: false, error: 'Please enter both email and password.' };
    }

    const supabase = createClient();

    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: password,
    });

    if (authError) {
      return {
        success: false,
        error: 'Invalid email or password. Please verify your credentials and try again.',
      };
    }

    const userId = authData.user?.id;

    // 2. Query user profile from public.profiles
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, is_public')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      // Fallback profile if profile record missing
      return {
        success: true,
        message: 'Signed in successfully!',
        user: { id: userId, email: trimmedEmail },
        profile: {
          id: userId,
          email: trimmedEmail,
          full_name: authData.user?.user_metadata?.full_name || 'Gym Member',
          role: 'member',
          is_public: true,
        },
      };
    }

    return {
      success: true,
      message: `Welcome back, ${userProfile.full_name}!`,
      user: { id: userId, email: trimmedEmail },
      profile: userProfile as AuthActionResult['profile'],
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'An unexpected server error occurred during login.',
    };
  }
}

/**
 * Server Action: Send Password Reset Email via Supabase Auth
 */
export async function resetPasswordAction({
  email,
}: {
  email: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const trimmedEmail = email?.trim()?.toLowerCase();

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { success: false, error: 'Please provide a valid email address.' };
    }

    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/reset-password`,
    });

    if (error) {
      return {
        success: false,
        error: error.message || 'Failed to send password reset email. Please try again.',
      };
    }

    return {
      success: true,
      message: `Password reset instructions sent to ${trimmedEmail}. Please check your inbox!`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to send password reset email.',
    };
  }
}

/**
 * Server Action: Sign out active session
 */
export async function signOutAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}
