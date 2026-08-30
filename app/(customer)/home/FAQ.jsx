"use client";

import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import Link from "next/link";

export default function FAQ() {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const faqItems = [
    {
      id: "panel1",
      question: "What is the primary motive of EasyTechnoMed?",
      answer: "Our main motive is to help local diagnostic laboratories and pathology centers transition to digital operations easily and seamlessly. We empower ground-level labs to go digital with zero hassle.",
    },
    {
      id: "panel2",
      question: "Is the software user interface simple to use?",
      answer: "Yes, absolutely! The user interface of EasyTechnoMed is designed to be clean and simple. We focus on ground-level usability, ensuring that anyone can operate the system without needing technical training.",
    },
    {
      id: "panel3",
      question: "Do I need a desktop computer or special hardware?",
      answer: "No, a desktop computer is not mandatory. If a laptop or PC is not available, you can simply use your smartphone or tablet. The entire system is responsive and fully optimized for mobile devices.",
    },
    {
      id: "panel4",
      question: "Do you offer a free trial, and how quickly do you respond to queries?",
      answer: (
        <span>
          Yes, we provide a 5-day free trial so you can test all features with zero risk. If you have any questions, you can contact us via our{" "}
          <Link href="/contact" style={{ color: "#0f766e", fontWeight: 700, textDecoration: "underline" }}>
            contact page
          </Link>
          . We typically reply to all support requests within 1 to 2 hours!
        </span>
      ),
      answerText: "Yes, we provide a 5-day free trial so you can test all features with zero risk. If you have any questions, you can contact us via our contact page. We typically reply to all support requests within 1 to 2 hours!",
    },
    {
      id: "panel5",
      question: "If my subscription plan expires, will my patients still be able to scan and view their reports?",
      answer: "Yes, absolutely! Even if your subscription plan expires, all patient test reports registered during your active subscription period remain permanently scanable and accessible via their QR codes. We guarantee that historical patient reports will never be locked.",
    },
    {
      id: "panel6",
      question: "Will the lab software work if the internet is slow or completely offline?",
      answer: "Yes, absolutely! EasyTechnoMed includes an Offline Working Mode (Beta). Even without internet or during slow network connections, you can register patients, input test results, and generate PDF lab reports without interruptions. As soon as your internet is back, all offline data automatically synchronizes live to your cloud database.",
    },
  ];

  // FAQ Schema for SEO structure
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map((item) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.id === "panel4" ? item.answerText : item.answer,
      },
    })),
  };

  return (
    <Box
      id="faq"
      sx={{
        scrollMarginTop: { xs: "72px", md: "80px" },
        py: { xs: 9, md: 14 },
        bgcolor: "#FFFFFF",
        borderTop: "2px solid #E5E7EB"
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <Container maxWidth="md">
        <Box sx={{ textAlign: "center", mb: { xs: 6, md: 9 } }}>
          {/* Flat Section Badge */}
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1.5,
              px: 2.2,
              py: 0.8,
              borderRadius: "6px",
              bgcolor: "rgba(15, 118, 110, 0.12)",
              mb: 2.5
            }}
          >
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#0f766e" }} />
            <Typography
              sx={{
                fontFamily: "var(--font-outfit), sans-serif",
                fontSize: "0.8rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#0f766e",
                fontWeight: 800
              }}
            >
              Frequently Asked Questions
            </Typography>
          </Box>

          <Typography
            variant="h2"
            sx={{
              fontFamily: "var(--font-outfit), sans-serif",
              fontSize: { xs: "2.2rem", sm: "2.75rem", md: "3.2rem" },
              fontWeight: 800,
              color: "#111827",
              mb: 2,
              letterSpacing: "-0.02em"
            }}
          >
            Got Questions? We Have Answers.
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontFamily: "var(--font-outfit), sans-serif",
              color: "#4B5563",
              maxWidth: 580,
              mx: "auto",
              fontSize: { xs: "1rem", md: "1.1rem" },
              lineHeight: 1.6
            }}
          >
            Everything you need to know about EasyTechnoMed and getting started with your lab.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {faqItems.map((item) => (
            <Accordion
              key={item.id}
              expanded={expanded === item.id}
              onChange={handleChange(item.id)}
              elevation={0}
              sx={{
                borderRadius: "8px !important",
                border: "2px solid",
                borderColor: expanded === item.id ? "#0f766e" : "#E5E7EB",
                bgcolor: expanded === item.id ? "#FAFAFA" : "#FFFFFF",
                boxShadow: "none !important",
                transition: "border-color 0.2s, background-color 0.2s",
                "&:hover": {
                  borderColor: "#0f766e"
                },
                "&:before": {
                  display: "none",
                }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: expanded === item.id ? "#0f766e" : "#111827" }} />}
                sx={{
                  px: 3,
                  py: 1,
                  "& .MuiAccordionSummary-content": {
                    my: 1.5,
                  },
                }}
              >
                <Typography
                  variant="subtitle1"
                  component="h3"
                  sx={{
                    fontFamily: "var(--font-outfit), sans-serif",
                    fontWeight: 700,
                    color: expanded === item.id ? "#0f766e" : "#111827",
                    fontSize: { xs: "1rem", md: "1.1rem" },
                  }}
                >
                  {item.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "var(--font-outfit), sans-serif",
                    color: "#4B5563",
                    lineHeight: 1.7,
                    fontSize: "0.98rem",
                  }}
                >
                  {item.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
