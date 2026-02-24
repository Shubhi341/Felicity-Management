# Felicity Event Management System

## Project Overview
Felicity is a comprehensive Event Management System built on the MERN stack. It empowers organizers to seamlessly deploy events, track revenue (especially for merchandise), manage dynamic event registrations, and engage users in real-time.

---

## 🚀 Setup & Installation (Local Development)

### Prerequisites
- Node.js (v16+)
- MongoDB Atlas Account (or Local MongoDB)
- Git

### 1. Clone & Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables
**Backend (`backend/.env`):**
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_smtp_email
EMAIL_PASS=your_smtp_password
DISCORD_WEBHOOK_URL=your_discord_webhook
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run the Application
```bash
# Start backend (from /backend)
npm start

# Start frontend (from /frontend)
npm run dev
```

---

## 📚 Libraries, Frameworks & Technical Choices

### Frontend
* **React + Vite**: Chosen for lightning-fast HMR (Hot Module Replacement) and optimized build times over standard Create React App or heavy SSR frameworks.
* **Tailwind CSS**: Utility-first CSS framework. Chosen to rapidly build complex, modern, and responsive UIs without the bloat of raw custom CSS files. 
* **React Router Dom**: Standard declarative routing for React. Enables complex nested routes and protected authorization layers for Participants, Organizers, and Admins.
* **Axios**: Promised-based HTTP client. Superior to native `fetch` due to automatic JSON transformations and easier interceptor configuration for JWT Bearer Tokens.
* **Html5-Qrcode**: Lightweight library used for the Organizer Attendance Scanner to tap directly into device cameras.
* **React-QR-Code**: Generates valid SVG QR codes quickly on the client side for participant tickets.

### Backend
* **Node.js + Express**: Lightweight, unopinionated, and fast backend framework. Perfect for building RESTful APIs rapidly.
* **MongoDB + Mongoose**: NoSQL database. Chosen for its flexible schema, which was mandatory for the "Dynamic Form Builder" feature where different events have completely different answer payloads.
* **JSONWebToken (JWT)**: Stateless authorization. Scales better than session cookies and easily passes Role-Based Access Control (RBAC) scopes.
* **Bcrypt**: For secure, salted password hashing to protect user credentials.
* **Multer**: Middleware for handling `multipart/form-data`, strictly used to intercept and save image uploads for Merchandise Payment Proofs.
* **Nodemailer**: Powerful module for sending automated HTML emails, specifically ticket confirmations and pending payment alerts.

---

## 🌟 Advanced Features Implemented

### Tier A: Merchandise Payment Approval 
* **Justification**: Handling physical goods requires strict inventory integrity. Allowing automated checkouts for free events is easy, but merchandise demands manual organizer oversight to verify UTR/payment screenshots before confirming a ticket.
* **Implementation Details**: The registration payload dynamically switches to `multipart/form-data` if the event is 'merchandise'. Multer intercepts the image and stores its URL. The registration is flagged as `pending`. The Organizer Dashboard queries all pending transactions, allowing them to explicitly `Approve` (which fires an email with a newly minted QR code and decrements inventory stock) or `Reject`.
* **Technical Challenges**: Overcoming Axios's boundary stripping bug when manually enforcing content types during file uploads.

### Tier A: QR Scanner & Attendance Tracking 
* **Justification**: Paper lists are inefficient for large-scale college fests. A digital QR scanner guarantees instant throughput at the gate and eliminates duplicate entries.
* **Implementation Details**: `html5-qrcode` accesses the device camera via native browser APIs. Scanning a ticket sends a `POST` request to the backend. The backend checks if `attended === true` and strictly blocks double-scanning.
* **Technical Challenges**: Implementing the manual override function while ensuring a strict audit log (`attendanceLog` schema field) captured exactly *which* organizer bypassed the scanner and *why*.

### Tier B: Real-Time Discussion Forum
* **Justification**: A centralized pre-event communication channel limits support emails and builds community hype.
* **Implementation Details**: Implemented inside the `EventDetails` page. It features background polling rather than heavy WebSockets for simplicity, keeping the server load light. The backend schema `Discussion.js` supports infinite threading (`replyTo`), soft deletes, custom Emoji reactions array, and boolean `isPinned` flags.
* **Technical Challenges**: Structuring the MongoDB queries to `populate` deeply nested User refs for both the original message and its parent thread simultaneously.

### Tier C: Anonymous Feedback
* **Justification**: Organizers need post-event metrics to improve, but participants are more honest when anonymized.
* **Implementation Details**: A dedicated `Feedback.js` schema captures 1-5 star ratings and string comments, deliberately omitting a User reference to guarantee anonymity. The Organizer Dashboard aggregates this data, calculating the mean Average Rating dynamically for published events.
