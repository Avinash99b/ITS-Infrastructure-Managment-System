# ITS – Infrastructure Tracking System

> Modern, full-stack IT infrastructure visibility platform built for **universities and large labs**. Enables real-time diagnostics, fault tracking, and transparent technician workflows through a unified dashboard.

---

## 📦 Monorepo Structure

```
ITS/
├── Backend/               # Node.js + Express + PostgreSQL (API + DB)
├── Frontend/              # Next.js + React web dashboard (Admin, Technician, Public)
├── Frontend-App/          # React Native mobile app (On-the-go control)
├── Frontend-Windows-App/  # C++ Windows GUI (WAP) to control the local agent & settings
├── Readme.md              # Monorepo overview (this file)
└── LICENSE

```

---

🧠 Overview

ITS replaces outdated manual tracking in educational institutions by introducing:

Real-time, agent-based monitoring of lab systems

Centralized backend and role-based dashboards

Public transparency through live dashboards

Technician automation & analytics-driven fault management



---

## 🔧 Key Features

### 📡 Agent (Windows Service)

Collects system specs, IP address, optional speed test

Identified via disk serial number

Sends periodic reports (user-defined interval)

Configured via local GUI (lab ID, interval, labels)


### 🧠 Backend API (Node.js + Express + PostgreSQL)

Role-based access: Admin, Lab Incharge, Technician

System registration & lab mapping

Fault reporting & status tracking

Technician auto-scheduling

Historical logs & performance data


### 🌐 Web Dashboard (Next.js + React)

Public + internal dashboards

View all systems by lab, current status, specs

Charts: fault frequency, lab uptime, response time


### 📱 Mobile App (React Native)

Fault reporting interface

Technician queue & task management

Compact dashboard view


### 🖥️ Windows Config App (C++ GUI)

Configure local system agent

Input lab ID, labels, reporting interval

Enable/disable speed checks

Start/Stop reporting service (wraps Python/Node agent)



---

## 🧱 Technologies Used

Layer	Tech Stack

Backend	Node.js, Express, PostgreSQL

Web Frontend	Next.js, React, TailwindCSS

Mobile App	React Native + Expo

Agent	Python or Node.js (runs in background)

Agent GUI	C++ (Windows API)

Charts	Recharts / Chart.js

Auth	JWT, Role-based permissions

Network	HTTPS API over public internet

---

🛠️ Getting Started

<details>
<summary>🔧 Prerequisites</summary>Node.js ≥ 18.x

PostgreSQL ≥ 14

Git

Expo Go (for mobile testing)

React Native CLI (if building locally)


</details>
---

1. Clone Repository

git clone https://github.com/Avinash99b/ITS-Infrastructure-Managment-System

cd ITS


---

2. Backend Setup

cd Backend
npm install
cp .env.example .env   # Edit DB credentials
npm run dev


---

3. Frontend – Web Dashboard

cd ../Frontend
npm install
npm run dev


---

4. Frontend-App – Mobile App

cd ../Frontend-App
npm install
npx expo start


---

5. Frontend-Windows-App – Agent Config GUI (C++)

Open the project in Visual Studio (or your preferred C++ IDE)

Compile the GUI application

Run it on each lab system to configure agent


The GUI wraps a Python/Node script that:

Collects system specs

Sends data to backend

Runs periodically based on user-defined interval



---

📊 Project Milestones

Phase	Description	Status

Phase 1	Core data tracking, system registration, public dashboard

Phase 2	Fault reporting flow + technician auto-schedule

Phase 3	Public analytics, performance graphs, role dashboard

Phase 4	Retry logic, isolated system tolerance, mobile app polish



---

🔐 Roles & Permissions

Role	Access Capabilities

Admin	All data access, analytics, user & system management
Lab Incharge	View/report faults for own lab systems
Technician	View assigned faults, mark resolved, update notes
Public	Read-only access to lab/system health, charts



---

📂 Future Enhancements

🔄 Offline agent queuing with retry logic

📧 Email notifications on fault resolution/status

📍 Technician geolocation (optional privacy toggle)

🗃️ Exportable reports (CSV / PDF)

🧠 AI-based fault prediction (experimental module)



---

💻 Frontend-Windows-App (WAP GUI)

The GUI enables local config for each agent without manual scripting:

Features:

Input: Lab ID, System Label

Controls: Set reporting interval, toggle speed test

Monitor: View current config

Actions: Start/Stop agent (Python/Node wrapper)


> All agent activity is tied to the disk serial number to ensure unique identity, even if hostname/IP changes.




---

📖 License

MIT © [Avinash99b]


---

💬 Questions / Contributions

Open an issue or pull request — contributions, suggestions, or feedback welcome.

Let’s build modern IT infrastructure visibility — transparent, efficient, and future-proof.

---