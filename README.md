 Smart Meeting Room & Resource Management System

A full-stack web application for managing meeting rooms, bookings, shared resources, notifications, users, reporting, and administrative operations from a centralized platform.

The system is designed to simplify room scheduling, prevent booking conflicts, track resource usage, provide booking notifications, and generate management reports.



 Overview

The **Smart Meeting Room & Resource Management System** provides an integrated solution for organizations that need to efficiently manage meeting spaces and associated resources.

Users can view available meeting rooms, create and manage bookings, reserve resources, receive notifications, review booking history, and monitor usage through reports and dashboards.

The application follows a modern full-stack architecture with a **React + TypeScript frontend** and a **FastAPI backend**.



Key Features

Dashboard

* Centralized overview of meeting room activity
* Booking and usage statistics
* Recent activity information
* Quick navigation to major system modules

Meeting Room Management

* View available meeting rooms
* Manage room information
* Track room availability
* Support for room-specific resources

Booking Management

* Create meeting room bookings
* View existing bookings
* Cancel bookings
* Support for recurring meetings
* Booking status tracking
* Start and end date/time management
* Booking descriptions and meeting titles
* Pagination for booking records

Resource Management

* Manage shared resources
* Associate resources with meeting rooms
* Track resource reservations
* Monitor resource usage and quantities

Notifications

* Booking confirmation notifications
* Meeting reminder notifications
* Booking cancellation notifications
* Read/unread notification status
* Automatic notification refreshing

Reports & Analytics

* Monthly booking summary
* Confirmed booking statistics
* Cancelled booking statistics
* Total booked hours
* Room utilization
* Resource usage statistics
* Upcoming meetings
* Excel report export
* PDF report export

User Management

* User authentication
* User account management
* Role and department support
* Administrative user management

 Audit & Administration

* Audit log support
* Administrative operations
* Role-based application structure
* Centralized backend services

Background Processing

* Background notification task support
* Celery-based task configuration



Technology Stack

 Frontend

* React
* TypeScript
* Vite
* Material UI (MUI)
* Axios
* React Router
* JavaScript/TypeScript browser storage

Backend

* Python
* FastAPI
* SQLAlchemy
* Alembic
* Pydantic
* JWT-based authentication
* Celery

 Development Tools

* Git
* GitHub
* VS Code
* npm
* Python virtual environment


## Project Architecture


Smart Meeting Room And Resource Management System
│
├── backend/
│   ├── alembic/
│   │   └── versions/
│   ├── app/
│   │   ├── core/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── tasks/
│   │   └── utils/
│   ├── alembic.ini
│   ├── requirements.txt
│   └── test_db.py
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── assets/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── main.tsx
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.ts
│
└── .gitignore


Backend Modules

The backend is organized into separate layers to improve maintainability and scalability.


app/
├── core/
├── models/
├── routers/
├── schemas/
├── services/
├── tasks/
└── utils/


Core

Application configuration, database integration, authentication, dependencies, and task configuration.

Models

Database models for:

* Users
* Roles
* Departments
* Meeting Rooms
* Bookings
* Resources
* Room Resources
* Booking Resources
* Notifications
* Audit Logs

 Routers

API endpoints for:

* Authentication
* Bookings
* Meeting Rooms
* Resources
* Room Resources
* Notifications
* Dashboard
* Administration
* Audit Logs

Services

Business logic is separated from route definitions through dedicated service modules.



Frontend Pages

The application currently includes major pages such as:


Dashboard
Meeting Rooms
Bookings
Resources
Notifications
Reports
Users


The frontend uses Material UI components to provide a responsive and structured user interface.



API Overview

The backend exposes REST API endpoints for the major application modules.

Examples include:


Authentication
Bookings
Meeting Rooms
Resources
Notifications
Dashboard
Reports
Users
Administration
Audit Logs


Example backend base URL used during local development:


http://127.0.0.1:8000


