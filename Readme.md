# ITS – Infrastructure Tracking System

> Modern, full-stack IT infrastructure visibility platform built for **universities and large labs**. Enables real-time diagnostics, fault tracking, and transparent workflows through a unified dashboard.

---

## 📦 Monorepo Structure

```
ITS/
├── Backend/               # Node.js + Express + PostgreSQL (API + DB)
├── Frontend/              # Next.js + React web dashboard (with permission checks)
├── Frontend-App/          # React Native mobile app (On-the-go control)
├── Frontend-Windows-App/  # C++ Windows GUI (WAP) to control the local agent & settings
├── Readme.md              # Monorepo overview (this file)
└── LICENSE
```

---

🧠 Overview

ITS replaces outdated manual tracking in educational institutions by introducing:

* Real-time, agent-based monitoring of lab systems
* Centralized backend with permission-based dashboards
* Public transparency through live dashboards
* Technician automation & analytics-driven fault management

> **Note:** Roles have been removed. Access control is now entirely **permission-based**, giving modularity and easier management.

---

## 🔧 Key Features

### 📡 Agent (Windows Service)

* Collects system specs, IP address, optional speed test
* Identified via disk serial number
* Sends periodic reports (user-defined interval)
* Configured via local GUI (lab ID, interval, labels)

### 🧠 Backend API (Node.js + Express + PostgreSQL)

* **Permission-based access control** (no predefined roles)
* System registration & lab mapping
* Fault reporting & status tracking
* Technician auto-scheduling
* Historical logs & performance data

> **Wildcard permission restriction:** Only users who already have the `*` permission can grant `*` to another user.

### 🌐 Web Dashboard (Next.js + React)

* Public + internal dashboards
* View all systems by lab, current status, specs
* Charts: fault frequency, lab uptime, response time

### 📱 Mobile App (React Native)

* Fault reporting interface
* Technician queue & task management
* Compact dashboard view

### 🖥️ Windows Config App (C++ GUI)

* Configure local system agent
* Input lab ID, labels, reporting interval
* Enable/disable speed checks
* Start/Stop reporting service (wraps Python/Node agent)

---

## 🧱 Technologies Used

| Layer        | Tech Stack                             |
| ------------ | -------------------------------------- |
| Backend      | Node.js, Express, PostgreSQL           |
| Web Frontend | Next.js, React, TailwindCSS            |
| Mobile App   | React Native + Expo                    |
| Agent        | Python or Node.js (runs in background) |
| Agent GUI    | C++ (Windows API)                      |
| Charts       | Recharts / Chart.js                    |
| Auth         | JWT + Individual permissions           |
| Network      | HTTPS API over public internet         |

---

## 🛠️ Getting Started

<details>
<summary>🔧 Prerequisites</summary>

* Node.js ≥ 18.x
* PostgreSQL ≥ 14
* Git
* Expo Go (for mobile testing)
* React Native CLI (if building locally)

</details>

---

### 1. Clone Repository

```bash
git clone https://github.com/Avinash99b/ITS-Infrastructure-Managment-System
cd ITS
```

---

### 2. Backend Setup

```bash
cd Backend
npm install
cp .env.example .env   # Edit DB credentials
npm run dev
```

---

### 3. Frontend – Web Dashboard

```bash
cd ../Frontend
npm install
npm run dev
```

---

### 4. Frontend-App – Mobile App

```bash
cd ../Frontend-App
npm install
npx expo start
```

---

### 5. Frontend-Windows-App – Agent Config GUI (C++)

* Open the project in Visual Studio (or preferred C++ IDE)
* Compile the GUI application
* Run on each lab system to configure the agent

The GUI wraps a Python/Node script that:

* Collects system specs
* Sends data to backend
* Runs periodically based on user-defined interval

> All agent activity is tied to the disk serial number to ensure unique identity.

---

## 📊 Project Milestones

| Phase   | Description                                                      |
| ------- | ---------------------------------------------------------------- |
| Phase 1 | Core data tracking, system registration, public dashboard        |
| Phase 2 | Fault reporting flow + technician auto-schedule                  |
| Phase 3 | Public analytics, performance graphs, permission-based dashboard |
| Phase 4 | Retry logic, isolated system tolerance, mobile app polish        |

---

## 🔐 Permissions

Each user is assigned **individual permissions**. There are no predefined roles.

| Permission Name     | Description                                                                    |
| ------------------- | ------------------------------------------------------------------------------ |
| `view_users`        | View users                                                                     |
| `edit_users`        | Edit users                                                                     |
| `delete_users`      | Delete users                                                                   |
| `grant_permissions` | Grant permissions to other users (cannot grant `*` unless holder also has `*`) |
| `edit_systems`      | Edit system details                                                            |
| `delete_systems`    | Delete systems                                                                 |
| `edit_faults`       | Edit fault reports                                                             |
| `delete_faults`     | Delete fault reports                                                           |
| `*`                 | All permissions, use with caution; can only be granted by another `*` holder   |

### API Authorization

* Each endpoint requires authentication via **JWT**
* Access is verified against **user’s permission array**
* Wildcard permission `*` grants all access

Example middleware:

```ts
function checkPermission(required: string) {
  return (req, res, next) => {
    const userPerms = req.user.permissions;
    if (!userPerms.includes(required) && !userPerms.includes('*')) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
```

---

## 📂 Future Enhancements

* Offline agent queuing with retry logic
* Email notifications on fault resolution/status
* Technician geolocation (optional privacy toggle)
* Exportable reports (CSV / PDF)
* AI-based fault prediction (experimental module)

---

## 💻 Frontend-Windows-App (WAP GUI)

The GUI enables local config for each agent:

* **Input:** Lab ID, System Label
* **Controls:** Set reporting interval, toggle speed test
* **Monitor:** View current config
* **Actions:** Start/Stop agent (Python/Node wrapper)

> All activity tied to disk serial number ensures unique identity even if hostname/IP changes.

---

## 📖 License

MIT © \[Avinash99b]

---

💬 Questions / Contributions

Open an issue or pull request — contributions, suggestions, or feedback welcome.

Transparent, efficient, and future-proof IT infrastructure visibility.

---
