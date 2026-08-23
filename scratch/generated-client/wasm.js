
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.WorkspaceScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isDeleted: 'isDeleted',
  nextSequence: 'nextSequence'
};

exports.Prisma.SuperAdminScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  password: 'password',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SuperAdminSessionScalarFieldEnum = {
  id: 'id',
  superAdminId: 'superAdminId',
  token: 'token',
  expiresAt: 'expiresAt',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  createdAt: 'createdAt'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  password: 'password',
  provider: 'provider',
  googleId: 'googleId',
  roleId: 'roleId',
  isEmailVerified: 'isEmailVerified',
  isApproved: 'isApproved',
  rejected: 'rejected',
  verificationToken: 'verificationToken',
  verificationTokenExpires: 'verificationTokenExpires',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  workspaceId: 'workspaceId',
  expireAt: 'expireAt',
  startAt: 'startAt'
};

exports.Prisma.UserSessionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  token: 'token',
  expiresAt: 'expiresAt',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  createdAt: 'createdAt'
};

exports.Prisma.UserRoleScalarFieldEnum = {
  id: 'id',
  name: 'name'
};

exports.Prisma.UserRolePermissionScalarFieldEnum = {
  id: 'id',
  roleId: 'roleId',
  permission: 'permission'
};

exports.Prisma.AdminScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  password: 'password',
  provider: 'provider',
  roleId: 'roleId',
  isEmailVerified: 'isEmailVerified',
  isApproved: 'isApproved',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  footerMargin: 'footerMargin',
  framePdfUrl: 'framePdfUrl',
  headerMargin: 'headerMargin',
  useFrameDefault: 'useFrameDefault',
  isActive: 'isActive',
  workspaceId: 'workspaceId',
  expireAt: 'expireAt',
  startAt: 'startAt',
  authorizedSignatoryDegree1: 'authorizedSignatoryDegree1',
  authorizedSignatoryDegree2: 'authorizedSignatoryDegree2',
  authorizedSignatoryName1: 'authorizedSignatoryName1',
  authorizedSignatoryName2: 'authorizedSignatoryName2',
  companyName: 'companyName',
  mobileNumber: 'mobileNumber'
};

exports.Prisma.AdminSessionScalarFieldEnum = {
  id: 'id',
  adminId: 'adminId',
  token: 'token',
  expiresAt: 'expiresAt',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  createdAt: 'createdAt'
};

exports.Prisma.AdminRoleScalarFieldEnum = {
  id: 'id',
  name: 'name',
  deletedAt: 'deletedAt',
  isDeleted: 'isDeleted'
};

exports.Prisma.AdminRolePermissionScalarFieldEnum = {
  id: 'id',
  roleId: 'roleId',
  permission: 'permission'
};

exports.Prisma.DoctorScalarFieldEnum = {
  id: 'id',
  name: 'name',
  code: 'code',
  lastPaid: 'lastPaid',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  workspaceId: 'workspaceId',
  incentivePercent: 'incentivePercent',
  isDeleted: 'isDeleted',
  deletedAt: 'deletedAt',
  address: 'address',
  clinicName: 'clinicName',
  degree: 'degree'
};

exports.Prisma.TestScalarFieldEnum = {
  id: 'id',
  name: 'name',
  code: 'code',
  price: 'price',
  baseRate: 'baseRate',
  curRate: 'curRate',
  rate: 'rate',
  collectionCenterRate: 'collectionCenterRate',
  franchiseRate: 'franchiseRate',
  superFranchiseRate: 'superFranchiseRate',
  labRate: 'labRate',
  offerPrice: 'offerPrice',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  isProcessed: 'isProcessed',
  workspaceId: 'workspaceId',
  isCustomized: 'isCustomized',
  defaultUpdatedAt: 'defaultUpdatedAt',
  deletedAt: 'deletedAt',
  isDeleted: 'isDeleted',
  departmentId: 'departmentId'
};

