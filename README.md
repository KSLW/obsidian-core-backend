# ⚙️ Obsidian Core Backend

The backend engine powering the **Obsidian** platform — an event-driven automation and data management system built with **Node.js**, **Express**, and **PostgreSQL/MongoDB**.

---

## 🚀 Live API

🔗 **Live Deployment:** [https://obsidian-core-backend.onrender.com/](https://obsidian-core-backend.onrender.com/)  
🖥️ **Frontend Dashboard:** [https://dashboard-3let.onrender.com/](https://dashboard-3let.onrender.com/)

---

## 🧠 Overview

The **Obsidian Core Backend** provides the underlying API, event bus, and automation engine for the platform.  
It’s built with modular Express routes and supports live communication through WebSockets, allowing the frontend dashboard to react to real-time updates.

---

## 🧰 Tech Stack

| Layer | Technology |
|--------|-------------|
| Server | Node.js + Express |
| Database | PostgreSQL (via Sequelize) / MongoDB |
| Auth | JWT (JSON Web Tokens) |
| Realtime | WebSocket + EventEmitter |
| Deployment | Render |
| Language | JavaScript (ES6+) |

---

## 🧩 Key Features

- 🎯 Modular route structure (auth, events, users, system)
- 📡 WebSocket event system for real-time updates
- 🧠 EventBus engine with action triggers
- 🔐 JWT authentication and refresh tokens
- 🗂️ PostgreSQL + Sequelize ORM integration
- 🛠️ RESTful API design with versioning support
- ⚙️ Configurable `.env` for dev/production environments

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the repository
```bash
git clone https://github.com/KSLW/obsidian-core-backend
cd obsidian-core-backend
