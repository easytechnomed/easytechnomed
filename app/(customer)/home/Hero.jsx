"use client";

import React from "react";
import {
    Box,
    Container,
    Typography,
    Button,
    Grid,
    TextField,
    InputAdornment,
    CircularProgress,
    Chip,
    Card
} from "@mui/material";
import {
    PhoneAndroid as PhoneIcon,
    Email as EmailIcon,
    ArrowForward as ArrowForwardIcon,
    LocalOffer as OfferIcon
} from "@mui/icons-material";

export default function Hero({
    contactInput,
    setContactInput,
    inputType,
    loading,
    handleLeadSubmit,
    router
}) {
    return (
        <Box
            sx={{
                minHeight: "100vh",
                pt: { xs: 12, md: 14 },
                pb: { xs: 6, md: 8 },
                display: "flex",
                alignItems: "center",
                background: "radial-gradient(circle at 10% 20%, rgba(20, 184, 166, 0.05) 0%, rgba(255, 255, 255, 0) 60%)",
                position: "relative",
                overflow: "hidden"
            }}
        >
            <Container maxWidth="xl">
                <Grid container spacing={{ xs: 6, md: 8 }} sx={{ alignItems: "center" }}>
                    {/* Hero Left Content */}
                    <Grid size={{ xs: 12, md: 6, lg: 8 }}>
                        <Box sx={{ pr: { md: 4 }, display: "flex", flexDirection: "column", gap: 3 }}>
                            {/* Badges/Chips */}
                            <Chip
                                icon={<OfferIcon sx={{ fontSize: "0.95rem !important", color: "primary.main" }} />}
                                label="WELCOME OFFER • 3 DAYS FREE TRIAL"
                                color="primary"
                                variant="outlined"
                                sx={{
                                    alignSelf: "flex-start",
                                    px: 1.5,
                                    py: 2,
                                    fontWeight: 700,
                                    fontSize: "0.8rem",
                                    color: "primary.main",
                                    borderColor: "rgba(15, 118, 110, 0.2)",
                                    backgroundColor: "rgba(15, 118, 110, 0.03)",
                                    borderRadius: "9999px"
                                }}
                            />

                            {/* Main Headline */}
                            <Typography
                                variant="h1"
                                sx={{
                                    fontSize: { xs: "2.25rem", sm: "3rem", md: "3.5rem" },
                                    fontWeight: 800,
                                    lineHeight: { xs: 1.2, md: 1.15 },
                                    color: "text.primary"
                                }}
                            >
                                Online Lab Reports Made <Box component="span" sx={{ color: "primary.main" }}>Beautiful</Box> & Simple
                            </Typography>

                            {/* Subtitle Paragraph */}
                            <Typography
                                variant="body1"
                                sx={{
                                    fontSize: { xs: "1rem", md: "1.125rem" },
                                    color: "text.secondary",
                                    lineHeight: 1.6,
                                    maxWidth: "540px"
                                }}
                            >
                                Run your diagnostic laboratory workspace with ease. Register patients, input test parameters, and share digital medical reports instantly. High performance, zero limitation.
                            </Typography>

                            {/* Lead Form & Action Buttons container */}
                            <Box sx={{ maxWidth: "500px", display: "flex", flexDirection: "column", gap: 2 }}>
                                <Typography
                                    variant="subtitle2"
                                    sx={{
                                        fontWeight: 700,
                                        color: "primary.main",
                                        textTransform: "uppercase",
                                        fontSize: "0.75rem",
                                        letterSpacing: "0.05em",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1
                                    }}
                                >
                                    <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", backgroundColor: "#14b8a6" }}></span>
                                    Leave your details & we will contact you
                                </Typography>

                                {/* Responsive Form Box */}
                                <Box
                                    component="form"
                                    onSubmit={handleLeadSubmit}
                                    sx={{
                                        p: 0.75,
                                        borderRadius: "12px",
                                        bgcolor: "#ffffff",
                                        boxShadow: "0 10px 25px -10px rgba(15, 118, 110, 0.15)",
                                        border: "1px solid rgba(15, 118, 110, 0.12)",
                                        display: "flex",
                                        flexDirection: { xs: "column", sm: "row" },
                                        alignItems: { xs: "stretch", sm: "center" },
                                        gap: 1.5
                                    }}
                                >
                                    <TextField
                                        fullWidth
                                        variant="standard"
                                        placeholder="Email address or Mobile number"
                                        value={contactInput}
                                        onChange={(e) => setContactInput(e.target.value)}
                                        slotProps={{
                                            input: {
                                                disableUnderline: true,
                                                startAdornment: (
                                                    <InputAdornment position="start" sx={{ pl: 1.5, pr: 0.5 }}>
                                                        {inputType === "mobile" ? (
                                                            <PhoneIcon sx={{ color: "primary.main", fontSize: "1.25rem" }} />
                                                        ) : (
                                                            <EmailIcon sx={{ color: "primary.main", fontSize: "1.25rem" }} />
                                                        )}
                                                    </InputAdornment>
                                                ),
                                            }
                                        }}
                                        sx={{
                                            "& .MuiInputBase-input": {
                                                py: 1.5,
                                                fontSize: "0.95rem",
                                                fontWeight: 500
                                            }
                                        }}
                                    />
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        disabled={loading}
                                        sx={{
                                            py: { xs: 1.5, sm: 1.25 },
                                            px: 4,
                                            fontWeight: 700,
                                            fontSize: "0.9rem",
                                            borderRadius: "8px",
                                            textTransform: "none",
                                            whiteSpace: "nowrap"
                                        }}
                                    >
                                        {loading ? <CircularProgress size={20} color="inherit" /> : "Save"}
                                    </Button>
                                </Box>

                                {/* Divider */}
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2, my: 0.5 }}>
                                    <Box sx={{ flex: 1, height: "1px", bgcolor: "rgba(15, 118, 110, 0.1)" }} />
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: "text.secondary",
                                            fontWeight: 700,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.05em",
                                            fontSize: "0.7rem"
                                        }}
                                    >
                                        or
                                    </Typography>
                                    <Box sx={{ flex: 1, height: "1px", bgcolor: "rgba(15, 118, 110, 0.1)" }} />
                                </Box>

                                {/* Direct Claim Button */}
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    onClick={() => router.push("/auth/register")}
                                    endIcon={<ArrowForwardIcon />}
                                    sx={{
                                        py: 1.75,
                                        px: 4,
                                        width: "100%",
                                        fontSize: "1rem",
                                        fontWeight: 700,
                                        borderRadius: "12px",
                                        background: "linear-gradient(135deg, #0f766e 0%, #115e59 100%)",
                                        color: "#ffffff",
                                        boxShadow: "0 10px 22px -5px rgba(15, 118, 110, 0.35)",
                                        transition: "all 0.3s ease",
                                        textTransform: "none",
                                        "&:hover": {
                                            background: "linear-gradient(135deg, #115e59 0%, #0f766e 100%)",
                                            transform: "translateY(-1px)",
                                            boxShadow: "0 12px 26px -5px rgba(15, 118, 110, 0.4)",
                                        }
                                    }}
                                >
                                    Claim 3 Days Trial
                                </Button>

                                {/* Bullet points */}
                                <Typography
                                    variant="caption"
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                        color: "text.secondary",
                                        pl: 1,
                                        mt: 0.5
                                    }}
                                >
                                    <span>🚀</span> <b>3 Days Free Trial</b> • No Credit Card Required • Setup in 2 mins
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>

                    {/* Hero Right Mockup Image */}
                    <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                        <Box
                            sx={{
                                position: "relative",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center"
                            }}
                        >
                            {/* Decorative glowing gradient blur */}
                            <Box
                                sx={{
                                    position: "absolute",
                                    width: "85%",
                                    height: "85%",
                                    bgcolor: "rgba(20, 184, 166, 0.15)",
                                    filter: "blur(60px)",
                                    borderRadius: "50%",
                                    zIndex: 1
                                }}
                            />

                            {/* Main Mockup Card */}
                            <Card
                                sx={{
                                    zIndex: 2,
                                    overflow: "hidden",
                                    border: "1px solid rgba(15, 118, 110, 0.12)",
                                    boxShadow: "0 20px 45px -15px rgba(15, 118, 110, 0.2)",
                                    borderRadius: "20px",
                                    width: "100%",
                                    maxWidth: "580px",
                                    transition: "transform 0.4s ease",
                                    "&:hover": {
                                        transform: "scale(1.01)"
                                    }
                                }}
                            >
                                <Box
                                    component="img"
                                    src="/landing/test report table.png"
                                    alt="EasyTechnoMed Dashboard Preview"
                                    sx={{
                                        width: "100%",
                                        height: "auto",
                                        display: "block",
                                        maxHeight: { xs: 300, sm: 450, md: 600 },
                                        objectFit: "cover",
                                        objectPosition: "top"
                                    }}
                                />
                            </Card>
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}
