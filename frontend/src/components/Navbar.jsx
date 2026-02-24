import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");
        navigate("/login");
    };

    return (
        <nav className="bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-lg sticky top-0 z-50">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold tracking-wide hover:text-blue-100 transition">
                    Felicity EMS
                </Link>
                <div className="flex gap-6 items-center font-medium">
                    {!token ? (
                        <>
                            <Link to="/login" className="hover:text-blue-200 transition">Login</Link>
                            <Link to="/register" className="bg-white text-blue-600 px-4 py-2 rounded-full hover:bg-blue-50 transition shadow-sm">Register</Link>
                        </>
                    ) : (
                        <>
                            {role === "participant" && (
                                <>
                                    <Link to="/participant-dashboard" className="hover:text-blue-200 transition">Dashboard</Link>
                                    <Link to="/browse-events" className="hover:text-blue-200 transition">Browse Events</Link>
                                    <Link to="/organizers" className="hover:text-blue-200 transition">Clubs</Link>
                                </>
                            )}
                            {role === "organizer" && (
                                <>
                                    <Link to="/organizer-dashboard" className="hover:text-blue-200 transition">Dashboard</Link>
                                    <Link to="/organizer/ongoing-events" className="hover:text-blue-200 transition">Ongoing Events</Link>
                                    <Link to="/create-event" className="bg-blue-500 px-4 py-2 rounded-lg hover:bg-blue-400 transition shadow-sm">Create Event</Link>
                                </>
                            )}
                            {role === "admin" && (
                                <>
                                    <Link to="/admin-dashboard" className="hover:text-blue-200 transition">Admin Dashboard</Link>
                                    <Link to="/admin/clubs" className="hover:text-blue-200 transition">Manage Clubs</Link>
                                </>
                            )}
                            <div className="flex items-center gap-4 ml-4 pl-4 border-l border-blue-400">
                                <Link to="/profile" className="text-sm bg-blue-800 bg-opacity-50 px-3 py-1 rounded hover:bg-opacity-75 transition">
                                    {user.firstName} ({role})
                                </Link>
                                <button onClick={handleLogout} className="text-sm text-red-200 hover:text-white transition">
                                    Logout
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
