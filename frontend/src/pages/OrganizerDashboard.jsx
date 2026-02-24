import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import PaymentManagement from "../components/PaymentManagement";
import AttendanceScanner from "../components/AttendanceScanner";

function OrganizerDashboard() {
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState({ totalEvents: 0, totalRegistrations: 0, totalRevenue: 0, totalAttendance: 0 });
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [eventsRes, statsRes, registrationsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/organizer/events", { headers }),
        axios.get("http://localhost:5000/api/organizer/dashboard/stats", { headers }),
        axios.get("http://localhost:5000/api/organizer/registrations", { headers })
      ]);

      console.log("Events Response:", eventsRes.data);
      console.log("Stats Response:", statsRes.data);
      console.log("Registrations Response:", registrationsRes.data);

      setEvents(eventsRes.data);
      setStats(statsRes.data);
      setRegistrations(registrationsRes.data);
      setLoading(false);
    } catch (error) {
      console.error("Organizer Dashboard error:", error);
      setLoading(false);
    }
  };

  const publishEvent = async (eventId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:5000/api/events/${eventId}/publish`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData(); // Refresh
      alert("Event Published!");
    } catch (error) {
      alert(error.response?.data?.message || "Publish failed");
    }
  };

  // New function to get registration count for an event
  const getEventRegistrationCount = (eventId) => {
    const eventRegistrations = registrations.find(group => group.event._id === eventId);
    return eventRegistrations ? eventRegistrations.registrations.length : 0;
  };

  // New function to update payment status
  const updatePaymentStatus = async (registrationId, status) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:5000/api/registrations/${registrationId}/payment-status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData(); // Refresh data
      alert(`Payment status updated to ${status}`);
    } catch (error) {
      console.error("Error updating payment status:", error);
      alert(error.response?.data?.message || "Failed to update payment status");
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header Stats */}
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-3xl font-extrabold text-gray-800">Organizer Dashboard</h1>
        <div className="flex gap-4">
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-center min-w-[100px]">
            <p className="text-xs font-bold uppercase">Events</p>
            <p className="text-xl font-bold">{stats.totalEvents}</p>
          </div>
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-center min-w-[100px]">
            <p className="text-xs font-bold uppercase">Registrations</p>
            <p className="text-xl font-bold">{stats.totalRegistrations}</p>
          </div>
          <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-center min-w-[100px]">
            <p className="text-xs font-bold uppercase">Revenue</p>
            <p className="text-xl font-bold">₹{stats.totalRevenue || 0}</p>
          </div>
          <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg text-center min-w-[100px]">
            <p className="text-xs font-bold uppercase">Attendance</p>
            <p className="text-xl font-bold">{stats.totalAttendance || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Events List */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-700">Your Events</h2>
            <Link to="/create-event" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-medium">
              + Create Event
            </Link>
          </div>

          {events.length === 0 ? (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
              <p className="text-gray-500 mb-4">You haven't created any events yet.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {events.map(event => (
                <div key={event._id} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${event.eventType === 'merchandise' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {event.eventType}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm mb-2">
                      {new Date(event.startDate).toLocaleDateString()} - {event.status}
                    </p>
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>{getEventRegistrationCount(event._id)}</strong> registrations
                    </div>

                    {event.eventType === 'merchandise' && event.merchandiseVariants && event.merchandiseVariants.length > 0 && (
                      <div className="bg-purple-50 p-3 rounded border border-purple-100 mt-2 text-sm">
                        <strong className="text-purple-800 block mb-1">Stock Remaining:</strong>
                        <ul className="space-y-1">
                          {event.merchandiseVariants.map((v, i) => (
                            <li key={i} className="flex justify-between text-purple-900">
                              <span>{v.variantName} {v.color ? `(${v.color})` : ''} {v.size ? `[${v.size}]` : ''}</span>
                              <span className={`font-mono font-bold ${v.stock < 10 ? 'text-red-500' : 'text-green-600'}`}>{v.stock}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center items-end">
                    <Link to={`/events/${event._id}`} className="text-blue-600 font-bold hover:underline mb-2">
                      View Details
                    </Link>
                    {(event.status === 'draft' || event.status === 'published') && (
                      <Link to={`/organizer/edit-event/${event._id}`} className="text-gray-600 font-bold hover:underline mb-2 text-sm">
                        Edit
                      </Link>
                    )}
                    {event.status === 'draft' && (
                      <button
                        onClick={() => publishEvent(event._id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition shadow-sm"
                      >
                        Publish Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pending Payments Section */}
          {registrations.some(group => group.registrations.some(r => r.paymentStatus === 'pending')) && (
            <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-yellow-500">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Pending Payments</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                    <tr>
                      <th className="p-3">Event</th>
                      <th className="p-3">Participant</th>
                      <th className="p-3">Item</th>
                      <th className="p-3">Proof</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {registrations.flatMap(group =>
                      group.registrations.filter(r => r.paymentStatus === 'pending').map(reg => (
                        <tr key={reg._id} className="hover:bg-gray-50">
                          <td className="p-3 font-medium">{group.event.title}</td>
                          <td className="p-3">
                            <div className="text-sm font-bold">{reg.participant.firstName} {reg.participant.lastName}</div>
                            <div className="text-xs text-gray-500">{reg.participant.email}</div>
                          </td>
                          <td className="p-3 text-sm">{reg.merchandiseVariant} (x{reg.quantity})</td>
                          <td className="p-3">
                            {reg.paymentProofUrl ? (
                              <a href={`http://localhost:5000${reg.paymentProofUrl}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">
                                View Proof
                              </a>
                            ) : (
                              <span className="text-gray-400 text-xs">No Proof</span>
                            )}
                          </td>
                          <td className="p-3 flex gap-2">
                            <button onClick={() => updatePaymentStatus(reg._id, 'approved')} className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600">Approve</button>
                            <button onClick={() => updatePaymentStatus(reg._id, 'rejected')} className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600">Reject</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Scanner */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-blue-600 sticky top-24">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Attendance Scanner</h2>
              <button
                onClick={() => setShowScanner(!showScanner)}
                className={`text-sm px-3 py-1 rounded-full font-bold transition ${showScanner ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
              >
                {showScanner ? "Close Scanner" : "Open Scanner"}
              </button>
            </div>

            {showScanner ? (
              <AttendanceScanner />
            ) : (
              <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg dashed-border">
                <p>Scanner is closed.</p>
                <button onClick={() => setShowScanner(true)} className="mt-2 text-blue-600 font-bold hover:underline">
                  Start Scanning
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrganizerDashboard;

