import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
    const [resetRequests, setResetRequests] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchResetRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchResetRequests = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const response = await fetch("http://localhost:5000/api/password-reset/pending", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setResetRequests(data);
            } else {
                console.error("Failed to fetch reset requests:", response.status);
            }
        } catch (error) {
            console.error("Failed to fetch reset requests:", error);
        }
    };

    const handleResolveReset = async (id, status) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await fetch(`http://localhost:5000/api/password-reset/${id}/resolve`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status }),
            });

            if (!res.ok) {
                const msg = await res.json().catch(() => ({}));
                alert(msg.message || "Action failed");
                return;
            }

            alert(`Request ${status}`);
            fetchResetRequests();
        } catch (error) {
            console.error(error);
            alert("Action failed");
        }
    };

    return (
        <div className="container mx-auto p-4">
            {/* Keep ONLY the title here.
          Logout is assumed to be in your Admin Navbar (to avoid duplicate button). */}
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

            {/* Password Reset Requests Section */}
            <div className="bg-white p-6 rounded shadow-md mb-6 border-l-4 border-yellow-500">
                <h2 className="text-xl font-semibold mb-4">Password Reset Requests</h2>

                {resetRequests.length === 0 ? (
                    <p className="text-gray-500">No pending requests.</p>
                ) : (
                    <div className="space-y-4">
                        {resetRequests.map((req) => (
                            <div
                                key={req._id}
                                className="border p-4 rounded flex justify-between items-center bg-gray-50"
                            >
                                <div>
                                    <p className="font-bold">{req.email}</p>
                                    <p className="text-xs text-gray-500">
                                        Requested: {new Date(req.createdAt).toLocaleString()}
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleResolveReset(req._id, "approved")}
                                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 font-bold text-sm"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleResolveReset(req._id, "rejected")}
                                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 font-bold text-sm"
                                    >
                                        Reject
                                    </button>
                                </div>
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

                <div className="bg-white p-6 rounded shadow-md border flex flex-col items-center justify-center h-32">
                    <h2 className="text-xl font-bold text-gray-700">System Statistics</h2>
                    <p className="text-gray-500 mt-2">Coming Soon...</p>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
