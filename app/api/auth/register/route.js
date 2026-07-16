import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/mail";

export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        const name = body.name?.trim();
        const email = body.email?.trim().toLowerCase();
        const password = body.password;
        const confirmPassword = body.confirmPassword;

        if (!name || !email || !password || !confirmPassword) {
            return NextResponse.json({ success: false, message: "All fields are required" });
        }

        if (password !== confirmPassword) {
            return NextResponse.json({ success: false, message: "Passwords do not match" });
        }

        if (password.length < 8) {
            return NextResponse.json({ success: false, message: "Password must be at least 8 characters long" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ success: false, message: "Invalid email address" });
        }

        const existingAdmin = await prisma.admin.findUnique({ where: { email } });
        if (existingAdmin) {
            return NextResponse.json({ success: false, message: "Email is already registered as an admin" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const now = new Date();
        const trialEnd = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days trial

        await prisma.admin.create({
            data: {
                name,
                email,
                password: hashedPassword,
                provider: "credentials",
                roleId: 1,
                isEmailVerified: true,
                isApproved: true,
                isActive: true,
                startAt: now,
                expireAt: trialEnd,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Registration successful! You can now log in.",
        });
    } catch (error) {
        console.error("Customer Register API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
