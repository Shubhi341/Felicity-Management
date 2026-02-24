import { useState, useEffect } from "react";
import axios from "axios";

const ManageClubs = () => {
    const [organizers, setOrganizers] = useState([]);
    const [formData, setFormData] = useState({ organizerName: "", contactNumber: "" });
    const [newCredentials, setNewCredentials] = useState(null); // { email, password }
    const [error, setError] = useState("");

    useEffect(() => {
        fetchOrganizers();
    }, []);

    const fetchOrganizers = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/participants/organizers");
            setOrganizers(res.data);
        } catch (err) {
            console.error("Error fetching organizers", err);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setError("");
        setNewCredentials(null);

        try {
            const token = localStorage.getItem("token");
            const res = await axios.post("http://localhost:5000/api/participants/admin/organizers", formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setNewCredentials({
                email: res.data.organizer.email,
                password: res.data.temporaryPassword
            });
            fetchOrganizers();
            setFormData({ organizerName: "", contactNumber: "" }); // Reset form
        } catch (err) {
            setError(err.response?.data?.message || "Error creating organizer");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This cannot be undone.")) return;

        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://localhost:5000/api/participants/admin/organizers/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchOrganizers();
        } catch (err) {
            alert("Error deleting organizer");
        }
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Manage Clubs / Organizers</h1>

            {/* Success Modal / Banner for New Credentials */}
            {newCredentials && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-6 mb-8 rounded shadow-lg relative">
                    <button
                        onClick={() => setNewCredentials(null)}
                        className="absolute top-2 right-2 text-green-700 font-bold"
                    >
                        ✕
                    </button>
                    <h2 className="font-bold text-xl mb-2">🎉 Organizer Created Successfully!</h2>
                    <p className="mb-4">Please copy these credentials and share them with the organizer. <br /> <span className="font-bold text-red-600">This is the ONLY time the password will be shown.</span></p>
                    <div className="bg-white p-4 rounded border font-mono">
                        <p><strong>Email:</strong> {newCredentials.email}</p>
                        <p><strong>Password:</strong> {newCredentials.password}</p>
                    </div>
                </div>
            )}

            {/* Create Form */}
            <div className="bg-white p-6 rounded shadow-md mb-10">
                <h2 className="text-xl font-semibold mb-4">Add New Organizer</h2>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        className="p-2 border rounded"
                        placeholder="Club Name"
                        value={formData.organizerName}
                        onChange={e => setFormData({ ...formData, organizerName: e.target.value })}
                        required
                    />
                    <input
                        className="p-2 border rounded"
                        placeholder="Contact Number"
                        value={formData.contactNumber}
                        onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                        required
                    />
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded md:col-span-1 hover:bg-blue-700 transition">
                        Create Organizer
                    </button>
                </form>
            </div>

            {/* List */}
            <h2 className="text-2xl font-bold mb-4">Existing Organizers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {organizers.map(org => (
                    <div key={org._id} className="bg-white p-6 rounded shadow-sm border hover:shadow-md transition flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-lg">{org.organizerName || org.firstName}</h3>
                            <p className="text-gray-500 text-sm">{org.email}</p>
                            <p className="text-gray-400 text-xs mt-1">ID: {org._id}</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => window.location.href = `/organizers/${org._id}`}
                                className="text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded text-sm font-medium border border-blue-200"
                            >
                                View
                            </button>
                            <button
                                onClick={() => handleDelete(org._id)}
                                className="text-red-500 hover:text-red-700 bg-red-50 px-3 py-1 rounded text-sm font-medium border border-red-200"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ManageClubs;
