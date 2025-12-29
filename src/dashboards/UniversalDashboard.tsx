
import React, { useState } from 'react';
import { 
  Menu, X, Wallet, History, Users, LogOut, CheckCircle, 
  Scissors, Shirt, Truck, Package, Bell, Inbox, Play, Send, DollarSign, Camera, Copy, Lock, Edit2
} from 'lucide-react';
import { Role, UserProfile, Order, OrderStatus, ItemType, PaymentRequest } from '../types';
import { Modal } from './ui/Modal';
import { SuccessModal } from './ui/SuccessModal';
import { HelpAgent } from './HelpAgent';

interface DashboardProps {
  currentUser: UserProfile;
  orders: Order[];
  users: UserProfile[];
  onLogout: () => void;
  onUpdateOrder: (updatedOrder: Order) => void;
  onRequestPayment: (req: Partial<PaymentRequest>) => void;
  onUpdateUser: (updatedUser: UserProfile) => void; // New Prop
}

export const UniversalDashboard: React.FC<DashboardProps> = ({ 
  currentUser, orders, users, onLogout, onUpdateOrder, onRequestPayment, onUpdateUser 
}) => {
  // --- STATE ---
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [targetHandler, setTargetHandler] = useState<string>('');
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', tPassword: '', selectedWallet: 'workWallet' }); // Default to work wallet for workers
  const [successData, setSuccessData] = useState({ isOpen: false, title: '', message: '', role: '', name: '', sub: '' });
  
  // Profile Form State
  const [profileForm, setProfileForm] = useState(currentUser);
  const [showPassword, setShowPassword] = useState(false);

  // --- LOGIC HELPERS ---
  
  const myInbox = orders.filter(o => 
    o.currentHandlerId === currentUser.id && 
    (o.status.includes('Handover') || o.status.includes('Inbox'))
  );

  const myProgress = orders.filter(o => 
    o.currentHandlerId === currentUser.id && 
    o.status.includes('Progress')
  );

  const myHistory = orders.filter(o => 
    o.history.some(h => h.user === currentUser.name && h.action.includes('Handover')) && 
    o.currentHandlerId !== currentUser.id
  );

  // Calculate Today's Income
  const today = new Date().toISOString().split('T')[0];
  const todaysIncome = currentUser.wallet.transactions
    .filter(t => t.date === today && t.type === 'CREDIT' && t.description.includes('Work Income'))
    .reduce((sum, t) => sum + t.amount, 0);

  // --- NETWORK TREE CALCULATION (10 LEVELS) ---
  const getNetworkTree = () => {
     let levels: { level: number, members: UserProfile[], income: number }[] = [];
     let currentIds = [currentUser.id];
     
     for(let i=1; i<=10; i++) {
        const nextGen = users.filter(u => u.referredBy && currentIds.includes(u.referredBy));
        
        // Calculate income from this specific level
        const levelIncome = currentUser.wallet.transactions
            .filter(t => t.description.includes(`L${i} Downline`))
            .reduce((sum, t) => sum + t.amount, 0);

        if (nextGen.length > 0) {
            levels.push({ level: i, members: nextGen, income: levelIncome });
            currentIds = nextGen.map(u => u.id);
        } else if (levelIncome > 0) {
             levels.push({ level: i, members: [], income: levelIncome });
        } else {
            break; 
        }
     }
     return levels;
  };

  const networkTree = getNetworkTree();
  const totalDownlineCount = networkTree.reduce((sum, l) => sum + l.members.length, 0);

  // --- HANDLERS ---

  const handleAcceptOrder = (order: Order) => {
     onUpdateOrder({
        ...order,
        status: OrderStatus.MAKER_PROGRESS, 
        history: [...order.history, { action: 'Accepted', timestamp: new Date().toISOString(), user: currentUser.name, role: currentUser.role }]
     });
     setSuccessData({
        isOpen: true, title: 'Order Accepted', message: 'You have accepted the order.', role: currentUser.role, name: currentUser.name, sub: 'Moved to In-Progress'
     });
     setActiveModal(null);
  };

  const handleOpenCompleteModal = (order: Order) => {
     setSelectedOrder(order);
     if (currentUser.role === Role.DELIVERY) {
        setActiveModal('DELIVERY_CONFIRM');
     } else {
        setActiveModal('HANDOVER_SELECT');
     }
  };

  const handleHandover = () => {
     if (!selectedOrder || (!targetHandler && currentUser.role !== Role.DELIVERY)) return;
     const targetUser = users.find(u => u.id === targetHandler);
     
     onUpdateOrder({
        ...selectedOrder,
        status: OrderStatus.HANDOVER_TO_STITCHING, 
        currentHandlerId: targetHandler,
        currentHandlerRole: targetUser?.role || Role.SHOWROOM,
        history: [...selectedOrder.history, { action: `Handover to ${targetUser?.name}`, timestamp: new Date().toISOString(), user: currentUser.name, role: currentUser.role }]
     });

     setActiveModal(null);
     setSelectedOrder(null);
     setTargetHandler('');
     setSuccessData({
        isOpen: true, title: 'Successful Handover', message: 'Order handed over successfully.', role: targetUser?.role, name: targetUser?.name, sub: 'Work Completed.'
     });
  };

  const handleDeliveryComplete = () => {
     if (!selectedOrder) return;
     onUpdateOrder({
        ...selectedOrder,
        status: OrderStatus.COMPLETED,
        currentHandlerId: selectedOrder.showroomName, 
        currentHandlerRole: Role.SHOWROOM,
        history: [...selectedOrder.history, { action: 'Delivered to Customer', timestamp: new Date().toISOString(), user: currentUser.name, role: currentUser.role }]
     });
     setActiveModal(null);
     setSuccessData({
        isOpen: true, title: 'Delivery Successful', message: 'Order marked as Delivered.', role: 'Showroom', name: selectedOrder.showroomName, sub: 'Order Completed.'
     });
  };

  const handleWithdrawRequest = () => {
     const amount = Number(withdrawForm.amount);
     
     if (!amount || amount <= 0) {
         alert("Please enter a valid amount.");
         return;
     }
     
     if (withdrawForm.tPassword !== currentUser.tPassword) {
         alert("❌ Invalid Transaction Password!");
         return;
     }

     // @ts-ignore
     const walletBalance = currentUser.wallet[withdrawForm.selectedWallet] || 0;
     if (walletBalance < amount) {
         alert("❌ Insufficient Funds in selected wallet.");
         return;
     }

     onRequestPayment({
         amount: amount,
         type: 'WITHDRAWAL',
         status: 'PENDING',
         mode: 'UPI'
     });
     
     setActiveModal(null);
     setSuccessData({
        isOpen: true, title: 'Withdrawal Sent', message: 'Your withdrawal request has been sent to Admin.', role: 'Admin', name: 'Finance', sub: 'Processing...'
     });
     setWithdrawForm({ ...withdrawForm, amount: '', tPassword: '' });
  };

  const handleSaveProfile = () => {
     onUpdateUser(profileForm);
     setActiveModal(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setProfileForm({ ...profileForm, profileImage: reader.result as string });
          };
          reader.readAsDataURL(file);
      }
  };

  // --- RENDERERS ---
  
  const renderKPICard = (title: string, value: string | number, color: string, onClick: () => void) => (
    <div 
      onClick={onClick} 
      className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-5 rounded-xl cursor-pointer hover:border-gold-500/30 transition-all shadow-[0_5px_15px_rgba(0,0,0,0.5)] transform hover:-translate-y-1 group relative overflow-hidden"
    >
      {/* Glossy Effect */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-gold-500/10 transition-colors"></div>

      <h3 className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-2 z-10 relative">{title}</h3>
      <p className={`text-3xl font-serif font-bold ${color} z-10 relative drop-shadow-md`}>{value}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-gold-500/30">
      
      {/* Sticky Glass Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-gold-900/30 p-4 flex justify-between items-center shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setActiveModal('MENU')} 
             className="text-gold-400 p-2 hover:bg-gold-900/20 rounded-full transition-colors"
           >
             <Menu className="w-6 h-6" />
           </button>
           <div>
             <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 to-gold-600 font-serif font-bold text-xl tracking-wider">LORD'S</h1>
             <p className="text-[10px] text-gray-500 uppercase tracking-widest">{currentUser.role} Panel</p>
           </div>
        </div>
        <div 
            onClick={() => setActiveModal('PROFILE')}
            className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center font-bold text-gold-400 border-2 border-gold-600/30 cursor-pointer hover:border-gold-500 transition-colors shadow-lg overflow-hidden"
        >
            {currentUser.profileImage ? <img src={currentUser.profileImage} className="w-full h-full object-cover" /> : currentUser.name[0]}
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="p-6 max-w-7xl mx-auto pb-24">
        <div className="flex justify-between items-end mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <h2 className="text-2xl font-serif text-white">Hello, <span className="text-gold-400">{currentUser.name.split(' ')[0]}</span></h2>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
           {renderKPICard("Inbox", myInbox.length, "text-red-400", () => setActiveModal('INBOX'))}
           {renderKPICard("Pending", myProgress.length, "text-gold-400", () => setActiveModal('PROGRESS'))}
           {renderKPICard("Completed", myHistory.length, "text-green-400", () => setActiveModal('HISTORY'))}
           {renderKPICard("Work Wallet", `₹${currentUser.wallet.workWallet.toLocaleString()}`, "text-blue-400", () => setActiveModal('WALLET'))}
        </div>

        {/* Action Center - 3D Card Style */}
        {myInbox.length > 0 && (
           <div className="bg-gradient-to-r from-zinc-900 to-black border border-red-900/30 rounded-xl p-5 mb-6 shadow-[0_0_20px_rgba(220,38,38,0.1)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-red-600 to-transparent"></div>
              
              <h3 className="text-red-400 font-bold flex items-center gap-2 mb-2 text-lg">
                <Inbox className="w-5 h-5 animate-bounce"/> New Orders Arrived!
              </h3>
              <p className="text-sm text-gray-400 mb-4">You have <span className="text-white font-bold">{myInbox.length}</span> new orders waiting for acceptance.</p>
              
              <button 
                onClick={() => setActiveModal('INBOX')} 
                className="w-full bg-red-900/20 border border-red-800 text-red-400 py-3 rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-red-900/40 transition-colors"
              >
                View Inbox
              </button>
           </div>
        )}
      </main>

      {/* --- MODALS --- */}

      <Modal isOpen={activeModal === 'MENU'} onClose={() => setActiveModal(null)} title="Menu">
          <div className="grid grid-cols-3 gap-3 mb-6">
             <button onClick={() => setActiveModal('INBOX')} className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-gray-300 flex flex-col items-center gap-2 hover:bg-zinc-800 hover:border-gold-500/30 transition-all"><Inbox className="w-5 h-5 text-gold-500"/> <span className="text-[10px] uppercase font-bold">Inbox</span></button>
             <button onClick={() => setActiveModal('PROGRESS')} className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-gray-300 flex flex-col items-center gap-2 hover:bg-zinc-800 hover:border-gold-500/30 transition-all"><Play className="w-5 h-5 text-gold-500"/> <span className="text-[10px] uppercase font-bold">Tasks</span></button>
             <button onClick={() => setActiveModal('HISTORY')} className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-gray-300 flex flex-col items-center gap-2 hover:bg-zinc-800 hover:border-gold-500/30 transition-all"><CheckCircle className="w-5 h-5 text-gold-500"/> <span className="text-[10px] uppercase font-bold">Done</span></button>
             <button onClick={() => setActiveModal('WALLET')} className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-gray-300 flex flex-col items-center gap-2 hover:bg-zinc-800 hover:border-gold-500/30 transition-all"><Wallet className="w-5 h-5 text-gold-500"/> <span className="text-[10px] uppercase font-bold">Wallet</span></button>
             <button onClick={() => setActiveModal('TEAM')} className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-gray-300 flex flex-col items-center gap-2 hover:bg-zinc-800 hover:border-gold-500/30 transition-all"><Users className="w-5 h-5 text-gold-500"/> <span className="text-[10px] uppercase font-bold">Team</span></button>
             <button onClick={() => setActiveModal('PROFILE')} className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-gray-300 flex flex-col items-center gap-2 hover:bg-zinc-800 hover:border-gold-500/30 transition-all"><Edit2 className="w-5 h-5 text-gold-500"/> <span className="text-[10px] uppercase font-bold">Profile</span></button>
          </div>
          <button onClick={onLogout} className="w-full p-3 text-red-400 bg-red-900/10 border border-red-900/20 rounded-xl flex justify-center hover:bg-red-900/20 transition-all font-bold text-sm uppercase"><LogOut className="mr-2 w-5 h-5"/> Logout</button>
      </Modal>

      <Modal isOpen={activeModal === 'INBOX'} onClose={() => setActiveModal(null)} title={`Inbox (${myInbox.length})`}>
          <div className="space-y-4">
             {myInbox.map(order => (
                <div key={order.id} className="bg-zinc-900/50 p-5 rounded-xl border border-zinc-800 shadow-md">
                   <div className="flex justify-between mb-3">
                      <span className="text-gold-400 font-bold text-lg">{order.billNumber}</span>
                      <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded text-gray-400 uppercase tracking-wide">{order.status}</span>
                   </div>
                   <p className="text-sm text-white mb-1 font-serif">{order.customerName}</p>
                   <p className="text-xs text-gray-500 mb-4 font-mono">{order.items[0].type} | Qty: {order.items[0].quantity}</p>
                   <p className="text-xs text-gold-600 mb-4 italic">Booked By: {order.bookingUserName}</p>
                   <button onClick={() => handleAcceptOrder(order)} className="w-full bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white py-3 rounded-lg font-bold shadow-lg transform active:scale-95 transition-all">Accept Order</button>
                </div>
             ))}
             {myInbox.length === 0 && <p className="text-gray-500 text-center py-8 italic">Inbox Empty.</p>}
          </div>
      </Modal>

      <Modal isOpen={activeModal === 'PROGRESS'} onClose={() => setActiveModal(null)} title={`Pending Tasks (${myProgress.length})`}>
          <div className="space-y-4">
             {myProgress.map(order => (
                <div key={order.id} className="bg-zinc-900/50 p-5 rounded-xl border border-zinc-800 shadow-md">
                   <div className="flex justify-between mb-3">
                      <span className="text-white font-bold text-lg">{order.billNumber}</span>
                      <span className="text-[10px] text-gold-500 italic bg-gold-900/20 px-2 py-1 rounded">In Progress</span>
                   </div>
                   <div className="bg-black/40 p-3 rounded-lg text-xs text-gray-300 mb-4 border border-zinc-800">
                      <p className="font-bold mb-1 text-gold-600">Measurements:</p>
                      <p className="font-mono">{order.items[0].measurements}</p>
                   </div>
                   <button onClick={() => handleOpenCompleteModal(order)} className="w-full bg-gradient-to-r from-gold-600 to-gold-500 text-black font-bold py-3 rounded-lg shadow-lg hover:shadow-gold-500/20 transform active:scale-95 transition-all">Complete & Handover</button>
                </div>
             ))}
             {myProgress.length === 0 && <p className="text-gray-500 text-center py-8 italic">No active tasks.</p>}
          </div>
      </Modal>

      <Modal isOpen={activeModal === 'HANDOVER_SELECT'} onClose={() => setActiveModal(null)} title="Select Next Master">
          {selectedOrder && (
            <div className="space-y-3">
               <p className="text-sm text-gray-400 mb-4">Who are you handing this work to?</p>
               {users
                 .filter(u => u.role !== Role.ADMIN) 
                 .map(user => (
                    <button 
                       key={user.id} 
                       onClick={() => setTargetHandler(user.id)}
                       className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center ${targetHandler === user.id ? 'bg-gold-900/30 border-gold-500 text-white shadow-[0_0_15px_rgba(212,160,0,0.2)]' : 'bg-black border-zinc-800 text-gray-400 hover:bg-zinc-900'}`}
                    >
                       <div>
                           <span className="block font-bold">{user.name}</span>
                           <span className="text-xs opacity-60">{user.role}</span>
                       </div>
                       {targetHandler === user.id && <CheckCircle className="w-5 h-5 text-gold-500" />}
                    </button>
                 ))
               }
               <button 
                onClick={handleHandover} 
                disabled={!targetHandler} 
                className="w-full bg-gold-600 text-black font-bold py-3 rounded-xl mt-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
               >
                Confirm Handover
               </button>
            </div>
          )}
      </Modal>

      {/* --- WITHDRAWAL & WALLET MODAL --- */}
      <Modal isOpen={activeModal === 'WALLET'} onClose={() => setActiveModal(null)} title="My Complete Wallet">
         <div className="space-y-1">
            
            {/* TODAY'S WORK INCOME DISPLAY */}
            <div className="bg-gradient-to-r from-gold-600 to-gold-400 p-5 rounded-xl mb-4 shadow-[0_5px_20px_rgba(212,160,0,0.3)] text-black">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-sm uppercase tracking-wide text-black/70">Today's Income</h3>
                        <p className="text-black/50 text-xs mt-1 font-mono">{new Date().toDateString()}</p>
                    </div>
                    <p className="font-serif font-bold text-3xl">₹ {todaysIncome.toLocaleString()}</p>
                </div>
            </div>

            {[
              { id: 'workWallet', name: 'Total Work Income', balance: currentUser.wallet.workWallet },
              { id: 'uplineIncome', name: 'Upline Income', balance: currentUser.wallet.uplineIncome },
              { id: 'downlineIncome', name: 'Downline Income', balance: currentUser.wallet.downlineIncome },
              { id: 'mainBalance', name: 'Main Earnings', balance: currentUser.wallet.mainBalance },
            ].map((wallet, idx) => (
              <div key={idx} className="bg-zinc-900 p-4 rounded-xl mb-3 flex justify-between items-center border border-zinc-800 act
