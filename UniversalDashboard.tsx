
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
              <div key={idx} className="bg-zinc-900 p-4 rounded-xl mb-3 flex justify-between items-center border border-zinc-800 active:scale-95 transition-transform cursor-pointer hover:border-gold-500/20">
                <div>
                  <h3 className="text-white font-bold text-sm">{wallet.name}</h3>
                  <p className="text-gray-500 text-xs mt-1">Available Balance</p>
                </div>
                <p className="text-gold-400 font-bold text-lg font-mono">₹ {wallet.balance.toLocaleString()}</p>
              </div>
            ))}
            
            <div className="mt-6 pt-6 border-t border-zinc-800">
               <h4 className="text-white text-sm mb-4 font-bold flex items-center gap-2 uppercase tracking-widest"><Wallet className="w-4 h-4 text-gold-500"/> Withdraw Funds</h4>
               
               <div className="space-y-4">
                   {/* Wallet Selector */}
                   <div className="relative">
                       <select 
                          className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white text-sm appearance-none focus:border-gold-500 outline-none"
                          value={withdrawForm.selectedWallet}
                          onChange={(e) => setWithdrawForm({...withdrawForm, selectedWallet: e.target.value})}
                       >
                           <option value="workWallet">Work Wallet</option>
                           <option value="uplineIncome">Upline Income</option>
                           <option value="downlineIncome">Downline Income</option>
                           <option value="mainBalance">Main Balance</option>
                       </select>
                   </div>

                   <input 
                       type="number" 
                       className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-gold-500 outline-none" 
                       placeholder="Amount (₹)" 
                       value={withdrawForm.amount}
                       onChange={(e) => setWithdrawForm({...withdrawForm, amount: e.target.value})}
                   />
                   
                   <input 
                       type="password" 
                       className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-gold-500 outline-none" 
                       placeholder="Transaction Password" 
                       value={withdrawForm.tPassword}
                       onChange={(e) => setWithdrawForm({...withdrawForm, tPassword: e.target.value})}
                   />

                   <button onClick={handleWithdrawRequest} className="w-full bg-gradient-to-r from-red-900 to-red-800 border border-red-700 text-red-100 py-3 rounded-lg hover:from-red-800 hover:to-red-700 transition-colors font-bold text-sm uppercase tracking-widest shadow-lg">
                       Request Withdrawal
                   </button>
               </div>
            </div>

         </div>
      </Modal>

      {/* --- NETWORK MODAL --- */}
      <Modal isOpen={activeModal === 'TEAM'} onClose={() => setActiveModal(null)} title="My 10-Level Network">
         <div className="space-y-6">
            
            {/* Referral Tools */}
            <div className="bg-gradient-to-r from-zinc-900 to-black p-5 rounded-xl border border-gold-900/30 flex justify-between items-center shadow-lg">
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Referral Code</p>
                    <p className="text-2xl text-gold-400 font-serif font-bold tracking-wider">{currentUser.referralCode}</p>
                </div>
                <div className="flex gap-2">
                    <button className="bg-gold-600 text-black px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-gold-500 transition-colors" onClick={() => navigator.clipboard.writeText(currentUser.referralCode)}>
                        <Copy className="w-3 h-3"/> Code
                    </button>
                    <button className="bg-black border border-gold-600 text-gold-500 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-gold-900 transition-colors" onClick={() => navigator.clipboard.writeText(`https://lords.com/join?ref=${currentUser.referralCode}`)}>
                        <Copy className="w-3 h-3"/> Link
                    </button>
                </div>
            </div>

            <div className="flex justify-between items-end border-b border-zinc-800 pb-2">
                 <h4 className="text-white text-sm font-bold">Total Network</h4>
                 <span className="text-gold-500 text-sm font-bold">{totalDownlineCount} Members</span>
            </div>
               
            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                {networkTree.map((levelData) => (
                    <div key={levelData.level} className="bg-black/50 border border-zinc-800 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                             <span className="text-gold-400 font-bold text-sm">Level {levelData.level}</span>
                             <span className="text-green-500 font-mono text-xs bg-green-900/20 px-2 py-0.5 rounded border border-green-900/50">+ ₹{levelData.income} Earned</span>
                        </div>
                        
                        {levelData.members.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                                {levelData.members.map(m => (
                                    <div key={m.id} className="bg-zinc-900 p-2 rounded flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 text-[10px] flex items-center justify-center text-gray-400 border border-zinc-700 font-bold">
                                            {m.name[0]}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-white text-xs truncate font-bold">{m.name}</p>
                                            <p className="text-[9px] text-gray-500 truncate">{m.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-600 italic">No members in this level yet.</p>
                        )}
                    </div>
                ))}
            </div>
         </div>
      </Modal>

      {/* --- PROFILE MODAL --- */}
      <Modal isOpen={activeModal === 'PROFILE'} onClose={() => setActiveModal(null)} title="Edit Profile">
          <div className="space-y-6">
              <div className="flex justify-center mb-6">
                  <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-gold-500 shadow-[0_0_30px_rgba(212,160,0,0.3)]">
                      {profileForm.profileImage ? (
                          <img src={profileForm.profileImage} className="w-full h-full object-cover" />
                      ) : (
                          <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-gold-600 text-3xl font-bold">{profileForm.name[0]}</div>
                      )}
                      <label className="absolute bottom-0 w-full bg-black/80 text-white text-[10px] text-center py-1 cursor-pointer hover:bg-gold-600 transition-colors">
                          CHANGE PHOTO
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1 block">Name</label>
                      <input className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white text-sm focus:border-gold-500 outline-none" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
                  </div>
                  <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1 block">Mobile</label>
                      <input className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white text-sm focus:border-gold-500 outline-none" value={profileForm.mobile} onChange={e => setProfileForm({...profileForm, mobile: e.target.value})} />
                  </div>
              </div>

              <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1 block">Address</label>
                  <input className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white text-sm focus:border-gold-500 outline-none" value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} />
              </div>
              
              <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1 block">Email</label>
                  <input className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white text-sm focus:border-gold-500 outline-none" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} />
              </div>

              <div className="bg-zinc-900/50 p-4 rounded-xl border border-gold-900/20 mt-4">
                   <h4 className="text-gold-500 text-xs font-bold mb-4 uppercase flex items-center gap-2"><Lock className="w-3 h-3"/> Security Settings</h4>
                   
                   <div className="mb-4">
                       <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1 block">Login Password</label>
                       <div className="relative">
                            <input type={showPassword ? 'text' : 'password'} className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white text-sm focus:border-gold-500 outline-none" value={profileForm.password || ''} onChange={e => setProfileForm({...profileForm, password: e.target.value})} placeholder="Set Login Password" />
                            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-[10px] text-gold-500 uppercase font-bold">{showPassword ? 'Hide' : 'Show'}</button>
                       </div>
                   </div>

                   <div>
                       <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1 block">Transaction Password (T-Pass)</label>
                       <input type="text" className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white text-sm focus:border-gold-500 outline-none" value={profileForm.tPassword || ''} onChange={e => setProfileForm({...profileForm, tPassword: e.target.value})} placeholder="Set Transaction Password" />
                   </div>
              </div>

              <button onClick={handleSaveProfile} className="w-full bg-gold-600 text-black font-bold py-4 rounded-xl mt-2 hover:bg-gold-500 transition-colors shadow-[0_0_20px_rgba(212,160,0,0.3)]">SAVE CHANGES</button>
          </div>
      </Modal>

      <Modal isOpen={activeModal === 'DELIVERY_CONFIRM'} onClose={() => setActiveModal(null)} title="Confirm Delivery">
          <div className="space-y-6 text-center py-4">
             <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto border border-green-500/50">
                 <Truck className="w-8 h-8 text-green-500" />
             </div>
             <p className="text-gray-300 text-lg">Are you sure you want to mark this order as <span className="text-white font-bold">Delivered</span>?</p>
             <button onClick={handleDeliveryComplete} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg transition-colors">Yes, Mark Delivered</button>
          </div>
      </Modal>

      <SuccessModal 
        isOpen={successData.isOpen}
        onClose={() => setSuccessData({...successData, isOpen: false})}
        title={successData.title}
        message={successData.message}
        recipientRole={successData.role}
        recipientName={successData.name}
        subMessage={successData.sub}
      />

      <HelpAgent userRole={currentUser.role} userName={currentUser.name} />

    </div>
  );
};
