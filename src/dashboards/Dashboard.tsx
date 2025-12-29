import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Order, OrderStatus } from '../types';

interface DashboardProps {
  orders: Order[];
}

const COLORS = ['#D4A000', '#806000', '#2B2000', '#554000'];

export const Dashboard: React.FC<DashboardProps> = ({ orders }) => {
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.keys(statusCounts).map(status => ({
    name: status,
    value: statusCounts[status]
  }));

  const dailyProduction = [
    { name: 'Mon', cut: 12, stitched: 8 },
    { name: 'Tue', cut: 15, stitched: 10 },
    { name: 'Wed', cut: 8, stitched: 12 },
    { name: 'Thu', cut: 20, stitched: 15 },
    { name: 'Fri', cut: 18, stitched: 14 },
    { name: 'Sat', cut: 25, stitched: 20 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* KPI Cards */}
      <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-black-card border border-gold-800/30 p-4 rounded-lg">
          <h3 className="text-gold-700 text-xs uppercase tracking-widest font-bold mb-1">Total Orders</h3>
          <p className="text-2xl text-gold-100 font-serif">{orders.length}</p>
        </div>
        <div className="bg-black-card border border-gold-800/30 p-4 rounded-lg">
          <h3 className="text-gold-700 text-xs uppercase tracking-widest font-bold mb-1">In Production</h3>
          <p className="text-2xl text-gold-100 font-serif">
            {orders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.RETURNED).length}
          </p>
        </div>
        <div className="bg-black-card border border-gold-800/30 p-4 rounded-lg">
          <h3 className="text-gold-700 text-xs uppercase tracking-widest font-bold mb-1">Delivered (Mtd)</h3>
          <p className="text-2xl text-gold-100 font-serif">
             {orders.filter(o => o.status === OrderStatus.COMPLETED).length}
          </p>
        </div>
        <div className="bg-black-card border border-gold-800/30 p-4 rounded-lg">
          <h3 className="text-gold-700 text-xs uppercase tracking-widest font-bold mb-1">Payout Pending</h3>
          <p className="text-2xl text-gold-100 font-serif">₹ 14,250</p>
        </div>
      </div>

      {/* Charts */}
      <div className="bg-black-card border border-gold-800/30 p-6 rounded-lg shadow-lg">
        <h3 className="text-gold-400 font-serif mb-6">Order Status Breakdown</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#121212', borderColor: '#554000', color: '#D4A000' }}
                itemStyle={{ color: '#D4A000' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-gray-400">
          {pieData.map((entry, index) => (
            <div key={entry.name} className="flex items-center">
              <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
              {entry.name} ({entry.value})
            </div>
          ))}
        </div>
      </div>

      <div className="bg-black-card border border-gold-800/30 p-6 rounded-lg shadow-lg">
        <h3 className="text-gold-400 font-serif mb-6">Weekly Production Output</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyProduction}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2B2000" vertical={false} />
              <XAxis dataKey="name" stroke="#554000" tick={{fill: '#806000'}} axisLine={false} tickLine={false} />
              <YAxis stroke="#554000" tick={{fill: '#806000'}} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{fill: '#1a1a1a'}}
                contentStyle={{ backgroundColor: '#121212', borderColor: '#554000', color: '#D4A000' }}
              />
              <Bar dataKey="cut" stackId="a" fill="#D4A000" radius={[0, 0, 0, 0]} />
              <Bar dataKey="stitched" stackId="a" fill="#554000" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}; bhi
