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
          isActive: true,
          startAt,
          expireAt,
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
            code: p.code,
            unit: p.unit,
            valueType: p.valueType || "NUMERIC",
            options: p.options || null,
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
            criticalMinValMale: p.criticalMinValMale,
            criticalMaxValMale: p.criticalMaxValMale,
            criticalMinValFemale: p.criticalMinValFemale,
            criticalMaxValFemale: p.criticalMaxValFemale,
            criticalMinValBaby: p.criticalMinValBaby,
            criticalMaxValBaby: p.criticalMaxValBaby,
            criticalMinValDefault: p.criticalMinValDefault,
            criticalMaxValDefault: p.criticalMaxValDefault,
            borderlineMinValMale: p.borderlineMinValMale,
            borderlineMaxValMale: p.borderlineMaxValMale,
            borderlineMinValFemale: p.borderlineMinValFemale,
            borderlineMaxValFemale: p.borderlineMaxValFemale,
            borderlineMinValBaby: p.borderlineMinValBaby,
            borderlineMaxValBaby: p.borderlineMaxValBaby,
            borderlineMinValDefault: p.borderlineMinValDefault,
            borderlineMaxValDefault: p.borderlineMaxValDefault,
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
          baseRate: dt.baseRate,
          curRate: dt.curRate,
          rate: dt.rate,
          collectionCenterRate: dt.collectionCenterRate,
          franchiseRate: dt.franchiseRate,
          superFranchiseRate: dt.superFranchiseRate,
          labRate: dt.labRate,
          offerPrice: dt.offerPrice,
          departmentId: dt.departmentId,
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

      // 10. Two-pass insertion of TestParameters to preserve isHeader -> child parentId mapping
      // Pass 1: Insert all isHeader rows first to get their new DB IDs
      const defaultTpIdToNewTpIdMap = new Map();

      for (const dt of defaultTests) {
        const key = `${dt.name.toLowerCase()}_${(dt.code || "").toLowerCase()}`;
        const newTestId = testKeyToIdMap[key];
        if (newTestId && dt.parameters) {
          const headerTps = dt.parameters.filter(tp => tp.isHeader && tp.parameter);
          for (const tp of headerTps) {
            const newParamId = paramNameToIdMap[tp.parameter.name.toLowerCase()];
            if (newParamId) {
              const createdHeaderTp = await tx.testParameter.create({
                data: {
                  testId: newTestId,
                  parameterId: newParamId,
                  order: tp.order,
                  isHeader: true,
                  parentId: null,
                  unit: tp.unit || tp.parameter.unit || null,
                  valueType: tp.valueType || tp.parameter.valueType || "OPTIONS",
                  options: tp.options || tp.parameter.options || null,
                  isCalculated: tp.isCalculated || false,
                  decimalPlace: tp.decimalPlace ?? 2,
                  roundingMethod: tp.roundingMethod || "HALF_UP",
                  section: tp.section || null,
                  isDeleted: false,
                  workspaceId: workspace.id,
                }
              });
              defaultTpIdToNewTpIdMap.set(tp.id, createdHeaderTp.id);
            }
          }
        }
      }

      // Pass 2: Insert all child and standalone rows (!isHeader) linking parentId
      const childParamsToCreate = [];
      for (const dt of defaultTests) {
        const key = `${dt.name.toLowerCase()}_${(dt.code || "").toLowerCase()}`;
        const newTestId = testKeyToIdMap[key];
        if (newTestId && dt.parameters) {
          const nonHeaderTps = dt.parameters.filter(tp => !tp.isHeader && tp.parameter);
          for (const tp of nonHeaderTps) {
            const newParamId = paramNameToIdMap[tp.parameter.name.toLowerCase()];
            if (newParamId) {
              const newParentId = tp.parentId ? (defaultTpIdToNewTpIdMap.get(tp.parentId) || null) : null;
              childParamsToCreate.push({
                testId: newTestId,
                parameterId: newParamId,
                order: tp.order,
                isHeader: false,
                parentId: newParentId,
                unit: tp.unit || tp.parameter.unit || null,
                valueType: tp.valueType || tp.parameter.valueType || "NUMERIC",
                options: tp.options || tp.parameter.options || null,
                isCalculated: tp.isCalculated || false,
                decimalPlace: tp.decimalPlace ?? 2,
                roundingMethod: tp.roundingMethod || "HALF_UP",
                section: tp.section || null,
                isDeleted: false,
                workspaceId: workspace.id,
              });
            }
          }
        }
      }

      // 11. Bulk insert all child test parameters
      if (childParamsToCreate.length > 0) {
        await tx.testParameter.createMany({
          data: childParamsToCreate
        });
      }

      // 12. Fetch default test formulas (where workspaceId is null and isActive is true)
      const defaultFormulas = await tx.testFormula.findMany({
        where: {
          workspaceId: null,
          isActive: true
        },
        include: {
          test: true,
          outputParameter: true
        }
      });

      // 13. Map and prepare formulas for bulk insert
      const formulasToCreate = [];
      for (const df of defaultFormulas) {
        if (df.test && df.outputParameter) {
          const testKey = `${df.test.name.toLowerCase()}_${(df.test.code || "").toLowerCase()}`;
          const newTestId = testKeyToIdMap[testKey];
          const newOutputParamId = paramNameToIdMap[df.outputParameter.name.toLowerCase()];

          if (newTestId && newOutputParamId) {
            formulasToCreate.push({
              workspaceId: workspace.id,
              testId: newTestId,
              outputParameterId: newOutputParamId,
              formula: df.formula,
              description: df.description,
              name: df.name,
              version: df.version,
              isActive: df.isActive
            });
          }
        }
      }

      // 14. Bulk insert formulas
      if (formulasToCreate.length > 0) {
        await tx.testFormula.createMany({
          data: formulasToCreate
        });
      }

      // 15. Fetch default interpretation rules and clone
      const defaultRules = await tx.interpretationRule.findMany({
        where: {
          workspaceId: null
        },
        include: {
          test: true,
          parameter: true
        }
      });

      if (defaultRules.length > 0) {
        const rulesToCreate = [];
        for (const dr of defaultRules) {
          let newTestId = null;
          if (dr.test) {
            const testKey = `${dr.test.name.toLowerCase()}_${(dr.test.code || "").toLowerCase()}`;
            newTestId = testKeyToIdMap[testKey] || null;
          }
          let newParamId = null;
          if (dr.parameter) {
            newParamId = paramNameToIdMap[dr.parameter.name.toLowerCase()] || null;
          }

          if (newTestId && newParamId) {
            rulesToCreate.push({
              workspaceId: workspace.id,
              testId: newTestId,
              parameterId: newParamId,
              condition: dr.condition,
              interpretation: dr.interpretation
            });
          }
        }
        if (rulesToCreate.length > 0) {
          await tx.interpretationRule.createMany({ data: rulesToCreate });
        }
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
