import { useState, useEffect } from 'react';
import axios from 'axios';

// --- TYPES ---
type Log = { id: string; action: string; details: string; timestamp: string };
type Booking = {
  id: string;
  service: string;
  status: string;
  provider: string | null;
  logs: Log[];
};

// --- CONFIG ---
const API_URL = 'http://localhost:4000';

function App() {
  const [view, setView] = useState<'CUSTOMER' | 'PROVIDER' | 'ADMIN'>('CUSTOMER');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [newService, setNewService] = useState('Home Cleaning');
  const [loading, setLoading] = useState(false);

  // Poll backend every 2 seconds to see status updates in real-time
  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API_URL}/bookings`);
      setBookings(res.data);
    } catch (err) {
      console.error("Server not connected");
    }
  };

  const createBooking = async () => {
    setLoading(true);
    await axios.post(`${API_URL}/bookings`, { service: newService });
    setLoading(false);
    alert('✅ Booking Request Sent! The system is now looking for a provider...');
    fetchBookings();
  };

  const updateStatus = async (id: string, status: string, actor: string) => {
    try {
      await axios.patch(`${API_URL}/bookings/${id}/status`, { status, actor });
      fetchBookings();
    } catch (err: any) {
      alert(`❌ Error: ${err.response?.data?.error || "Unknown error"}`);
    }
  };

  return (
    <div className="min-h-screen p-8 font-sans text-gray-800">
      
      {/* --- HEADER --- */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-extrabold text-blue-900">⚡ On-Demand Service</h1>
        
        {/* Role Switcher Buttons */}
        <div className="bg-white p-1 rounded-lg shadow-sm border border-gray-200">
          {['CUSTOMER', 'PROVIDER', 'ADMIN'].map((role) => (
            <button
              key={role}
              onClick={() => setView(role as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === role 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {role} View
            </button>
          ))}
        </div>
      </div>

      {/* --- SCREEN 1: CUSTOMER (Create Booking) --- */}
      {view === 'CUSTOMER' && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 max-w-lg mx-auto mb-10">
          <h2 className="text-xl font-bold mb-4">Book a Service</h2>
          <div className="flex gap-2">
            <select 
              className="flex-1 p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
            >
              <option>🧹 Home Cleaning</option>
              <option>🚰 Plumbing Repair</option>
              <option>⚡ Electrician</option>
              <option>🌳 Gardening</option>
            </select>
            <button 
              onClick={createBooking}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? '...' : 'Book Now'}
            </button>
          </div>
        </div>
      )}

      {/* --- SCREEN 2: DASHBOARD (List of Bookings) --- */}
      <h3 className="text-xl font-bold mb-4 text-gray-700">Live Dashboard</h3>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {bookings.map((booking) => (
          <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
            
            {/* Card Header */}
            <div className={`p-4 border-b flex justify-between items-center ${
              booking.status === 'COMPLETED' ? 'bg-green-50' : 
              booking.status === 'PENDING' ? 'bg-yellow-50' : 'bg-blue-50'
            }`}>
              <span className="font-bold text-gray-800">{booking.service}</span>
              <span className={`px-2 py-1 text-xs font-bold rounded uppercase tracking-wider ${
                 booking.status === 'COMPLETED' ? 'text-green-700 bg-green-200' : 
                 booking.status === 'PENDING' ? 'text-yellow-700 bg-yellow-200' : 
                 'text-blue-700 bg-blue-200'
              }`}>
                {booking.status}
              </span>
            </div>

            {/* Card Body */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">👤</div>
                <div className="text-sm">
                  <p className="text-gray-500">Provider</p>
                  <p className="font-semibold">{booking.provider || "Waiting for match..."}</p>
                </div>
              </div>

              {/* ACTION BUTTONS (State Machine Triggers) */}
              <div className="flex flex-col gap-2">
                
                {/* Provider Workflow */}
                {view === 'PROVIDER' && booking.status === 'ASSIGNED' && (
                  <div className="flex gap-2">
                    <button onClick={() => updateStatus(booking.id, 'CONFIRMED', 'Provider')} className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Accept Job</button>
                    <button onClick={() => updateStatus(booking.id, 'PENDING', 'Provider')} className="flex-1 bg-red-100 text-red-600 py-2 rounded hover:bg-red-200">Reject</button>
                  </div>
                )}
                {view === 'PROVIDER' && booking.status === 'CONFIRMED' && (
                  <button onClick={() => updateStatus(booking.id, 'IN_PROGRESS', 'Provider')} className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">Start Job</button>
                )}
                {view === 'PROVIDER' && booking.status === 'IN_PROGRESS' && (
                  <button onClick={() => updateStatus(booking.id, 'COMPLETED', 'Provider')} className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">Complete Job</button>
                )}

                {/* Cancel / Admin Override */}
                {(view === 'ADMIN' || view === 'CUSTOMER') && !['COMPLETED', 'CANCELLED'].includes(booking.status) && (
                   <button onClick={() => updateStatus(booking.id, 'CANCELLED', view)} className="w-full border border-gray-300 text-gray-600 py-2 rounded hover:bg-gray-50 text-sm">
                     Cancel Booking
                   </button>
                )}
              </div>
            </div>

            {/* AUDIT LOGS (Observability) */}
            <div className="bg-gray-50 p-3 border-t text-xs text-gray-500 h-32 overflow-y-auto">
              <p className="font-bold text-gray-400 mb-2 uppercase tracking-wider text-[10px]">Audit Log</p>
              {booking.logs.map(log => (
                <div key={log.id} className="mb-2 pl-2 border-l-2 border-gray-300">
                  <span className="block text-gray-400 font-mono text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</span> 
                  <span className={log.details.includes('FAILED') ? 'text-red-500' : ''}>{log.details}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;