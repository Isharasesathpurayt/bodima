export type Language = 'si' | 'en';
export type Theme = 'light' | 'dark';

export type CollectionCategory = 'rent' | 'food' | 'toiletries' | 'utilities' | 'other';

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
  branch?: string;
}

export interface BoardingMember {
  id: string;
  name: string;
  roleDescriptionSi: string; // e.g. "මාසික කුලිය භාරකරු"
  roleDescriptionEn: string; // e.g. "Monthly Rent Collector"
  phone: string; // WhatsApp enabled
  avatar: string;
  isActive: boolean;
  eatsAtBodima?: boolean; // whether this member eats meals at the bodima
  bankDetails?: BankDetails; // collector's bank account info
  isCollectorFor?: CollectionCategory[];
}

export interface PaymentStatus {
  memberId: string;
  amount: number;
  isPaid: boolean;
  paidAt?: string;
  paymentMethod?: 'cash' | 'transfer';
  note?: string;
}

export interface CollectionPool {
  id: string;
  bodimaId?: string;
  titleSi: string;
  titleEn: string;
  category: CollectionCategory;
  collectorId: string; // memberId of person collecting
  targetPerPerson: number;
  totalTarget?: number;
  dueDate: string; // YYYY-MM-DD
  cycle: 'monthly' | 'weekly' | 'one-time';
  descriptionSi?: string;
  descriptionEn?: string;
  participatingMemberIds?: string[]; // IDs of members participating in this specific collection
  collectorBankDetails?: BankDetails; // Bank details for direct transfers
  payments: PaymentStatus[];
  createdAt: string;
  isCompleted: boolean;
}

export interface ExpenseItem {
  id: string;
  bodimaId?: string;
  titleSi: string;
  titleEn: string;
  category: CollectionCategory;
  amount: number;
  paidById: string; // memberId who paid
  date: string;
  receiptUrl?: string; // base64 data url or image url
  receiptName?: string;
  notes?: string;
  collectionPoolId?: string;
  created_at?: string;
}

export interface CatalogItem {
  id: string;
  bodimaId?: string;
  nameSi: string;
  nameEn: string;
  category: string;
  unit: string;
  estimatedPrice: number;
  lastUpdated: string;
}

export interface ShoppingRequest {
  id: string;
  bodimaId?: string;
  catalogItemId?: string;
  nameSi: string;
  nameEn: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  requestedById: string;
  requestedAt: string;
  isPurchased: boolean;
  votes: string[];
  notes?: string;
}
