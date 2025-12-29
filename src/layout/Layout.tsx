import React, { ReactNode } from 'react';
import { Crown, Scissors, Users, BarChart3, Package, LogOut, Shirt, Truck, Ruler, Printer } from 'lucide-react';
import { Role } from '../types';

interface LayoutProps {
  children: ReactNode;
  currentUserRole: Role;
  setCurrentUserRole: (role: Role) => void;
  onLogout: () => void;
}

const NavItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 mb-2 transition-all duration-300 rounded-r-lg border-l-4 ${
      active
        ? 'border-gold-500 bg-gold-900/20 text-gold-400'
        : 'border-transparent text-gray-400 hover:text-gold-200 hover:bg-white/5'
    }`}
  >
    <Icon className="w-5 h-5 mr-3" />
    <span className="font-sans font-medium tracking-wide text-sm uppercase">{label}</span>
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ children, currentUserRole, setCurrentUserRole, onLogout }) => {
  return (
    <div className="flex h-screen bg-black-rich text-gray-200 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-black border-r border-gold-800/30 flex flex-col z-20 shadow-[4px_0_24px_rgba(212,160,0,0.05)]">
        <div className="p-8 flex flex-col items-center justify-center border-b border-gold-800/20">
          <Crown className="w-12 h-12 text-gold-500 mb-2 drop-shadow-[0_0_10px_rgba(212,160,0,0.5)]" />
          <h1 className="font-serif text-xl font-bold text-gold-400 text-center tracking-widest">LORD'S</h1>
          <p className="font-sans text-[10px] text-gold-700 tracking-[0.3em] uppercase mt-1">Bespoke Tailor</p>
        </div>

        <div className="flex-1 overflow-y-auto py-6">
          <div className="px-4 mb-4">
            <p className="text-xs font-bold text-gold-800 uppercase tracking-widest mb-2 px-2">Role Switcher (Demo)</p>
            <select
              value={currentUserRole}
              onChange={(e) => setCurrentUserRole(e.target.value as Role)}
              className="w-full bg-black-input text-xs text-gold-200 border border-gold-900 rounded p-2 focus:border-gold-500 focus:outline-none"
            >
              {Object.values(Role).map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <div className="px-2">
            <NavItem icon={BarChart3} label="Dashboard" active={true} onClick={() => {}} />
            {currentUserRole === Role.ADMIN && <NavItem icon={Users} label="Hierarchy" onClick={() => {}} />}
            {(currentUserRole === Role.ADMIN || currentUserRole === Role.SHOWROOM) && <NavItem icon={Users} label="Customers" onClick={() => {}} />}
            {(currentUserRole === Role.ADMIN || currentUserRole === Role.MATERIAL) && <NavItem icon={Package} label="Inventory" onClick={() => {}} />}
          </div>
        </div>

        <div className="p-4 border-t border-gold-800/20">
          <div className="flex items-center mb-4 px-4">
            <div className="w-8 h-8 rounded-full bg-gold-600/20 flex items-center justify-center border border-gold-600/50">
               <span className="text-gold-400 font-bold text-xs">{currentUserRole[0]}</span>
            </div>
            <div className="ml-3">
              <p className="text-xs font-bold text-gold-300">{currentUserRole}</p>
              <p className="text-[10px] text-gray-500">Online</p>
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center justify-center w-full py-2 px-4 rounded border border-red-900/30 text-red-700 hover:bg-red-900/10 hover:text-red-500 transition-colors text-xs uppercase tracking-wider">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold-900/10 via-black to-black">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-gold-900/30 px-8 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-gold-100 font-serif text-lg tracking-wide">
              {currentUserRole === Role.CUSTOMER ? 'Order Tracking Portal' : 'Operations Dashboard'}
            </h2>
            <p className="text-xs text-gray-500 font-sans mt-0.5">Welcome to the Lord's System v2025</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden md:block">
              <p className="text-gold-500 text-xs font-bold font-serif">{new Date().toDateString()}</p>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
