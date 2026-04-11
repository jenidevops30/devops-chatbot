# ⚙ DevOps Chatbot

A production-ready DevOps assistant powered by Google Gemini AI. Helps with CI/CD pipelines, Docker, Kubernetes, Terraform, cloud platforms, and monitoring.

![Tech Stack](https://img.shields.io/badge/stack-React%20%7C%20Node.js%20%7C%20Gemini%20AI-blue)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-black)

---

## Project Structure

```
devops-chatbot/
├── backend/
│   ├── src/
│   │   └── server.js          # Express API server
│   ├── Dockerfile             # Multi-stage backend image
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main React app
│   │   ├── components/
│   │   │   ├── ChatMessage.jsx   # Message bubble + syntax highlight
│   │   │   └── index.jsx         # LoadingBubble, TopicChips, WelcomeScreen
│   │   ├── hooks/
│   │   │   └── useChatHistory.js # Local storage persistence
│   │   └── utils/
│   ├── nginx.conf             # Production Nginx config
│   ├── Dockerfile             # Multi-stage frontend image
│   └── package.json
├── .github/
│   └── workflows/
│       └── ci-cd.yml          # Full CI/CD pipeline
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- Google Gemini API key → [Get one free](https://makersuite.google.com/app/apikey)

### 1. Clone & configure

```bash
git clone https://github.com/your-org/devops-chatbot.git
cd devops-chatbot
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 2. Run with Docker Compose (recommended)

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health check: http://localhost:3001/api/health

### 3. Run locally (development)

**Backend:**
```bash
cd backend
npm install
GEMINI_API_KEY=your_key_here npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
REACT_APP_API_URL=http://localhost:3001 npm run dev
```

---

## API Reference

### `POST /api/chat`

Send a message and receive an AI response.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Write a Dockerfile for a Node.js app" }
  ],
  "conversationHistory": []
}
```

**Response:**
```json
{
  "message": "Here's an optimized multi-stage Dockerfile...",
  "usage": {
    "promptTokens": 245,
    "completionTokens": 512
  }
}
```

### `GET /api/health`

Returns service health status.

---

## Features

| Feature | Status |
|---|---|
| Multi-turn conversation | ✅ |
| Syntax-highlighted code blocks | ✅ |
| Copy-to-clipboard | ✅ |
| Chat history (localStorage) | ✅ |
| Quick topic chips | ✅ |
| Rate limiting | ✅ |
| Docker + Docker Compose | ✅ |
| GitHub Actions CI/CD | ✅ |
| Security headers (Helmet) | ✅ |

---

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci-cd.yml`) runs:

1. **Test** — backend unit tests + frontend build check
2. **Security scan** — Trivy filesystem vulnerability scan
3. **Build & push** — Docker images to GitHub Container Registry (GHCR)
4. **Deploy** — SSH deploy to production server
5. **Health check** — Verifies deployment succeeded
6. **Notify** — Slack alert on failure

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `DEPLOY_HOST` | Production server IP/hostname |
| `DEPLOY_USER` | SSH username |
| `DEPLOY_SSH_KEY` | Private SSH key |
| `SLACK_WEBHOOK_URL` | Slack notifications (optional) |

### Required GitHub Variables

| Variable | Description |
|---|---|
| `API_URL` | Backend API URL for frontend build |
| `HEALTH_CHECK_URL` | URL to hit for post-deploy health check |

---

## Environment Variables

**Backend (`.env`):**
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
NODE_ENV=production
FRONTEND_URL=http://localhost:3000
```

---

## Deployment

### Deploy to AWS ECS

```bash
# Build and push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_URI
docker build -t $ECR_URI/devops-chatbot-backend:latest ./backend
docker push $ECR_URI/devops-chatbot-backend:latest

# Update ECS service
aws ecs update-service --cluster devops-chatbot --service backend --force-new-deployment
```

### Deploy to Kubernetes

```bash
kubectl apply -f k8s/
kubectl set image deployment/backend backend=$NEW_IMAGE
kubectl rollout status deployment/backend
```

---

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, react-markdown, react-syntax-highlighter
- **Backend:** Node.js 20, Express, @google/generative-ai, Helmet, express-rate-limit
- **AI:** Google Gemini 1.5 Flash
- **Infrastructure:** Docker, Nginx, GitHub Actions, GHCR

---

## License

MIT
