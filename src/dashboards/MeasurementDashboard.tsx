
import React, { useState } from 'react';
import { 
  LayoutDashboard, Inbox, Ruler, Save, Clock, CheckCircle, 
  Banknote, User, Bell, LogOut, Menu, Scissors, Wallet, Edit2, Lock, Camera, Copy, Send, Split
} from 'lucide-react';
import { Modal } from './ui/Modal';
import { SuccessModal } from './ui/SuccessModal';
import { UserProfile, Order, OrderStatus, ItemType, Role, PaymentRequest } from '../types';
import { HelpAgent } from './HelpAgent';

interface MeasurementDashboardProps {
  currentUser: UserProfile;
  orders: Order[];
  users: UserProfile[]; 
  onLogout: () => void;
  onUpdateOrder: (order: Order) => void;
  onRequestPayment: (req: Partial<PaymentRequest>) => void; 
  onUpdateUser: (updatedUser: UserProfile) => void; 
  onSplitOrder: (parentId: string, newOrders: Order[]) => void; // New Prop for splitting
}

const MEASUREMENT_FIELDS: Record<string, string[]> = {
  [ItemType.SHIRT]: ['Length', 'Chest', 'Waist', 'Shoulder', 'Sleeve', 'Collar', 'Cuff', 'Fitting Type', 'Style Notes'],
  [ItemType.PANT]: ['Length', 'Waist', 'Hip', 'Thigh', 'Bottom', 'Rise', 'Fitting Type'],
  [ItemType.COAT]: ['Length', 'Chest', 'Waist', 'Shoulder', 'Sleeve', 'Neck', 'Vent', 'Fit Type'],
  [ItemType.SAFARI]: ['Length', 'Chest', 'Waist', 'Shoulder', 'Sleeve', 'Neck', 'Vent', 'Fit Type'],
  [ItemType.KURTA]: ['Length', 'Chest', 'Waist', 'Shoulder', 'Sleeve', 'Neck'],
  [ItemType.PAJAMA]: ['Length', 'Waist', 'Hip', 'Bottom'],
};

