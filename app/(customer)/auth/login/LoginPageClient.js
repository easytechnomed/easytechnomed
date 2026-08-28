"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { toast } from "sonner";
import { TextField, InputAdornment, IconButton } from "@mui/material";
import { ArrowRight, Mail, Lock, Phone, ShieldCheck, X, CheckCircle, KeyRound, Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/Label";

// Auto-detect: if it looks like a phone number treat as mobile
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
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password modal state
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

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

  const handleOpenForgotModal = () => {
    const trimmed = identifierValue.trim();
    if (trimmed.includes("@")) {
      setForgotEmail(trimmed);
    } else {
      setForgotEmail("");
    }
    setForgotSuccess(false);
    setIsForgotOpen(true);
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error("Please enter your registered email address.");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      }).then((r) => r.json());

      if (res.success) {
        setForgotSuccess(true);
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("Failed to send reset link. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const inputStyle = {
    "& .MuiOutlinedInput-root": {
      bgcolor: "#F8FAFC",
      borderRadius: "12px",
      fontSize: { xs: "16px", sm: "0.95rem" },
      fontWeight: 600,
      touchAction: "manipulation",
      "& fieldset": {
        borderColor: "#CBD5E1",
        borderWidth: "2px",
      },
      "&:hover fieldset": {
        borderColor: "#94A3B8",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#0f766e",
        borderWidth: "2px",
      },
      "&.Mui-focused": {
        bgcolor: "#FFFFFF",
      },
    },
    "& .MuiInputBase-input": {
      py: { xs: 1.5, sm: 1.4 },
      fontSize: { xs: "16px", sm: "0.95rem" },
      color: "#0F172A",
      touchAction: "manipulation",
    },
    "& .MuiFormHelperText-root": {
      fontWeight: 700,
      fontSize: "0.75rem",
      mx: 0.5,
      mt: 0.5,
    },
  };

  return (
    <div className="min-h-[calc(100vh-72px)] w-full flex items-center justify-center pt-28 sm:pt-32 pb-16 px-4 sm:px-6 bg-[#F8FAFC] text-slate-900 font-sans">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-extrabold bg-[#0f766e]/15 text-[#0f766e]">
            <span className="h-2 w-2 rounded-full bg-[#0f766e]" />
            EasyTechnoMed Portal
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Sign In to Workspace
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Enter your mobile number or email to manage your lab.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 sm:p-8 shadow-none">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Email / Mobile Field */}
            <div className="space-y-1.5">
              <Label htmlFor="identifier" className="text-slate-700 text-xs font-bold tracking-wide uppercase">
                Mobile Number or Email
              </Label>
              <TextField
                fullWidth
                id="identifier"
                placeholder="Enter mobile number or email"
                error={!!errors.identifier}
                helperText={errors.identifier?.message}
                {...register("identifier", {
                  onChange: (e) => setIdentifierValue(e.target.value),
                })}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start" sx={{ color: "text.secondary", pl: 0.5 }}>
                        {isMobileInput ? (
                          <Phone className="w-5 h-5 text-slate-400" />
                        ) : (
                          <Mail className="w-5 h-5 text-slate-400" />
                        )}
                      </InputAdornment>
                    ),
                  },
                }}
                sx={inputStyle}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700 text-xs font-bold tracking-wide uppercase">
                  Password
                </Label>
                <button
                  type="button"
                  onClick={handleOpenForgotModal}
                  className="text-xs font-bold text-[#0f766e] hover:underline cursor-pointer transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <TextField
                fullWidth
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                error={!!errors.password}
                helperText={errors.password?.message}
                {...register("password")}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start" sx={{ color: "text.secondary", pl: 0.5 }}>
                        <Lock className="w-5 h-5 text-slate-400" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: "text.secondary" }}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                sx={inputStyle}
              />
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
                    Access Customer Portal
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>

            {/* Toggle Register */}
            <div className="pt-3 text-center border-t-2 border-slate-100">
              <button
                type="button"
                onClick={() => router.push("/auth/register")}
                className="text-xs sm:text-sm text-slate-600 font-bold hover:text-[#0f766e] transition-colors"
              >
                Don&apos;t have an account?{" "}
                <span className="text-[#0f766e] underline decoration-2 underline-offset-4">
                  Register Workspace
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

      {/* Forgot Password Modal Dialog */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-none">
          <div className="bg-white border-2 border-slate-300 rounded-2xl w-full max-w-md p-6 sm:p-7 shadow-2xl relative">
            
            {/* Close Button */}
            <button
              onClick={() => setIsForgotOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {forgotSuccess ? (
              <div className="text-center py-4 space-y-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center text-emerald-600">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Reset Link Sent!
                  </h3>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    We have sent a password reset link to <strong className="text-slate-900">{forgotEmail}</strong>. Please check your inbox and spam folder.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(false)}
                  style={{ backgroundColor: "#0f766e" }}
                  className="w-full h-11 text-white font-bold text-sm rounded-xl cursor-pointer hover:bg-[#115e59] transition-all border-0"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0f766e]/15 flex items-center justify-center text-[#0f766e]">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                      Reset Password
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Enter your registered email to receive a reset link.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="forgot-email" className="text-slate-700 text-xs font-bold tracking-wide uppercase">
                      Registered Email Address
                    </Label>
                    <TextField
                      fullWidth
                      id="forgot-email"
                      type="email"
                      required
                      placeholder="e.g. admin@yourlab.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start" sx={{ color: "text.secondary", pl: 0.5 }}>
                              <Mail className="w-5 h-5 text-slate-400" />
                            </InputAdornment>
                          ),
                        },
                      }}
                      sx={inputStyle}
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsForgotOpen(false)}
                      className="flex-1 h-11 border-2 border-slate-300 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      style={{ backgroundColor: "#0f766e" }}
                      className="flex-1 h-11 text-white font-extrabold text-sm rounded-xl cursor-pointer hover:bg-[#115e59] transition-all flex items-center justify-center gap-2 border-0 disabled:opacity-50"
                    >
                      {forgotLoading ? (
                        <span className="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        "Send Reset Link"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
