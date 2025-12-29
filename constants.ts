
import { Role, OrderStatus, UserProfile, ItemType, InvestmentPlan, Wallet, PaymentRequest, SystemLog, IncomeSettings } from './types';

export const INVESTMENT_PLANS: InvestmentPlan[] = [
  { id: 'inv1', name: 'Starter', amount: 5000, dailyRoiPercent: 0.5, capMultiplier: 2.3 },
  { id: 'inv2', name: 'Basic', amount: 10000, dailyRoiPercent: 0.75, capMultiplier: 2.3 },
  { id: 'inv3', name: 'Standard', amount: 20000, dailyRoiPercent: 1.4, capMultiplier: 2.3 },
];

const DEFAULT_WALLET = { 
  mainBalance: 0, stitchingWallet: 0, workWallet: 0, withdrawalWallet: 0, pendingWithdrawal: 0, 
  performanceWallet: 0, uplineIncome: 0, downlineIncome: 0, investmentWallet: 0, 
  roiIncome: 0, transactions: [] 
};

// Users with Passwords
export const MOCK_USERS: UserProfile[] = [
  // Admin (Root)
  { id: 'admin1', name: 'Super Admin', role: Role.ADMIN, mobile: '9999999999', email: 'admin@lords.com', address: 'HQ', referralCode: 'ADMIN', password: 'admin123', tPassword: '1234', isActive: true, wallet: { ...DEFAULT_WALLET, mainBalance: 0 } },
  
  // Showroom (Referred by Admin)
  { id: 'sr1', name: 'Showroom Andheri', role: Role.SHOWROOM, mobile: '8888888888', email: 'andheri@lords.com', address: 'Andheri West', referralCode: 'SR01', referredBy: 'admin1', password: 'shop123', tPassword: '1234', isActive: true, wallet: { ...DEFAULT_WALLET } },
  
  // Material Manager (Referred by Admin)
  { id: 'mat1', name: 'Material Manager', role: Role.MATERIAL, mobile: '7777777799', email: 'material@lords.com', address: 'Warehouse', referralCode: 'MAT01', referredBy: 'admin1', password: 'mat123', tPassword: '1234', isActive: true, wallet: DEFAULT_WALLET },

  // Measurement (Referred by Showroom)
  { id: 'meas1', name: 'Rahul Measurement', role: Role.MEASUREMENT, mobile: '7777777771', email: 'rahul@lords.com', address: 'Mumbai', referralCode: 'ME01', referredBy: 'sr1', password: 'meas123', tPassword: '1234', isActive: true, wallet: DEFAULT_WALLET },
  { id: 'meas2', name: 'Vikram Measurement', role: Role.MEASUREMENT, mobile: '7777777772', email: 'vikram@lords.com', address: 'Pune', referralCode: 'ME02', referredBy: 'sr1', password: 'meas123', tPassword: '1234', isActive: true, wallet: DEFAULT_WALLET },

  // Cutting (Referred by Measurement)
  { id: 'cut1', name: 'Suresh Cutter', role: Role.CUTTING, mobile: '7777777773', email: 'suresh@lords.com', address: 'Mumbai', referralCode: 'CU01', referredBy: 'meas1', password: 'cut123', tPassword: '1234', isActive: true, wallet: DEFAULT_WALLET },
  
  // Makers (Referred by Cutting)
  { id: 'shirt1', name: 'Anil Shirt Maker', role: Role.SHIRT_MAKER, mobile: '7777777774', email: 'anil@lords.com', address: 'Workshop 1', referralCode: 'SM01', referredBy: 'cut1', password: 'stitch123', tPassword: '1234', isActive: true, wallet: DEFAULT_WALLET },
  { id: 'pant1', name: 'Sunil Pant Maker', role: Role.PANT_MAKER, mobile: '7777777775', email: 'sunil@lords.com', address: 'Workshop 1', referralCode: 'PM01', referredBy: 'cut1', password: 'stitch123', tPassword: '1234', isActive: true, wallet: DEFAULT_WALLET },
  { id: 'coat1', name: 'Raj Coat Maker', role: Role.COAT_MAKER, mobile: '7777777776', email: 'raj@lords.com', address: 'Workshop 2', referralCode: 'CM01', referredBy: 'cut1', password: 'stitch123', tPassword: '1234', isActive: true, wallet: DEFAULT_WALLET },
  
  // Press (Referred by Maker)
  { id: 'press1', name: 'Mohan Press', role: Role.PRESS, mobile: '7777777777', email: 'mohan@lords.com', address: 'Workshop 2', referralCode: 'PR01', referredBy: 'shirt1', password: 'press123', tPassword: '1234', isActive: true, wallet: DEFAULT_WALLET },
  
  // Delivery (Referred by Press)
  { id: 'del1', name: 'Vikram Delivery', role: Role.DELIVERY, mobile: '7777777778', email: 'vikram@lords.com', address: 'Logistics', referralCode: 'DE01', referredBy: 'press1', password: 'del123', tPassword: '1234', isActive: true, wallet: DEFAULT_WALLET },
];

// Clean System: No Orders initially
export const MOCK_ORDERS_V2 = []; 

// Clean System: No History
const MOCK_HISTORY_DATA = [];

export const MOCK_WALLETS: Wallet[] = [
  { id: 'w1', name: 'Total Income', balance: 0, history: [] },
  { id: 'w2', name: 'Profit Wallet', balance: 0, history: [] },
  { id: 'w3', name: 'Withdrawal Pool', balance: 0, history: [] },
  { id: 'w4', name: 'Pending Withdrawal', balance: 0, history: [] },
  { id: 'w5', name: 'Level Income', balance: 0, history: [] },
  { id: 'w6', name: 'Material Wallet', balance: 0, history: [] },
];

export const MOCK_PAYMENT_REQUESTS: PaymentRequest[] = [];

export const MOCK_LOGS: SystemLog[] = [];

// New Levels: 25%, 20%, 15%, 10%, 5%, 5%, 5%, 5%, 5%, 5%
const LEVEL_PERCENTAGES = [0.25, 0.20, 0.15, 0.10, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05];

export const DEFAULT_INCOME_SETTINGS: IncomeSettings = {
  uplineLevels: LEVEL_PERCENTAGES,
  downlineLevels: LEVEL_PERCENTAGES, 
  productRates: [
    { product: 'Shirt Stitching', rate: 120 }, // UPDATED
    { product: 'Pant Stitching', rate: 220 },  // UPDATED
    { product: 'Coat Stitching', rate: 1200 },
    { product: 'Shirt Cutting', rate: 25 },
    { product: 'Pant Cutting', rate: 25 },
    { product: 'Shirt Measurement', rate: 20 },
    { product: 'Pant Measurement', rate: 30 },
    { product: 'Shirt Finishing', rate: 20 }, 
    { product: 'Pant Finishing', rate: 10 },
    { product: 'Delivery', rate: 10 },
  ],
  roleCommissions: [
    { role: Role.SHOWROOM, percentage: 5 }, // 5% Commission
    { role: Role.MATERIAL, percentage: 9 }, // 9% Allocation
    { role: Role.MEASUREMENT, percentage: 0 }, 
    { role: Role.CUTTING, percentage: 0 },
  ]
};
