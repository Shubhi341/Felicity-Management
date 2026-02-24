import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

const OrganizerDetails = () => {
    const { id } = useParams();
    const [organizer, setOrganizer] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            // Fetch Organizer Details (Public)
            const orgRes = await axios.get(`http://localhost:5000/api/participants/organizers/${id}`);
            setOrganizer(orgRes.data);

            // Check if following (if logged in as participant)
            const token = localStorage.getItem("token");
            if (token && localStorage.getItem("role") === "participant") {
                const profileRes = await axios.get("http://localhost:5000/api/participants/profile", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const followedData = profileRes.data.followedOrganizers || [];
                const isFound = followedData.some(org =>
                    (typeof org === 'object' ? org._id : org) === id
                );
                setIsFollowing(isFound);
            }

            // Fetch All Events and Filter
            const eventsRes = await axios.get("http://localhost:5000/api/events");
            const orgEvents = eventsRes.data.filter(e =>
                (e.organizer && String(e.organizer._id) === id) ||
                (e.organizer && String(e.organizer) === id)
            );
            setEvents(orgEvents);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching data", error);
            if (error.response && error.response.status === 404) {
                // handled in render
            }
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return alert("Login to follow");

            const res = await axios.post(`http://localhost:5000/api/participants/organizers/${id}/follow`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.isFollowing) {
                setIsFollowing(true);
                alert("Followed!");
            } else {
                setIsFollowing(false);
                alert("Unfollowed!");
            }
        } catch (error) {
            alert("Error updating follow status");
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
    if (!organizer) {
        return (
            <div className="p-8 text-center bg-red-50 rounded border border-red-200 text-red-600 m-8">
                <h2 className="text-xl font-bold mb-2">Organizer Not Found</h2>
                <p>The requested organizer details (ID: {id}) could not be retrieved.</p>
                <Link to="/organizers" className="mt-4 inline-block text-blue-600 hover:underline">
                    &larr; Back to Clubs List
                </Link>
            </div>
        );
    }

    // Split events
    const upcomingEvents = events.filter(e => new Date(e.startDate) > new Date());
    const pastEvents = events.filter(e => new Date(e.endDate) < new Date());

    return (
        <div className="container mx-auto p-6 max-w-5xl">
            {/* Header / Profile Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-10">
                <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-8 text-white">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">{organizer.organizerName || `${organizer.firstName} ${organizer.lastName}`}</h1>
                            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium border border-white/30">
                                {organizer.category || "General"}
                            </span>
                        </div>
                    </div>
                    {/* Follow Button */}
                    {localStorage.getItem("role") === "participant" && (
                        <button
                            onClick={handleFollow}
                            className={`px-6 py-2 rounded-full font-bold shadow-lg transition transform hover:scale-105 ${isFollowing
                                ? "bg-white text-blue-800 hover:bg-gray-100"
                                : "bg-orange-500 text-white hover:bg-orange-600"
                                }`}
                        >
                            {isFollowing ? "Following" : "+ Follow"}
                        </button>
                    )}
                </div>
            </div>
            <div className="p-8">
                <h2 className="text-gray-500 text-sm font-bold uppercase tracking-wide mb-2">About</h2>
                <p className="text-gray-700 leading-relaxed max-w-3xl mb-6">
                    {organizer.description || "No description provided."}
                </p>

                <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    <a href={`mailto:${organizer.contactEmail}`} className="hover:text-blue-600 transition truncate">
                        {organizer.contactEmail || <span className="italic text-gray-400">No contact email available</span>}
                    </a>
                </div>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                {/* Upcoming Events */}
                <div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        📅 Upcoming Events
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{upcomingEvents.length}</span>
                    </h3>
                    {upcomingEvents.length > 0 ? (
                        <div className="space-y-4">
                            {upcomingEvents.map(event => (
                                <Link to={`/events/${event._id}`} key={event._id} className="block group">
                                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-lg group-hover:text-blue-600 transition">{event.title}</h4>
                                                <p className="text-sm text-gray-500 mb-2">{new Date(event.startDate).toLocaleDateString()}</p>
                                            </div>
                                            <span className={`px-2 py-1 text-xs rounded font-medium ${event.eventType === 'merchandise' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                                {event.eventType}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 text-sm line-clamp-2">{event.description}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No upcoming events.</p>
                    )}
                </div>

                {/* Past Events */}
                <div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        🕰️ Past Events
                        <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{pastEvents.length}</span>
                    </h3>
                    {pastEvents.length > 0 ? (
                        <div className="space-y-4">
                            {pastEvents.map(event => (
                                <Link to={`/events/${event._id}`} key={event._id} className="block group">
                                    <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 hover:bg-white hover:shadow-sm transition opacity-80 hover:opacity-100">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-gray-700 group-hover:text-blue-600 transition">{event.title}</h4>
                                                <p className="text-sm text-gray-500 mb-2">{new Date(event.startDate).toLocaleDateString()}</p>
                                            </div>
                                            <span className="px-2 py-1 text-xs rounded font-medium bg-gray-200 text-gray-600">
                                                Ended
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No past events.</p>
                    )}
                </div>
            </div>
        </div >
    );
};

export default OrganizerDetails;
