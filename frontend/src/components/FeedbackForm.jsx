import { useState, useEffect } from "react";
import axios from "axios";

const FeedbackForm = ({ eventId }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFeedback();
    }, [eventId]);

    const fetchFeedback = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/feedback/${eventId}`);
            setFeedbacks(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch feedback");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            if (!token) return alert("Please login to submit feedback");

            await axios.post(
                "http://localhost:5000/api/feedback",
                { eventId, rating: Number(rating), comment, isAnonymous },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Feedback submitted!");
            setComment("");
            fetchFeedback(); // Refresh
        } catch (error) {
            alert(error.response?.data?.message || "Failed to submit feedback");
        }
    };

    return (
        <div className="bg-white p-6 rounded shadow-md mt-6">
            <h3 className="text-xl font-bold mb-4">Feedback & Ratings</h3>

            {/* Submission Form */}
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 border rounded">
                <div className="mb-2">
                    <label className="block font-semibold">Rating:</label>
                    <select
                        value={rating}
                        onChange={(e) => setRating(e.target.value)}
                        className="p-2 border rounded w-full"
                    >
                        <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                        <option value="4">⭐⭐⭐⭐ (4)</option>
                        <option value="3">⭐⭐⭐ (3)</option>
                        <option value="2">⭐⭐ (2)</option>
                        <option value="1">⭐ (1)</option>
                    </select>
                </div>
                <div className="mb-2">
                    <label className="block font-semibold">Comment:</label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="p-2 border rounded w-full h-20"
                        required
                        placeholder="Share your experience..."
                    />
                </div>
                <div className="mb-4 flex items-center">
                    <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="mr-2 h-4 w-4"
                    />
                    <label>Submit Anonymously</label>
                </div>
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-bold">
                    Submit Feedback
                </button>
            </form>

            {/* List of Feedback */}
            <div className="space-y-4">
                {feedbacks.length === 0 && <p className="text-gray-500">No feedback yet.</p>}
                {feedbacks.map((fb) => (
                    <div key={fb._id} className="border-b pb-4">
                        <div className="flex justify-between">
                            <span className="font-bold  text-gray-700">
                                {fb.user.firstName} {fb.user.lastName}
                                {fb.isAnonymous && <span className="text-xs text-gray-500 italic ml-2">(Anonymous)</span>}
                            </span>
                            <span className="text-yellow-500">{"⭐".repeat(fb.rating)}</span>
                        </div>
                        <p className="text-gray-600 mt-1">{fb.comment}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(fb.createdAt).toLocaleDateString()}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FeedbackForm;
