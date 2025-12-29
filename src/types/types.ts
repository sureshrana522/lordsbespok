
export enum Role {
  ADMIN = 'Admin',
  SHOWROOM = 'Showroom',
  MEASUREMENT = 'Measurement Master',
  CUTTING = 'Cutting Master',
  SHIRT_MAKER = 'Shirt Maker',
  PANT_MAKER = 'Pant Maker',
  COAT_MAKER = 'Coat Maker',
  SAFARI_MAKER = 'Safari Maker',
  KAJ_BUTTON = 'Kaj Button',
  PRESS = 'Press Master',
  DELIVERY = 'Delivery Boy',
  MATERIAL = 'Material Manager',
  MANAGER = 'Manager',
  AGENT = 'Agent',
  CUSTOMER = 'Customer'
}

export enum OrderStatus {
  DRAFT = 'Draft',
  CREATED = 'Order Created', 
  HANDOVER_TO_MEASUREMENT = 'Handover to Measurement',
  
  MEASUREMENT_INBOX = 'Measurement Inbox',
  MEASUREMENT_PROGRESS = 'Measurement In-Progress',
  HANDOVER_TO_CUTTING = 'Handover to Cutting',

  CUTTING_INBOX = 'Cutting Inbox',
  CUTTING_PROGRESS = 'Cutting In-Progress',
  
  HANDOVER_TO_STITCHING = 'Handover to Stitching', // Generic for Makers

  MAKER_INBOX = 'Stitching Inbox',
  MAKER_PROGRESS = 'Stitching In-Progress',
  HANDOVER_TO_FINISHING = 'Handover to Finishing', // Press/Kaj

  FINISHING_INBOX = 'Finishing Inbox',
  FINISHING_PROGRESS = 'Finishing In-Progress',
  HANDOVER_TO_DELIVERY = 'Handover to Delivery',

  DELIVERY_INBOX = 'Delivery Inbox',
  DELIVERY_PROGRESS = 'Out for Delivery',
  
  COMPLETED = 'Order Completed',
  CANCELLED = 'Cancelled',
  RETURNED = 'Returned'
}

export enum ItemType {
  SHIRT = 'Shirt',
  PANT = 'Pant',
  COAT = 'Coat',
  SAFARI = 'Safari',
  KURTA = 'Kurta',
  PAJAMA = 'Pajama'
}

export interface Order {
  id: string;
  billNumber: string;
  customerName: string;
  mobile: string;
  items: { type: ItemType; rate: number; measurements: string; quantity: number; clothLength?: string }[];
  totalAmount: number;
  showroomName: string;
  orderDate: string;
  deliveryDate: string;
  status: OrderStatus;
  
  // Tracking
  bookingUserId: string;   // ID of the user who created/booked the order
  bookingUserName: string; // Name of the user who created/booked the order
  currentHandlerId: string; 
  currentHandlerRole: Role;
  previousHandlerId?: string;
  
  // Financials
  isWithBill?: boolean;
  advanceAmount?: number;
  paymentStatus?: 'Pending' | 'Partial' | 'Paid';
  deductedAmount?: number; // Total amount deducted from wallet so far
  
  // Admin Control
  cancelReason?: string;
  
  history: { 
    action: string; 
    timestamp: string; 
    user: string; 
    role: Role 
  }[];
}

export interface WalletTransaction {
  id: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  description: string;
  date: string;
  reason?: string;
}

export interface UserWallet {
  mainBalance: number;
  stitchingWallet: number; 
  workWallet: number; // Income from direct labor (New)
  withdrawalWallet: number;
  pendingWithdrawal: number;
  performanceWallet: number;
  uplineIncome: number;
  downlineIncome: number;
  investmentWallet: number; 
  roiIncome: number; 
  transactions: WalletTransaction[];
}

export interface UserProfile {
  id: string;
  name: string;
  role: Role;
  mobile: string;
  email: string;
  address: string;
  profileImage?: string;
  password?: string; // Login Password
  tPassword?: string; // Transaction Password
  referralCode: string;
  referredBy?: string; // ID of the referrer
  wallet: UserWallet;
  isActive: boolean;
}

export interface PaymentRequest {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  type: 'DEPOSIT' | 'WITHDRAWAL'; // Added Type
  utr?: string; // Optional for withdrawal
  amount: number;
  mode: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  date: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
}

export interface IncomeSettings {
  uplineLevels: number[];
  downlineLevels: number[];
  productRates: { product: string; rate: number }[];
  roleCommissions: { role: Role; percentage: number }[];
}

export interface Wallet {
  id: string;
  name: string;
  balance: number;
  history: WalletTransaction[];
}

export interface InvestmentPlan {
  id: string;
  name: string;
  amount: number;
  dailyRoiPercent: number;
  capMultiplier: number;
}