FastAPI documentation is available during development at:


http://127.0.0.1:8000/docs


Local Development Setup

 1. Clone the repository

bash
git clone https://github.com/nareshkumar5253/Smart-Meeting-Room-And-Resource-Management-System.git


Move into the project:


cd Smart-Meeting-Room-And-Resource-Management-System




2. Backend Setup

Open a terminal in the backend directory:


cd backend


Create a Python virtual environment:

Windows

powershell
python -m venv venv


Activate it:

powershell
venv\Scripts\activate


Install dependencies:


pip install -r requirements.txt


Run database migrations:


alembic upgrade head


Start the FastAPI server:


python -m uvicorn app.main:app --reload


Backend API:


http://127.0.0.1:8000


Swagger API documentation:


http://127.0.0.1:8000/docs




3. Frontend Setup

Open another terminal and move into the frontend directory:


cd frontend


Install dependencies:


npm install


Start the development server:


npm run dev


The Vite development server will display the local frontend URL in the terminal, typically:


http://localhost:5173


 Environment Configuration

For security, environment-specific configuration should be stored in environment files and should not be committed to GitHub.

Typical configuration may include:


API configuration
Database configuration
Authentication configuration
Secret keys
Background task configuration


Refer to the backend configuration files when creating your local environment configuration.

Never commit passwords, secret keys, access tokens, or other sensitive credentials to the repository.
Database Migrations

The project uses **Alembic** for database schema migrations.

Apply the latest migrations:

```bash
alembic upgrade head
```

Create a new migration when required:

```bash
alembic revision --autogenerate -m "your migration message"
```

Then apply it:

```bash
alembic upgrade head
```

---

## Development Workflow

Run the backend and frontend separately.

### Terminal 1 — Backend

```bash
cd backend
venv\Scripts\activate
python -m uvicorn app.main:app --reload
```

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

Open the frontend URL shown by Vite in your browser.

---

## Git Workflow

After making changes:

```bash
git status
```

Add changes:

```bash
git add .
```

Commit:

```bash
git commit -m "Describe your changes"
```

Push:

```bash
git push
```

Example:

```bash
git add .
git commit -m "Improve booking and reporting features"
git push
```

---

## Security

The project uses authentication and protected API access.

When working with the repository:

* Do not commit `.env` files containing secrets.
* Do not commit passwords or API keys.
* Do not commit `backend/venv`.
* Do not commit `node_modules`.
* Keep production credentials outside source control.

The repository includes a `.gitignore` file to prevent common generated files and sensitive files from being committed.

---

## Future Improvements

Potential future enhancements include:

* Calendar-based booking interface
* Real-time WebSocket notifications
* Advanced room availability visualization
* Email notification integration
* Mobile-responsive improvements
* Advanced analytics dashboards
* Automated reminder scheduling
* Cloud deployment
* Containerized deployment with Docker
* Automated testing and CI/CD
* Enhanced administrative controls

---

## Project Goals

The main goals of this project are to:

1. Simplify meeting room scheduling.
2. Reduce booking conflicts.
3. Improve visibility of room and resource utilization.
4. Provide timely booking notifications.
5. Centralize meeting room and resource administration.
6. Provide useful reports for operational decision-making.
7. Maintain a scalable and maintainable full-stack architecture.

---

## Project Structure Summary

| Layer            | Technology         |
| ---------------- | ------------------ |
| Frontend         | React + TypeScript |
| UI               | Material UI        |
| Build Tool       | Vite               |
| API Client       | Axios              |
| Backend          | FastAPI            |
| Data Validation  | Pydantic           |
| ORM              | SQLAlchemy         |
| Migrations       | Alembic            |
| Authentication   | JWT                |
| Background Tasks | Celery             |
| Version Control  | Git + GitHub       |

---

## Repository

GitHub:

https://github.com/nareshkumar5253/Smart-Meeting-Room-And-Resource-Management-System

---


