import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function OngoingEvents() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:5000/api/organizer/events", {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Filter for ongoing events (status === 'ongoing' or based on date)
            // Assuming backend updates status logic or we filter by date here
            const now = new Date();
            const ongoing = res.data.filter(e => {
                const start = new Date(e.startDate);
                const end = new Date(e.endDate);
                return start <= now && end >= now;
            });
            setEvents(ongoing);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching events", error);
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="container mx-auto p-6 max-w-5xl">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Ongoing Events</h1>
            {events.length === 0 ? (
                <div className="bg-white p-8 rounded shadow text-center text-gray-500">
                    <p>No events are currently ongoing.</p>
                    <Link to="/create-event" className="text-blue-600 hover:underline mt-2 inline-block">Create one?</Link>
                </div>
            ) : (
                <div className="grid gap-6">
                    {events.map(event => (
                        <div key={event._id} className="bg-white p-6 rounded-xl shadow-md border border-green-200 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-green-700">{event.title}</h2>
                                <p className="text-gray-600">{new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}</p>
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-bold uppercase mt-2 inline-block">Ongoing</span>
                            </div>
                            <Link to={`/events/${event._id}`} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                                Manage Event
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default OngoingEvents;