export const MeasurementDashboard: React.FC<MeasurementDashboardProps> = ({ 
  currentUser, orders, users, onLogout, onUpdateOrder, onRequestPayment, onUpdateUser, onSplitOrder
}) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedCuttingMaster, setSelectedCuttingMaster] = useState<string>('');
  
  const [paymentForm, setPaymentForm] = useState({ amount: '', utr: '' });
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', tPassword: '', selectedWallet: 'workWallet' });

  const [profileForm, setProfileForm] = useState(currentUser);
  const [showPassword, setShowPassword] = useState(false);

  const [successData, setSuccessData] = useState<{isOpen: boolean; title: string; message: string; role?: string; name?: string; sub?: string}>({
    isOpen: false, title: '', message: '', role: '', name: '', sub: ''
  });

  const [measurementData, setMeasurementData] = useState<Record<number, Record<string, string>>>({});

  // KPI
  const inboxOrders = orders.filter(o => o.status === OrderStatus.HANDOVER_TO_MEASUREMENT && o.currentHandlerId === currentUser.id);
  const inProgressOrders = orders.filter(o => o.status === OrderStatus.MEASUREMENT_PROGRESS && o.currentHandlerId === currentUser.id);
  const completedOrders = orders.filter(o => o.history.some(h => h.role === Role.MEASUREMENT && h.action.includes('Handover')) && o.currentHandlerId !== currentUser.id);

  // Calculate Today's Income
  const today = new Date().toISOString().split('T')[0];
  const todaysIncome = currentUser.wallet.transactions
    .filter(t => t.date === today && t.type === 'CREDIT' && t.description.includes('Work Income'))
    .reduce((sum, t) => sum + t.amount, 0);

  // --- NETWORK DATA ---
  const getNetworkTree = () => {
     let levels: { level: number, members: UserProfile[], income: number }[] = [];
     let currentIds = [currentUser.id];
     for(let i=1; i<=10; i++) {
        const nextGen = users.filter(u => u.referredBy && currentIds.includes(u.referredBy));
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

  // Handlers
  const handleAcceptOrder = (order: Order) => {
    // CHECK FOR SPLIT: If order has multiple items, break it apart now.
    if (order.items.length > 1) {
        const subOrders = order.items.map((item, idx) => ({
            ...order,
            id: `${order.id}-${idx + 1}`, // Create Unique ID for sub-order
            items: [item], // Single item per order
            totalAmount: item.rate * item.quantity, // Proportional amount (approx)
            status: OrderStatus.MEASUREMENT_PROGRESS,
            history: [...order.history, { 
                action: `Order Split: ${item.type} accepted`, 
                timestamp: new Date().toISOString(), 
                user: currentUser.name, 
                role: currentUser.role 
            }]
        }));
        
        onSplitOrder(order.id, subOrders);

        setSuccessData({
            isOpen: true,
            title: 'Order Accepted & Split',
            message: `Order ${order.billNumber} contained multiple items. It has been split into ${subOrders.length} separate tasks (Shirt, Pant, etc.) for easier handover.`,
            role: 'System',
            name: 'Auto-Split',
            sub: 'Check "In Progress" for separate items.'
        });
    } else {
        // Standard single item flow
        onUpdateOrder({
          ...order,
          status: OrderStatus.MEASUREMENT_PROGRESS,
          history: [...order.history, { action: 'Measurement Accepted', timestamp: new Date().toISOString(), user: currentUser.name, role: currentUser.role }]
        });
        setSuccessData({
           isOpen: true,
           title: 'Order Accepted',
           message: 'Order successfully accepted.',
           role: 'Measurement Master',
           name: currentUser.name,
           sub: 'Moved to Saved Measurements.'
        });
    }
    setActiveModal(null);
  };

  const handleOpenMeasurement = (order: Order) => {
    setSelectedOrder(order);
    const initialData: Record<number, Record<string, string>> = {};
    order.items.forEach((item, idx) => {
      initialData[idx] = {}; 
      
      // Parse existing measurements if they exist
      if (item.measurements) {
          item.measurements.split(', ').forEach(pair => {
              const [key, value] = pair.split(': ');
              if (key && value) {
                  initialData[idx][key] = value;
              }
          });
      }
      
      // Ensure all fields exist
      MEASUREMENT_FIELDS[item.type]?.forEach(field => {
        if (!initialData[idx][field]) initialData[idx][field] = ''; 
      });
    });
    setMeasurementData(initialData);
    setActiveModal('MEASUREMENT_FORM');
  };

  const handleSaveMeasurement = (handover: boolean) => {
    if (!selectedOrder) return;

    const updatedItems = selectedOrder.items.map((item, idx) => {
      const data = measurementData[idx];
      const dataStr = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(', ');
      return { ...item, measurements: dataStr };
    });

    if (handover) {
       // Open Selection Modal first
       const updatedOrderTemp = { ...selectedOrder, items: updatedItems };
       setSelectedOrder(updatedOrderTemp);
       setActiveModal('CUTTING_SELECT');
    } else {
       // Just Save Draft
       onUpdateOrder({
          ...selectedOrder,
          items: updatedItems,
          history: [...selectedOrder.history, { action: 'Draft Saved', timestamp: new Date().toISOString(), user: currentUser.name, role: currentUser.role }]
       });
       alert("Draft Saved.");
       setActiveModal(null);
    }
  };

  const confirmHandover = () => {
     if(!selectedOrder || !selectedCuttingMaster) return;

     const cutter = users.find(u => u.id === selectedCuttingMaster);

     onUpdateOrder({
        ...selectedOrder,
        status: OrderStatus.HANDOVER_TO_CUTTING, 
        currentHandlerId: selectedCuttingMaster,
        currentHandlerRole: Role.CUTTING,
        history: [...selectedOrder.history, { action: `Handover to ${cutter?.name}`, timestamp: new Date().toISOString(), user: currentUser.name, role: currentUser.role }]
     });

     setActiveModal(null);
     setSelectedOrder(null);
     setSelectedCuttingMaster('');
  };

  const handleAddMoney = () => {
    onRequestPayment({
      amount: Number(paymentForm.amount),
      utr: paymentForm.utr,
      mode: 'UPI',
      type: 'DEPOSIT',
      status: 'PENDING'
    });
    setActiveModal(null);
    setSuccessData({
       isOpen: true,
       title: 'Deposit Sent',
       message: 'Request to add money to Stitching Wallet sent.',
       role: 'Admin',
       name: 'Accounts',
       sub: 'Pending Approval'
    });
  };

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

  const renderKPICard = (title: string, value: string | number, colorClass: string, onClick: () => void) => (
    <div onClick={onClick} className="bg-zinc-900/50 border border-gold-900/30 p-4 rounded-lg cursor-pointer hover:bg-zinc-800 transition-all">
      <h3 className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">{title}</h3>
      <p className={`text-2xl font-serif font-bold ${colorClass}`}>{value}</p>
    </div>
  );

  const MenuGridItem = ({ icon: Icon, label, onClick, color = "text-gray-300" }: { icon: any, label: string, onClick: () => void, color?: string }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center p-4 bg-zinc-900 border border-zinc-800 hover:border-gold-500/50 rounded-lg gap-2">
      <Icon className={`w-6 h-6 ${color}`} />
      <span className="text-xs font-medium text-gray-300 uppercase">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      
      {/* Header */}
      <header className="bg-zinc-950 p-4 border-b border-gold-900/30 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-3">
           <button onClick={() => setActiveModal('MENU')} className="text-gold-400 p-2"><Menu /></button>
           <div>
             <h1 className="text-gold-500 font-serif font-bold text-lg">LORD'S</h1>
             <p className="text-[10px] text-gray-500 uppercase">Measurement Panel</p>
           </div>
        </div>
        <div 
            onClick={() => setActiveModal('PROFILE')}
            className="w-8 h-8 rounded-full bg-zinc-800 border border-gold-600/50 flex items-center justify-center text-gold-400 font-serif font-bold text-sm overflow-hidden cursor-pointer"
        >
            {currentUser.profileImage ? <img src={currentUser.profileImage} className="w-full h-full object-cover"/> : currentUser.name[0]}
        </div>
      </header>

      {/* Dashboard */}
      <main className="p-4 max-w-7xl mx-auto pb-24">
        <div className="flex justify-between items-end mb-6">
           <div><h2 className="text-xl font-serif text-gold-200">Hello, Master</h2></div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {renderKPICard("Inbox", inboxOrders.length, "text-red-400", () => setActiveModal('INBOX'))}
          {renderKPICard("In Progress", inProgressOrders.length, "text-gold-400", () => setActiveModal('SAVED'))}
          {renderKPICard("Completed", completedOrders.length, "text-green-400", () => setActiveModal('COMPLETED'))}
          {renderKPICard("Work Wallet", `₹${currentUser.wallet.workWallet.toLocaleString()}`, "text-blue-400", () => setActiveModal('WALLET'))}
        </div>

        <div className="bg-zinc-900/30 border border-gold-900/30 rounded-lg p-4">
           <h3 className="text-gold-300 font-serif mb-4 flex items-center gap-2"><Ruler className="w-4 h-4"/> Recent Work</h3>
           <div className="space-y-3">
             {inProgressOrders.slice(0,3).map(o => (
                 <div key={o.id} className="bg-black p-3 rounded border border-zinc-800 flex justify-between items-center">
                    <div>
                       <p className="text-white text-sm font-bold">{o.billNumber}</p>
                       <p className="text-xs text-gray-500">{o.customerName} - {o.items[0].type}</p>
                       <p className="text-[10px] text-gold-600 italic mt-0.5">Booked By: {o.bookingUserName}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => handleOpenMeasurement(o)} className="text-xs bg-zinc-800 text-gray-300 px-2 py-1 rounded border border-zinc-700">Edit</button>
                        <button onClick={() => { setSelectedOrder(o); setActiveModal('CUTTING_SELECT'); }} className="text-xs bg-gold-900/40 text-gold-400 px-2 py-1 rounded border border-gold-900">Handover</button>
                    </div>
                 </div>
             ))}
             {inProgressOrders.length === 0 && <p className="text-gray-500 text-sm text-center">No active work.</p>}
           </div>
        </div>
      </main>

      {/* --- MODALS --- */}

      <Modal isOpen={activeModal === 'MENU'} onClose={() => setActiveModal(null)} title="Menu">
          <div className="grid grid-cols-3 gap-3 mb-6">
             <MenuGridItem icon={LayoutDashboard} label="Dashboard" onClick={() => setActiveModal(null)} />
             <MenuGridItem icon={Inbox} label="Inbox" onClick={() => setActiveModal('INBOX')} />
             <MenuGridItem icon={Save} label="Saved" onClick={() => setActiveModal('SAVED')} />
             <MenuGridItem icon={CheckCircle} label="History" onClick={() => setActiveModal('COMPLETED')} />
             <MenuGridItem icon={Wallet} label="Wallet" onClick={() => setActiveModal('WALLET')} />
             <MenuGridItem icon={Edit2} label="Profile" onClick={() => setActiveModal('PROFILE')} />
          </div>
          <button onClick={onLogout} className="w-full p-3 text-red-400 bg-red-900/10 rounded flex justify-center"><LogOut className="mr-2"/> Logout</button>
      </Modal>

      <Modal isOpen={activeModal === 'INBOX'} onClose={() => setActiveModal(null)} title="Order Inbox">
          <div className="space-y-4">
             {inboxOrders.map(order => (
                <div key={order.id} className="bg-zinc-900 p-4 rounded border border-zinc-800">
                   <div className="flex justify-between mb-2">
                      <h4 className="text-gold-400 font-bold">{order.billNumber}</h4>
                      <span className="text-[10px] text-gray-500">{order.showroomName}</span>
                   </div>
                   <p className="text-sm text-gray-300 mb-1">{order.customerName}</p>
                   {/* Display breakdown of items if multiple */}
                   {order.items.length > 1 ? (
                       <div className="mb-4 bg-black p-2 rounded border border-zinc-800">
                           <p className="text-xs text-gold-500 font-bold mb-1">Contains {order.items.length} items:</p>
                           {order.items.map((item, i) => (
                               <span key={i} className="text-xs text-gray-400 block">• {item.type}</span>
                           ))}
                           <p className="text-[10px] text-green-500 mt-2 italic">*Will split into separate jobs on Accept</p>
                       </div>
                   ) : (
                       <p className="text-xs text-gray-500 mb-4">{order.items[0].type} | Qty: {order.items[0].quantity}</p>
                   )}
                   
                   <p className="text-xs text-gold-600 mb-4 italic">Booked By: {order.bookingUserName}</p>
                   <div className="flex gap-2">
                      <button onClick={() => handleAcceptOrder(order)} className="flex-1 bg-green-700 text-white py-2 rounded text-xs font-bold">Accept Order</button>
                      <button className="flex-1 bg-red-900/30 text-red-500 py-2 rounded text-xs">Reject</button>
                   </div>
                </div>
             ))}
             {inboxOrders.length === 0 && <p className="text-gray-500 text-center">No new orders.</p>}
          </div>
      </Modal>

      <Modal isOpen={activeModal === 'SAVED'} onClose={() => setActiveModal(null)} title="In Progress">
          <div className="space-y-3">
             {inProgressOrders.map(o => (
                 <div key={o.id} className="bg-zinc-900 p-3 rounded border border-zinc-800">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-white font-bold">{o.billNumber}</span>
                        <span className="text-xs text-gold-500 font-bold px-2 py-0.5 bg-gold-900/30 rounded">{o.items[0].type}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{o.customerName}</p>
                    
                    {/* Measurement Panel Buttons: Edit & Handover */}
                    <div className="flex gap-2 mt-2">
                        <button 
                            onClick={() => handleOpenMeasurement(o)} 
                            className="flex-1 flex items-center justify-center gap-1 bg-zinc-800 text-white text-xs py-2 rounded border border-zinc-700 hover:bg-zinc-700 transition-colors"
                        >
                            <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button 
                            onClick={() => { setSelectedOrder(o); setActiveModal('CUTTING_SELECT'); }} 
                            className="flex-1 flex items-center justify-center gap-1 bg-gold-600 text-black text-xs font-bold py-2 rounded hover:bg-gold-500 transition-colors"
                        >
                            <Send className="w-3 h-3" /> Handover
                        </button>
                    </div>
                 </div>
             ))}
             {inProgressOrders.length === 0 && <p className="text-gray-500 text-center text-sm">No saved measurements.</p>}
          </div>
      </Modal>

      <Modal isOpen={activeModal === 'MEASUREMENT_FORM'} onClose={() => setActiveModal(null)} title="Measurement">
         {selectedOrder && (
            <div className="space-y-6">
               {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="bg-zinc-900 p-4 rounded border border-gold-900/30">
                     <h4 className="text-gold-400 text-sm mb-4">{item.type} Details</h4>
                     <div className="grid grid-cols-2 gap-3">
                        {MEASUREMENT_FIELDS[item.type]?.map(field => (
                           <div key={field}>
   
