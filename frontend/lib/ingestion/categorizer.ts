import type { TransactionCategory } from "@/financial-engine";

export interface NormalizedMerchant {
  rawDescription: string;
  normalizedMerchant: string;
  category: TransactionCategory;
  isRecurring: boolean;
  confidenceScore: number;
}

const CATEGORY_RULES: Array<{
  pattern: RegExp;
  merchant: string;
  category: TransactionCategory;
  isRecurring: boolean;
}> = [
  { pattern: /IOCL|HPCL|BPCL|PETROL|DIESEL|SHELL|FUEL|REFUELL?ING/i, merchant: "Fuel Station", category: "Fuel", isRecurring: true },
  { pattern: /TATA MOTORS|MAHINDRA FINANCE|HDFC BANK LOAN|EMI|CHOLAMANDALAM|VEHICLE EMI/i, merchant: "Debt Service", category: "Debt Service", isRecurring: true },
  { pattern: /SALARY|PAYROLL|NEFT.*PAYROLL|STAFF/i, merchant: "Payroll Batch", category: "Payroll", isRecurring: true },
  { pattern: /WAREHOUSE|LEASE|RENT|INDUSTRIAL PARK|ESTATE/i, merchant: "Property Lease", category: "Rent", isRecurring: true },
  { pattern: /BESCOM|ELECTRICITY|POWER|WATER|UTILITY/i, merchant: "Utilities Board", category: "Utilities", isRecurring: true },
  { pattern: /MAINTENANCE|TYRES?|SPARE PARTS|WORKSHOP|REPAIR/i, merchant: "Vehicle Maintenance", category: "Logistics", isRecurring: false },
  { pattern: /INSURANCE|HDFC ERGO|ICICI LOMBARD|NEW INDIA/i, merchant: "Commercial Insurance", category: "Debt Service", isRecurring: true },
  { pattern: /JIO|AIRTEL|TELECOM|GPS|TRACKING/i, merchant: "Telecom & IoT", category: "Utilities", isRecurring: true },
  { pattern: /RELIANCE|FLIPKART|AMAZON|BLUEDART|INVOICE CR|FREIGHT SETTLEMENT/i, merchant: "Freight Client Settlement", category: "Revenue", isRecurring: true },
  { pattern: /GST|TAX|TDS|ADVANCE TAX/i, merchant: "Tax Department", category: "Tax", isRecurring: false },
];

export function categorizeTransaction(rawDesc: string): NormalizedMerchant {
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(rawDesc)) {
      return {
        rawDescription: rawDesc,
        normalizedMerchant: rule.merchant,
        category: rule.category,
        isRecurring: rule.isRecurring,
        confidenceScore: 0.95,
      };
    }
  }

  return {
    rawDescription: rawDesc,
    normalizedMerchant: rawDesc.trim().slice(0, 24),
    category: "Other",
    isRecurring: false,
    confidenceScore: 0.5,
  };
}
