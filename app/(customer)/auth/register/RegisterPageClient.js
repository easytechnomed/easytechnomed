"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { toast } from "sonner";
import { ArrowRight, Mail, Lock, User, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/Label";

const registerSchema = zod.object({
  name: zod.string().min(1, "Lab/Owner Name is required"),
  email: zod.string().min(1, "Email address is required").email("Invalid email address"),
  password: zod.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: zod.string().min(1, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function CustomerRegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json());

      if (res.success) {
        toast.success(res.message);
        router.push("/auth/login");
      } else {
        toast.error(res.message);
        setIsLoading(false);
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
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
            Claim 5-Day Free Trial 🎁
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Create Lab Workspace
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Start testing the full platform in 60 seconds. No credit card needed.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 sm:p-8 shadow-none">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            
            {/* Full Name */}
            <div className="space-y-1">
              <Label htmlFor="name" className="text-slate-700 text-xs font-bold tracking-wide uppercase">
                Lab Name or Full Name
              </Label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
                  <User className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  id="name"
                  type="text"
                  placeholder="e.g. Metro Diagnostic Lab"
                  className="w-full h-12 bg-slate-50 pl-11 pr-4 rounded-xl border-2 border-slate-300 focus:border-[#0f766e] focus:bg-white text-slate-900 font-semibold placeholder:text-slate-400 placeholder:font-normal text-sm transition-all focus:outline-none"
                  {...register("name")}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-red-600 font-bold mt-0.5 pl-1">{errors.name.message}</p>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-slate-700 text-xs font-bold tracking-wide uppercase">
                Email Address
              </Label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
                  <Mail className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="name@labcenter.com"
                  className="w-full h-12 bg-slate-50 pl-11 pr-4 rounded-xl border-2 border-slate-300 focus:border-[#0f766e] focus:bg-white text-slate-900 font-semibold placeholder:text-slate-400 placeholder:font-normal text-sm transition-all focus:outline-none"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-600 font-bold mt-0.5 pl-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <Label htmlFor="password" className="text-slate-700 text-xs font-bold tracking-wide uppercase">
                Password
              </Label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  className="w-full h-12 bg-slate-50 pl-11 pr-11 rounded-xl border-2 border-slate-300 focus:border-[#0f766e] focus:bg-white text-slate-900 font-semibold placeholder:text-slate-400 placeholder:font-normal text-sm transition-all focus:outline-none"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 font-bold mt-0.5 pl-1">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-slate-700 text-xs font-bold tracking-wide uppercase">
                Confirm Password
              </Label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
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
                <p className="text-xs text-red-600 font-bold mt-0.5 pl-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Action Button */}
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
                    Start 5-Day Free Trial
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            {/* Toggle Login */}
            <div className="pt-3 text-center border-t-2 border-slate-100">
              <button
                type="button"
                onClick={() => router.push("/auth/login")}
                className="text-xs sm:text-sm text-slate-600 font-bold hover:text-[#0f766e] transition-colors"
              >
                Already have an account?{" "}
                <span className="text-[#0f766e] underline decoration-2 underline-offset-4">
                  Sign In
                </span>
              </button>
            </div>

          </form>
        </div>

        {/* Security Footnote */}
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 text-center">
          <ShieldCheck className="w-4 h-4 text-[#0f766e]" />
          <span>100% Secure & HIPAA Compliant Cloud LIMS</span>
        </div>

      </div>
    </div>
  );
}
