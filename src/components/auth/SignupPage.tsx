import React, { useState } from 'react';
import { signUpAction } from '../../actions/auth';
import { Dumbbell, Lock, Mail, User, ArrowRight, Loader2, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Profile } from '../../types';

interface SignupPageProps {
  onNavigateToLogin: () => void;
  onSignupSuccess: (profile: Profile) => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({
  onNavigateToLogin,
  onSignupSuccess,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      // Execute Server Action for Signup + Database Linking
      const result = await signUpAction({
        firstName,
        lastName,
        email,
        password,
      });

      if (result.success && result.profile) {
        setSuccessMessage(result.message || 'Account created successfully! Directing to Dashboard...');

        const newProfile: Profile = {
          id: result.profile.id,
          email: result.profile.email,
          full_name: result.profile.full_name,
          role: result.profile.role || 'member',
          is_public: result.profile.is_public ?? true,
          benchmark_prs: {},
          barbell_prs: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setTimeout(() => {
          onSignupSuccess(newProfile);
        }, 800);
      } else {
        setErrorMessage(result.error || 'Failed to create account. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred during account creation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 bg-zinc-950 text-zinc-100 font-sans">
      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400 mb-1">
            <Dumbbell className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black italic tracking-tight text-white uppercase">
            JOIN <span className="text-indigo-400">BADLANDS LOGGER</span>
          </h1>
          <p className="text-xs text-zinc-400 font-mono">
            Create your athlete profile to start logging workouts, tracking PRs, and viewing community results.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-xs flex items-start space-x-2.5 animate-fadeIn">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span className="font-mono">{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-emerald-400 text-xs flex items-start space-x-2.5 animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span className="font-mono">{successMessage}</span>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          {/* First & Last Name Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-zinc-300 font-bold uppercase tracking-wider text-[11px]">
                First Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Alex"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-9 pr-3 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-zinc-300 font-bold uppercase tracking-wider text-[11px]">
                Last Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Riviera"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-9 pr-3 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="block text-zinc-300 font-bold uppercase tracking-wider text-[11px]">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex.riviera@gym.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-9 pr-3 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-zinc-300 font-bold uppercase tracking-wider text-[11px]">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-9 pr-3 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          {/* Info Badge for Automatic Profile Creation */}
          <div className="bg-zinc-950 p-3 rounded border border-zinc-800/80 flex items-start space-x-2 text-[10px] text-zinc-400 font-sans">
            <ShieldCheck className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <span>
              Signing up automatically registers your profile record with role <strong>Member</strong> and creates linked PR tracking tables in Supabase.
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 text-white font-bold rounded-lg uppercase tracking-wider transition flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Creating Account & Linking Database...</span>
              </>
            ) : (
              <>
                <span>Complete Signup</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation link */}
        <div className="text-center pt-2 font-sans text-xs text-zinc-400 border-t border-zinc-800">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="text-indigo-400 hover:text-indigo-300 font-bold underline transition"
          >
            Sign In Instead
          </button>
        </div>
      </div>
    </div>
  );
};
