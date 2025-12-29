
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Wallet, Settings, Users, FileText, CheckCircle, 
  TrendingUp, ArrowUpRight, ShieldAlert, Menu, Bell, LogOut, Search, X,
  PieChart, Activity, DollarSign, Layers, Scissors, AlertCircle, Banknote
} from 'lucide-react';
import { Order, OrderStatus, Wallet as WalletType, PaymentRequest, SystemLog, IncomeSettings, Role, UserProfile, ItemType } from '../types';
import { MOCK_WALLETS, MOCK_LOGS, DEFAULT_INCOME_SETTINGS } from '../constants';
import { Modal } from './ui/Modal';
import { SuccessModal } from './ui/SuccessModal';
import { HelpAgent } from './HelpAgent';

interface AdminDashboardProps {
  currentUser: UserProfile;
  orders: Order[];
  users: UserProfile[];
  onLogout: () => void;
  onUpdateOrder: (order: Order) => void;
  globalPaymentRequests?: PaymentRequest[];
  onUpdatePayments?: (reqs: PaymentRequest[]) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  currentUser, orders, users, onLogout, onUpdateOrder, globalPaymentRequests, onUpdatePayments 
}) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [wallets, setWallets] = useState<WalletType[]>(MOCK_WALLETS);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>(globalPaymentRequests || []);
  const [incomeSettings, setIncomeSettings] = useState<IncomeSettings>(DEFAULT_INCOME_SETTINGS);
  const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null);
  const [successData, setSuccessData] = useState({ isOpen: false, title: '', message: '' });

  useEffect(() => {
     if(globalPaymentRequests) setPaymentRequests(globalPaymentRequests);
  }, [globalPaymentRequests]);

  // --- FINANCIAL CALCULATION ENGINE ---
  const calculateFinancials = () => {
    let totalRevenue = 0;
    let totalLaborCost = 0;

    orders.forEach(order => {
        if (order.status !== OrderStatus.CANCELLED) {
            totalRevenue += order.totalAmount;
        }

        order.items.forEach(item => {
            const qty = item.quantity;
            let itemCost = 0;

            // Measurement Cost
            if (item.type === ItemType.SHIRT) itemCost += 20;
            else if (item.type === ItemType.PANT) itemCost += 30;
            else itemCost += 30;

            // Cutting Cost
            itemCost += 25;

            // Stitching Cost (WORKER PAYOUT)
            // UPDATED RATES
            if (item.type === ItemType.SHIRT) itemCost += 120; // 120 for Shirt
            else if (item.type === ItemType.PANT) itemCost += 220; // 220 for Pant
            else itemCost += 400;

            // Finishing Cost
            if (item.type === ItemType.SHIRT) itemCost += 20; // 10 Kaj + 10 Press
            else if (item.type === ItemType.PANT) itemCost += 10; // 10 Press
            else itemCost += 10;

            // Delivery Cost
            itemCost += 10;

            // Showroom Commission (5% of total amount proportional to item)
            // Simplified: Add 5% of rate
            itemCost += (item.rate * 0.05);

            // Material Allocation (9%)
            itemCost += (item.rate * 0.09);

            // Add to total
            totalLaborCost += (itemCost * qty);
        });
    });

    return {
        revenue: totalRevenue,
        labor: totalLaborCost,
        profit: totalRevenue - totalLaborCost
    };
  };

  const financials = calculateFinancials();
  const pendingRequestsCount = paymentRequests.filter(p => p.status === 'PENDING').length;

  // --- DEPARTMENT STATS ENGINE ---
  const getDepartmentStats = (role: Role) => {
      const staff = users.filter(u => u.role === role);
      const activeCount = staff.length;
      const pendingTasks = orders.filter(o => o.currentHandlerRole === role && !o.status.includes('Completed')).length;
      const totalPayoutPending = staff.reduce((sum, u) => sum + u.wallet.stitchingWallet, 0);
      
      return { activeCount, pendingTasks, totalPayoutPending };
  };

  const departmentList = [
      { id: 'dept1', name: 'Showrooms', role: Role.SHOWROOM, icon: Users },
      { id: 'dept2', name: 'Measurement', role: Role.MEASUREMENT, icon: Activity },
      { id: 'dept3', name: 'Cutting', role: Role.CUTTING, icon: Scissors },
      { id: 'dept4', name: 'Stitching (Makers)', role: Role.SHIRT_MAKER, icon: Layers },
      { id: 'dept5', name: 'Finishing', role: Role.PRESS, icon: CheckCircle },
      { id: 'dept6', name: 'Delivery', role: Role.DELIVERY, icon: TrendingUp },
  ];

  // --- HANDLERS ---
  const handlePaymentAction = (id: string, action: 'APPROVED' | 'REJECTED') => {
    const updatedReqs = paymentRequests.map(p => p.id === id ? { ...p, status: action } : p);
    setPaymentRequests(updatedReqs);
    if(onUpdatePayments) onUpdatePayments(updatedReqs);

    if (action === 'APPROVED') {
       const req = paymentRequests.find(p => p.id === id);
       const msg = req?.type === 'DEPOSIT' 
         ? `Funds added to ${req.userName}'s Stitching Wallet.` 
         : `Withdrawal Approved for ${req?.userName}.`;
       
       setSuccessData({ isOpen: true, title: 'Request Approved', message: msg });
    }
  };

  const handleCancelOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      onUpdateOrder({ ...order, status: OrderStatus.CANCELLED, cancelReason: 'Cancelled by Admin' });
      alert("Order Cancelled Successfully");
      setActiveModal(null);
    }
  };

  // --- RENDERERS ---
  const renderFinancialCard = (title: string, value: number, subtext: string, colorClass: string, icon: any) => (
      <div className="bg-black border border-gold-900/30 p-5 rounded-lg flex items-center justify-between shadow-lg relative overflow-hidden group">
          <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}>
              {icon}
          </div>
          <div>
              <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-1">{title}</p>
              <h3 className={`text-3xl font-serif font-bold ${colorClass}`}>₹ {value.toLocaleString()}</h3>
              <p className="text-[10px] text-gray-500 mt-2">{subtext}</p>
          </div>
      </div>
  );

  const renderWalletCard = (wallet: WalletType) => (
    <div 
      onClick={() => { setSelectedWallet(wallet); setActiveModal('WALLET_DETAIL'); }}
      className="bg-black border border-gold-800/20 p-4 rounded hover:border-gold-500 cursor-pointer flex flex-col justify-between h-32 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
        <Wallet className="w-16 h-16 text-gold-500" />
      </div>
      <h3 className="text-gold-600 text-xs uppercase tracking-widest font-bold z-10">{wallet.name}</h3>
      <p className="text-xl text-gold-100 font-mono z-10">₹ {wallet.balance.toLocaleString()}</p>
      <div className="text-[10px] text-gray-500 flex items-center z-10 mt-auto group-hover:text-gold-400 transition-colors">
        View History <ArrowUpRight className="w-3 h-3 ml-1" />
      </div>
    </div>
  );

  const MenuGridItem = ({ icon: Icon, label, sub, onClick, alertCount }: { icon: any, label: string, sub: string, onClick: () => void, alertCount?: number }) => (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 bg-zinc-900 border border-zinc-800 hover:border-gold-500/50 hover:bg-zinc-800 rounded-lg transition-all relative group h-32 w-full text-center"
    >
      {alertCount && alertCount > 0 ? (
        <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">{alertCount}</span>
      ) : null}
      <Icon className="w-8 h-8 text-gold-500 mb-2 group-hover:scale-110 transition-transform" />
      <span className="text-sm font-bold text-gray-200">{label}</span>
      <span className="text-[10px] text-gray-500 mt-1">{sub}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Header */}
      <header className="bg-zinc-950 p-4 border-b border-gold-900/30 flex justify-between items-center sticky top-0 z-30">
         <div className="flex items-center gap-3">
            <button onClick={() => setActiveModal('MENU')} className="text-gold-400 p-2 hover:bg-gold-900/20 rounded-full transition-colors"><Menu /></button>
            <div>
                <h1 className="text-gold-500 font-serif font-bold text-lg tracking-wider">LORD'S SYSTEM</h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em]">Administrator</p>
            </div>
         </div>
         <div className="flex items-center gap-4">
            {pendingRequestsCount > 0 && (
                <button onClick={() => setActiveModal('APPROVALS')} className="flex items-center gap-2 bg-red-900/20 border border-red-900 px-3 py-1 rounded-full animate-pulse">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-xs text-red-400 font-bold">{pendingRequestsCount} Pending Requests</span>
                </button>
            )}
            <div className="w-8 h-8 rounded-full bg-gold-900 flex items-center justify-center font-bold text-gold-300 border border-gold-600">A</div>
         </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto pb-20">
        
        {/* 1. FINANCIAL REPORTING (KPIs) - Kept on Dashboard for immediate insight */}
        <section className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-white font-serif text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gold-500"/> Financial Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {renderFinancialCard(
                    "Total Revenue", 
                    financials.revenue, 
                    "Gross Order Value", 
                    "text-white", 
                    <DollarSign className="w-20 h-20" />
                )}
                {renderFinancialCard(
                    "Total Labor Cost", 
                    financials.labor, 
                    "Rates + Commissions", 
                    "text-red-400", 
                    <Users className="w-20 h-20" />
                )}
                {renderFinancialCard(
                    "Net System Profit", 
                    financials.profit, 
                    "Revenue - Labor Costs", 
                    "text-green-500", 
                    <PieChart className="w-20 h-20" />
                )}
            </div>
        </section>

        {/* Dashboard Hint */}
        <div className="text-center py-12 opacity-50">
            <p className="text-gold-600 font-serif text-sm">Tap the Menu icon (top left) to access detailed reports and controls.</p>
        </div>

      </main>

      {/* --- MENU MODAL (MAIN NAVIGATION HUB) --- */}
      <Modal isOpen={activeModal === 'MENU'} onClose={() => setActiveModal(null)} title="Admin Menu">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
             <MenuGridItem 
                icon={Activity} 
                label="System Oversight" 
                sub="Dept. Reports & Staff" 
                onClick={() => { setActiveModal('OVERSIGHT'); }} 
             />
             <MenuGridItem 
                icon={Wallet} 
                label="Master Wallets" 
                sub="Admin Funds & Profit" 
                onClick={() => { setActiveModal('WALLETS_GRID'); }} 
             />
             <MenuGridItem 
                icon={Banknote} 
                label="Payment Approvals" 
                sub="Withdrawals & Deposits" 
                onClick={() => { setActiveModal('APPROVALS'); }}
                alertCount={pendingRequestsCount} 
             />
             <MenuGridItem 
                icon={FileText} 
                label="Order Manager" 
                sub="Track & Cancel Orders" 
                onClick={() => { setActiveModal('ORDERS'); }} 
             />
             <MenuGridItem 
                icon={Settings} 
                label="Settings" 
                sub="Commissions & Rates" 
                onClick={() => { setActiveModal('SETTINGS'); }} 
             />
             <MenuGridItem 
                icon={Users} 
                label="User Manager" 
                sub="Staff & Access" 
                onClick={() => { setActiveModal('USERS'); }} 
             />
             <MenuGridItem 
                icon={ShieldAlert} 
                label="Profile" 
                sub="Security" 
                onClick={() => { setActiveModal('PROFILE'); }} 
             />
          </div>
          <button onClick={onLogout} className="w-full flex items-center justify-center p-4 text-red-400 bg-red-900/10 rounded-lg hover:bg-red-900/20 border border-red-900/30 transition-all font-bold">
             <LogOut className="mr-2 w-5 h-5"/> Secure Logout
          </button>
      </Modal>

      {/* --- NEW: OVERSIGHT MODAL --- */}
      <Modal isOpen={activeModal === 'OVERSIGHT'} onClose={() => setActiveModal('MENU')} title="System Oversight Report">
        <div className="bg-zinc-900/30 border border-gold-900/30 rounded-lg overflow-hidden">
            <div className="grid grid-cols-5 bg-black p-3 border-b border-gold-900/30 text-xs text-gray-400 uppercase tracking-wider font-bold">
                <div className="col-span-2">Department</div>
                <div className="text-center">Active Staff</div>
                <div className="text-center">Live Orders</div>
                <div className="text-right">Wallet Liability</div>
            </div>
            {departmentList.map((dept) => {
                const stats = getDepartmentStats(dept.role);
                return (
                    <div key={dept.id} className="grid grid-cols-5 p-4 border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors items-center">
                        <div className="col-span-2 flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-gold-500">
                                <dept.icon className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">{dept.name}</p>
                                <p className="text-[10px] text-gray-500">Role: {dept.role}</p>
                            </div>
                        </div>
                        <div className="text-center text-sm text-gray-300">{stats.activeCount}</div>
                        <div className="text-center">
                            <span className={`text-xs px-2 py-1 rounded font-bold ${stats.pendingTasks > 0 ? 'bg-gold-900/30 text-gold-400' : 'bg-zinc-800 text-gray-500'}`}>
                                {stats.pendingTasks} Pending
                            </span>
                        </div>
                        <div className="text-right font-mono text-sm text-gray-300">
                            ₹ {stats.totalPayoutPending.toLocaleString()}
                        </div>
                    </div>
                );
            })}
        </div>
      </Modal>

      {/* --- NEW: WALLETS GRID MODAL --- */}
      <Modal isOpen={activeModal === 'WALLETS_GRID'} onClose={() => setActiveModal('MENU')} title="Admin Master Wallets">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {wallets.map(w => <React.Fragment key={w.id}>{renderWalletCard(w)}</React.Fragment>)}
        </div>
      </Modal>

      {/* --- NEW: APPROVALS MODAL --- */}
      <Modal isOpen={activeModal === 'APPROVALS'} onClose={() => setActiveModal('MENU')} title={`Payment Approvals (${pendingRequestsCount})`}>
          <div className="space-y-3">
             {paymentRequests.map(req => (
                <div key={req.id} className="bg-black p-4 rounded border border-zinc-800 flex justify-between items-center">
                   <div>
                      <div className="flex items-center gap-2 mb-1">
                         <p className="text-sm text-white font-bold">{req.userName}</p>
                         <span className={`text-[9px] px-1.5 rounded ${req.type === 'DEPOSIT' ? 'bg-green-900/40 text-green-400 border border-green-800' : 'bg-red-900/40 text-red-400 border border-red-800'}`}>
                            {req.type}
                         </span>
                      </div>
                      <p className="text-xs text-gray-500">{req.userRole} | {req.utr ? `UTR: ${req.utr}` : req.mode}</p>
                      <p className="text-[10px] text-gray-600 mt-1">{req.date}</p>
                   </div>
                   <div className="text-right">
                      <p className={`text-lg font-bold ${req.type === 'DEPOSIT' ? 'text-green-400' : 'text-red-400'}`}>
                         {req.type === 'DEPOSIT' ? '+' : '-'} ₹ {req.amount}
                      </p>
                      {req.status === 'PENDING' ? (
                         <div className="flex gap-2 mt-2">
                            <button onClick={() => handlePaymentAction(req.id, 'APPROVED')} className="px-3 py-1 bg-green-900/30 text-green-500 text-xs rounded hover:bg-green-900/50 border border-green-900/50">Approve</button>
                            <button onClick={() => handlePaymentAction(req.id, 'REJECTED')} className="px-3 py-1 bg-red-900/30 text-red-500 text-xs rounded hover:bg-red-900/50 border border-red-900/50">Reject</button>
                         </div>
                      ) : <span className={`text-xs font-bold mt-1 block ${req.status === 'APPROVED' ? 'text-green-600' : 'text-red-600'}`}>{req.status}</span>}
                   </div>
                </div>
             ))}
             {paymentRequests.length === 0 && <p className="text-gray-500 text-center py-8">No requests found.</p>}
          </div>
      </Modal>

      {/* --- OTHER MODALS (Preserved) --- */}
      <Modal isOpen={activeModal === 'ORDERS'} onClose={() => setActiveModal('MENU')} title="All Orders (Master List)">
          <div className="space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar">
             {orders.map(o => (
                <div key={o.id} className="bg-zinc-900 p-3 rounded border border-zinc-800 flex justify-between items-center">
                   <div>
                      <p className="text-white text-sm font-bold">{o.billNumber} | {o.customerName}</p>
                      <p className="text-[10px] text-gray-500">{o.status} | {o.currentHandlerRole}</p>
                   </div>
                   {o.status !== OrderStatus.CANCELLED && (
                      <button onClick={() => handleCancelOrder(o.id)} className="text-[10px] bg-red-900/20 text-red-500 px-2 py-1 rounded border border-red-900/30 hover:bg-red-900/40">Cancel Order</button>
                   )}
                </div>
             ))}
          </div>
      </Modal>

      <Modal isOpen={activeModal === 'WALLET_DETAIL'} onClose={() => setActiveModal('WALLETS_GRID')} title={selectedWallet?.name ? `${selectedWallet.name} History` : 'Wallet History'}>
         <div className="space-y-4">
            <div className="flex justify-between items-center bg-zinc-900 p-4 rounded border border-gold-900/50">
                <span className="text-gray-400 text-sm">Current Balance</span>
                <span className="text-2xl font-serif text-gold-400">₹ {selectedWallet?.balance.toLocaleString()}</span>
            </div>
            
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Last 30 Days Activity</h4>
            
            <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {selectedWallet?.history && selectedWallet.history.length > 0 ? (
                    selectedWallet.history.map((tx) => (
                        <div key={tx.id} className="flex justify-between items-center bg-black p-3 rounded border border-zinc-800 hover:border-gold-900/20 transition-colors">
                           <div>
                              <p className="text-sm text-white font-bold">{tx.description}</p>
                              <p className="text-[10px] text-gray-500">{tx.date}</p>
                           </div>
                           <div className={`text-sm font-bold font-mono ${tx.type === 'CREDIT' ? 'text-green-500' : 'text-red-500'}`}>
                              {tx.type === 'CREDIT' ? '+' : '-'} ₹ {tx.amount.toLocaleString()}
                           </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-500 bg-zinc-900/20 rounded border border-dashed border-zinc-800">
                        <p>No transactions found for this period.</p>
                    </div>
                )}
            </div>
         </div>
      </Modal>

      <Modal isOpen={activeModal === 'SETTINGS'} onClose={() => setActiveModal('MENU')} title="Commission & Rates">
          <div className="space-y-4">
             <div>
                <h4 className="text-gold-500 text-xs font-bold mb-2 uppercase">Role Commissions (%)</h4>
                <div className="grid grid-cols-2 gap-2">
                   {incomeSettings.roleCommissions.map((rc, idx) => (
                      <div key={idx} className="flex justify-between bg-zinc-900 p-2 rounded border border-zinc-800">
                         <span className="text-xs text-gray-300">{rc.role}</span>
                         <span className="text-xs text-gold-400 font-bold">{rc.percentage}%</span>
                      </div>
                   ))}
                </div>
             </div>
             <div>
                <h4 className="text-gold-500 text-xs font-bold mb-2 uppercase">Labor Rates (Cost per Piece)</h4>
                {incomeSettings.productRates.map((pr, idx) => (
                   <div key={idx} className="flex justify-between bg-zinc-900 p-2 rounded border border-zinc-800 mb-1">
                      <span className="text-xs text-gray-300">{pr.product}</span>
                      <span className="text-xs text-gold-400 font-bold">₹ {pr.rate}</span>
                   </div>
                ))}
             </div>
          </div>
      </Modal>

      <Modal isOpen={activeModal === 'USERS'} onClose={() => setActiveModal('MENU')} title="User Manager">
          <div className="space-y-2 max-h-[70vh] overflow-y-auto custom-scrollbar">
             {users.map(u => (
                <div key={u.id} className="bg-zinc-900 p-3 rounded border border-zinc-800 flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-black border border-zinc-700 flex items-center justify-center text-xs text-gray-400">
                          {u.name[0]}
                      </div>
                      <div>
                          <p className="text-white text-sm font-bold">{u.name}</p>
                          <p className="text-[10px] text-gray-500">{u.role} | {u.mobile}</p>
                      </div>
                   </div>
                   <div className="text-right">
                       <p className="text-xs text-gold-500 font-bold">Wallet: ₹ {u.wallet.stitchingWallet}</p>
                       <span className={`text-[9px] px-1.5 rounded ${u.isActive ? 'bg-green-900/30 text-green-500' : 'bg-red-900/30 text-red-500'}`}>
                           {u.isActive ? 'Active' : 'Inactive'}
                       </span>
                   </div>
                </div>
             ))}
          </div>
      </Modal>

      <Modal isOpen={activeModal === 'PROFILE'} onClose={() => setActiveModal('MENU')} title="Admin Profile">
          <div className="space-y-4 text-center">
              <div className="w-20 h-20 rounded-full bg-gold-600 mx-auto flex items-center justify-center text-black font-bold text-2xl border-4 border-black ring-2 ring-gold-600">A</div>
              <h3 className="text-xl text-white font-serif">{currentUser.name}</h3>
              <p className="text-sm text-gray-500">System Administrator (Root)</p>
              
              <div className="bg-zinc-900 p-4 rounded text-left space-y-2 mt-4">
                  <p className="text-xs text-gray-400 uppercase">Email</p>
                  <p className="text-white text-sm">{currentUser.email}</p>
                  <p className="text-xs text-gray-400 uppercase mt-2">Access Level</p>
                  <p className="text-gold-500 text-sm font-bold">Full System Control</p>
              </div>
          </div>
      </Modal>

      <SuccessModal 
        isOpen={successData.isOpen}
        onClose={() => setSuccessData({...successData, isOpen: false})}
        title={successData.title}
        message={successData.message}
      />

      <HelpAgent userRole="Administrator" userName={currentUser.name} />

    </div>
  );
};
