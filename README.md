# SafeAlert Emergency Response System

Production-grade real-time emergency alerting, live geospatial telemetry broadcasting, multi-party WebRTC incident response room, and enterprise admin command center.

---

## 📁 Repository Structure

```
safe-alert-emergency-app/
├── backend/                  # Node.js + TypeScript + Express + Socket.io Real-Time Backend
│   ├── src/
│   │   ├── config/           # Environment and server configs
│   │   ├── core/             # Resilient Database store & PostGIS spatial models
│   │   ├── gateways/         # Socket.io real-time WebSocket hub
│   │   ├── modules/          # Modular domain modules (Auth, Alerts, Contacts, Telemetry, Dashboard)
│   │   └── server.ts         # REST API endpoints & server bootstrap
│   ├── package.json
│   └── tsconfig.json
│
└── dashboard/                # React 18 + Vite + TailwindCSS + Lucide Icons + Socket.io Frontend
    ├── src/
    │   ├── components/
    │   │   ├── admin/        # Admin Command Center views (Overview, Users, Types, Live Map, Billing)
    │   │   └── mobile/       # Interactive Mobile App Simulator (SOS Hub, Mode Select, Live Call, Cancel)
    │   ├── types/            # Shared TypeScript domain models
    │   ├── App.tsx           # Unified application shell
    │   └── index.css         # Design System tokens from Figma
    ├── package.json
    └── vite.config.ts
```

---

## 🚀 Quick Start Instructions

### 1. Start the Backend API & WebSocket Server
```bash
cd backend
pnpm install
pnpm dev
# Server running at http://localhost:5000 (WebSocket at ws://localhost:5000)
```

### 2. Start the Frontend Admin Dashboard & Mobile Simulator
```bash
cd dashboard
pnpm install
pnpm dev
# Web application running at http://localhost:3000
```
