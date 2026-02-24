import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const OrganizersList = () => {
    const [organizers, setOrganizers] = useState([]);
    const [followed, setFollowed] = useState([]); // Array of IDs

    useEffect(() => {
        fetchOrganizers();
        fetchProfile(); // to check followed status
    }, []);

    const fetchOrganizers = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/participants/organizers");
            setOrganizers(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("token");
            if (token) {
                const response = await axios.get("http://localhost:5000/api/participants/profile", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const followedData = response.data.followedOrganizers || [];
                // Handle both populated objects and ID strings
                const followedIds = followedData.map(org => typeof org === 'object' ? org._id : org);
                setFollowed(followedIds);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleFollow = async (id) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return alert("Login to follow");

            const res = await axios.post(`http://localhost:5000/api/participants/organizers/${id}/follow`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.isFollowing) {
                setFollowed([...followed, id]);
                alert("Followed!");
            } else {
                setFollowed(followed.filter(fid => fid !== id));
                alert("Unfollowed!");
            }
        } catch (error) {
            alert("Error updating follow status");
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Clubs/Organizers</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {organizers.map(org => (
                    <div key={org._id} className="bg-white p-6 rounded shadow-md border hover:shadow-lg transition">
                        <div className="flex justify-between items-start mb-2">
                            <Link to={`/organizers/${org._id}`} className="text-xl font-bold hover:text-blue-600 transition">
                                {org.organizerName || `${org.firstName} ${org.lastName}`}
                            </Link>
                            <span className="text-xs bg-gray-200 px-2 py-1 rounded">{org.category}</span>
                        </div>
                        <p className="text-gray-600 mb-4 line-clamp-3">{org.description}</p>
                        <p className="text-sm text-gray-500 mb-4">{org.contactEmail}</p>
                        {/* Only Participants can follow */}
                        {localStorage.getItem("role") === "participant" && (
                            <button
                                onClick={() => handleFollow(org._id)}
                                className={`w-full py-2 rounded font-semibold ${followed.includes(org._id) ? 'bg-gray-200 text-gray-800' : 'bg-blue-600 text-white'}`}
                            >
                                {followed.includes(org._id) ? "Following" : "Follow"}
                            </button>
                        )}
                    </div>
                ))}
            </div>
            {organizers.length === 0 && <p>No organizers found.</p>}
        </div>
    );
};

export default OrganizersList;
