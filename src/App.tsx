import React, { useState } from 'react';
import { UniversalDashboard } from './components/UniversalDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { ShowroomDashboard } from './components/ShowroomDashboard';
import { MeasurementDashboard } from './components/MeasurementDashboard';
import {
  Role,
  Order,
  UserProfile,
  PaymentRequest,
  OrderStatus,
  ItemType
} from './types';
import {
  MOCK_ORDERS_V2,
  MOCK_USERS,
  MOCK_PAYMENT_REQUESTS,
  DEFAULT_INCOME_SETTINGS
} from './constants';
import {
  Crown,
  Shield,
  Scissors,
  User,
  Calendar,
  Check,
  Clock,
  MapPin,
  Lock,
  X,
  Phone,
  Plus
} from 'lucide-react';

/* ---------------- ALTERATION SERVICES ---------------- */

const ALTERATION_SERVICES = [
  { id: 1, name: 'Pant Mohri (Narrow)', price: 30 },
  { id: 2, name: 'Pant Waist (Tight/Loose)', price: 30 },
  { id: 3, name: 'Pant Side Fitting (Formal)', price: 50 },
  { id: 4, name: 'Pant Side Fitting (Jeans)', price: 30 },
  { id: 5, name: 'Pant Zip Change (Formal)', price: 50 },
  { id: 6, name: 'Pant Zip Change (Jeans)', price: 70 },
  { id: 7, name: 'Shirt Fitting (with Overlock)', price: 30 },
  { id: 8, name: 'Shirt Cutting (Length)', price: 20 },
  { id: 9, name: 'Shirt Combo (Full Set)', price: 60 },
  { id: 10, name: 'Pant Combo (Full Set)', price: 100 },
];

/* ---------------- APP ---------------- */

const App: React.FC = () => {
  const [viewMode, setViewMode] =
    useState<'LANDING' | 'LOGIN' | 'DASHBOARD'>('LANDING');

  const [currentUser, setCurrentUser] =
    useState<UserProfile | null>(null);

  const [orders, setOrders] =
    useState<Order[]>(MOCK_ORDERS_V2);

  const [users] =
    useState<UserProfile[]>(MOCK_USERS);

  const [paymentRequests] =
    useState<PaymentRequest[]>(MOCK_PAYMENT_REQUESTS);

  /* ---------------- LOGIN ---------------- */

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRole, setLoginRole] = useState<Role | null>(null);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const initiateLogin = (role: Role) => {
    setLoginRole(role);
    setLoginPassword('');
    setLoginError('');
    setShowLoginModal(true);
  };

  const verifyLogin = () => {
    if (!loginRole) return;

    const user = users.find(u => u.role === loginRole);

    if (!user) {
      setLoginError('User not configured for this role');
      return;
    }

    // demo password = role name
    if (loginPassword !== loginRole) {
      setLoginError('Invalid password');
      return;
    }

    setCurrentUser(user);
    setViewMode('DASHBOARD');
    setShowLoginModal(false);
  };

  /* ---------------- BOOKING ---------------- */

  const [booking, setBooking] = useState({
    name: '',
    mobile: '',
    address: '',
    date: '',
    time: '',
    selectedServices: [] as number[],
  });

  const toggleService = (id: number) => {
    setBooking(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(id)
        ? prev.selectedServices.filter(s => s !== id)
        : [...prev.selectedServices, id],
    }));
  };

  const handleWhatsAppBooking = () => {
    if (
      !booking.name ||
      !booking.mobile ||
      !booking.address ||
      !booking.date ||
      !booking.time ||
      booking.selectedServices.length === 0
    ) {
      alert('Please fill all details');
      return;
    }

    const services = booking.selectedServices
      .map(id => {
        const s = ALTERATION_SERVICES.find(a => a.id === id);
        return `${s?.name} (₹${s?.price})`;
      })
      .join(', ');

    const total = booking.selectedServices.reduce((sum, id) => {
      const s = ALTERATION_SERVICES.find(a => a.id === id);
      return sum + (s ? s.price : 0);
    }, 0);

    const message =
      `*New Alteration Booking*%0A` +
      `👤 ${booking.name}%0A` +
      `📱 ${booking.mobile}%0A` +
      `📍 ${booking.address}%0A` +
      `📅 ${booking.date} ${booking.time}%0A%0A` +
      `✂️ ${services}%0A` +
      `💰 Total: ₹${total}`;

    window.open(
      `https://wa.me/919054301848?text=${message}`,
      '_blank'
    );
  };

  /* ---------------- DASHBOARD SWITCH ---------------- */

  if (viewMode === 'DASHBOARD' && currentUser) {
    if (currentUser.role === Role.ADMIN)
      return <AdminDashboard user={currentUser} />;

    if (currentUser.role === Role.SHOWROOM)
      return <ShowroomDashboard user={currentUser} />;

    if (currentUser.role === Role.MEASUREMENT)
      return <MeasurementDashboard user={currentUser} />;

    return <UniversalDashboard user={currentUser} />;
  }

  /* ---------------- LANDING ---------------- */

  return (
    <div className="min-h-screen flex items-center justify-center text-center">
      <div>
        <h1 className="text-4xl font-bold mb-6">
          LORDS BESPOKE TAILOR SYSTEM
        </h1>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => initiateLogin(Role.ADMIN)}
            className="px-6 py-3 bg-yellow-600 rounded"
          >
            Admin Login
          </button>

          <button
            onClick={() => initiateLogin(Role.SHOWROOM)}
            className="px-6 py-3 bg-blue-600 rounded"
          >
            Showroom Login
          </button>

          <button
            onClick={() => initiateLogin(Role.MEASUREMENT)}
            className="px-6 py-3 bg-green-600 rounded"
          >
            Measurement Login
          </button>
        </div>

        {showLoginModal && (
          <div className="mt-6">
            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
              className="px-4 py-2 text-black"
            />
            <button
              onClick={verifyLogin}
              className="ml-2 px-4 py-2 bg-black text-white"
            >
              Login
            </button>
            {loginError && (
              <p className="text-red-500 mt-2">{loginError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
