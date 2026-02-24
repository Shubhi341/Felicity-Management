import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        participantType: "IIIT", // Default to IIIT
        collegeName: "IIIT Hyderabad",
        contactNumber: ""
    });
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleTypeChange = (type) => {
        setFormData({
            ...formData,
            participantType: type,
            collegeName: type === "IIIT" ? "IIIT Hyderabad" : ""
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Email Validation Check
        if (formData.participantType === "IIIT" && !formData.email.endsWith("@iiit.ac.in")) {
            setError('⚠️ Notice: It looks like you are using a non-IIIT email. If you are not an IIIT student, please select "Non-IIIT" above to register correctly!');
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Registration failed");
            }

            alert("Registration successful! Please login.");
            navigate("/login");
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 py-12">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg border border-gray-100">
                <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-800">Create Account</h2>
                {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center">{error}</div>}

                <div className="flex mb-6 bg-gray-100 p-1 rounded-lg">
                    <button
                        className={`flex-1 py-2 rounded-md font-medium transition ${formData.participantType === "IIIT" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        onClick={() => handleTypeChange("IIIT")}
                    >
                        IIIT Student
                    </button>
                    <button
                        className={`flex-1 py-2 rounded-md font-medium transition ${formData.participantType === "Non-IIIT" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        onClick={() => handleTypeChange("Non-IIIT")}
                    >
                        Non-IIIT
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="text"
                            name="firstName"
                            placeholder="First Name"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                            onChange={handleChange}
                            required
                        />
                        <input
                            type="text"
                            name="lastName"
                            placeholder="Last Name"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <input
                        type="email"
                        name="email"
                        placeholder={formData.participantType === "IIIT" ? "Email (@iiit.ac.in)" : "Email Address"}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="text"
                        name="contactNumber"
                        placeholder="Contact Number"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                        onChange={handleChange}
                        required
                    />
                    {formData.participantType === "IIIT" ? (
                        <div className="relative">
                            <input
                                type="text"
                                name="collegeName"
                                value="IIIT Hyderabad (Default)"
                                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 outline-none select-none cursor-not-allowed"
                                readOnly
                            />
                            <div className="absolute right-3 top-3 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-bold">Default</div>
                        </div>
                    ) : (
                        <div>
                            <input
                                type="text"
                                name="collegeName"
                                placeholder="College or Organization Name"
                                value={formData.collegeName}
                                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${formData.collegeName === 'IIIT Hyderabad' ? 'border-orange-400 focus:ring-orange-500 bg-orange-50' : 'border-gray-300'}`}
                                onChange={handleChange}
                                required
                            />
                            {formData.collegeName === 'IIIT Hyderabad' && (
                                <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                                    <span className="font-bold">⚠️ Warning:</span> You are registering as a Non-IIIT participant. Please update your college/organization name if you are not from IIIT.
                                </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1 pl-1">Default value is IIIT. Non-IIIT participants should update this field with their college or organization name.</p>
                        </div>
                    )}
                    <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-md mt-4">
                        Register
                    </button>
                </form>
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Already have an account? <Link to="/login" className="text-blue-600 font-bold hover:underline">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
