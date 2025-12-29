import React from 'react';
import { CheckCircle, Clock } from 'lucide-react';
import { Order, OrderStatus, Role } from '../types';

interface WorkerPanelProps {
  role: Role;
  orders: Order[];
  onUpdateStatus: (orderId: string, nextStatus: OrderStatus) => void;
}

const getNextStatus = (role: Role): OrderStatus | null => {
  switch (role) {
    case Role.MEASUREMENT: return OrderStatus.HANDOVER_TO_CUTTING;
    case Role.CUTTING: return OrderStatus.HANDOVER_TO_STITCHING;
    case Role.SHIRT_MAKER:
    case Role.PANT_MAKER:
    case Role.COAT_MAKER:
    case Role.SAFARI_MAKER:
      return OrderStatus.HANDOVER_TO_FINISHING;
    case Role.KAJ_BUTTON: return OrderStatus.HANDOVER_TO_FINISHING; 
    case Role.PRESS: return OrderStatus.HANDOVER_TO_DELIVERY;
    case Role.DELIVERY: return OrderStatus.COMPLETED;
    default: return null;
  }
};

const getPendingStatusForRole = (role: Role): OrderStatus | null => {
  switch (role) {
    case Role.MEASUREMENT: return OrderStatus.MEASUREMENT_INBOX;
    case Role.CUTTING: return OrderStatus.CUTTING_INBOX;
    case Role.SHIRT_MAKER:
    case Role.PANT_MAKER:
    case Role.COAT_MAKER:
    case Role.SAFARI_MAKER:
      return OrderStatus.MAKER_INBOX;
    case Role.KAJ_BUTTON: return OrderStatus.FINISHING_INBOX;
    case Role.PRESS: return OrderStatus.FINISHING_INBOX;
    case Role.DELIVERY: return OrderStatus.DELIVERY_INBOX;
    default: return null;
  }
};

export const WorkerPanel: React.FC<WorkerPanelProps> = ({ role, orders, onUpdateStatus }) => {
  const targetStatus = getPendingStatusForRole(role);
  const nextStatus = getNextStatus(role);
  
  if (!targetStatus || !nextStatus) return <div className="text-gray-400">Access Restricted for this View.</div>;

  const relevantOrders = orders.filter(o => o.status === targetStatus);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-gold-900 pb-4">
        <div>
          <h2 className="text-2xl font-serif text-gold-400">{role} Department</h2>
          <p className="text-sm text-gray-500 mt-1">Pending Tasks: <span className="text-gold-300 font-bold">{relevantOrders.length}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relevantOrders.length === 0 ? (
          <div className="col-span-full py-12 text-center border border-dashed border-gold-900 rounded-lg">
            <p className="text-gray-500">No pending orders for {role}.</p>
          </div>
        ) : (
          relevantOrders.map(order => (
            <div key={order.id} className="bg-black-card border border-gold-800/20 rounded-lg p-6 hover:border-gold-500/50 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-gold-900/30 text-gold-400 text-xs px-2 py-1 rounded font-mono border border-gold-800/30">
                  {order.billNumber}
                </span>
                <span className="text-xs text-gray-500">{order.deliveryDate}</span>
              </div>
              
              <h3 className="text-white font-serif text-lg mb-1">{order.customerName}</h3>
              {/* Note: category is not in Order interface, using items[0].type */}
              <p className="text-gold-600 text-xs uppercase tracking-wide mb-4">{order.items[0]?.type}</p>
              
              <div className="space-y-2 mb-6">
                 <div className="flex justify-between text-sm text-gray-400">
                    <span>Measurements:</span>
                    {/* fabricAmount not in Order, using measurements from first item */}
                    <span className="text-gray-200 truncate w-32 text-right">{order.items[0]?.measurements}</span>
                 </div>
                 <div className="flex justify-between text-sm text-gray-400">
                    <span>Current Stage:</span>
                    <span className="text-gold-500/80">{order.status}</span>
                 </div>
              </div>

              <button
                onClick={() => onUpdateStatus(order.id, nextStatus)}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-gold-700 to-gold-600 hover:from-gold-600 hover:to-gold-500 text-black font-bold py-3 rounded transition-all transform active:scale-95"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Complete Task</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
