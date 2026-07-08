"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { toast } from "sonner";
import { Shield, ArrowRight, Mail, Lock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";

const adminLoginSchema = zod.object({
  email: zod.string().min(1, "Email is required").email("Invalid email address"),
  password: zod.string().min(1, "Password is required"),
});

export default function CustomerLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(adminLoginSchema), // keep the same schema validation
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
      {/* Col 1: AI Generated Visual and Branding */}
      <div className="hidden md:flex md:w-1/2 relative bg-cover bg-center items-center justify-center overflow-hidden"
        style={{ backgroundImage: "url('/logo/customer_login_bg.png')" }}>
        {/* Soft elegant gradient overlay (Light medical theme) */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white via-white/80 to-teal-50/40 z-10" />

        {/* Content Overlay */}
        <div className="relative z-20 max-w-lg px-8 text-center md:text-left flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo/logobg.png" alt="EasyTechnoMed Logo" className="h-14 w-auto drop-shadow-[0_4px_12px_rgba(20,184,166,0.15)] bg-white/80 p-1.5 rounded-2xl border border-teal-100" />
            {/* <div>
              <h1 className="text-2xl font-normal tracking-tight text-slate-900">
                Easy<span className="font-black">TechnoMed</span>
              </h1>
            </div> */}
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
            <p className="text-xs text-slate-500">
              Empowering laboratories with smart clinical technology.
            </p>
          </div>
        </div>
      </div>

      {/* Col 2: Login Input Fields (Gen-Z High-End B2B Redesign) */}
      <div className="w-full md:w-1/2 min-h-[100dvh] md:min-h-0 flex items-center justify-center p-6 md:p-8 bg-gradient-to-br from-slate-50 via-teal-50/10 to-slate-100 relative overflow-hidden">
        {/* Modern grid-pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />

        {/* Soft background glow bubbles */}
        <div className="absolute -top-32 -right-32 w-[30rem] h-[30rem] bg-gradient-to-br from-teal-200/30 to-emerald-200/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-[30rem] h-[30rem] bg-gradient-to-br from-sky-200/20 to-teal-100/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md space-y-6 relative z-10">

          {/* Logo showing on mobile only */}
          <div className="flex md:hidden items-center justify-center gap-2 mb-4">
            <img src="/logo/logobg.png" alt="EasyTechnoMed Logo" className="h-20 w-auto bg-white p-1 rounded-xl shadow-sm border border-slate-100" />
            {/* <div>
              <h1 className="text-lg font-normal tracking-tight text-slate-900">Easy<span className="font-black">TechnoMed</span></h1>
            </div> */}
          </div>

          {/* Heading with Gen-Z Tech Style */}
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-100/50">
              <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
              EasyTechnoMed Portal
            </div>
            <div className="space-y-1">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-950">
                Sign in
              </h2>
              <p className="text-sm text-slate-500 font-bold leading-relaxed">
                Connect your laboratory to our high-performance dashboard.
              </p>
            </div>
          </div>

          {/* Floating borderless glass login form */}
          <div className="border border-slate-200/50 bg-white/70 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.04)] hover:shadow-[0_30px_70px_rgba(20,184,166,0.09)] rounded-3xl p-6 md:p-8 border-2 transition-all duration-500 flex flex-col gap-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-5">

                {/* Email Field with Left Border Highlighting */}
                <div className="space-y-1.5 group">
                  <Label htmlFor="email" className="text-slate-700 text-xs font-bold pl-1 group-focus-within:text-teal-600 transition-colors">Email Address</Label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-4 text-slate-400 h-4.5 w-4.5 pointer-events-none group-focus-within:text-teal-500 transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@workspace.com"
                      error={errors.email?.message}
                      className="bg-white/80 pl-11 pr-4 border-l-4 border-l-teal-600 border-t-slate-200 border-r-slate-200 border-b-slate-200 text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 rounded-r-xl rounded-l-none transition-all duration-300 py-3 shadow-sm font-medium"
                      {...register("email")}
                    />
                  </div>
                </div>

                {/* Password Field with Left Border Highlighting */}
                <div className="space-y-1.5 group">
                  <div className="flex justify-between items-center pl-1">
                    <Label htmlFor="password" className="text-slate-700 text-xs font-bold group-focus-within:text-teal-600 transition-colors">Password</Label>
                  </div>
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

              {/* Dynamic submit button and links */}
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
                    Don't have an account? <span className="text-teal-600 underline decoration-teal-300 underline-offset-4 decoration-2">Register Workspace</span>
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
