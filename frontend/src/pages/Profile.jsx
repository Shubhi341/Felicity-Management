import { useState, useEffect } from "react";
import axios from "axios";

const Profile = () => {
    const [profile, setProfile] = useState({});
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        contactNumber: "",
        collegeName: "",
        organizerName: "",
        category: "",
        description: "",
        contactEmail: ""
    });
    const [passData, setPassData] = useState({ currentPassword: "", newPassword: "" });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("http://localhost:5000/api/participants/profile", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(response.data);
            setFormData(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching profile", error);
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            await axios.put("http://localhost:5000/api/participants/profile", formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Profile Updated Successfully");
            fetchProfile();
        } catch (error) {
            alert("Update Failed");
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            await axios.put("http://localhost:5000/api/participants/change-password", passData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Password Changed Successfully");
            setPassData({ currentPassword: "", newPassword: "" });
        } catch (error) {
            alert(error.response?.data?.message || "Password Change Failed");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <h1 className="text-2xl font-bold mb-6">My Profile</h1>

            <div className="bg-white p-6 rounded shadow-md mb-6">
                <h2 className="text-xl font-semibold mb-4">Edit Details</h2>
                <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <label className="text-sm text-gray-600">Email (Read-Only)</label>
                            <input
                                className="p-2 border rounded bg-gray-100 cursor-not-allowed"
                                value={profile.email || ""}
                                readOnly
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm text-gray-600">Participant Type (Read-Only)</label>
                            <input
                                className="p-2 border rounded bg-gray-100 cursor-not-allowed"
                                value={profile.participantType || "N/A"}
                                readOnly
                            />
                        </div>
                    </div>

                    <input
                        className="p-2 border rounded"
                        value={formData.firstName || ""}
                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="First Name"
                    />
                    <input
                        className="p-2 border rounded"
                        value={formData.lastName || ""}
                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Last Name"
                    />
                    <input
                        className="p-2 border rounded"
                        value={formData.contactNumber || ""}
                        onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                        placeholder="Contact Number"
                    />
                    {profile.role === 'participant' && (
                        <>
                            <input
                                className="p-2 border rounded"
                                value={formData.collegeName || ""}
                                onChange={e => setFormData({ ...formData, collegeName: e.target.value })}
                                placeholder="College Name"
                            />
                            <div className="md:col-span-2">
                                <label className="text-sm text-gray-600 mb-1 block">Interests (comma separated)</label>
                                <input
                                    className="p-2 border rounded w-full"
                                    value={formData.interests ? formData.interests.join(", ") : ""}
                                    onChange={e => setFormData({ ...formData, interests: e.target.value.split(",").map(i => i.trim()) })}
                                    placeholder="Coding, Music, Dance..."
                                />
                            </div>
                        </>
                    )}

                    {profile.role === 'organizer' && (
                        <>
                            <input
                                className="p-2 border rounded"
                                value={formData.organizerName || ""}
                                onChange={e => setFormData({ ...formData, organizerName: e.target.value })}
                                placeholder="Organizer Name"
                            />
                            <input
                                className="p-2 border rounded"
                                value={formData.category || ""}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                placeholder="Category"
                            />
                            <input
                                className="p-2 border rounded"
                                value={formData.contactEmail || ""}
                                onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                                placeholder="Public Contact Email"
                            />
                            <input
                                className="p-2 border rounded"
                                value={formData.discordWebhook || ""}
                                onChange={e => setFormData({ ...formData, discordWebhook: e.target.value })}
                                placeholder="Discord Webhook URL (Optional)"
                            />
                            <textarea
                                className="p-2 border rounded md:col-span-2"
                                value={formData.description || ""}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Description"
                            />
                        </>
                    )}

                    <div className="col-span-1 md:col-span-2">
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Update Profile</button>
                    </div>
                </form>
            </div>

            {/* Followed Clubs Section */}
            {
                profile.role === 'participant' && profile.followedOrganizers && profile.followedOrganizers.length > 0 && (
                    <div className="bg-white p-6 rounded shadow-md mb-6">
                        <h2 className="text-xl font-semibold mb-4">Followed Clubs</h2>
                        <ul className="space-y-2">
                            {profile.followedOrganizers.map((org, index) => (
                                <li key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                                    <span className="font-medium">{typeof org === 'object' ? (org.organizerName || org.firstName) : "Organizer ID: " + org}</span>
                                    <span className="text-xs text-gray-500">Go to Clubs page to unfollow</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )
            }

            <div className="bg-white p-6 rounded shadow-md">
                <h2 className="text-xl font-semibold mb-4">Change Password</h2>
                <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                    <input
                        type="password"
                        className="p-2 border rounded"
                        value={passData.currentPassword}
                        onChange={e => setPassData({ ...passData, currentPassword: e.target.value })}
                        placeholder="Current Password"
                    />
                    <input
                        type="password"
                        className="p-2 border rounded"
                        value={passData.newPassword}
                        onChange={e => setPassData({ ...passData, newPassword: e.target.value })}
                        placeholder="New Password"
                    />
                    <button type="submit" className="bg-red-500 text-white px-4 py-2 rounded w-full md:w-auto">Change Password</button>
                </form>
            </div>
        </div >
    );
};

export default Profile;
