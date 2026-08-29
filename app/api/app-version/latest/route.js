import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Helper function to compare semver-like version strings
function isVersionOutdated(current, latest) {
  if (!current || !latest) return false;
  const clean = (v) => v.replace(/^v/i, "").split(".").map((n) => parseInt(n, 10) || 0);
  const currParts = clean(current);
  const latestParts = clean(latest);
  const maxLen = Math.max(currParts.length, latestParts.length);

  for (let i = 0; i < maxLen; i++) {
    const c = currParts[i] || 0;
    const l = latestParts[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const clientVersion = searchParams.get("currentVersion")?.trim() || null;

    const latestRelease = await prisma.appVersion.findFirst({
      where: { isActive: true },
      orderBy: [{ releaseDate: "desc" }, { createdAt: "desc" }],
    });

    if (!latestRelease) {
      return NextResponse.json({
        success: true,
        hasRelease: false,
        message: "No active release found.",
      });
    }

    const hasUpdate = clientVersion ? isVersionOutdated(clientVersion, latestRelease.version) : false;

    // Check if there are any mandatory updates published between client version and latest
    let isMandatoryUpdate = false;
    if (hasUpdate && clientVersion) {
      const intermediateMandatory = await prisma.appVersion.findFirst({
        where: {
          isActive: true,
          isMandatory: true,
          releaseDate: { gte: latestRelease.releaseDate },
        },
      });
      isMandatoryUpdate = Boolean(intermediateMandatory || latestRelease.isMandatory);
    } else if (hasUpdate) {
      isMandatoryUpdate = latestRelease.isMandatory;
    }

    return NextResponse.json({
      success: true,
      hasRelease: true,
      latestVersion: latestRelease.version,
      title: latestRelease.title,
      description: latestRelease.description,
      changes: latestRelease.changes,
      isMandatory: latestRelease.isMandatory,
      releaseDate: latestRelease.releaseDate,
      hasUpdate,
      isMandatoryUpdate,
    });
  } catch (error) {
    console.error("Public AppVersion Latest GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve latest version." },
      { status: 500 }
    );
  }
}
