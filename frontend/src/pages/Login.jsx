import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Login button clicked");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email,
          password,
        }
      );

      console.log("Login Success:", response.data);

      const { token, participant } = response.data;

      // store token and user details
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(participant));
      localStorage.setItem("role", participant.role);

      // redirect based on role
      const role = participant.role;
      if (role === "participant") {
        navigate("/participant-dashboard");
      } else if (role === "organizer") {
        navigate("/organizer-dashboard");
      } else if (role === "admin") {
        navigate("/admin-dashboard");
      }

    } catch (error) {
      console.log(
        "Login Error:",
        error.response?.data || error.message
      );
      alert("Login Failed: " + (error.response?.data?.message || "Server Error"));
    }
  };

  const handleResetRequest = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/password-reset/request", {
        email: resetEmail,
        newPassword
      });
      alert("Password reset request sent to Admin!");
      setShowResetModal(false);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to send request");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-100">
        <h2 className="text-3xl font-extrabold mb-2 text-center text-gray-800">Welcome Back</h2>
        <p className="text-center text-gray-500 mb-8">Login to your account</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-md mt-2">
            Sign In
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account? <a href="/register" className="text-blue-600 font-bold hover:underline">Register</a>
          </p>
          <button onClick={() => setShowResetModal(true)} className="mt-4 text-xs text-red-500 hover:text-red-700 transition">
            Forgot Password? (Organizers)
          </button>
        </div>
      </div>

      {/* Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-96 transform transition-all scale-100">
            <h3 className="text-xl font-bold mb-2 text-gray-800">Reset Password</h3>
            <p className="text-sm text-gray-500 mb-6">Request a password reset. Admin must approve.</p>
            <form onSubmit={handleResetRequest} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Organizer Email</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowResetModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 font-medium transition">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold transition">Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
