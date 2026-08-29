# BSE Trade Data Pipeline

A full-stack trade data pipeline that simulates pulling trade data from the BSE Exchange API, processes it through a Node.js backend, stores the trades, and displays them in a real-time React dashboard.

The project is designed to handle a long-running BSE data pull without keeping an HTTP request open for the entire duration.

---

## 🏗️ Project Architecture

The project consists of three separate services:

```text
                         ┌──────────────────────┐
                         │   React Frontend      │
                         │   Vite               │
                         │   Port: 5173         │
                         └──────────┬───────────┘
                                    │
                                    │ HTTP + Socket.IO
                                    ▼
                         ┌──────────────────────┐
                         │   Node.js Backend     │
                         │   Express + Socket.IO │
                         │   Port: 5000         │
                         └──────────┬───────────┘
                                    │
                                    │ HTTP
                                    ▼
                         ┌──────────────────────┐
                         │   Mock BSE API        │
                         │   Express             │
                         │   Port: 5001         │
                         └──────────────────────┘
```

### Services

| Service      | Technology                    |   Port |
| ------------ | ----------------------------- | -----: |
| Frontend     | React + Vite                  | `5173` |
| Backend      | Node.js + Express + Socket.IO | `5000` |
| Mock BSE API | Node.js + Express             | `5001` |

---

# ✨ Features

* Mock BSE Exchange API
* 3,000 seeded trade records
* Configurable BSE API delay
* Background trade-pull processing
* Non-blocking HTTP API
* Real-time updates using Socket.IO
* React dashboard
* Initial display of recent trades
* Loads all 3,000 trades after a successful pull
* Pull status tracking
* Success and failure notifications
* Responsive dashboard UI
* CORS enabled for local development
---

# 🛠️ Prerequisites

Before running the project, install:

### 1. Node.js

Install Node.js from:

https://nodejs.org/

Check that Node.js and npm are installed:

```powershell
node --version
npm --version
```

The project was developed and tested with Node.js 24.x.

---

# 📥 Clone the Repository

Open VS Code and clone the repository:

```powershell
git clone https://github.com/tinachelwanii/arham.git
```

Then move into the project:

```powershell
cd arham
```

You can also open the project directly in VS Code:

```powershell
code .
```

---

# 📦 Install Dependencies

You need to install dependencies for all three services.

## Frontend

Open a terminal in VS Code:

```powershell
cd frontend
npm install
```

## Mock BSE API

Open another terminal:

```powershell
cd mock-bse-api
npm install
```

## Backend

Open another terminal:

```powershell
cd backend
npm install
```

---

# ⚙️ Environment Variables

The backend and Mock BSE API use environment variables.

Make sure the required `.env` files are present.

## Mock BSE API

Location:

```text
mock-bse-api/.env
```

Example:

```env
PORT=5001
BSE_DELAY_MS=10000
```

### Meaning

```text
PORT=5001
```

Runs the Mock BSE API on port `5001`.

```text
BSE_DELAY_MS=10000
```

Simulates a 10-second BSE API response delay.

You can change the delay if required.

For example:

```env
BSE_DELAY_MS=5000
```

will simulate a 5-second delay.

---

## Backend

Location:

```text
backend/.env
```

The backend environment variables should point to the local Mock BSE API and configure the backend port/database as required by the project.

For local development, the Mock BSE API should be available at:

```text
http://localhost:5001
```

The backend runs at:

```text
http://localhost:5000
```

> **Important:** Do not commit real secrets, database passwords, API keys, or production credentials to GitHub. Use `.env.example` files for sharing configuration templates.

---

# ▶️ Running the Project Locally

The project has **three separate services**, so you should run them in **three separate PowerShell terminals** inside VS Code.

---

## 🟢 Terminal 1 — Frontend

Open the first PowerShell terminal:

```powershell
cd C:\path\to\arham\frontend
npm run dev
```

For example:

```powershell
cd C:\Users\YourName\Desktop\arham\frontend
npm run dev
```

You should see:

```text
VITE ready

Local: http://localhost:5173/
```

Open:

```text
http://localhost:5173/
```

---

# 🟡 Terminal 2 — Mock BSE API

Open a **second PowerShell terminal**.

Run:

```powershell
cd C:\path\to\arham\mock-bse-api
npm start
```

For example:

```powershell
cd C:\Users\YourName\Desktop\arham\mock-bse-api
npm start
```

You should see:

```text
Mock BSE API running on http://localhost:5001
Seeded trades: 3000
Configured delay: 10 seconds
```

The Mock BSE API is now running.

You can test it by opening:

```text
http://localhost:5001
```

You should receive:

```json
{
  "service": "Mock BSE API",
  "status": "running",
  "totalTrades": 3000
}
```

---

# 🔵 Terminal 3 — Backend

Open a **third PowerShell terminal**.

Run:

```powershell
cd C:\path\to\arham\backend
npm start
```

For example:

```powershell
cd C:\Users\YourName\Desktop\arham\backend
npm start
```

You should see:

```text
Backend running on http://localhost:5000
```

The backend is now connected to the Mock BSE API.

---

# 🚀 Complete Local Startup

Every time you want to run the project locally, use these three terminals.

### Terminal 1

```powershell
cd arham\frontend
npm run dev
```

### Terminal 2

```powershell
cd arham\mock-bse-api
npm start
```

### Terminal 3

```powershell
cd arham\backend
npm start
```

Then open:

```text
http://localhost:5173/
```

---

# 🔄 How the Trade Pull Works

When the dashboard is opened, the frontend initially loads the most recent trades.

