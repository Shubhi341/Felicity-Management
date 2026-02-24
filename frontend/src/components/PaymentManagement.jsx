import { useState, useEffect } from "react";
import axios from "axios";

const PaymentManagement = () => {
    const [registrations, setRegistrations] = useState([]);

    useEffect(() => {
        fetchPendingPayments();
    }, []);

    const fetchPendingPayments = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:5000/api/organizer/registrations/pending", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRegistrations(res.data);
        } catch (error) {
            console.error("Error fetching payments", error);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            const token = localStorage.getItem("token");
            await axios.patch(
                `http://localhost:5000/api/registrations/${id}/payment-status`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert(`Payment ${status}`);
            fetchPendingPayments();
        } catch (error) {
            alert("Error updating status");
        }
    };

    return (
        <div className="bg-white p-6 rounded shadow-md mt-6">
            <h3 className="text-xl font-bold mb-4">Pending Payments</h3>
            {registrations.length === 0 ? (
                <p>No pending payments.</p>
            ) : (
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b">
                            <th className="p-2">Event</th>
                            <th className="p-2">Participant</th>
                            <th className="p-2">Item</th>
                            <th className="p-2">Proof</th>
                            <th className="p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registrations.map(reg => (
                            <tr key={reg._id} className="border-b">
                                <td className="p-2">{reg.event?.title}</td>
                                <td className="p-2">{reg.participant?.firstName} ({reg.participant?.email})</td>
                                <td className="p-2">{reg.merchandiseVariant} (x{reg.quantity})</td>
                                <td className="p-2">
                                    {reg.paymentProofUrl ? (
                                        <a href={`http://localhost:5000${reg.paymentProofUrl}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                                            View Proof
                                        </a>
                                    ) : "N/A"}
                                </td>
                                <td className="p-2">
                                    <button
                                        onClick={() => updateStatus(reg._id, "approved")}
                                        className="bg-green-500 text-white px-3 py-1 rounded mr-2 hover:bg-green-600"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => updateStatus(reg._id, "rejected")}
                                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                    >
                                        Reject
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default PaymentManagement;
