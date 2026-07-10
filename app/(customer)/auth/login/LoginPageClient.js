"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { toast } from "sonner";
import { ArrowRight, Mail, Lock, Phone } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";

// Auto-detect: if it looks like a phone number (digits, +, spaces, dashes) treat as mobile
const isLikelyMobile = (value) => /^[+\d\s\-()]{7,15}$/.test(value.trim());

const loginSchema = zod.object({
  identifier: zod
    .string()
    .min(1, "Email or mobile number is required")
    .refine(
      (val) => {
        const v = val.trim();
        return isLikelyMobile(v) || zod.string().email().safeParse(v).success;
      },
      { message: "Enter a valid email address or mobile number" }
    ),
  password: zod.string().min(1, "Password is required"),
});

export default function CustomerLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [identifierValue, setIdentifierValue] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const isMobileInput = isLikelyMobile(identifierValue);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: data.identifier.trim(), password: data.password }),
      }).then((r) => r.json());

      if (res.success) {
        toast.success(res.message);
        router.push(res.redirect);
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
    <div className="h-[100dvh] w-full flex flex-col md:flex-row bg-slate-50 text-slate-800 font-sans md:overflow-hidden overflow-y-auto">
      {/* Col 1: Branding */}
      <div className="hidden md:flex md:w-1/2 relative bg-cover bg-center items-center justify-center overflow-hidden"
        style={{ backgroundImage: "url('/logo/customer_login_bg.png')" }}>
        <div className="absolute inset-0 bg-gradient-to-tr from-white via-white/80 to-teal-50/40 z-10" />
        <div className="relative z-20 max-w-lg px-8 text-center md:text-left flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo/logobg.png" alt="EasyTechnoMed Logo" className="h-14 w-auto drop-shadow-[0_4px_12px_rgba(20,184,166,0.15)] bg-white/80 p-1.5 rounded-2xl border border-teal-100" />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-tight">
              Powering modern <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">Lab Operations ⚡</span>
            </h2>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
              Manage patient registrations, design custom parameters, track laboratory statistics, and generate print-ready reports with ease.
            </p>
          </div>
          <div className="flex items-center gap-4 pt-5 border-t border-slate-200">
            <div className="flex -space-x-2">
              <span className="w-8 h-8 rounded-full border-2 border-white bg-teal-500 flex items-center justify-center text-xs font-bold text-white">L</span>
              <span className="w-8 h-8 rounded-full border-2 border-white bg-emerald-500 flex items-center justify-center text-xs font-bold text-white">T</span>
              <span className="w-8 h-8 rounded-full border-2 border-white bg-sky-500 flex items-center justify-center text-xs font-bold text-white">M</span>
            </div>
            <p className="text-xs text-slate-500">Empowering laboratories with smart clinical technology.</p>
          </div>
        </div>
      </div>

      {/* Col 2: Login Form */}
      <div className="w-full md:w-1/2 min-h-[100dvh] md:min-h-0 flex items-center justify-center pt-20 pb-6 px-6 md:pt-24 md:pb-8 md:px-8 bg-gradient-to-br from-slate-50 via-teal-50/10 to-slate-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />
        <div className="absolute -top-32 -right-32 w-[30rem] h-[30rem] bg-gradient-to-br from-teal-200/30 to-emerald-200/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-[30rem] h-[30rem] bg-gradient-to-br from-sky-200/20 to-teal-100/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md space-y-6 relative z-10">

          {/* Heading */}
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-100/50">
              <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
              EasyTechnoMed Portal
            </div>
            <div className="space-y-1">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-950">Sign in</h2>
              <p className="text-sm text-slate-500 font-bold leading-relaxed">
                Connect your laboratory to our high-performance dashboard.
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className="border border-slate-200/50 bg-white/70 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.04)] hover:shadow-[0_30px_70px_rgba(20,184,166,0.09)] rounded-3xl p-6 md:p-8 border-2 transition-all duration-500 flex flex-col gap-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-5">

                {/* Email or Mobile — auto-detects icon + label */}
                <div className="space-y-1.5 group">
                  <Label htmlFor="identifier" className="text-slate-700 text-xs font-bold pl-1 group-focus-within:text-teal-600 transition-colors">
                    Email Address or Mobile Number
                  </Label>
                  <div className="relative flex items-center">
                    {isMobileInput ? (
                      <Phone className="absolute left-4 text-slate-400 h-4.5 w-4.5 pointer-events-none group-focus-within:text-teal-500 transition-colors" />
                    ) : (
                      <Mail className="absolute left-4 text-slate-400 h-4.5 w-4.5 pointer-events-none group-focus-within:text-teal-500 transition-colors" />
                    )}
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="name@workspace.com or 9876543210"
                      error={errors.identifier?.message}
                      className="bg-white/80 pl-11 pr-4 border-l-4 border-l-teal-600 border-t-slate-200 border-r-slate-200 border-b-slate-200 text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 rounded-r-xl rounded-l-none transition-all duration-300 py-3 shadow-sm font-medium"
                      {...register("identifier", {
                        onChange: (e) => setIdentifierValue(e.target.value),
                      })}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5 group">
                  <Label htmlFor="password" className="text-slate-700 text-xs font-bold pl-1 group-focus-within:text-teal-600 transition-colors">
                    Password
                  </Label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-4 text-slate-400 h-4.5 w-4.5 pointer-events-none group-focus-within:text-teal-500 transition-colors" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      error={errors.password?.message}
                      className="bg-white/80 pl-11 pr-4 border-l-4 border-l-teal-600 border-t-slate-200 border-r-slate-200 border-b-slate-200 text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 rounded-r-xl rounded-l-none transition-all duration-300 py-3 shadow-sm font-medium"
                      {...register("password")}
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="space-y-4 pt-2">
                <Button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3.5 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 border-0 shadow-[0_10px_20px_rgba(15,23,42,0.15)] hover:shadow-[0_15px_25px_rgba(20,184,166,0.2)] transform hover:-translate-y-0.5"
                  isLoading={isLoading}
                >
                  Access Customer Portal
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <div className="flex items-center justify-center w-full text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    className="hover:text-teal-600 transition-colors duration-150 font-extrabold text-slate-600"
                    onClick={() => router.push("/auth/register")}
                  >
                    Don&apos;t have an account?{" "}
                    <span className="text-teal-600 underline decoration-teal-300 underline-offset-4 decoration-2">Register Workspace</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
