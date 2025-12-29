import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { Search, Package, Scissors, Shirt, CheckCircle } from 'lucide-react';

interface CustomerPortalProps {
  orders: Order[];
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({ orders }) => {
  const [billId, setBillId] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');

  const handleSearch = () => {
    const order = orders.find(o => o.billNumber === billId);
    if (order) {
      setFoundOrder(order);
      setError('');
    } else {
      setFoundOrder(null);
      setError('Order not found. Please check your Bill Number.');
    }
  };

  const steps = [
    { status: OrderStatus.MEASUREMENT_INBOX, label: 'Measurement', icon: Package },
    { status: OrderStatus.CUTTING_INBOX, label: 'Cutting', icon: Scissors },
    { status: OrderStatus.MAKER_INBOX, label: 'Stitching', icon: Shirt },
    { status: OrderStatus.FINISHING_INBOX, label: 'Finishing', icon: CheckCircle },
    { status: OrderStatus.DELIVERY_INBOX, label: 'Ready', icon: CheckCircle },
  ];

  // Helper to check if step is completed based on enum order or logic
  // For simplicity, we check specific statuses
  const isCompleted = (stepStatus: OrderStatus, currentStatus: OrderStatus) => {
     // A simple naive implementation for the demo
     const orderOfOps = [
       OrderStatus.MEASUREMENT_INBOX,
       OrderStatus.CUTTING_INBOX,
       OrderStatus.MAKER_INBOX,
       OrderStatus.FINISHING_INBOX,
       OrderStatus.DELIVERY_INBOX,
       OrderStatus.COMPLETED
     ];
     const currentIndex = orderOfOps.indexOf(currentStatus);
     const stepIndex = orderOfOps.indexOf(stepStatus);
     // If current status is not in the list (e.g. intermediate status), treat as incomplete or previous step?
     // For this simple logic, if status is 'Progress', it typically means the Inbox step is 'active' or 'past'.
     // But strictly comparing indices:
     return currentIndex > stepIndex;
  };
  
  const isCurrent = (stepStatus: OrderStatus, currentStatus: OrderStatus) => stepStatus === currentStatus;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="font-serif text-3xl text-gold-400 mb-2">Track Your Suit</h1>
        <p className="text-gray-500">Enter your Bill Number to see the live status of your bespoke order.</p>
      </div>

      <div className="flex gap-2 mb-8">
        <input
          type="text"
          value={billId}
          onChange={(e) => setBillId(e.target.value)}
          placeholder="Enter Bill Number (e.g. 1001)"
          className="flex-1 bg-black-input border border-gold-800/50 text-gold-100 p-4 rounded focus:outline-none focus:border-gold-500"
        />
        <button
          onClick={handleSearch}
          className="bg-gold-600 text-black font-bold px-8 rounded hover:bg-gold-500 transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {error && <p className="text-red-500 text-center mb-8">{error}</p>}

      {foundOrder && (
        <div className="bg-black-card border border-gold-800/30 rounded-lg p-8 shadow-2xl animate-fade-in">
          <div className="flex justify-between items-start border-b border-gold-900 pb-6 mb-6">
            <div>
              <h2 className="text-2xl font-serif text-gold-200">{foundOrder.customerName}</h2>
              <p className="text-gold-600/70 text-sm mt-1">{foundOrder.items[0]?.type}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Delivery Date</p>
              <p className="text-gold-400 font-bold">{foundOrder.deliveryDate}</p>
            </div>
          </div>

          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-800" />

            <div className="space-y-8 pl-12">
              {steps.map((step, idx) => {
                const completed = isCompleted(step.status, foundOrder.status);
                const current = isCurrent(step.status, foundOrder.status);
                const Icon = step.icon;

                return (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-[3.25rem] w-8 h-8 rounded-full flex items-center justify-center border-2 
                      ${completed || current ? 'bg-gold-500 border-gold-400 text-black' : 'bg-black border-gray-700 text-gray-700'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className={`text-lg font-serif ${completed || current ? 'text-gold-300' : 'text-gray-600'}`}>
                        {step.label}
                      </h4>
                      {current && (
                        <p className="text-xs text-gold-600 animate-pulse mt-1">
                          Current Stage - Work in Progress
                        </p>
                      )}
                      {completed && (
                         <p className="text-xs text-green-600 mt-1">Completed</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gold-900 text-center">
            <p className="text-gray-500 italic text-sm">"Quality is never an accident; it is always the result of high intention."</p>
          </div>
        </div>
      )}
    </div>
  );
};