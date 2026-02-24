import { useState, useEffect } from "react";
import axios from "axios";

const DiscussionForum = ({ eventId, eventOrganizerId }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [replyingTo, setReplyingTo] = useState(null);
    const [loading, setLoading] = useState(true);

    // Get current user id from token (basic decoding for UI logic)
    const token = localStorage.getItem("token");
    let currentUserId = null;
    let currentUserRole = null;
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            currentUserId = payload.id;
            currentUserRole = payload.role;
        } catch (e) {
            console.error("Token decode error", e);
        }
    }

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000); // Poll for real-time feel
        return () => clearInterval(interval);
    }, [eventId]);

    const fetchMessages = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/discussions/${eventId}`);
            setMessages(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch messages", error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            if (!token) return alert("Please login to post");

            await axios.post(
                `http://localhost:5000/api/discussions/${eventId}`,
                { message: newMessage, replyTo: replyingTo?._id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNewMessage("");
            setReplyingTo(null);
            fetchMessages();
        } catch (error) {
            alert(error.response?.data?.message || "Failed to post message");
        }
    };

    const handleAction = async (method, url, data = {}) => {
        try {
            if (!token) return alert("Please login first");
            await axios({
                method,
                url: `http://localhost:5000/api/discussions/${url}`,
                data,
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchMessages();
        } catch (error) {
            alert(error.response?.data?.message || "Action failed");
        }
    };

    const renderReactions = (msg) => {
        const counts = { like: 0, love: 0, laugh: 0, sad: 0 };
        let userReacted = null;

        if (msg.reactions) {
            msg.reactions.forEach(r => {
                counts[r.type]++;
                if (r.user === currentUserId) userReacted = r.type;
            });
        }

        const emojis = { like: '👍', love: '❤️', laugh: '😂', sad: '😢' };

        return (
            <div className="flex gap-2 mt-2">
                {Object.keys(emojis).map(type => (
                    <button
                        key={type}
                        onClick={() => handleAction('post', `${msg._id}/react`, { type })}
                        className={`text-xs px-2 py-1 rounded-full border transition ${userReacted === type ? 'bg-blue-100 border-blue-300' : 'bg-gray-50 hover:bg-gray-100'}`}
                    >
                        {emojis[type]} {counts[type] > 0 && counts[type]}
                    </button>
                ))}
            </div>
        );
    };

    // Sort: Pinned first, then chronological
    const sortedMessages = [...messages].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        // If replyTo exists, group them visually (handled in render, keeping chronological here)
        return new Date(a.createdAt) - new Date(b.createdAt);
    });

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mt-8">
            <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                💬 Live Discussion Forum
            </h3>

            <div className="border border-gray-200 rounded-lg h-96 overflow-y-auto p-4 mb-4 bg-gray-50 flex flex-col gap-3">
                {loading && <p className="text-gray-500 text-center py-8 animate-pulse">Loading discussions...</p>}
                {!loading && messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <span className="text-4xl mb-2">👋</span>
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                )}

                {sortedMessages.map((msg) => {
                    const isModerator = currentUserId === eventOrganizerId || currentUserRole === 'admin';
                    const isAuthor = msg.user._id === currentUserId;

                    return (
                        <div key={msg._id} className={`p-4 rounded-lg text-sm transition-all ${msg.isPinned ? 'bg-yellow-50 border border-yellow-200 shadow-sm' : 'bg-white border border-gray-100 shadow-sm'}`}>

                            {/* Header Info */}
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-900">
                                        {msg.user.firstName} {msg.user.lastName}
                                    </span>
                                    {msg.user.role === 'organizer' && (
                                        <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Organizer</span>
                                    )}
                                    {msg.isPinned && (
                                        <span className="text-yellow-600 text-[10px] px-2 py-0.5 font-bold flex items-center gap-1">📌 Pinned</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-400">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>

                            {/* Threading Context */}
                            {msg.replyTo && (
                                <div className="ml-2 pl-2 border-l-2 border-gray-300 text-xs text-gray-500 mb-2 italic">
                                    Replying to <span className="font-semibold">{msg.replyTo.user.firstName}</span>: {msg.replyTo.message.substring(0, 50)}...
                                </div>
                            )}

                            {/* Main Message */}
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{msg.message}</p>

                            {/* Toolbar (Reactions & Actions) */}
                            <div className="mt-3 flex justify-between items-center bg-gray-50/50 -mx-2 -mb-2 px-2 py-1 rounded-b-lg">
                                {renderReactions(msg)}

                                <div className="flex gap-3 text-xs opacity-50 hover:opacity-100 transition">
                                    <button onClick={() => setReplyingTo(msg)} className="text-gray-600 hover:text-blue-600 font-medium">Reply</button>

                                    {isModerator && (
                                        <button onClick={() => handleAction('patch', `${msg._id}/pin`)} className="text-gray-600 hover:text-yellow-600 font-medium">
                                            {msg.isPinned ? 'Unpin' : 'Pin'}
                                        </button>
                                    )}

                                    {(isAuthor || isModerator) && (
                                        <button onClick={() => { if (window.confirm('Delete message?')) handleAction('delete', msg._id); }} className="text-gray-600 hover:text-red-600 font-medium">Delete</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input Form */}
            <div className="relative">
                {replyingTo && (
                    <div className="absolute bottom-full mb-1 left-0 bg-blue-50 text-blue-800 text-xs px-3 py-2 rounded-t-lg border border-blue-100 flex justify-between items-center w-full">
                        <span>Replying to <strong>{replyingTo.user.firstName}</strong></span>
                        <button onClick={() => setReplyingTo(null)} className="text-blue-500 hover:text-blue-800 font-bold">&times; Cancel</button>
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={replyingTo ? "Write a reply..." : "Join the discussion..."}
                        className={`flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${replyingTo ? 'rounded-tl-none border-blue-200' : 'border-gray-200'}`}
                        maxLength={500}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default DiscussionForum;
