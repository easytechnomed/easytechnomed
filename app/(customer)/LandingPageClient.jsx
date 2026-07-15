"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box } from "@mui/material";
import { toast } from "sonner";

// Import modular components
import Hero from "./home/Hero";
import Benefits from "./home/Benefits";
import Features from "./home/Features";
import Pricing from "./home/Pricing";
import FAQ from "./home/FAQ";
import Contact from "./home/Contact";

export default function LandingPage() {
    const router = useRouter();
    const [contactInput, setContactInput] = useState("");
    const [inputType, setInputType] = useState("email"); // "email" or "mobile"
    const [loading, setLoading] = useState(false);

    // Dynamic input type detector
    useEffect(() => {
        const numericRegex = /^[0-9+()-\s]*$/;
        if (contactInput.trim() === "") {
            setInputType("email");
        } else if (numericRegex.test(contactInput)) {
            setInputType("mobile");
        } else {
            setInputType("email");
        }
    }, [contactInput]);

    const handleLeadSubmit = async (e) => {
        e.preventDefault();
        if (!contactInput.trim()) {
            toast.error("Please enter your email or mobile number.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contact: contactInput }),
            }).then((r) => r.json());

            if (res.success) {
                toast.success(res.message);
                setContactInput("");
            } else {
                toast.error(res.message);
            }
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            {/* Hero Section */}
            <Hero
                contactInput={contactInput}
                setContactInput={setContactInput}
                inputType={inputType}
                loading={loading}
                handleLeadSubmit={handleLeadSubmit}
                router={router}
            />

            {/* Benefits Section */}
            <Benefits />

            {/* Features Showcase Section */}
            <Features />

            {/* Pricing Section */}
            <Pricing />

            {/* FAQ Section */}
            <FAQ />

            {/* Contact Us & Support Section */}
            <Contact
                contactInput={contactInput}
                setContactInput={setContactInput}
                inputType={inputType}
                loading={loading}
                handleLeadSubmit={handleLeadSubmit}
            />
        </Box>
    );
}
