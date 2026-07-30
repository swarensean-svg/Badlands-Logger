import React, { useState } from 'react';
import { resetPasswordAction } from '../../actions/auth';
import { Dumbbell, Mail, ArrowRight, Loader2, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';

interface ForgotPasswordPageProps {
  onNavigateToLogin: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  onNavigateToLogin,
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const result = await resetPasswordAction({ email });

      if (result.success) {
        setSuccessMessage(result.message || 'Password reset email sent! Check your inbox.');
      } else {
        setErrorMessage(result.error || 'Failed to send reset email. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 bg-zinc-950 text-zinc-100 font-sans">
      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400 mb-1">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black italic tracking-tight text-white uppercase">
            RESET <span className="text-amber-400">PASSWORD</span>
          </h1>
          <p className="text-xs text-zinc-400 font-mono">
            Enter your account email address below and we'll send you a link to reset your password.
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

        {/* Password Reset Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
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
                placeholder="athlete@gym.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-9 pr-3 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-900/50 text-white font-bold rounded-lg uppercase tracking-wider transition flex items-center justify-center space-x-2 shadow-lg shadow-amber-600/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Sending Reset Email...</span>
              </>
            ) : (
              <>
                <span>Send Reset Link</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation link */}
        <div className="text-center pt-2 font-sans text-xs text-zinc-400 border-t border-zinc-800">
          Remembered your password?{' '}
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="text-amber-400 hover:text-amber-300 font-bold underline transition"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
