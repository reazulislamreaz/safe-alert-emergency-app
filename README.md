# Safety Circle Emergency Response System

Production-grade real-time emergency alerting, live geospatial telemetry broadcasting, multi-party WebRTC incident response room, and enterprise admin command center.

---

## 📁 Repository Structure

```
safe-alert-emergency-app/
├── .github/
│   └── workflows/
│       └── ci-cd.yml         # GitHub Actions automated CI/CD pipeline
├── backend/                  # Node.js + TypeScript + Express + Socket.io Real-Time Backend
│   ├── src/
│   │   ├── config/           # Environment and server configs
│   │   ├── core/             # Database store & spatial models
│   │   ├── gateways/         # Socket.io real-time WebSocket hub
│   │   ├── modules/          # Modular domain modules (Auth, Alerts, Contacts, Dashboard)
│   │   └── server.ts         # REST API endpoints & server bootstrap
│   ├── Dockerfile            # Multi-stage production container image
│   ├── package.json
│   └── tsconfig.json
│
├── dashboard/                # React 18 + Vite + TailwindCSS + Leaflet + Socket.io Frontend
│   ├── src/
│   │   ├── components/       # Admin Command Center views & Mobile Simulator
│   │   ├── pages/            # Tactical Dashboard, Live Map, Subscriptions, Emergency Types
│   │   ├── services/         # Dynamic API & Socket.io client
│   │   ├── types/            # Shared TypeScript domain models
│   │   └── App.tsx           # Unified application shell
│   ├── nginx.conf            # High-performance reverse proxy & SPA server
│   ├── Dockerfile            # Multi-stage production container image
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml        # Production Docker Compose stack
├── docker-compose.dev.yml    # Local development Compose with hot-reload
├── deploy.sh                 # One-command automated deployment script
├── .env.example              # Environment variables template
└── AGENTS.md                 # Project architecture & engineering guidelines
```

---

## 🚢 One-Command Docker Deployment

Deploy the entire full-stack application (Backend, Frontend/Nginx, PostgreSQL, and Redis) with a single command:

```bash
./deploy.sh
```

Or using pnpm:

```bash
pnpm deploy
```

The automated deployment script will:
1. Validate system prerequisites (Docker, Docker Compose).
2. Bootstrap `.env` from `.env.example` if not already present.
3. Build optimized multi-stage container images.
4. Launch the stack in detached mode with persistent volumes.
5. Poll and verify health checks for all containers before completing.

---

## 🌐 Endpoints & Services

| Service | Port | Internal / External URL | Description |
|---|---|---|---|
| **Admin Dashboard & Simulator** | `3000` | `http://localhost:3000` | React 18 SPA served via Nginx with reverse proxy |
| **Backend REST API** | `5000` | `http://localhost:5000/api` | Express + TypeScript API server |
| **WebSocket Hub** | `5000` | `ws://localhost:5000/socket.io` | Real-time GPS telemetry & incident signaling |
| **PostgreSQL Database** | `5432` | `localhost:5432` | Persistent relational store |
| **Redis Cache** | `6379` | `localhost:6379` | High-throughput pub/sub and active session cache |
| **Backend Healthcheck** | `5000` | `http://localhost:5000/health` | Service liveness probe |

---

## 🔄 Docker Compose Commands

```bash
# Start stack in background
docker compose up -d

# View live service logs
docker compose logs -f

# Rebuild containers
docker compose build

# Stop stack
docker compose down

# Stop stack and purge database volumes
docker compose down -v
```

---

## ⚙️ CI/CD Pipeline (GitHub Actions)

The repository includes a production-ready automated CI/CD workflow at [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml) with 3 automated phases:

1. **Lint, Typecheck & Build Validation**:
   - Runs automated TypeScript compilation check (`tsc`) and bundle validation for both backend and frontend.
2. **Docker Build & Push**:
   - Builds multi-platform Docker container images using GitHub Actions caching (`type=gha`).
   - Automatically tags and publishes images to GitHub Container Registry (`ghcr.io`).
3. **Continuous Deployment (CD)**:
   - Connects to your production/staging host server via SSH (configured via GitHub Secrets).
   - Pulls latest changes and triggers `./deploy.sh` with zero downtime.

### Required GitHub Secrets (Optional for SSH deployment):
- `DEPLOY_HOST`: Target server IP or domain.
- `DEPLOY_USER`: Server SSH username.
- `DEPLOY_SSH_KEY`: Server private SSH key.
- `DEPLOY_PATH`: Repository path on server (e.g. `/opt/safe-alert-emergency-app`).

---

## 💻 Local Development (Without Docker)

### 1. Backend API & WebSocket Server
```bash
cd backend
pnpm install
pnpm dev
# Running at http://localhost:5000
```

### 2. Frontend Admin Dashboard & Mobile Simulator
```bash
cd dashboard
pnpm install
pnpm dev
# Running at http://localhost:3000
```