exports.Prisma.RegistrationScalarFieldEnum = {
  id: 'id',
  billOn: 'billOn',
  mobileNo: 'mobileNo',
  labId: 'labId',
  regNo: 'regNo',
  date: 'date',
  title: 'title',
  name: 'name',
  city: 'city',
  age: 'age',
  ageUnit: 'ageUnit',
  gender: 'gender',
  refById: 'refById',
  secondRefId: 'secondRefId',
  remark: 'remark',
  colType: 'colType',
  expRptDate: 'expRptDate',
  sampleDate: 'sampleDate',
  sampleNo: 'sampleNo',
  sampleBy: 'sampleBy',
  paymentMode: 'paymentMode',
  paymentRefNo: 'paymentRefNo',
  totalAmount: 'totalAmount',
  collectionCharge: 'collectionCharge',
  discountPercent: 'discountPercent',
  discountAmount: 'discountAmount',
  receivedAmount: 'receivedAmount',
  dueAmount: 'dueAmount',
  refByIncentivePercent: 'refByIncentivePercent',
  secondRefIncentivePercent: 'secondRefIncentivePercent',
  stickerCount: 'stickerCount',
  barcode: 'barcode',
  status: 'status',
  pdfOtp: 'pdfOtp',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  workspaceId: 'workspaceId',
  adminId: 'adminId',
  deletedAt: 'deletedAt',
  isDeleted: 'isDeleted'
};

exports.Prisma.RegistrationTestScalarFieldEnum = {
  registrationId: 'registrationId',
  testId: 'testId',
  price: 'price',
  assessNo: 'assessNo',
  collectedBy: 'collectedBy',
  expense: 'expense',
  pathologist: 'pathologist',
  product: 'product',
  sampleBarcode: 'sampleBarcode',
  sampleRemark: 'sampleRemark',
  sampleStatus: 'sampleStatus',
  sendTo: 'sendTo',
  interpretation: 'interpretation'
};

exports.Prisma.ParameterScalarFieldEnum = {
  id: 'id',
  name: 'name',
  code: 'code',
  unit: 'unit',
  valueType: 'valueType',
  options: 'options',
  minValMale: 'minValMale',
  maxValMale: 'maxValMale',
  normalRangeMale: 'normalRangeMale',
  minValFemale: 'minValFemale',
  maxValFemale: 'maxValFemale',
  normalRangeFemale: 'normalRangeFemale',
  minValBaby: 'minValBaby',
  maxValBaby: 'maxValBaby',
  normalRangeBaby: 'normalRangeBaby',
  normalRangeDefault: 'normalRangeDefault',
  criticalMinValMale: 'criticalMinValMale',
  criticalMaxValMale: 'criticalMaxValMale',
  criticalMinValFemale: 'criticalMinValFemale',
  criticalMaxValFemale: 'criticalMaxValFemale',
  criticalMinValBaby: 'criticalMinValBaby',
  criticalMaxValBaby: 'criticalMaxValBaby',
  criticalMinValDefault: 'criticalMinValDefault',
  criticalMaxValDefault: 'criticalMaxValDefault',
  borderlineMinValMale: 'borderlineMinValMale',
  borderlineMaxValMale: 'borderlineMaxValMale',
  borderlineMinValFemale: 'borderlineMinValFemale',
  borderlineMaxValFemale: 'borderlineMaxValFemale',
  borderlineMinValBaby: 'borderlineMinValBaby',
  borderlineMaxValBaby: 'borderlineMaxValBaby',
  borderlineMinValDefault: 'borderlineMinValDefault',
  borderlineMaxValDefault: 'borderlineMaxValDefault',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  workspaceId: 'workspaceId'
};

exports.Prisma.TestParameterScalarFieldEnum = {
  id: 'id',
  testId: 'testId',
  order: 'order',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isDeleted: 'isDeleted',
  parameterId: 'parameterId',
  workspaceId: 'workspaceId',
  editable: 'editable',
  isCalculated: 'isCalculated',
  decimalPlace: 'decimalPlace',
  roundingMethod: 'roundingMethod',
  section: 'section',
  unit: 'unit',
  valueType: 'valueType',
  options: 'options',
  isHeader: 'isHeader',
  parentId: 'parentId'
};

