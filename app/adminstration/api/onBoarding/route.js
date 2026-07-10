import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    
    const email = body.email?.trim().toLowerCase();
    const mobileNumber = body.mobileNumber?.trim() || null;
    const password = body.password;
    const confirmPassword = body.confirmPassword;
    const freeTrialDaysInput = body.freeTrialDays;
    const companyName = body.companyName?.trim() || null;
    
    // Address fields
    const address1 = body.address1?.trim() || null;
    const address2 = body.address2?.trim() || null;
    const city = body.city?.trim() || null;
    const state = body.state?.trim() || null;
    const pincode = body.pincode?.trim() || null;
    const country = body.country?.trim() || null;
    const latitude = body.latitude ? parseFloat(body.latitude) : null;
    const longitude = body.longitude ? parseFloat(body.longitude) : null;

    // Validate inputs
    if (!email || !password || !confirmPassword || freeTrialDaysInput === undefined || freeTrialDaysInput === null) {
      return NextResponse.json({ success: false, error: "Required fields are missing." }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ success: false, error: "Passwords do not match." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: "Password must be at least 6 characters long." }, { status: 400 });
    }

    const trialDays = parseInt(freeTrialDaysInput);
    if (isNaN(trialDays) || trialDays < 0) {
      return NextResponse.json({ success: false, error: "Free trial days must be a non-negative number." }, { status: 400 });
    }

    // Check if admin email already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      return NextResponse.json({ success: false, error: "Email is already registered." }, { status: 400 });
    }

    // Encrypt password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Setup dates
    const startAt = new Date();
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + trialDays);

    // Generate workspace slug
    const emailPrefix = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    const slug = `${emailPrefix}-${Date.now()}`;
    const workspaceName = companyName || `${emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)} Lab`;

    let result;

    // Run the onboarding transaction with extended timeouts
    await prisma.$transaction(async (tx) => {
      // 1. Create Workspace
      const workspace = await tx.workspace.create({
        data: {
          name: workspaceName,
          slug,
          isActive: true
        }
      });

      // 2. Create Admin
      const adminName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
      const admin = await tx.admin.create({
        data: {
          name: adminName,
          email,
          password: hashedPassword,
          mobileNumber,
          workspaceId: workspace.id,
          roleId: 1, // Default Admin role
          isApproved: true,
          isEmailVerified: true,
          isActive: true,
          startAt,
          expireAt,
          companyName
        }
      });

      // 3. Create AdminAddress if location or address details are provided
      const hasAddressData = address1 || address2 || city || state || pincode || country || latitude !== null || longitude !== null;
      if (hasAddressData) {
        await tx.adminAddress.create({
          data: {
            address1,
            address2,
            city,
            state,
            pincode,
            country,
            latitude,
            longitude,
            adminId: admin.id
          }
        });
      }

      // 4. Fetch default tests with parameter definitions (where workspaceId is null and isDeleted is false)
      const defaultTests = await tx.test.findMany({
        where: {
          workspaceId: null,
          isDeleted: false
        },
        include: {
          parameters: {
            where: {
              isDeleted: false
            },
            include: {
              parameter: true
            }
          }
        }
      });

      // 5. Clone unique parameters for the new workspace
      const uniqueParamsMap = new Map();
      for (const dt of defaultTests) {
        if (dt.parameters) {
          for (const tp of dt.parameters) {
            if (tp.parameter) {
              const p = tp.parameter;
              uniqueParamsMap.set(p.name.toLowerCase(), p);
            }
          }
        }
      }
      const uniqueParamsList = Array.from(uniqueParamsMap.values());

      if (uniqueParamsList.length > 0) {
        await tx.parameter.createMany({
          data: uniqueParamsList.map((p) => ({
            name: p.name,
            unit: p.unit,
            minValMale: p.minValMale,
            maxValMale: p.maxValMale,
            normalRangeMale: p.normalRangeMale,
            minValFemale: p.minValFemale,
            maxValFemale: p.maxValFemale,
            normalRangeFemale: p.normalRangeFemale,
            minValBaby: p.minValBaby,
            maxValBaby: p.maxValBaby,
            normalRangeBaby: p.normalRangeBaby,
            normalRangeDefault: p.normalRangeDefault,
            workspaceId: workspace.id
          }))
        });
      }

      // 6. Fetch the newly created parameters to match their new IDs
      const newParams = await tx.parameter.findMany({
        where: {
          workspaceId: workspace.id
        }
      });
      const paramNameToIdMap = {};
      for (const np of newParams) {
        paramNameToIdMap[np.name.toLowerCase()] = np.id;
      }

      // 7. Bulk insert default tests into the new workspace
      await tx.test.createMany({
        data: defaultTests.map((dt) => ({
          name: dt.name,
          code: dt.code,
          price: dt.price,
          workspaceId: workspace.id,
          isProcessed: dt.isProcessed,
          isDeleted: false
        }))
      });

      // 8. Fetch the newly created tests for this workspace to match IDs
      const newTests = await tx.test.findMany({
        where: {
          workspaceId: workspace.id,
          isDeleted: false
        }
      });

      // 9. Map test name+code key to its new database ID
      const testKeyToIdMap = {};
      for (const nt of newTests) {
        const key = `${nt.name.toLowerCase()}_${(nt.code || "").toLowerCase()}`;
        testKeyToIdMap[key] = nt.id;
      }

      // 10. Prepare all test parameters for bulk insert with workspace scoping
      const testParametersToCreate = [];
      for (const dt of defaultTests) {
        const key = `${dt.name.toLowerCase()}_${(dt.code || "").toLowerCase()}`;
        const newTestId = testKeyToIdMap[key];
        if (newTestId && dt.parameters) {
          for (const tp of dt.parameters) {
            if (tp.parameter) {
              const newParamId = paramNameToIdMap[tp.parameter.name.toLowerCase()];
              if (newParamId) {
                testParametersToCreate.push({
                  testId: newTestId,
                  parameterId: newParamId,
                  order: tp.order,
                  isDeleted: false,
                  workspaceId: workspace.id
                });
              }
            }
          }
        }
      }

      // 11. Bulk insert all test parameters in a single query
      if (testParametersToCreate.length > 0) {
        await tx.testParameter.createMany({
          data: testParametersToCreate
        });
      }

      result = {
        success: true,
        message: "Onboarding completed successfully!",
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        adminId: admin.id,
        email: admin.email
      };
    }, { maxWait: 25000, timeout: 50000 });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Admin Onboarding API Error:", error);
    return NextResponse.json({ success: false, error: error.message || "An unexpected error occurred during onboarding." }, { status: 500 });
  }
}
