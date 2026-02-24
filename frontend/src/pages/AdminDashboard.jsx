import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AdminDashboard = () => {
    const [resetRequests, setResetRequests] = useState([]);
    const [adminComments, setAdminComments] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        fetchResetRequests();
    }, []);

    const fetchResetRequests = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await axios.get("http://localhost:5000/api/password-reset", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setResetRequests(res.data);
        } catch (error) {
            console.error("Failed to fetch reset requests:", error);
        }
    };

    const handleCommentChange = (id, value) => {
        setAdminComments(prev => ({ ...prev, [id]: value }));
    };

    const handleResolveReset = async (id, status) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const comment = adminComments[id] || "";

            const res = await axios.patch(`http://localhost:5000/api/password-reset/${id}`,
                { status, adminComment: comment },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (status === "Approved" && res.data.newPassword) {
                // VERY IMPORTANT: Admin needs to see this to share with organizer
                alert(`SUCCESS! Request Approved.\n\nTEMPORARY PASSWORD GENERATED:\n${res.data.newPassword}\n\nPlease securely copy this and send it to the organizer.`);
            } else {
                alert(`Request ${status} successfully.`);
            }

            // Clear comment for this ID and refresh
            setAdminComments(prev => {
                const updated = { ...prev };
                delete updated[id];
                return updated;
            });
            fetchResetRequests();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Action failed");
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

            {/* Password Reset Requests Section */}
            <div className="bg-white p-6 rounded shadow-md mb-6 border-l-4 border-yellow-500">
                <h2 className="text-xl font-semibold mb-4">Organizer Password Reset Requests</h2>

                {resetRequests.length === 0 ? (
                    <p className="text-gray-500">No requests overall.</p>
                ) : (
                    <div className="space-y-4">
                        {resetRequests.map((req) => (
                            <div
                                key={req._id}
                                className={`border p-4 rounded bg-gray-50 flex flex-col md:flex-row justify-between gap-4 
                                    ${req.status === 'Approved' ? 'border-green-300 bg-green-50' : ''}
                                    ${req.status === 'Rejected' ? 'border-red-300 bg-red-50' : ''}
                                `}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <p className="font-bold text-lg">{req.organizer?.clubName || "Unknown Club"}</p>
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full 
                                            ${req.status === 'Pending' ? 'bg-yellow-200 text-yellow-800' : ''}
                                            ${req.status === 'Approved' ? 'bg-green-200 text-green-800' : ''}
                                            ${req.status === 'Rejected' ? 'bg-red-200 text-red-800' : ''}
                                        `}>
                                            {req.status}
                                        </span>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700">{req.organizer?.email || "Unknown Email"}</p>
                                    <p className="text-sm text-gray-600 mt-2"><span className="font-bold">Reason:</span> {req.reason}</p>
                                    <p className="text-xs text-gray-400 mt-1">Requested: {new Date(req.createdAt).toLocaleString()}</p>

                                    {req.status !== 'Pending' && req.adminComment && (
                                        <p className="text-sm text-blue-700 mt-2 bg-blue-50 p-2 rounded"><span className="font-bold">Admin Comment:</span> {req.adminComment}</p>
                                    )}
                                </div>

                                {req.status === 'Pending' && (
                                    <div className="flex flex-col gap-2 min-w-[250px]">
                                        <input
                                            type="text"
                                            placeholder="Optional Admin Comment..."
                                            className="w-full text-sm p-2 border rounded"
                                            value={adminComments[req._id] || ""}
                                            onChange={(e) => handleCommentChange(req._id, e.target.value)}
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleResolveReset(req._id, "Approved")}
                                                className="flex-1 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 font-bold text-sm shadow transition"
                                            >
                                                Approve & Generate
                                            </button>
                                            <button
                                                onClick={() => handleResolveReset(req._id, "Rejected")}
                                                className="flex-1 bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 font-bold text-sm shadow transition"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Links Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                    onClick={() => navigate("/admin/clubs")}
                    className="bg-blue-600 text-white p-6 rounded shadow-md cursor-pointer hover:bg-blue-700 transition flex flex-col items-center justify-center h-32"
                >
                    <h2 className="text-2xl font-bold">Manage Clubs</h2>
                    <p className="mt-2 text-blue-100">Add, Remove, View Organizers</p>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
