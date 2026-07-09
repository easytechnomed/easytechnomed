import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { prisma } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "d60155b93198cdce275efee6b4a242c75a4dc372e9a2be74cfd34208a546ccf9";

export function signToken(payload, expiresIn = "7d") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Secures routes and actions for Customers (Users).
 */
export async function requireUser(requiredPermission = null) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (!token) {
    redirect("/auth/login");
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    redirect("/auth/login");
  }

  // Fetch session from Customer session DB
  const session = await prisma.userSession.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          role: {
            include: {
              permissions: true,
            },
          },
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.userSession.delete({ where: { id: session.id } }).catch(() => { });
    }
    redirect("/auth/login");
  }

  const user = session.user;

  // Customers must be verified and approved, not rejected
  if (!user.isEmailVerified || !user.isApproved || user.rejected) {
    redirect("/auth/login");
  }

  if (requiredPermission) {
    const hasPermission = user.role.permissions.some(
      (p) => p.permission === requiredPermission
    );
    if (!hasPermission) {
      redirect("/auth/login?error=unauthorized");
    }
  }

  return user;
}

/**
 * Secures routes and actions for Administrators.
 */
export async function requireAdmin(requiredPermission = null) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session_token")?.value;

  if (!token) {
    redirect("/auth/login");
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    redirect("/auth/login");
  }

  // Fetch session from Admin session DB
  const session = await prisma.adminSession.findUnique({
    where: { token },
    include: {
      admin: {
        include: {
          role: {
            include: {
              permissions: true,
            },
          },
          workspace: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.adminSession.delete({ where: { id: session.id } }).catch(() => { });
    }
    redirect("/auth/login");
  }

  const admin = session.admin;

  // Verify active status of Admin and Workspace
  if (!admin.isActive || (admin.workspace && !admin.workspace.isActive)) {
    if (session) {
      await prisma.adminSession.delete({ where: { id: session.id } }).catch(() => { });
    }
    // Clean up de-auth cookies
    cookieStore.delete("admin_session_token");
    redirect("/auth/login?error=deactivated");
  }

  // Admins must be verified and approved (pre-seeded admin is always true)
  if (!admin.isEmailVerified || !admin.isApproved) {
    redirect("/auth/login");
  }

  if (requiredPermission) {
    const roleNameUpper = admin.role?.name?.toUpperCase() || "";
    const isSuperRole = roleNameUpper === "ADMIN" || roleNameUpper === "OWNER";
    const hasAllPermission = admin.role?.permissions?.some(
      (p) => p.permission?.toUpperCase() === "ALL"
    ) || false;

    if (!isSuperRole && !hasAllPermission) {
      const hasPermission = admin.role?.permissions?.some(
        (p) => p.permission === requiredPermission
      ) || false;
      if (!hasPermission) {
        redirect("/auth/login?error=unauthorized");
      }
    }
  }

  return admin;
}

/**
 * Secures routes and actions for Super Administrators.
 */
export async function requireSuperAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("super_admin_session_token")?.value;

  if (!token) {
    redirect("/adminstration/login");
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    redirect("/adminstration/login");
  }

  // Fetch session from SuperAdmin session DB
  const session = await prisma.superAdminSession.findUnique({
    where: { token },
    include: {
      superAdmin: true,
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.superAdminSession.delete({ where: { id: session.id } }).catch(() => { });
    }
    redirect("/adminstration/login");
  }

  return session.superAdmin;
}

/**
 * Secures routes and actions for Super Administrators in API contexts without redirects.
 */
export async function verifySuperAdminAPI() {
  const cookieStore = await cookies();
  const token = cookieStore.get("super_admin_session_token")?.value;

  if (!token) {
    throw new Error("Unauthorized");
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    throw new Error("Unauthorized");
  }

  // Fetch session from SuperAdmin session DB
  const session = await prisma.superAdminSession.findUnique({
    where: { token },
    include: {
      superAdmin: true,
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.superAdminSession.delete({ where: { id: session.id } }).catch(() => { });
    }
    throw new Error("Unauthorized");
  }

  return session.superAdmin;
}


