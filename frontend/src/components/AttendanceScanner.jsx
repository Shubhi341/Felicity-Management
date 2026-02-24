import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import axios from "axios";

const AttendanceScanner = () => {
    const [scanResult, setScanResult] = useState(null);
    const [manualId, setManualId] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 15, // Increased FPS for faster scanning
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            },
            /* verbose= */ false
        );

        scanner.render(onScanSuccess, onScanFailure);

        function onScanSuccess(decodedText, decodedResult) {
            scanner.clear();
            setScanResult(decodedText);
            markAttendance(decodedText);
        }

        function onScanFailure(error) {
            // console.warn(`Code scan error = ${error}`);
        }

        return () => {
            scanner.clear().catch(error => console.error("Failed to clear scanner", error));
        };
    }, []);

    const markAttendance = async (ticketId, method = 'QR Scan', reason = '') => {
        setLoading(true);
        setMessage("");
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                "http://localhost:5000/api/registrations/mark-attendance",
                { ticketId, method, reason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage(`✅ Success! ${response.data.participant} attended ${response.data.event}`);
            setScanResult(null); // Reset for next scan
        } catch (error) {
            setMessage(`❌ Error: ${error.response?.data?.message || "Failed to mark attendance"}`);
        } finally {
            setLoading(false);
            // Re-initialize scanner if needed or provide a button to scan again
        }
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (manualId) {
            const reason = window.prompt("Reason for manual override (Required for audit log):", "QR not scanning / Forgot ticket");
            if (reason) {
                markAttendance(manualId, 'Manual Override', reason);
            }
        }
    };

    return (
        <div className="p-4 bg-white rounded shadow-md max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4 text-center">Attendance Scanner</h2>

            {/* QR Scanner Region */}
            {!scanResult && <div id="reader" className="mb-4"></div>}

            {/* Manual Entry */}
            <form onSubmit={handleManualSubmit} className="flex gap-2 mb-4">
                <input
                    type="text"
                    placeholder="Enter Ticket ID Manually"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    className="flex-1 p-2 border rounded"
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    disabled={loading}
                >
                    {loading ? "..." : "Submit"}
                </button>
            </form>

            {/* Status Message */}
            {message && (
                <div className={`p-3 rounded text-center font-bold ${message.includes("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                    {message}
                </div>
            )}

            {/* Reset Button (to scan again if scanner was cleared) */}
            {(scanResult || message) && (
                <button
                    onClick={() => window.location.reload()} // Simple reload to restart scanner for now
                    className="w-full mt-4 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
                >
                    Scan Next
                </button>
            )}
        </div>
    );
};

export default AttendanceScanner;
