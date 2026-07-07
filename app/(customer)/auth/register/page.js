"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { toast } from "sonner";
import { UserPlus, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";

const registerSchema = zod.object({
  name: zod.string().min(1, "Name is required"),
  email: zod.string().min(1, "Email is required").email("Invalid email address"),
  password: zod.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: zod.string().min(1, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function CustomerRegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="flex-1 flex items-center justify-center p-6 bg-mesh">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-xl bg-teal-50 border border-teal-100 mb-4">
            <UserPlus className="h-6 w-6 text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Create Your Account
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Get started with your 3-day free trial
          </p>
        </div>

        <Card className="glass shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-teal-700">Claim 3-Day Free Trial</CardTitle>
            <CardDescription className="text-slate-500">
              No credit card required
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-slate-700">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  error={errors.name?.message}
                  {...register("name")}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-slate-700">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  error={errors.email?.message}
                  {...register("email")}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="password" className="text-slate-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register("password")}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirmPassword" className="text-slate-700">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  error={errors.confirmPassword?.message}
                  {...register("confirmPassword")}
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 focus:ring-teal-500"
                isLoading={isLoading}
              >
                Sign Up & Claim Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="text-xs text-slate-500 hover:text-slate-900"
                onClick={() => router.push("/auth/login")}
              >
                Already have an account? Sign In
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
