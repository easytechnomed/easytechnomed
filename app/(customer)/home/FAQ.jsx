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
      answer: "Our main motive is to help local diagnostic laboratories and pathology centers transition to digital operations easily and seamlessly. We believe in empowering ground-level labs to go digital with zero hassle.",
    },
    {
      id: "panel2",
      question: "Is the software user interface simple to use?",
      answer: "Yes, absolutely! The user interface of EasyTechnoMed is designed to be extremely simple and clean. We focus on ground-level usability, ensuring that anyone can easily operate the system without getting confused by complex features.",
    },
    {
      id: "panel3",
      question: "Do I need a desktop computer or special hardware?",
      answer: "No, a desktop computer is not mandatory to run your diagnostic lab with us. If a desktop or laptop is not available, you can simply use your mobile phone. The entire system is fully optimized for mobile devices so you can manage your lab on the go.",
    },
    {
      id: "panel4",
      question: "Do you offer a free trial, and how quickly do you respond to queries?",
      answer: (
        <span>
          Yes, we provide a free trial so you can test all features with zero risk. If you have any doubts or questions, you can contact us using our{" "}
          <Link href="/contact" style={{ color: "#0f766e", fontWeight: 700, textDecoration: "underline" }}>
            contact page
          </Link>
          . We typically reply to all support requests within 1 to 2 hours!
        </span>
      ),
      answerText: "Yes, we provide a free trial so you can test all features with zero risk. If you have any doubts or questions, you can contact us using our contact page. We typically reply to all support requests within 1 to 2 hours!",
    },
    {
      id: "panel5",
      question: "If my subscription plan expires, will my patients still be able to scan and view their reports?",
      answer: "Yes, absolutely! Even if your subscription plan expires, all patient test reports registered during your active subscription period remain permanently scanable and accessible via their QR codes. We guarantee that your historical patient reports will never be locked or disabled.",
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
        py: { xs: 8, md: 12 },
        bgcolor: "#f8fafc", // slate-50
        borderTop: "1px solid rgba(15, 118, 110, 0.05)",
        borderBottom: "1px solid rgba(15, 118, 110, 0.05)",
      }}
    >
      {/* Schema injection for search engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <Container maxWidth="md">
        <Box sx={{ textAlign: "center", mb: { xs: 6, md: 8 } }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.5rem" },
              fontWeight: 800,
              color: "primary.main",
              mb: 2,
            }}
          >
            Frequently Asked Questions
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "text.secondary",
              maxWidth: 600,
              mx: "auto",
              fontSize: { xs: "1rem", md: "1.1rem" },
            }}
          >
            Quick answers to help you learn about EasyTechnoMed and get started.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {faqItems.map((item) => (
            <Accordion
              key={item.id}
              expanded={expanded === item.id}
              onChange={handleChange(item.id)}
              variant="outlined"
              sx={{
                borderRadius: "12px",
                borderColor: "rgba(15, 118, 110, 0.12)",
                bgcolor: "#ffffff",
                transition: "all 0.2s ease",
                "&:hover": {
                  boxShadow: "0 4px 20px rgba(15, 118, 110, 0.05)",
                  borderColor: "primary.main",
                },
                "&:before": {
                  display: "none",
                },
                "&.Mui-expanded": {
                  borderColor: "primary.main",
                  boxShadow: "0 4px 20px rgba(15, 118, 110, 0.05)",
                  borderRadius: "12px",
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: "primary.main" }} />}
                sx={{
                  px: 3,
                  py: 1,
                  borderRadius: "12px",
                  "& .MuiAccordionSummary-content": {
                    my: 1.5,
                  },
                }}
              >
                <Typography
                  variant="subtitle1"
                  component="h3"
                  sx={{
                    fontWeight: 700,
                    color: expanded === item.id ? "primary.main" : "text.primary",
                    fontSize: { xs: "0.95rem", md: "1.1rem" },
                  }}
                >
                  {item.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    lineHeight: 1.7,
                    fontSize: { xs: "0.875rem", md: "0.95rem" },
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
