import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import QRCode from "react-qr-code";

function ParticipantDashboard() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [activeTab, setActiveTab] = useState("upcoming"); // 'upcoming' or 'history'
  const [historyFilter, setHistoryFilter] = useState("all"); // 'all', 'normal', 'merchandise', 'completed', 'cancelled'

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/registrations/my",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRegistrations(response.data);
      setLoading(false);
    } catch (error) {
      console.log("Dashboard error:", error.response?.data || error.message);
      setLoading(false);
    }
  };

  // Helper to categorize
  const getFilteredRegistrations = () => {
    const now = new Date();

    // Separate into Upcoming and History logic
    // Upcoming: Future events, not rejected
    const upcoming = registrations.filter(reg => {
      if (!reg.event) return false;
      const endDate = new Date(reg.event.endDate);
      return endDate >= now && reg.paymentStatus !== 'rejected';
    });

    // History: Past events OR rejected/cancelled
    const history = registrations.filter(reg => {
      if (!reg.event) return false; // Handle deleted events
      const endDate = new Date(reg.event.endDate);
      return endDate < now || reg.paymentStatus === 'rejected';
    });

    if (activeTab === "upcoming") {
      return upcoming;
    } else {
      // History Filters
      if (historyFilter === "all") return history;
      if (historyFilter === "normal") return history.filter(r => r.event.eventType === "normal");
      if (historyFilter === "merchandise") return history.filter(r => r.event.eventType === "merchandise");
      if (historyFilter === "completed") return history.filter(r => r.paymentStatus === "successful" && new Date(r.event.endDate) < now);
      if (historyFilter === "cancelled") return history.filter(r => r.paymentStatus === "rejected");
      return history;
    }
  };

  const filteredData = getFilteredRegistrations();

  const EventCard = ({ reg }) => (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <div className="bg-gray-50 p-4 border-b border-gray-100">
        <div className="flex justify-between items-start mb-2">
          <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${reg.event?.eventType === 'merchandise' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
            {reg.event?.eventType}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full font-bold ${reg.paymentStatus === 'successful' ? 'bg-green-100 text-green-700' : reg.paymentStatus === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
            {reg.paymentStatus}
          </span>
        </div>
        <h4 className="font-bold text-lg text-gray-900 leading-tight hover:text-blue-600 transition">
          <Link to={`/events/${reg.event?._id}`}>{reg.event?.title || "Event Removed"}</Link>
        </h4>
        <div className="text-xs text-gray-500 mt-2 space-y-1">
          <p>📅 {new Date(reg.event?.startDate).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
          <p>👤 {reg.event?.organizer?.organizerName || `${reg.event?.organizer?.firstName} ${reg.event?.organizer?.lastName}`}</p>
        </div>
      </div>

      <div className="p-4 flex-1">
        <div className="space-y-2 text-sm text-gray-600">
          {reg.paymentStatus !== 'pending' ? (
            <p className="flex justify-between items-center bg-gray-50 p-2 rounded">
              <span className="font-medium">Ticket ID:</span>
              <span className="font-mono text-xs">{reg.ticketId}</span>
            </p>
          ) : (
            <p className="bg-yellow-50 text-yellow-700 p-2 rounded text-center text-xs font-semibold">
              Ticket ID will be generated upon organizers' approval.
            </p>
          )}

          {reg.merchandiseVariant && (
            <p className="flex justify-between">
              <span>Variant:</span>
              <span className="font-medium text-gray-900">{reg.merchandiseVariant} (x{reg.quantity})</span>
            </p>
          )}
          {reg.teamName && (
            <p className="flex justify-between">
              <span>Team:</span>
              <span className="font-medium">{reg.teamName}</span>
            </p>
          )}
        </div>
      </div>

      {/* QR Code Section */}
      {reg.paymentStatus !== 'pending' && (
        <div className="bg-gray-50 p-4 border-t border-gray-100 text-center">
          {selectedTicket === reg._id ? (
            <div className="animate-fade-in">
              <div className="bg-white p-3 inline-block border rounded shadow-sm mb-3">
                <QRCode value={reg.ticketId} size={128} />
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-sm text-gray-500 hover:text-gray-800 underline block w-full"
              >
                Close QR
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSelectedTicket(reg._id)}
              className="w-full bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-black transition"
            >
              View Ticket QR
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h2 className="text-3xl font-extrabold mb-8 text-gray-800 border-b pb-4">My Dashboard</h2>

      {/* Main Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => { setActiveTab("upcoming"); setHistoryFilter("all"); }}
          className={`px-6 py-2 rounded-lg font-bold transition ${activeTab === 'upcoming' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
        >
          Upcoming Events
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-6 py-2 rounded-lg font-bold transition ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
        >
          Participation History
        </button>
      </div>

      {/* Sub-Tabs for History */}
      {activeTab === "history" && (
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          {['all', 'normal', 'merchandise', 'completed', 'cancelled'].map(filter => (
            <button
              key={filter}
              onClick={() => setHistoryFilter(filter)}
              className={`px-4 py-1 rounded-full text-sm font-medium capitalize transition ${historyFilter === filter ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              {filter}
            </button>
          ))}
        </div>
      )}

      {/* Content Grid */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 min-h-[300px]">
        <h3 className="text-xl font-bold mb-6 text-gray-700 capitalize">
          {activeTab === 'upcoming' ? 'Upcoming Events' : `${historyFilter} History`}
        </h3>

        {filteredData.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-lg mb-4">No events found in this category.</p>
            <Link to="/browse-events" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition">
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredData.map((reg) => (
              <EventCard key={reg._id} reg={reg} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ParticipantDashboard;