exports.Prisma.PatientResultScalarFieldEnum = {
  id: 'id',
  registrationId: 'registrationId',
  testParameterId: 'testParameterId',
  value: 'value',
  flag: 'flag',
  interpretation: 'interpretation',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LeadScalarFieldEnum = {
  id: 'id',
  contact: 'contact',
  type: 'type',
  createdAt: 'createdAt'
};

exports.Prisma.AdminAddressScalarFieldEnum = {
  id: 'id',
  address1: 'address1',
  address2: 'address2',
  city: 'city',
  state: 'state',
  pincode: 'pincode',
  country: 'country',
  latitude: 'latitude',
  longitude: 'longitude',
  adminId: 'adminId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RegistrationPaymentScalarFieldEnum = {
  id: 'id',
  registrationId: 'registrationId',
  amount: 'amount',
  paymentMode: 'paymentMode',
  paymentRefNo: 'paymentRefNo',
  remark: 'remark',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LeadContactScalarFieldEnum = {
  id: 'id',
  name: 'name',
  emailOrPhone: 'emailOrPhone',
  message: 'message',
  isRead: 'isRead',
  isDeleted: 'isDeleted',
  deletedAt: 'deletedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AdminTrackingScalarFieldEnum = {
  id: 'id',
  sessionId: 'sessionId',
  startUTC: 'startUTC',
  ENDUTC: 'ENDUTC',
  mode: 'mode',
  durationInMin: 'durationInMin',
  adminId: 'adminId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SuperAdminTrackingScalarFieldEnum = {
  id: 'id',
  sessionId: 'sessionId',
  startUTC: 'startUTC',
  ENDUTC: 'ENDUTC',
  mode: 'mode',
  durationInMin: 'durationInMin',
  superAdminId: 'superAdminId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TestDepartmentScalarFieldEnum = {
  id: 'id',
  name: 'name',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TestFormulaScalarFieldEnum = {
  id: 'id',
  workspaceId: 'workspaceId',
  testId: 'testId',
  outputParameterId: 'outputParameterId',
  formula: 'formula',
  description: 'description',
  name: 'name',
  version: 'version',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InterpretationRuleScalarFieldEnum = {
  id: 'id',
  workspaceId: 'workspaceId',
  testId: 'testId',
  parameterId: 'parameterId',
  condition: 'condition',
  interpretation: 'interpretation',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DoctorIncentiveScalarFieldEnum = {
  id: 'id',
  doctorId: 'doctorId',
  incentivePercent: 'incentivePercent',
  createdAt: 'createdAt'
};

exports.Prisma.WorkspacePdfScalarFieldEnum = {
  id: 'id',
  workspaceId: 'workspaceId',
  framePdfUrl: 'framePdfUrl',
  useFrameDefault: 'useFrameDefault',
  headerMargin: 'headerMargin',
  footerMargin: 'footerMargin',
  leftMargin: 'leftMargin',
  rightMargin: 'rightMargin',
  primaryColor: 'primaryColor',
  headerBgColor: 'headerBgColor',
  headerTextColor: 'headerTextColor',
  textColor: 'textColor',
  patientCardBgColor: 'patientCardBgColor',
  patientCardBorderColor: 'patientCardBorderColor',
  tableRowBorderColor: 'tableRowBorderColor',
  departmentTextColor: 'departmentTextColor',
  fontFamily: 'fontFamily',
  headerFontSize: 'headerFontSize',
  parameterFontSize: 'parameterFontSize',
  patientInfoFontSize: 'patientInfoFontSize',
  departmentFontSize: 'departmentFontSize',
  remarkFontSize: 'remarkFontSize',
  columnOrder: 'columnOrder',
  authorizedSignatoryName1: 'authorizedSignatoryName1',
  authorizedSignatoryDegree1: 'authorizedSignatoryDegree1',
  authorizedSignatoryName2: 'authorizedSignatoryName2',
  authorizedSignatoryDegree2: 'authorizedSignatoryDegree2',
  showSignatures: 'showSignatures',
  showQrCode: 'showQrCode',
  showDepartmentBanner: 'showDepartmentBanner',
  showPatientBox: 'showPatientBox',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};


exports.Prisma.ModelName = {
  Workspace: 'Workspace',
  SuperAdmin: 'SuperAdmin',
  SuperAdminSession: 'SuperAdminSession',
  User: 'User',
  UserSession: 'UserSession',
  UserRole: 'UserRole',
  UserRolePermission: 'UserRolePermission',
  Admin: 'Admin',
  AdminSession: 'AdminSession',
  AdminRole: 'AdminRole',
  AdminRolePermission: 'AdminRolePermission',
  Doctor: 'Doctor',
  Test: 'Test',
  Registration: 'Registration',
  RegistrationTest: 'RegistrationTest',
  Parameter: 'Parameter',
  TestParameter: 'TestParameter',
  PatientResult: 'PatientResult',
  Lead: 'Lead',
  AdminAddress: 'AdminAddress',
  RegistrationPayment: 'RegistrationPayment',
  LeadContact: 'LeadContact',
  AdminTracking: 'AdminTracking',
  SuperAdminTracking: 'SuperAdminTracking',
  TestDepartment: 'TestDepartment',
  TestFormula: 'TestFormula',
  InterpretationRule: 'InterpretationRule',
  DoctorIncentive: 'DoctorIncentive',
  WorkspacePdf: 'WorkspacePdf'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
