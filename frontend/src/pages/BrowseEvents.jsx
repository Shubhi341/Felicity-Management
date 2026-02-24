import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const BrowseEvents = () => {
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    // Filters
    const [filterType, setFilterType] = useState("all");
    const [eligibility, setEligibility] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [showFollowedOnly, setShowFollowedOnly] = useState(false);

    // Trending
    const [isTrending, setIsTrending] = useState(false);

    // User Data
    const [followedOrganizers, setFollowedOrganizers] = useState([]);

    useEffect(() => {
        fetchEvents();
        fetchUserData();
    }, []);

    useEffect(() => {
        if (isTrending) {
            fetchTrendingEvents();
        } else {
            fetchEvents(); // Re-fetch all normal events
        }
    }, [isTrending]);

    const fetchEvents = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/events");
            setEvents(response.data);
            setFilteredEvents(response.data);
        } catch (error) {
            console.error("Error fetching events", error);
        }
    };

    const fetchTrendingEvents = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/events/trending");
            setEvents(response.data);
            setFilteredEvents(response.data);
        } catch (error) {
            console.error("Error fetching trending events", error);
        }
    };

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem("token");
            if (token) {
                const response = await axios.get("http://localhost:5000/api/participants/profile", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFollowedOrganizers(response.data.followedOrganizers || []);
            }
        } catch (error) {
            console.error("Error fetching user data", error);
        }
    };

    useEffect(() => {
        let result = events;

        // 1. Search
        if (searchTerm) {
            result = result.filter(e =>
                e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (e.organizer && (e.organizer.organizerName || e.organizer.firstName).toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // 2. Type Filter
        if (filterType !== "all") {
            result = result.filter(e => e.eventType === filterType);
        }

        // 3. Eligibility Filter
        if (eligibility !== "all") {
            result = result.filter(e => e.eligibility && e.eligibility.toLowerCase().includes(eligibility.toLowerCase()));
        }

        // 4. Date Range
        if (startDate) {
            result = result.filter(e => new Date(e.startDate) >= new Date(startDate));
        }
        if (endDate) {
            result = result.filter(e => new Date(e.endDate) <= new Date(endDate));
        }

        // 5. Followed Clubs Only
        if (showFollowedOnly) {
            const followedIds = followedOrganizers.map(org => typeof org === 'object' ? org._id : org);
            result = result.filter(e => e.organizer && followedIds.includes(e.organizer._id));
        }

        setFilteredEvents(result);
    }, [searchTerm, filterType, eligibility, startDate, endDate, showFollowedOnly, events, followedOrganizers]);

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Browse Events</h1>
                <button
                    onClick={() => setIsTrending(!isTrending)}
                    className={`px-4 py-2 rounded-full font-bold transition flex items-center gap-2 ${isTrending ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    🔥 {isTrending ? "Trending (Top 5)" : "Show Trending"}
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="Search events, organizers..."
                        className="p-2 border rounded w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    <select
                        className="p-2 border rounded w-full"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="all">All Types</option>
                        <option value="normal">Normal Events</option>
                        <option value="merchandise">Merchandise</option>
                    </select>

                    <select
                        className="p-2 border rounded w-full"
                        value={eligibility}
                        onChange={(e) => setEligibility(e.target.value)}
                    >
                        <option value="all">All Eligibility</option>
                        <option value="Open to all">Open to All</option>
                        <option value="IIIT Only">IIIT Only</option>
                    </select>

                    <label className="flex items-center space-x-2 cursor-pointer p-2 border rounded hover:bg-gray-50">
                        <input
                            type="checkbox"
                            checked={showFollowedOnly}
                            onChange={(e) => setShowFollowedOnly(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-700">Followed Clubs Only</span>
                    </label>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="font-bold">Date Range:</span>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border rounded p-1"
                    />
                    <span>to</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border rounded p-1"
                    />
                    <button
                        onClick={() => { setStartDate(""); setEndDate(""); }}
                        className="text-xs text-blue-500 hover:underline ml-2"
                    >
                        Clear Dates
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map(event => (
                    <div key={event._id} className="border rounded shadow-md p-4 bg-white hover:shadow-lg transition">
                        <div className="flex justify-between items-start mb-2">
                            <h2 className="text-xl font-bold">{event.title}</h2>
                            <span className={`px-2 py-1 text-xs rounded ${event.eventType === 'merchandise' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                {event.eventType}
                            </span>
                        </div>
                        <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>
                        <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                            <span>{new Date(event.startDate).toLocaleDateString()}</span>
                            <span>{event.organizer?.organizerName || event.organizer?.firstName || "Organizer"}</span>
                        </div>
                        <Link
                            to={`/events/${event._id}`}
                            className="block text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                        >
                            View Details
                        </Link>
                    </div>
                ))}
            </div>

            {filteredEvents.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No events found matching your criteria.</p>
                    <button
                        onClick={() => {
                            setSearchTerm("");
                            setFilterType("all");
                            setEligibility("all");
                            setStartDate("");
                            setEndDate("");
                            setShowFollowedOnly(false);
                            setIsTrending(false);
                        }}
                        className="mt-4 text-blue-600 font-bold hover:underline"
                    >
                        Clear all filters
                    </button>
                </div>
            )}
        </div>
    );
};

export default BrowseEvents;
