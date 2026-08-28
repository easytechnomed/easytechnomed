"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { toast } from "sonner";
import { Lock, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/Label";

const resetPasswordSchema = zod
  .object({
    newPassword: zod.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: zod.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function ResetPasswordClient({ token }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data) => {
    if (!token) {
      toast.error("Reset token is missing. Please request a new link.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword,
        }),
      }).then((r) => r.json());

      if (res.success) {
        setIsSuccess(true);
        toast.success(res.message);
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      } else {
        toast.error(res.message || "Failed to reset password.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] w-full flex items-center justify-center pt-28 sm:pt-32 pb-16 px-4 sm:px-6 bg-[#F8FAFC] text-slate-900 font-sans">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-extrabold bg-[#0f766e]/15 text-[#0f766e]">
            <span className="h-2 w-2 rounded-full bg-[#0f766e]" />
            EasyTechnoMed Security
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Set New Password
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Enter a strong new password for your workspace account.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 sm:p-8 shadow-none">
          {!token ? (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 border-2 border-amber-400 flex items-center justify-center text-amber-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  Missing or Invalid Reset Link
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  The password reset token is missing from your link. Please request a new one from the sign-in page.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/auth/login")}
                style={{ backgroundColor: "#0f766e" }}
                className="w-full h-11 text-white font-bold text-sm rounded-xl cursor-pointer hover:bg-[#115e59] transition-all border-0"
              >
                Go to Sign In
              </button>
            </div>
          ) : isSuccess ? (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-extrabold text-slate-900">
                  Password Reset Successfully!
                </h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  Your new password is now active. Redirecting you to sign in...
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/auth/login")}
                style={{ backgroundColor: "#0f766e" }}
                className="w-full h-11 text-white font-bold text-sm rounded-xl cursor-pointer hover:bg-[#115e59] transition-all border-0"
              >
                Sign In Now
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              
              {/* New Password Field */}
              <div className="space-y-1.5">
                <Label htmlFor="newPassword" className="text-slate-700 text-xs font-bold tracking-wide uppercase">
                  New Password
                </Label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter at least 8 characters"
                    className="w-full h-12 bg-slate-50 pl-11 pr-11 rounded-xl border-2 border-slate-300 focus:border-[#0f766e] focus:bg-white text-slate-900 font-semibold placeholder:text-slate-400 placeholder:font-normal text-sm transition-all focus:outline-none"
                    {...register("newPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-xs text-red-600 font-bold mt-1 pl-1">{errors.newPassword.message}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-slate-700 text-xs font-bold tracking-wide uppercase">
                  Confirm New Password
                </Label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your new password"
                    className="w-full h-12 bg-slate-50 pl-11 pr-11 rounded-xl border-2 border-slate-300 focus:border-[#0f766e] focus:bg-white text-slate-900 font-semibold placeholder:text-slate-400 placeholder:font-normal text-sm transition-all focus:outline-none"
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-600 font-bold mt-1 pl-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{ backgroundColor: "#0f766e" }}
                  className="w-full h-12 text-white hover:bg-[#115e59] active:scale-[0.98] font-extrabold text-base rounded-xl transition-all flex items-center justify-center gap-2 border-0 shadow-none cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="inline-block animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      Save New Password
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>

              {/* Back to Sign In */}
              <div className="pt-3 text-center border-t-2 border-slate-100">
                <button
                  type="button"
                  onClick={() => router.push("/auth/login")}
                  className="text-xs sm:text-sm text-slate-600 font-bold hover:text-[#0f766e] transition-colors"
                >
                  Remember your password?{" "}
                  <span className="text-[#0f766e] underline decoration-2 underline-offset-4">
                    Sign In
                  </span>
                </button>
              </div>

            </form>
          )}
        </div>

        {/* Security Footnote */}
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 text-center">
          <ShieldCheck className="w-4 h-4 text-[#0f766e]" />
          <span>Encrypted with SHA-256 & bcrypt</span>
        </div>

      </div>
    </div>
  );
}