When the user clicks:

```text
Pull Latest Trades
```

the frontend sends a request to the backend:

```text
POST /api/pull
```

The backend immediately starts the pull as a background job instead of keeping the HTTP request open.

The backend then calls:

```text
GET http://localhost:5001/getTrades
```

The Mock BSE API waits for the configured delay and returns:

```text
3000 trades
```

The backend processes and stores the trades.

After completion, the backend emits a Socket.IO event:

```text
pull-completed
```

The frontend receives the event and loads all 3,000 trades.

The dashboard then displays:

```text
Pull completed successfully

3000 trades were fetched from the BSE API.
```

---

# ⏱️ Why the Pull Runs in the Background

A full BSE pull can take several minutes.

Keeping the browser's HTTP connection open for the entire pull is unreliable because network infrastructure may terminate long-running HTTP connections.

Instead, the application uses:

```text
Frontend
   │
   │ POST /api/pull
   ▼
Backend
   │
   ├── Create Pull Job
   │
   ├── Return immediately
   │
   └── Background Pull
           │
           ▼
      Mock BSE API
           │
           ▼
       3000 Trades
           │
           ▼
      Store Trades
           │
           ▼
      Socket.IO Event
           │
           ▼
        Frontend
```

This allows the frontend to remain responsive while the trade pull is running.

---

# 📊 Dashboard Behavior

### On initial page load

The dashboard displays the available recent trades.

Example:

```text
Trades Loaded
100
```

The previous completed pull does not automatically display the success notification.

---

### When Pull Latest Trades is clicked

The button changes to:

```text
Pulling Trades...
```

The dashboard displays:

```text
Trade pull in progress

The BSE API is processing the request.
Existing trades remain available.
```

---

### After the pull completes

The backend receives:

```text
3000 trades
```

The frontend loads all 3,000 records.

The dashboard displays:

```text
Trades Loaded
3000
```

and:

```text
Pull completed successfully

3000 trades were fetched from the BSE API.
```

---

# 🔌 Important Local URLs

| Service      | URL                   |
| ------------ | --------------------- |
| Frontend     | http://localhost:5173 |
| Backend      | http://localhost:5000 |
| Mock BSE API | http://localhost:5001 |

---

# 🧪 Testing the Mock BSE API

You can test the health endpoint:

```powershell
Invoke-RestMethod http://localhost:5001
```

Expected response:

```json
{
  "service": "Mock BSE API",
  "status": "running",
  "totalTrades": 3000
}
```

The trade endpoint is:

```text
GET http://localhost:5001/getTrades
```

Because the Mock BSE API intentionally simulates a delay, the request will take the configured amount of time before returning the 3,000 trades.

---

# 🛑 Stopping the Services

To stop any service, go to its terminal and press:

```text
Ctrl + C
```

You need to stop each running service separately.

---

# 🔧 Troubleshooting

## `npm start` says "Missing script: start"

Make sure you are inside the correct project directory.

For Mock BSE API:

```powershell
cd mock-bse-api
npm start
```

For Backend:

```powershell
cd backend
npm start
```

The frontend uses:

```powershell
npm run dev
```

---

## Port 5000 is already in use

Check which process is using the port:

```powershell
netstat -ano | findstr :5000
```

Stop the relevant process if necessary.

---

## Port 5001 is already in use

Check:

```powershell
netstat -ano | findstr :5001
```

---

## Frontend cannot connect to backend

Make sure all three services are running:

```text
Frontend       → 5173
Backend        → 5000
Mock BSE API   → 5001
```

Also verify that the frontend API URL points to:

```text
http://localhost:5000
```

---

## Backend cannot fetch trades

Make sure the Mock BSE API is running first.

Test:

```powershell
Invoke-RestMethod http://localhost:5001
```

Expected:

```json
{
  "service": "Mock BSE API",
  "status": "running",
  "totalTrades": 3000
}
```

Then restart the backend.

---

# 📝 Notes for Developers

* `node_modules` should not be committed to GitHub.
* Run `npm install` inside each service directory after cloning.
* Keep `.env` files containing secrets out of GitHub.
* Use `.env.example` to document required environment variables.
* The Mock BSE API generates 3,000 deterministic seeded trade records.
* The BSE delay is configurable using `BSE_DELAY_MS`.
* Socket.IO is used for real-time pull status updates.

---

# 👩‍💻 Technology Stack

### Frontend

* React
* Vite
* Axios
* Socket.IO Client
* CSS

### Backend

* Node.js
* Express
* Socket.IO
* Axios
* Database / ORM as configured in the backend

### Mock BSE API

* Node.js
* Express
* CORS
* dotenv

---

# 📌 Quick Start

For experienced developers:

```powershell
git clone https://github.com/tinachelwanii/arham.git

cd arham\frontend
npm install
npm run dev
```

Open a second terminal:

```powershell
cd arham\mock-bse-api
npm install
npm start
```

Open a third terminal:

```powershell
cd arham\backend
npm install
npm start
```

Then open:

```text
http://localhost:5173
```

---

# ✅ Expected Result

Once all three services are running:

```text
Frontend
http://localhost:5173
        │
        ▼
Backend
http://localhost:5000
        │
        ▼
Mock BSE API
http://localhost:5001
        │
        ▼
3000 Trade Records
```

Click **Pull Latest Trades** on the dashboard to start a new trade pull.

### Pulling Trades

![Pulling Trades](./Screenshot%20(575).png)

### 100 Trades Loaded

![100 Trades](./Screenshot%20(574).png)
