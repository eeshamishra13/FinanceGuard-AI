import type { BusinessProfile } from "@/financial-engine";

export const APEX_LOGISTICS_PROFILE = {
  companyName: "Apex Logistics & Freight Solutions Pvt Ltd",
  industry: "Freight Logistics & Multimodal Transport",
  approxMonthlyRevenue: 680000,
  approxFixedOpEx: 350000,
  exposureCategories: ["Fuel", "Debt Service", "Logistics"],
  initialCashBalance: 1450000,
  initialAccountsReceivable: 420000,
  initialAccountsPayable: 290000,
  initialTotalDebt: 850000,
};

export const APEX_LOGISTICS_BUSINESS_INPUT: BusinessProfile = {
  companyName: "Apex Logistics & Freight Solutions Pvt Ltd",
  industry: "Freight Logistics & Multimodal Transport",
  monthlyRevenue: 680000,
  fixedOpEx: 350000,
  variableOpEx: 60000,
  payroll: 140000,
  fuelSpend: 120000,
  debtService: 65000,
  totalDebt: 850000,
  cashBalance: 1450000,
  accountsReceivable: 420000,
  accountsPayable: 290000,
  exposureCategories: ["Fuel", "Debt Service", "Logistics"],
};

export const APEX_LOGISTICS_RAW_CSV = `Date,Description,Type,Amount,Balance
2026-08-01,IOCL PETROL DIESEL PUMP #412 BENGALURU,Debit,45000,1405000
2026-08-02,TATA MOTORS FINANCE COMMERCIAL VEHICLE EMI,Debit,65000,1340000
2026-08-03,WAREHOUSE LEASE INDUSTRIAL PARK PEENYA,Debit,120000,1220000
2026-08-04,CLIENT INVOICE CR - RELIANCE RETAIL LOGISTICS,Credit,280000,1500000
2026-08-05,HPCL HIGH SPEED DIESEL HIGHWAY JUNCTION,Debit,38000,1462000
2026-08-07,STAFF SALARY NEFT PAYROLL BATCH 08/26,Debit,140000,1322000
2026-08-10,CLIENT INVOICE CR - FLIPKART SUPPLY CHAIN,Credit,220000,1542000
2026-08-12,BPCL BULK REFUELING YARD ELECTRONIC CITY,Debit,37000,1505000
2026-08-14,FLEET MAINTENANCE & TYRE REPLACEMENT JK TYRES,Debit,35000,1470000
2026-08-18,CLIENT INVOICE CR - BLUEDART FREIGHT CLEARING,Credit,180000,1650000
2026-08-20,ELECTRICITY BESCOM INDUSTRIAL FEEDER,Debit,28000,1622000
2026-08-22,IOCL DIESEL BUNKERING FLEET REFUELLING,Debit,20000,1602000
2026-08-25,INSURANCE HDFC ERGO COMMERCIAL FLEET COVER,Debit,22000,1580000
2026-08-28,TELECOM JIO FIBRE & GPS FLEET TRACKING,Debit,5000,1575000
`;
