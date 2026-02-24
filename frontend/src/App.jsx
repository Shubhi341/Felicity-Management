import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ParticipantDashboard from "./pages/ParticipantDashboard";
import OrganizerDashboard from "./pages/OrganizerDashboard";

import ProtectedRoute from "./components/ProtectedRoute";

import AdminDashboard from "./pages/AdminDashboard";
import CreateEvent from "./pages/CreateEvent";
import BrowseEvents from "./pages/BrowseEvents";
import EventDetails from "./pages/EventDetails";
import Profile from "./pages/Profile";
import OrganizersList from "./pages/OrganizersList";
import OrganizerDetails from "./pages/OrganizerDetails";
import ManageClubs from "./pages/ManageClubs";
import OngoingEvents from "./pages/OngoingEvents";
import EditEvent from "./pages/EditEvent";

import Navbar from "./components/Navbar";

// ...
function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="min-h-screen bg-gray-100">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<h1>Home</h1>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/browse-events" element={<BrowseEvents />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/organizers" element={<OrganizersList />} />
          <Route path="/organizers/:id" element={<OrganizerDetails />} />

          {/* Participant routes */}
          <Route
            path="/participant-dashboard"
            element={
              <ProtectedRoute allowedRole="participant">
                <ParticipantDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/clubs"
            element={
              <ProtectedRoute allowedRole="admin">
                <ManageClubs />
              </ProtectedRoute>
            }
          />

          {/* Organizer routes */}
          <Route
            path="/organizer-dashboard"
            element={
              <ProtectedRoute allowedRole="organizer">
                <OrganizerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-event"
            element={
              <ProtectedRoute allowedRole="organizer">
                <CreateEvent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/edit-event/:id"
            element={
              <ProtectedRoute allowedRole="organizer">
                <EditEvent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/ongoing-events"
            element={
              <ProtectedRoute allowedRole="organizer">
                <OngoingEvents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer-dashboard"
            element={
              <ProtectedRoute allowedRole="organizer">
                <OrganizerDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
