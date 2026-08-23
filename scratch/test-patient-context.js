function addPatientContextToValuesMap(valuesMap, reg) {
  if (!reg) return;

  // 1. Patient Age (converted to years if unit is Month / Day)
  if (reg.age !== undefined && reg.age !== null && !isNaN(Number(reg.age))) {
    const rawAge = Number(reg.age);
    let ageInYears = rawAge;
    const unit = (reg.ageUnit || "Year").toLowerCase().trim();
    if (unit.startsWith("month")) {
      ageInYears = rawAge / 12;
    } else if (unit.startsWith("day")) {
      ageInYears = rawAge / 365.25;
    }

    valuesMap["AGE"] = ageInYears;
    valuesMap["age"] = ageInYears;
    valuesMap["Age"] = ageInYears;
    valuesMap["patient_age"] = ageInYears;
    valuesMap["PATIENT_AGE"] = ageInYears;
    valuesMap["patientAge"] = ageInYears;
  }

  // 2. Patient Gender
  if (reg.gender) {
    const g = String(reg.gender).trim();
    const gLower = g.toLowerCase();
    const isFemale = gLower === "female" || gLower === "f";
    const isMale = gLower === "male" || gLower === "m";

    // Standardized Gender strings
    const stdGender = isFemale ? "Female" : (isMale ? "Male" : g);
    valuesMap["GENDER"] = stdGender;
    valuesMap["gender"] = stdGender;
    valuesMap["Gender"] = stdGender;
    valuesMap["SEX"] = stdGender;
    valuesMap["sex"] = stdGender;

    // Boolean / Numeric indicators
    valuesMap["IS_FEMALE"] = isFemale ? 1 : 0;
    valuesMap["is_female"] = isFemale ? 1 : 0;
    valuesMap["FEMALE"] = isFemale ? 1 : 0;
    valuesMap["female"] = isFemale ? 1 : 0;

    valuesMap["IS_MALE"] = isMale ? 1 : 0;
    valuesMap["is_male"] = isMale ? 1 : 0;
    valuesMap["MALE"] = isMale ? 1 : 0;
    valuesMap["male"] = isMale ? 1 : 0;
  }
}

// Test with various registrations:
const valuesMap1 = { CREAT: 0.8 };
addPatientContextToValuesMap(valuesMap1, { age: 30, ageUnit: "Year", gender: "Female" });
console.log("ValuesMap Female:", valuesMap1);

const valuesMap2 = { CREAT: 1.1 };
addPatientContextToValuesMap(valuesMap2, { age: 60, ageUnit: "Year", gender: "Male" });
console.log("ValuesMap Male:", valuesMap2);

const valuesMap3 = { CREAT: 0.5 };
addPatientContextToValuesMap(valuesMap3, { age: 6, ageUnit: "Month", gender: "Female" });
console.log("ValuesMap Baby 6 Months:", valuesMap3);
