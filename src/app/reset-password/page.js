"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setError("Invalid reset link. Please request a new password reset.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/api/auth/reset-password", {
        token,
        password
      });

      if (response.data.success) {
        setMessage("Password reset successfully! Redirecting to login...");
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch (err) {
      const errorCode = err.response?.data?.code;
      if (errorCode === "INVALID_TOKEN") {
        setError("This reset link has expired or is invalid. Please request a new one.");
        setTokenValid(false);
      } else {
        setError(err.response?.data?.error || "Failed to reset password");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {message && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-4">
          <p className="text-green-400">{message}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {tokenValid ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition-colors"
              required
              minLength={8}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition-colors"
              required
              minLength={8}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      ) : (
        <div className="text-center">
          <button
            onClick={() => router.push("/forgot-password")}
            className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-semibold py-3 px-6 rounded-lg transition-all duration-300"
          >
            Request New Reset Link
          </button>
        </div>
      )}

      <div className="mt-6 text-center">
        <button
          onClick={() => router.push("/login")}
          className="text-gray-400 hover:text-white transition-colors"
        >
          Back to Login
        </button>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full border border-gray-700/50">
        <h1 className="text-3xl font-bold text-white mb-2">Set New Password</h1>
        <p className="text-gray-400 mb-6">Enter your new password below</p>

        <Suspense fallback={<div className="text-gray-400 text-center">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
