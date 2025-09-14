# 🌱 Digital Agriculture Frontend

A React + TypeScript + Vite application for managing farms, analyzing crop data, and interacting with an AI-powered backend.
This frontend integrates authentication, farm management, harvest tracking, dashboards, and interactive farm mapping with Leaflet.js.

## 🚀 Features

### 1. Authentication & Authorization

Create account, login, and OTP verification via backend API.

JWT token stored in localStorage and synced across tabs.

Auth-protected routes (/dashboard).

### 2. Dashboard

Sidebar-based navigation between modules.

Sections: Farm Manager, Reports, Chat, Drone Simulation.

Decodes JWT to show farmer info (name & phone).

### 3. Farm Management

Add and view farms (name, crop, acreage, polygon coordinates).

Visualize farms with Leaflet.js maps.

Save and fetch harvest records from backend.

View farm polygons and open farm location in Google Maps.

### 4. Leaflet Map Integration

Uses react-leaflet and leaflet.css.

Polygon drawing and rendering for farm boundaries.

Supports fetching grid images (drone/satellite tiles).

### 5. State Management with MobX

farmManagerStore handles farms & harvests.

dashboardStore manages dashboard steps.

Reactive UI updates with @observer.

### 6. Backend API Integration

Configurable via VITE_API_BASE environment variable.

Endpoints: /create-account, /login, /verify-code, /farms, /harvests, etc.

## 🛠️ Tech Stack

Frontend Framework: React + TypeScript + Vite

Routing: React Router

State Management: MobX

Maps & Visualization: Leaflet + React-Leaflet

Authentication: JWT + LocalStorage Sync

Styling: CSS Modules

## ⚙️ Installation & Setup
### 1. Clone the Repository
git clone https://github.com/your-username/digital-agriculture-frontend.git
cd digital-agriculture-frontend

### 2. Install Dependencies
npm install

### 3. Environment Variables

Create a .env file in the root:

VITE_API_BASE=http://127.0.0.1:8000


For production, set this to your deployed backend URL.

### 4. Run Development Server
npm run dev


The app will run on:
👉 http://localhost:5173

📖 Project Structure
src/
│── App.tsx              # Routing & authentication guard
│── pages/
│   ├── AuthPage.tsx      # Signup/Login/Verify workflow
│   ├── Dashboard.tsx     # Main dashboard with sidebar navigation
│   ├── FarmManager.tsx   # Farm & harvest management + Leaflet maps
│   ├── Reports.tsx       # Reports section
│   ├── Chat.tsx          # AI-powered chat
│   └── DroneSim.tsx      # Drone simulation UI
│
│── stores/
│   ├── DashboardStore.ts # MobX store for dashboard navigation
│   └── FarmManagerStore.ts # MobX store for farms & harvests
│
│── components/
│   └── Sidebar.tsx       # Dashboard sidebar navigation
│
│── styles/               # CSS styles for pages
│
└── main.tsx              # React entry point

## 🔑 Authentication Flow

Signup → Enter name & phone → API sends WhatsApp code.

Login → Enter phone → Redirects to verify step.

Verify → Enter code → JWT token issued → Saved in localStorage.

Dashboard Access → Routes protected with Navigate based on token presence.

Token Sync → Listens to storage events for multi-tab support.

## 🗺️ Farm Manager (Leaflet Maps)

Uses react-leaflet for map rendering.

Displays farm polygons stored as coordinate arrays.

Provides clickable Google Maps link for each farm center.

Supports adding farms with polygon coordinates through a map modal (FarmMap).

## 🧩 Future Enhancements

Offline-first support with local caching.

Farm image grid overlay for drone analysis.

Graphical reports (harvest yield trends, soil health).

Real-time WebSocket updates for farm alerts.

This project is designed to work with the Farm Management & Advisory API
 (FastAPI backend).
