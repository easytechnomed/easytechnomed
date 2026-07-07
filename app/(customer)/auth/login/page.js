"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { toast } from "sonner";
import { Shield, ArrowRight } from "lucide-react";
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
    <div className="flex-1 flex items-center justify-center p-6 bg-mesh">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-xl bg-teal-50 border border-teal-100 mb-4">
            <Shield className="h-6 w-6 text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Customer Portal
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to access your lab reports
          </p>
        </div>

        <Card className="glass shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-teal-700">Customer Sign In</CardTitle>
            <CardDescription className="text-slate-500">
              Enter your credentials to access the portal
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email" className="text-slate-700">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="customer@example.com"
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
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 focus:ring-teal-500"
                isLoading={isLoading}
              >
                Access Customer Portal
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <div className="flex justify-between w-full text-xs text-slate-500">
                <button
                  type="button"
                  className="hover:text-slate-900"
                  onClick={() => router.push("/auth/register")}
                >
                  Create an Account
                </button>
                <button
                  type="button"
                  className="hover:text-slate-900"
                  onClick={() => router.push("/admin/auth/login")}
                >
                  Admin Login
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
