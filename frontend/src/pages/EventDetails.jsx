import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import DiscussionForum from "../components/DiscussionForum";
import FeedbackForm from "../components/FeedbackForm";

const EventDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [answers, setAnswers] = useState({});
    const [merchandiseVariant, setMerchandiseVariant] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [paymentProof, setPaymentProof] = useState(null); // File state
    const [loading, setLoading] = useState(true);
    const [isRegistered, setIsRegistered] = useState(false);
    const [userRegistration, setUserRegistration] = useState(null);

    useEffect(() => {
        fetchEventDetails();
    }, [id]);

    const fetchEventDetails = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/events/${id}`);
            setEvent(response.data);

            const token = localStorage.getItem("token");
            const role = localStorage.getItem("role");

            if (token && (!role || role === "participant")) {
                // Check if user is already registered for this event
                try {
                    const regRes = await axios.get(`http://localhost:5000/api/registrations/my`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const myRegs = regRes.data;
                    const myReg = myRegs.find(reg => reg.event._id === id);
                    if (myReg) {
                        setIsRegistered(true);
                        setUserRegistration(myReg);
                    }
                } catch (err) {
                    console.error("Error checking registration status", err);
                }
            }

            // If user is organizer of this event, fetch participants
            const user = JSON.parse(localStorage.getItem("user"));
            if (role === "organizer" && response.data.organizer._id === user?.id) {
                fetchParticipants();
            }

            setLoading(false);
        } catch (error) {
            console.error("Error fetching event details", error);
            setLoading(false);
        }
    };

    const [participants, setParticipants] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchParticipants = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`http://localhost:5000/api/organizer/events/${id}/participants`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setParticipants(res.data);
        } catch (error) {
            console.error("Error fetching participants", error);
        }
    };

    const downloadCSV = () => {
        const headers = ["Name", "Email", "Contact", "Registration Date", "Payment Status", "Attended"];
        const rows = participants.map(reg => [
            `${reg.participant.firstName} ${reg.participant.lastName}`,
            reg.participant.email,
            reg.participant.contactNumber || "N/A",
            new Date(reg.createdAt).toLocaleDateString(),
            reg.paymentStatus,
            reg.attended ? "Yes" : "No"
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers, ...rows].map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `participants_${event.title}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleRegister = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Please login to register");
                navigate("/login");
                return;
            }

            const formData = new FormData();
            formData.append("eventId", id);

            if (event.eventType === "normal") {
                formData.append("answers", JSON.stringify(answers));
            } else {
                formData.append("merchandiseVariant", merchandiseVariant);
                formData.append("quantity", quantity);
                if (paymentProof) {
                    formData.append("paymentProof", paymentProof);
                }
            }

            await axios.post(
                `http://localhost:5000/api/registrations/events/${id}/register`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert("Registration Successful!");
            navigate("/participant-dashboard");
        } catch (error) {
            alert(error.response?.data?.message || "Registration failed");
        }
    };

    if (loading) return <div className="p-4">Loading...</div>;
    if (!event) return <div className="p-4">Event not found</div>;

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-4xl font-extrabold mb-2">{event.title}</h1>
                            <div className="flex gap-2">
                                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm border border-white/30 capitalize">{event.eventType} Event</span>
                                <span className="bg-green-500/80 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm border border-white/30 capitalize">{event.status}</span>
                            </div>
                        </div>
                        <div className="text-right bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                            <p className="text-sm opacity-80">Deadline</p>
                            <p className="font-bold text-lg">{new Date(event.registrationDeadline).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wide mb-2">Description</h3>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{event.description}</p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                            <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wide mb-4">Event Details</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Start Time</span>
                                    <span className="font-medium">{new Date(event.startDate).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">End Time</span>
                                    <span className="font-medium">{new Date(event.endDate).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t">
                                    <span className="text-gray-600">Location</span>
                                    <span className="font-medium">{event.location || "N/A"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Eligibility</span>
                                    <span className="font-medium">{event.eligibility}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Registration Fee</span>
                                    <span className="font-medium">{event.registrationFee > 0 ? `₹${event.registrationFee}` : "Free"}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t">
                                    <span className="text-gray-600">Organizer</span>
                                    <span className="font-medium">{event.organizer?.organizerName || event.organizer?.firstName || "N/A"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Contact</span>
                                    <span className="font-medium">{event.organizer?.contactEmail || event.organizer?.email || "N/A"}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t">
                                    <span className="text-gray-600">Registration Limit</span>
                                    <span className="font-medium">{event.registrationLimit > 0 ? event.registrationLimit : "Unlimited"}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Registration / Purchase Section - HIDDEN FOR ORGANIZERS/ADMINS */}
                    {(!localStorage.getItem("role") || localStorage.getItem("role") === "participant") && (
                        <div className="bg-blue-50 border border-blue-100 p-8 rounded-xl mb-12">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b border-blue-200 pb-2">
                                {event.eventType === "merchandise" ? "Purchase Merchandise" : "Register for Event"}
                            </h2>

                            {/* Blocking Logic */}
                            {isRegistered ? (
                                <div className="space-y-6">
                                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                                        <strong className="font-bold">Already Registered! </strong>
                                        <span className="block sm:inline">You have already registered for this event.</span>
                                    </div>

                                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                        <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Your Registration Details</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                                <span className="text-gray-600 font-medium">Ticket ID</span>
                                                <span className="font-mono text-gray-800">
                                                    {userRegistration?.paymentStatus === 'pending'
                                                        ? <span className="text-yellow-600 text-sm">Pending Approval</span>
                                                        : userRegistration?.ticketId}
                                                </span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                                <span className="text-gray-600 font-medium">Status</span>
                                                <span className={`font-bold uppercase text-xs px-2 py-1 rounded-full ${userRegistration?.paymentStatus === 'successful' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {userRegistration?.paymentStatus}
                                                </span>
                                            </div>

                                            {/* Normal Event Answers */}
                                            {event.eventType === "normal" && userRegistration?.answers && Object.keys(userRegistration.answers).length > 0 && (
                                                <div className="pt-2">
                                                    <h4 className="text-gray-500 text-sm font-bold uppercase mb-3">Submitted Form</h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {Object.entries(userRegistration.answers).map(([question, answer], idx) => (
                                                            <div key={idx} className="bg-gray-50 p-3 rounded border border-gray-100">
                                                                <p className="text-xs text-gray-500 mb-1">{question}</p>
                                                                <p className="font-medium text-gray-800">
                                                                    {Array.isArray(answer) ? answer.join(", ") : answer.toString()}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Merchandise Details */}
                                            {event.eventType === "merchandise" && userRegistration?.merchandiseVariant && (
                                                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="bg-gray-50 p-3 rounded border border-gray-100">
                                                        <p className="text-xs text-gray-500 mb-1">Variant</p>
                                                        <p className="font-medium text-gray-800">{userRegistration.merchandiseVariant}</p>
                                                    </div>
                                                    <div className="bg-gray-50 p-3 rounded border border-gray-100">
                                                        <p className="text-xs text-gray-500 mb-1">Quantity</p>
                                                        <p className="font-medium text-gray-800">{userRegistration.quantity}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : new Date() > new Date(event.registrationDeadline) ? (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                                    <strong className="font-bold">Registration Closed! </strong>
                                    <span className="block sm:inline">The deadline for this event has passed.</span>
                                </div>
                            ) : (event.registrationLimit > 0 && event.registrationCount >= event.registrationLimit) ? (
                                <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded relative" role="alert">
                                    <strong className="font-bold">House Full! </strong>
                                    <span className="block sm:inline">All spots have been filled.</span>
                                </div>
                            ) : (
                                <>
                                    {/* Dynamic Form for Normal Events */}
                                    {event.eventType === "normal" && event.formSchema && event.formSchema.length > 0 && (
                                        <div className="space-y-4 mb-6">
                                            {event.formSchema.map((field, idx) => (
                                                <div key={idx}>
                                                    <label className="block text-sm font-bold text-gray-700 mb-1">
                                                        {field.label} {field.required && <span className="text-red-500">*</span>}
                                                    </label>
                                                    {field.type === "text" || field.type === "number" || field.type === "file" ? (
                                                        <input
                                                            type={field.type}
                                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                                            required={field.required}
                                                            onChange={(e) => setAnswers({ ...answers, [field.label]: field.type === "file" ? e.target.files[0] : e.target.value })}
                                                        />
                                                    ) : field.type === "dropdown" ? (
                                                        <select
                                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                            required={field.required}
                                                            onChange={(e) => setAnswers({ ...answers, [field.label]: e.target.value })}
                                                        >
                                                            <option value="">Select...</option>
                                                            {field.options && field.options.map((opt, i) => (
                                                                <option key={i} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    ) : field.type === "checkbox" ? (
                                                        <div className="flex flex-col gap-2 mt-2">
                                                            {field.options && field.options.map((opt, i) => (
                                                                <label key={i} className="flex items-center gap-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        name={field.label}
                                                                        value={opt}
                                                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                                        onChange={(e) => {
                                                                            const currentAnswers = answers[field.label] || [];
                                                                            let updatedAnswers;
                                                                            if (e.target.checked) {
                                                                                updatedAnswers = [...currentAnswers, opt];
                                                                            } else {
                                                                                updatedAnswers = currentAnswers.filter(item => item !== opt);
                                                                            }
                                                                            setAnswers({ ...answers, [field.label]: updatedAnswers });
                                                                        }}
                                                                    />
                                                                    <span className="text-gray-700">{opt}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <input type="text" className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Unhandled field type" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Merchandise Selection */}
                                    {event.eventType === "merchandise" && event.merchandiseVariants && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1">Select Variant</label>
                                                <select
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                    onChange={(e) => setMerchandiseVariant(e.target.value)}
                                                >
                                                    <option value="">-- Choose Option --</option>
                                                    {event.merchandiseVariants.map((v, i) => (
                                                        <option key={i} value={v.variantName}>
                                                            {v.variantName} {v.color ? `(${v.color}, ${v.size})` : ""} (Stock: {v.stock})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1">Quantity</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={event.purchaseLimit}
                                                    value={quantity}
                                                    onChange={(e) => setQuantity(e.target.value)}
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                                    Upload Payment Proof <span className="text-gray-500 font-normal">(Required)</span>
                                                </label>
                                                <div className="flex items-center justify-center w-full">
                                                    <label className="flex flex-col w-full h-32 border-2 border-dashed border-blue-300 hover:bg-blue-50 transition rounded-lg items-center justify-center cursor-pointer">
                                                        <div className="flex flex-col items-center justify-center pt-7">
                                                            <p className="text-sm text-gray-400 group-hover:text-blue-600 pt-1 tracking-wider">
                                                                {paymentProof ? paymentProof.name : "Select a photo"}
                                                            </p>
                                                        </div>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => setPaymentProof(e.target.files[0])}
                                                            className="opacity-0"
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleRegister}
                                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg transform hover:-translate-y-0.5"
                                    >
                                        {event.eventType === "merchandise" ? "Buy Now" : "Register Now"}
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* ORGANIZER VIEW - ANALYTICS & PARTICIPANTS */}
                    {localStorage.getItem("role") === "organizer" && event.organizer._id === JSON.parse(localStorage.getItem("user")).id && (
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Organizer Dashboard</h2>

                            {/* Analytics Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-center">
                                    <p className="text-gray-500 text-xs font-bold uppercase">Registrations</p>
                                    <p className="text-2xl font-bold text-blue-700">{participants.length}</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-center">
                                    <p className="text-gray-500 text-xs font-bold uppercase">Revenue</p>
                                    <p className="text-2xl font-bold text-green-700">₹{participants.filter(p => p.paymentStatus === 'approved' || p.paymentStatus === 'successful').reduce((acc, curr) => acc + (event.registrationFee * (curr.quantity || 1)), 0)}</p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 text-center">
                                    <p className="text-gray-500 text-xs font-bold uppercase">Attendance</p>
                                    <p className="text-2xl font-bold text-purple-700">{participants.filter(p => p.attended).length}</p>
                                </div>
                                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-center">
                                    <p className="text-gray-500 text-xs font-bold uppercase">Conversion</p>
                                    <p className="text-2xl font-bold text-yellow-700">
                                        {participants.length > 0
                                            ? Math.round((participants.filter(p => p.paymentStatus === 'approved' || p.paymentStatus === 'successful').length / participants.length) * 100)
                                            : 0}%
                                    </p>
                                </div>
                            </div>

                            {/* Participants List */}
                            <div className="bg-white rounded-lg border shadow-sm">
                                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                                    <h3 className="font-bold text-gray-700">Participants List</h3>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Search by name..."
                                            className="border rounded px-3 py-1 text-sm"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        <button onClick={downloadCSV} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                                            Export CSV
                                        </button>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-100 text-gray-600">
                                            <tr>
                                                <th className="p-3">Name</th>
                                                <th className="p-3">Email</th>
                                                <th className="p-3">Date</th>
                                                <th className="p-3">Status</th>
                                                <th className="p-3">Attended</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {participants
                                                .filter(p => p.participant.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || p.participant.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
                                                .map(reg => (
                                                    <tr key={reg._id} className="hover:bg-gray-50">
                                                        <td className="p-3 font-medium">{reg.participant.firstName} {reg.participant.lastName}</td>
                                                        <td className="p-3 text-gray-500">{reg.participant.email}</td>
                                                        <td className="p-3">{new Date(reg.createdAt).toLocaleDateString()}</td>
                                                        <td className="p-3">
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize 
                                                            ${reg.paymentStatus === 'approved' ? 'bg-green-100 text-green-700' :
                                                                    reg.paymentStatus === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                                {reg.paymentStatus}
                                                            </span>
                                                        </td>
                                                        <td className="p-3">
                                                            {reg.attended ? (
                                                                <span className="text-green-600 font-bold">Yes</span>
                                                            ) : (
                                                                <span className="text-gray-400">No</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            {participants.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="p-4 text-center text-gray-500">No participants yet.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Community Section */}
                    <div className="border-t border-gray-200 pt-10">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Community & Feedback</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <DiscussionForum eventId={event._id} eventOrganizerId={event.organizer?._id} />

                            {/* Feedback Form - Only for Participants */}
                            {(!localStorage.getItem("role") || localStorage.getItem("role") === "participant") && (
                                <FeedbackForm eventId={event._id} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetails;
