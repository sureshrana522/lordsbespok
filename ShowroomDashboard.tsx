
import React, { useState } from 'react';
import { 
  LayoutDashboard, User, Wallet, FilePlus, History, Search, Users, 
  Banknote, Bell, HelpCircle, LogOut, PlusCircle, CreditCard, ChevronRight, X, Menu, Zap, Edit2, Lock, Copy, Camera, Trash2
} from 'lucide-react';
import { Modal } from './ui/Modal';
import { SuccessModal } from './ui/SuccessModal';
import { UserProfile, Order, OrderStatus, ItemType, PaymentRequest, Role } from '../types';
import { HelpAgent } from './HelpAgent';

interface ShowroomDashboardProps {
  currentUser: UserProfile;
  orders: Order[];
  users: UserProfile[]; // Added users list for selection
  onLogout: () => void;
  onUpdateOrder: (order: Order) => void;
  onRequestPayment: (req: Partial<PaymentRequest>) => void;
  onUpdateUser: (updatedUser: UserProfile) => void; // New Prop
}

// Temporary interface for item entry in the form
interface BillItem {
  id: number;
  type: ItemType;
  quantity: number;
  rate: number;
  clothLength: string;
  measurements: string;
}

export const ShowroomDashboard: React.FC<ShowroomDashboardProps> = ({ 
  currentUser, orders, users, onLogout, onUpdateOrder, onRequestPayment, onUpdateUser 
}) => {
  // --- STATE ---
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Handover State
  const [selectedOrderForHandover, setSelectedOrderForHandover] = useState<Order | null>(null);
  const [selectedMeasurementMaster, setSelectedMeasurementMaster] = useState<string>('');
  
  // Withdrawal State
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', tPassword: '', selectedWallet: 'stitchingWallet' });

  // Profile Form State
  const [profileForm, setProfileForm] = useState(currentUser);
  const [showPassword, setShowPassword] = useState(false);

  // Success Modal State
  const [successData, setSuccessData] = useState<{isOpen: boolean; title: string; message: string; role?: string; name?: string; sub?: string}>({
    isOpen: false, title: '', message: '', role: '', name: '', sub: ''
  });

  // --- NEW ORDER FORM STATE (Multi-Item) ---
  const [customerDetails, setCustomerDetails] = useState({
    name: '', mobile: '', address: '', withBill: true
  });
  
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  
  // State for the specific item currently being added
  const [currentItem, setCurrentItem] = useState({
    type: ItemType.SHIRT,
    quantity: 1,
    rate: 375, // Default for Shirt
    clothLength: '',
    measurements: ''
  });

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState({ amount: '', utr: '', mode: 'UPI' });

  // --- NETWORK DATA & 10-LEVEL CALCULATION ---
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

  // --- KPI DATA ---
  const myOrders = orders.filter(o => o.showroomName === currentUser.name);
  const pendingOrders = myOrders.filter(o => !o.status.includes('Completed') && !o.status.includes('Cancelled'));
  const completedOrders = myOrders.filter(o => o.status === OrderStatus.COMPLETED);
  const todayOrders = myOrders.filter(o => o.orderDate === new Date().toISOString().split('T')[0]);
  
  // --- HANDLERS ---
  
  const handleCustomerSearch = () => {
     const existingOrder = orders.find(o => o.mobile === customerDetails.mobile);
     if (existingOrder) {
        setCustomerDetails(prev => ({
           ...prev,
           name: existingOrder.customerName,
           address: 'Mumbai (Auto-filled)', 
        }));
        alert("Customer Found! Loaded previous details.");
     } else {
        alert("New Customer.");
     }
  };

  const handleFillDemoData = () => {
    setCustomerDetails({
      name: 'Rajesh Kumar (Demo)',
      mobile: '9876543210',
      address: '101, Bandra West, Mumbai',
      withBill: true,
    });
    // Add dummy items with correct fixed rates
    setBillItems([
        { id: 1, type: ItemType.SHIRT, quantity: 2, rate: 375, clothLength: '3.2 Mtr', measurements: 'Standard L' },
        { id: 2, type: ItemType.PANT, quantity: 1, rate: 475, clothLength: '1.2 Mtr', measurements: 'Standard 32' }
    ]);
  };

  const handleAddItem = () => {
      if (currentItem.quantity <= 0 || currentItem.rate <= 0) {
          alert("Please enter valid quantity and rate.");
          return;
      }
      setBillItems(prev => [
          ...prev, 
          { 
              ...currentItem, 
              id: Date.now() 
          }
      ]);
      // Reset current item fields slightly for next entry (reset to Shirt default)
      setCurrentItem({
          type: ItemType.SHIRT,
          quantity: 1,
          rate: 375, 
          clothLength: '',
          measurements: ''
      });
  };

  const handleRemoveItem = (id: number) => {
      setBillItems(prev => prev.filter(item => item.id !== id));
  };

  const handleCreateOrder = (isDraft: boolean) => {
    if (billItems.length === 0) {
        alert("Please add at least one item to the bill.");
        return;
    }
    if (!customerDetails.name || !customerDetails.mobile) {
        alert("Customer Name and Mobile are required.");
        return;
    }

    const orderId = `ORD-${Math.floor(Math.random() * 10000)}`;
    const billNo = `BILL-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const totalBillAmount = billItems.reduce((sum, item) => sum + (item.rate * item.quantity), 0);

    const newOrderObj: Order = {
      id: orderId,
      billNumber: billNo,
      customerName: customerDetails.name,
      mobile: customerDetails.mobile,
      showroomName: currentUser.name,
      // Map temporary Bill Items to Order Items
      items: billItems.map(b => ({
          type: b.type,
          rate: b.rate,
          quantity: b.quantity,
          clothLength: b.clothLength,
          measurements: b.measurements
      })),
      totalAmount: totalBillAmount,
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: isDraft ? OrderStatus.DRAFT : OrderStatus.CREATED,
      currentHandlerId: currentUser.id,
      currentHandlerRole: Role.SHOWROOM,
      bookingUserId: currentUser.id,
      bookingUserName: currentUser.name,
      isWithBill: customerDetails.withBill,
      history: [{ action: 'Created', timestamp: new Date().toISOString(), user: currentUser.name, role: currentUser.role }]
    };

    onUpdateOrder(newOrderObj);
    setActiveModal(null);
    setBillItems([]); // Clear form
    setCustomerDetails({ name: '', mobile: '', address: '', withBill: true });
    
    if (!isDraft) {
       alert(`Order Created Successfully! Bill No: ${billNo}`);
    } else {
       alert(`Draft Saved! Bill No: ${billNo}`);
    }
  };

  const handleDemoComplete = (order: Order) => {
    onUpdateOrder({
      ...order,
      status: OrderStatus.COMPLETED,
      history: [...order.history, { action: 'Fast Track Complete (Demo)', timestamp: new Date().toISOString(), user: currentUser.name, role: currentUser.role }]
    });
    setSuccessData({
      isOpen: true,
      title: 'Demo Complete',
      message: 'Order marked as Completed instantly.',
      role: 'Customer',
      name: order.customerName,
      sub: 'Demo Mode: All stages skipped.'
    });
  };

  const initiateHandover = (order: Order) => {
     setSelectedOrderForHandover(order);
     setActiveModal('HANDOVER_SELECT');
  };

  const confirmHandover = () => {
     if (!selectedOrderForHandover || !selectedMeasurementMaster) return;
     
     const master = users.find(u => u.id === selectedMeasurementMaster);
     
     onUpdateOrder({
        ...selectedOrderForHandover,
        status: OrderStatus.HANDOVER_TO_MEASUREMENT,
        currentHandlerId: selectedMeasurementMaster,
        currentHandlerRole: Role.MEASUREMENT,
        history: [...selectedOrderForHandover.history, { action: `Handover to ${master?.name}`, timestamp: new Date().toISOString(), user: currentUser.name, role: currentUser.role }]
     });

     setActiveModal(null);
     setSuccessData({
        isOpen: true,
        title: 'Successful Handover',
        message: 'Order successfully handed over.',
        role: 'Measurement Master',
        name: master?.name || 'Unknown',
        sub: 'Showroom side: Handover Done – Waiting for Measurement'
     });
     setSelectedOrderForHandover(null);
     setSelectedMeasurementMaster('');
  };

  const handleSubmitPayment = () => {
    onRequestPayment({
      showroomName: currentUser.name,
      amount: Number(paymentForm.amount),
      utr: paymentForm.utr,
      mode: paymentForm.mode,
      type: 'DEPOSIT', // Explicit Deposit
      status: 'PENDING',
      date: new Date().toISOString().split('T')[0]
    });
    setActiveModal(null);
    setSuccessData({
       isOpen: true,
       title: 'Deposit Request Sent',
       message: 'Your request to add money to Stitching Wallet is sent.',
       role: 'Admin Panel',
       name: 'Accounts Dept',
       sub: 'Please wait for Admin approval.'
    });
  };

  // --- WITHDRAWAL HANDLER ---
  const handleWithdrawRequest = () => {
     const amount = Number(withdrawForm.amount);
     if (!amount || amount <= 0) { alert("Invalid Amount"); return; }
     
     // @ts-ignore
     const balance = currentUser.wallet[withdrawForm.selectedWallet] || 0;

     if (withdrawForm.tPassword !== currentUser.tPassword) {
         alert("❌ Invalid Transaction Password");
         return;
     }
     if (balance < amount) {
         alert("❌ Insufficient Balance");
         return;
     }

     onRequestPayment({
        amount: amount,
        type: 'WITHDRAWAL',
        status: 'PENDING',
        mode: 'UPI'
     });
     setActiveModal(null);
     setSuccessData({ isOpen: true, title: 'Withdrawal Sent', message: 'Request sent to Admin.', sub: 'Processing...' });
     setWithdrawForm({...withdrawForm, amount: '', tPassword: ''});
  };

  const handleSaveProfile = () => {
     onUpdateUser(profileForm);
     setActiveModal(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setProfileForm({ ...profileForm, profileImage: reader.result as string });
          reader.readAsDataURL(file);
      }
  };

  // --- RENDER HELPERS ---
  const renderKPICard = (title: string, value: string | number, colorClass: string, onClick: () => void) => (
    <div 
      onClick={onClick}
      className="bg-zinc-900/50 border border-gold-900/30 p-4 rounded-lg cursor-pointer hover:bg-zinc-800 transition-all group shadow-lg"
    >
      <h3 className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-1 group-hover:text-gold-400">{title}</h3>
      <p className={`text-2xl font-serif font-bold ${colorClass}`}>{value}</p>
    </div>
  );

  const MenuGridItem = ({ icon: Icon, label, onClick, color = "text-gray-300" }: { icon: any, label: string, onClick: () => void, color?: string }) => (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 bg-zinc-900 border border-zinc-800 hover:border-gold-500/50 hover:bg-zinc-800 rounded-lg transition-all gap-2"
    >
      <Icon className={`w-6 h-6 ${color}`} />
      <span className="text-xs font-medium text-gray-300 uppercase tracking-wide">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      
      {/* 1. TOP HEADER */}
      <header className="bg-zinc-950 p-4 border-b border-gold-900/30 flex justify-between items-center sticky top-0 z-30 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setActiveModal('MENU')} 
             className="text-gold-400 p-2 hover:bg-gold-900/20 rounded-full transition-colors"
           >
             <Menu className="w-6 h-6" />
           </button>
           <div>
             <h1 className="text-gold-500 font-serif font-bold text-lg tracking-wider">LORD'S</h1>
             <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] leading-none">Showroom Panel</p>
           </div>
        </div>
        <div className="flex items-center gap-3">
            <button className="text-gray-400 hover:text-gold-400 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div 
                onClick={() => setActiveModal('PROFILE')}
                className="w-8 h-8 rounded-full bg-zinc-800 border border-gold-600/50 flex items-center justify-center text-gold-400 font-serif font-bold text-sm overflow-hidden cursor-pointer"
            >
               {currentUser.profileImage ? <img src={currentUser.profileImage} className="w-full h-full object-cover"/> : currentUser.name[0]}
            </div>
        </div>
      </header>

      {/* 2. MAIN DASHBOARD CONTENT */}
      <main className="p-4 md:p-6 max-w-7xl mx-auto pb-24">
        <div className="flex justify-between items-end mb-6">
           <div>
             <h2 className="text-xl md:text-2xl font-serif text-gold-200">Welcome Back</h2>
             <p className="text-sm text-gray-500">{currentUser.name}</p>
           </div>
           <button 
             onClick={() => setActiveModal('NEW_ORDER')}
             className="bg-gold-600 text-black px-4 py-2 rounded font-bold hover:bg-gold-500 flex items-center gap-2 text-sm shadow-[0_0_15px_rgba(212,160,0,0.4)] animate-pulse hover:animate-none transition-all"
           >
             <PlusCircle className="w-4 h-4" /> New Bill
           </button>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
          {renderKPICard("New Orders", todayOrders.length, "text-white", () => setActiveModal('HISTORY'))}
          {renderKPICard("Pending", pendingOrders.length, "text-gold-400", () => setActiveModal('HISTORY'))}
          {renderKPICard("Completed", completedOrders.length, "text-green-400", () => setActiveModal('HISTORY'))}
          {renderKPICard("Wallet", `₹${currentUser.wallet.mainBalance}`, "text-gold-400", () => setActiveModal('WALLET'))}
        </div>

        {/* Recent Pending Orders */}
        <div className="bg-zinc-900/30 border border-gold-900/30 rounded-lg p-4 md:p-6">
           <h3 className="text-gold-300 font-serif mb-4 flex items-center gap-2">
             <History className="w-4 h-4" /> Recent Pending Orders
           </h3>
           <div className="space-y-3">
             {pendingOrders.slice(0, 5).map(o => (
               <div key={o.id} className="flex justify-between items-center bg-black p-3 rounded border border-zinc-800 hover:border-gold-900/50 transition-colors">
                 <div>
                   <p className="text-white font-bold text-sm">{o.billNumber} - {o.customerName}</p>
                   <p className="text-xs text-gray-500">{o.items[0].type} | {o.status}</p>
                   <p className="text-[10px] text-gold-600 italic mt-1">Booked By: {o.bookingUserName}</p>
                 </div>
                 {o.status === OrderStatus.CREATED && (
                     <button onClick={() => initiateHandover(o)} className="text-[10px] bg-gold-600 text-black px-3 py-1 rounded font-bold hover:bg-gold-500">
                        Handover
                     </button>
                 )}
                 {o.status !== OrderStatus.CREATED && (
                    <span className="text-[10px] text-gray-500 italic">Processing</span>
                 )}
               </div>
             ))}
             {pendingOrders.length === 0 && <p className="text-gray-500 text-sm italic">No pending orders.</p>}
           </div>
        </div>

      </main>

      {/* --- MENU MODAL (POPUP) --- */}
      <Modal isOpen={activeModal === 'MENU'} onClose={() => setActiveModal(null)} title="Showroom Menu">
          <div className="grid grid-cols-3 gap-3 mb-6">
             <MenuGridItem icon={LayoutDashboard} label="Dashboard" onClick={() => setActiveModal(null)} color="text-white" />
             <MenuGridItem icon={FilePlus} label="New Bill" onClick={() => setActiveModal('NEW_ORDER')} color="text-gold-400" />
             <MenuGridItem icon={Wallet} label="Wallet" onClick={() => setActiveModal('WALLET')} color="text-green-400" />
             <MenuGridItem icon={History} label="History" onClick={() => setActiveModal('HISTORY')} />
             <MenuGridItem icon={Search} label="Track" onClick={() => setActiveModal('TRACKING')} />
             <MenuGridItem icon={Users} label="Team" onClick={() => setActiveModal('REFERRAL')} />
             <MenuGridItem icon={Banknote} label="Withdraw" onClick={() => setActiveModal('WITHDRAWAL')} />
             <MenuGridItem icon={User} label="Profile" onClick={() => setActiveModal('PROFILE')} />
             <MenuGridItem icon={HelpCircle} label="Help" onClick={() => setActiveModal('HELP')} />
          </div>
          
          <button onClick={onLogout} className="w-full flex items-center justify-center p-3 text-red-400 bg-red-900/10 border border-red-900/30 rounded-lg hover:bg-red-900/20 transition-colors text-sm font-bold uppercase tracking-wider">
             <LogOut className="w-4 h-4 mr-2"/> Secure Logout
          </button>
      </Modal>

      {/* --- NEW ORDER POPUP (Multi-Item Support) --- */}
      <Modal isOpen={activeModal === 'NEW_ORDER'} onClose={() => setActiveModal(null)} title="Create New Custom Bill">
         <div className="space-y-4">
            
            {/* Header / Demo Mode */}
            <div className="flex justify-between items-center bg-zinc-900 p-2 rounded border border-gold-900/30">
                <span className="text-xs text-gray-400">Multi-Item Order</span>
                <button onClick={handleFillDemoData} className="text-[10px] bg-gold-900/40 text-gold-400 px-2 py-1 rounded border border-gold-600/30 hover:bg-gold-600 hover:text-black">
                   Auto-Fill Demo
                </button>
            </div>

            {/* 1. Customer Details */}
            <div className="space-y-2 border-b border-zinc-800 pb-4">
                <h4 className="text-xs text-gold-500 font-bold uppercase tracking-widest">Customer Details</h4>
                <div className="flex gap-2">
                   <input className="flex-1 bg-black border border-gold-800/50 p-2 rounded text-sm text-white" placeholder="Mobile No..." value={customerDetails.mobile} onChange={e => setCustomerDetails({...customerDetails, mobile: e.target.value})} />
                   <button onClick={handleCustomerSearch} className="bg-zinc-800 text-gold-400 px-3 rounded text-xs border border-gold-800/30">Find</button>
                </div>
                <input className="w-full bg-black border border-gold-800/50 p-2 rounded text-sm text-white" placeholder="Customer Name" value={customerDetails.name} onChange={e => setCustomerDetails({...customerDetails, name: e.target.value})} />
                <input className="w-full bg-black border border-gold-800/50 p-2 rounded text-sm text-white" placeholder="Address" value={customerDetails.address} onChange={e => setCustomerDetails({...customerDetails, address: e.target.value})} />
            </div>
            
            {/* 2. Add Items Section */}
            <div className="space-y-3 bg-zinc-900/30 p-3 rounded border border-zinc-800">
               <h4 className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2"><PlusCircle className="w-3 h-3"/> Add Item</h4>
               
               <div className="grid grid-cols-2 gap-2">
                 <div>
                   <label className="text-[10px] text-gray-500">Product</label>
                   <select 
                      className="w-full bg-black border border-zinc-700 p-2 rounded text-sm text-gray-300" 
                      value={currentItem.type} 
                      onChange={e => {
                         const newType = e.target.value as ItemType;
                         let newRate = 375;
                         if (newType === ItemType.SHIRT) newRate = 375;
                         else if (newType === ItemType.PANT) newRate = 475;
                         else if (newType === ItemType.COAT) newRate = 1200;
                         else if (newType === ItemType.SAFARI) newRate = 850;
                         setCurrentItem({...currentItem, type: newType, rate: newRate});
                      }}
                   >
                      {Object.values(ItemType).map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                 </div>
                 <div>
                   <label className="text-[10px] text-gray-500">Quantity</label>
                   <input type="number" className="w-full bg-black border border-zinc-700 p-2 rounded text-sm text-white" value={currentItem.quantity} onChange={e => setCurrentItem({...currentItem, quantity: Number(e.target.value)})} />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-2">
                 <div>
                   <label className="text-[10px] text-gray-500">Cloth (Mtr)</label>
                   <input className="w-full bg-black border border-zinc-700 p-2 rounded text-sm text-white" placeholder="e.g. 1.2" value={currentItem.clothLength} onChange={e => setCurrentItem({...currentItem, clothLength: e.target.value})} />
                 </div>
                 <div>
                   <label className="text-[10px] text-gray-500">Rate (₹)</label>
                   <input type="number" className="w-full bg-black border border-zinc-700 p-2 rounded text-sm text-gold-400 font-bold" value={currentItem.rate} onChange={e => setCurrentItem({...currentItem, rate: Number(e.target.value)})} />
                 </div>
               </div>
               
               <input className="w-full bg-black border border-zinc-700 p-2 rounded text-sm text-white" placeholder="Measurements / Notes" value={currentItem.measurements} onChange={e => setCurrentItem({...currentItem, measurements: e.target.value})} />

               <button onClick={handleAddItem} className="w-full bg-zinc-800 text-white font-bold py-2 rounded text-xs hover:bg-zinc-700 border border-zinc-600">
                  + Add Item to Bill
               </button>
            </div>

            {/* 3. Added Items List */}
            {billItems.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2">Bill Summary</h4>
                    <div className="max-h-32 overflow-y-auto custom-scrollbar border border-zinc-800 rounded bg-black">
                        {billItems.map((item, idx) => (
                            <div key={item.id} className="flex justify-between items-center p-2 border-b border-zinc-900 last:border-0 hover:bg-zinc-900/50">
                                <div>
                                    <p className="text-sm text-white font-bold">{item.type} <span className="text-gray-500 text-xs">x{item.quantity}</span></p>
                                    <p className="text-[10px] text-gray-500">{item.measurements || 'No Note'} | {item.clothLength}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-gold-400 font-mono text-sm">₹ {item.rate * item.quantity}</span>
                                    <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-400"><Trash2 className="w-3 h-3"/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gold-900/20 rounded border border-gold-900">
                        <span className="text-gold-500 font-bold text-sm">Total Bill Amount</span>
                        <span className="text-gold-400 font-bold text-lg">₹ {billItems.reduce((sum, item) => sum + (item.rate * item.quantity), 0)}</span>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" checked={customerDetails.withBill} onChange={e => setCustomerDetails({...customerDetails, withBill: e.target.checked})} className="w-4 h-4 accent-gold-500" />
                <span className="text-sm text-gray-300">With Official Bill</span>
            </div>

            <div className="flex gap-2 pt-2">
               <button onClick={() => handleCreateOrder(true)} className="flex-1 bg-zinc-800 text-gray-300 py-3 rounded hover:bg-zinc-700 transition-colors text-xs font-bold">Save Draft</button>
               <button onClick={() => handleCreateOrder(false)} className="flex-1 bg-gold-600 text-black font-bold py-3 rounded hover:bg-gold-500 transition-colors text-xs">GENERATE BILL</button>
            </div>
         </div>
      </Modal>

      {/* --- HANDOVER SELECT MODAL --- */}
      <Modal isOpen={activeModal === 'HANDOVER_SELECT'} onClose={() => setActiveModal(null)} title="Select Measurement Master">
         <div className="space-y-4">
             <p className="text-sm text-gray-400">Please select a Measurement Master to assign this order.</p>
             <div className="space-y-2">
                {users.filter(u => u.role === Role.MEASUREMENT).map(master => (
                   <button 
                      key={master.id}
                      onClick={() => setSelectedMeasurementMaster(master.id)}
                      className={`w-full text-left p-3 rounded border flex justify-between ${selectedMeasurementMaster === master.id ? 'bg-gold-900/30 border-gold-500 text-white' : 'bg-black border-zinc-800 text-gray-400'}`}
                   >
                      <span>{master.name}</span>
                      <span className="text-[10px] bg-zinc-800 px-2 rounded">Available</span>
                   </button>
                ))}
             </div>
             <button onClick={confirmHandover} disabled={!selectedMeasurementMaster} className="w-full bg-gold-600 text-black font-bold py-3 rounded disabled:opacity-50">Confirm Handover</button>
         </div>
      </Modal>

      {/* --- PAYMENT MODAL --- */}
      <Modal isOpen={activeModal === 'ADD_PAYMENT'} onClose={() => setActiveModal('WALLET')} title="Add Money to Stitching Wallet">
         <div className="space-y-4">
             <p className="text-sm text-green-400 bg-green-900/20 p-2 rounded border border-green-800">Funds added here will be used for stitching payouts.</p>
             <div><label className="text-xs text-gray-400">Amount (₹)</label><input type="number" className="w-full bg-black border border-gold-800/50 p-2 rounded text-sm text-white" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} /></div>
             <div><label className="text-xs text-gray-400">UTR / Ref</label><input className="w-full bg-black border border-gold-800/50 p-2 rounded text-sm text-white" value={paymentForm.utr} onChange={e => setPaymentForm({...paymentForm, utr: e.target.value})} /></div>
             <button onClick={handleSubmitPayment} className="w-full bg-green-600 text-black font-bold py-2 rounded mt-2 hover:bg-green-500 transition-colors">Submit Deposit</button>
         </div>
      </Modal>

      {/* --- WITHDRAWAL & WALLET UI --- */}
      <Modal isOpen={activeModal === 'WALLET'} onClose={() => setActiveModal(null)} title="My Wallets">
         <div className="space-y-1">
            <p className="text-gray-400 text-xs mb-4">Tap any wallet to see history (popup)</p>
            
            {/* STITCHING WALLET (Highlighted as Primary for Showroom Operations) */}
            <div className="bg-gold-900/20 p-4 rounded-xl mb-3 flex justify-between items-center border border-gold-600 active:scale-95 transition-transform cursor-pointer">
                <div>
                  <h3 className="text-gold-400 font-bold text-sm">Stitching Wallet</h3>
                  <p className="text-gold-600/70 text-xs mt-1">Used for Worker Payouts (Required)</p>
                </div>
                <p className="text-white font-bold text-lg">₹ {currentUser.wallet.stitchingWallet.toLocaleString()}</p>
            </div>

            {[
              { id: 'mainBalance', name: 'Main Earnings', balance: currentUser.wallet.mainBalance },
              { id: 'withdrawalWallet', name: 'Withdrawal Wallet', balance: currentUser.wallet.withdrawalWallet },
              { id: 'performanceWallet', name: 'Performance Wallet', balance: currentUser.wallet.performanceWallet },
              { id: 'uplineIncome', name: 'Upline Wallet', balance: currentUser.wallet.uplineIncome },
              { id: 'downlineIncome', name: 'Downline Wallet', balance: currentUser.wallet.downlineIncome },
            ].map((wallet, idx) => (
              <div key={idx} className="bg-zinc-900 p-4 rounded-xl mb-3 flex justify-between items-center border border-zinc-800 active:scale-95 transition-transform cursor-pointer">
                <div>
                  <h3 className="text-white font-bold text-sm">{wallet.name}</h3>
                  <p className="text-gray-500 text-xs mt-1">Balance</p>
                </div>
                <p className="text-gold-400 font-bold text-lg">₹ {wallet.balance.toLocaleString()}</p>
              </div>
            ))}

            <button onClick={() => setActiveModal('ADD_PAYMENT')} className="w-full bg-green-600 text-black font-bold py-3 rounded-xl mt-4 shadow-[0_0_15px_rgba(34,197,94,0.3)]">Add Money to Stitching Wallet</button>

            {/* WITHDRAWAL SECTION */}
            <div className="mt-8 pt-4 border-t border-zinc-800">
               <h4 className="text-white text-sm mb-2 font-bold flex items-center gap-2"><Wallet className="w-4 h-4 text-gold-500"/> Withdraw Funds</h4>
               
               <div className="space-y-3">
                   {/* Wallet Selector */}
                   <select 
                      className="w-full bg-black border border-zinc-700 rounded p-2 text-white text-sm"
                      value={withdrawForm.selectedWallet}
                      onChange={(e) => setWithdrawForm({...withdrawForm, selectedWallet: e.target.value})}
                   >
                       <option value="stitchingWallet">Stitching Wallet</option>
                       <option value="mainBalance">Main Balance</option>
                       <option value="uplineIncome">Upline Income</option>
                       <option value="downlineIncome">Downline Income</option>
                       <option value="withdrawalWallet">Withdrawal Wallet</option>
                   </select>

                   <input 
                       type="number" 
                       className="w-full bg-black border border-zinc-700 rounded p-2 text-white" 
                       placeholder="Amount (₹)" 
                       value={withdrawForm.amount}
                       onChange={(e) => setWithdrawForm({...withdrawForm, amount: e.target.value})}
                   />
                   
                   <input 
                       type="password" 
                       className="w-full bg-black border border-zinc-700 rounded p-2 text-white" 
                       placeholder="Transaction Password" 
                       value={withdrawForm.tPassword}
                       onChange={(e) => setWithdrawForm({...withdrawForm, tPassword: e.target.value})}
                   />

                   <button onClick={handleWithdrawRequest} className="w-full bg-red-900/40 border border-red-800 text-red-400 py-2 rounded hover:bg-red-900/60 transition-colors font-bold text-sm uppercase tracking-widest">
                       Withdraw Funds
                   </button>
               </div>
            </div>

         </div>
      </Modal>

      {/* --- PROFILE MODAL --- */}
      <Modal isOpen={activeModal === 'PROFILE'} onClose={() => setActiveModal(null)} title="Edit Profile">
          <div className="space-y-4">
              <div className="flex justify-center mb-4">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gold-500">
                      {profileForm.profileImage ? (
                          <img src={profileForm.profileImage} className="w-full h-full object-cover" />
                      ) : (
                          <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-gold-600 text-2xl font-bold">{profileForm.name[0]}</div>
                      )}
                      <label className="absolute bottom-0 w-full bg-black/70 text-white text-[9px] text-center py-1 cursor-pointer">
                          UPLOAD
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="text-xs text-gray-500 uppercase">Name</label>
                      <input className="w-full bg-black border border-zinc-700 rounded p-2 text-white text-sm" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
                  </div>
                  <div>
                      <label className="text-xs text-gray-500 uppercase">Mobile</label>
                      <input className="w-full bg-black border border-zinc-700 rounded p-2 text-white text-sm" value={profileForm.mobile} onChange={e => setProfileForm({...profileForm, mobile: e.target.value})} />
                  </div>
              </div>

              <div>
                  <label className="text-xs text-gray-500 uppercase">Address</label>
                  <input className="w-full bg-black border border-zinc-700 rounded p-2 text-white text-sm" value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} />
              </div>
              
              <div>
                  <label className="text-xs text-gray-500 uppercase">Gmail</label>
                  <input className="w-full bg-black border border-zinc-700 rounded p-2 text-white text-sm" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} />
              </div>

              <div className="border-t border-zinc-800 pt-4 mt-2">
                   <h4 className="text-gold-500 text-xs font-bold mb-3 uppercase flex items-center gap-2"><Lock className="w-3 h-3"/> Security Settings</h4>
                   
                   <div className="mb-3">
                       <label className="text-xs text-gray-500 uppercase">Login Password</label>
                       <div className="relative">
                            <input type={showPassword ? 'text' : 'password'} className="w-full bg-black border border-zinc-700 rounded p-2 text-white text-sm" value={profileForm.password || ''} onChange={e => setProfileForm({...profileForm, password: e.target.value})} placeholder="Set Login Password" />
                            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-2 text-[10px] text-gold-500 uppercase">{showPassword ? 'Hide' : 'Show'}</button>
                       </div>
                   </div>

                   <div>
                       <label className="text-xs text-gray-500 uppercase">Transaction Password (T-Pass)</label>
                       <input type="text" className="w-full bg-black border border-zinc-700 rounded p-2 text-white text-sm" value={profileForm.tPassword || ''} onChange={e => setProfileForm({...profileForm, tPassword: e.target.value})} placeholder="Set Transaction Password" />
                   </div>
              </div>

              <button onClick={handleSaveProfile} className="w-full bg-gold-600 text-black font-bold py-3 rounded mt-2 hover:bg-gold-500">Save Changes</button>
          </div>
      </Modal>

      {/* --- REFERRAL UI --- */}
      <Modal isOpen={activeModal === 'REFERRAL'} onClose={() => setActiveModal(null)} title="My 10-Level Network">
         <div className="space-y-6">
            
            <div className="bg-zinc-900/50 p-4 rounded-lg border border-gold-900/30 flex justify-between items-center">
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest">Referral Code</p>
                    <p className="text-xl text-gold-400 font-serif font-bold">{currentUser.referralCode}</p>
                </div>
                <div className="flex gap-2">
                    <button className="bg-gold-600 text-black px-3 py-1 rounded text-xs font-bold flex items-center gap-1" onClick={() => navigator.clipboard.writeText(currentUser.referralCode)}>
                        <Copy className="w-3 h-3"/> Code
                    </button>
                    <button className="bg-black border border-gold-600 text-gold-500 px-3 py-1 rounded text-xs font-bold flex items-center gap-1" onClick={() => navigator.clipboard.writeText(`https://lords.com/join?ref=${currentUser.referralCode}`)}>
                        <Copy className="w-3 h-3"/> Link
                    </button>
                </div>
            </div>

            <div className="flex justify-between items-end border-b border-zinc-800 pb-2">
                 <h4 className="text-white text-sm font-bold">Total Network</h4>
                 <span className="text-gold-500 text-sm font-bold">{totalDownlineCount} Members</span>
            </div>
               
            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                {networkTree.map((levelData) => (
                    <div key={levelData.level} className="bg-black border border-zinc-800 rounded p-3">
                        <div className="flex justify-between items-center mb-2">
                             <span className="text-gold-400 font-bold text-sm">Level {levelData.level}</span>
                             <span className="text-green-500 font-mono text-xs">+ ₹{levelData.income} Earned</span>
                        </div>
                        
                        {levelData.members.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                                {levelData.members.map(m => (
                                    <div key={m.id} className="bg-zinc-900 p-2 rounded flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-zinc-800 text-[10px] flex items-center justify-center text-gray-400 border border-zinc-700">
                                            {m.name[0]}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-white text-xs truncate">{m.name}</p>
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

      <Modal isOpen={activeModal === 'HISTORY'} onClose={() => setActiveModal(null)} title="Order History">
         <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
            {myOrders.map(o => (
               <div key={o.id} className="bg-zinc-900 p-3 rounded border border-zinc-800 flex justify-between items-center">
                  <div>
                     <p className="text-sm font-bold text-white">{o.billNumber} - {o.customerName}</p>
                     <p className="text-xs text-gray-500">Items: {o.items.length} | {o.status}</p>
                  </div>
                  {o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED && (
                    <button onClick={() => handleDemoComplete(o)} className="text-[10px] bg-red-900/20 text-red-400 border border-red-900 px-2 py-1 rounded flex items-center gap-1 hover:bg-red-900/40">
                       <Zap className="w-3 h-3" /> Demo Complete
                    </button>
                  )}
               </div>
            ))}
            {myOrders.length === 0 && <p className="text-gray-500 text-center text-sm p-4">No order history found.</p>}
         </div>
      </Modal>

      {/* SUCCESS POPUP */}
      <SuccessModal 
        isOpen={successData.isOpen}
        onClose={() => setSuccessData({...successData, isOpen: false})}
        title={successData.title}
        message={successData.message}
        recipientRole={successData.role}
        recipientName={successData.name}
        subMessage={successData.sub}
      />

      <HelpAgent userRole="Showroom Manager" userName={currentUser.name} />

    </div>
  );
};
