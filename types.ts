
export interface Transaction {
  id: number;
  month: string;
  analytics: 'TRUE' | 'FALSE' | 'WORK';
  date: string;
  account: string;
  movement: number;
  curr: string;
  category: string;
  subcategory: string;
  flag: string;
  note: string;
  valueChf: number;
}

export interface CreateTransactionPayload {
  date: string;
  analytics: string;
  account: string;
  movement: number;
  curr: string;
  category: string;
  subcategory: string;
  flag: string;
  note: string;
  valueChf: number;
}

export interface UpdateTransactionPayload {
  id: number;
  date?: string;
  analytics?: string;
  account?: string;
  movement?: number;
  curr?: string;
  category?: string;
  subcategory?: string;
  flag?: string;
  note?: string;
  valueChf?: number;
}

export interface ApiResponse {
  status: string;
  data: Transaction[];
}

export type PeriodType = 'MONTH' | 'YEAR';

export interface FilterState {
  periodType: PeriodType;
  selectedMonth: number; // 0 = Jan, 11 = Dec
  selectedYear: number;
  accountId: string | 'ALL';
  category: string | 'ALL';
  analyticsType: 'ALL' | 'NO_TRANSFER' | 'WORK_ONLY' | 'TRANSFERS_ONLY';
  eventTag: string | 'ALL';
}

export type AccountTuple = [string, string]; // [Name, Currency]

export const INITIAL_ACCOUNTS: AccountTuple[] = [
  ["Cash-CHF", "CHF"],
  ["Cash-EUR", "EUR"],
  ["CreditAgricole", "EUR"],
  ["Revolut-CHF", "CHF"],
  ["Revolut-EUR", "EUR"],
  ["Revolut-GBP", "GBP"],
  ["Revolut-USD", "USD"],
  ["Yuh-CHF", "CHF"]
];

export const INITIAL_CATEGORIES: Record<string, string[]> = {
  "INVESTMENT": ["3a Pillar", "3b Pillar", "Cash", "InteractiveBrokers", "Referral"],
  "TRANSPORTATION": ["Airplane", "Bus/Metro", "Car Rent", "Cycling Rent", "Gasoline", "Parking", "Taxi", "Toll", "Train"],
  "GIFT": ["Expence", "Income"],
  "SALARY": ["Adesso CH"],
  "MAINTENANCE": ["Car", "Car Assurance", "House"],
  "HOUSING": ["Airbnb", "Hostel", "Hotel", "MyHome"],
  "HEALTH": ["Cassa malati", "Medicine", "Prestazioni Mediche"],
  "SUBSCRIPTION": ["Amazon Prime", "ChatGPT", "Disney+", "Geforce Now", "GoDaddy", "GoogleOne", "Netflix", "NordVPN", "Photo Editor", "Tinder", "Youtube Premium"],
  "INTEREST": ["Bank"],
  "WELLNESS": ["Gym", "Haircut/Barber", "Laundry", "Personal Care", "Protein", "Spa/Thermes"],
  "TAXES": ["Deduction", "Document", "Fine", "Liability/household insurance", "TV license fee", "Vehicle tax", "Waste tax"],
  "STUDY": ["ArtEmpact", "Book", "Google Cloud"],
  "ENTERTAINMENT": ["Cinema", "Coffee/Ice-cream", "Disco", "Drink", "Event", "Museum", "Park"],
  "RESTAURANT": ["Breakfast", "Brunch", "Dinner", "Lunch"],
  "SALES": ["Ebay", "Vinted"],
  "TRANSFER": [],
  "SHOPPING": ["Clothes", "E-cigarette", "Electronics", "Other", "Supermarket"]
};
