# TUC ICT Help Desk & HR Recruitment Portal
A comprehensive web-based institutional management system for Turkana University College (TUC), built with the MERN stack. The system combines an ICT Help Desk and a Human Resource Recruitment Portal into a single, unified platform.
 System Overview
Turkana University College manages hundreds of staff and students who require ICT support daily.
This system digitizes and automates ICT issue reporting, resolution tracking, and staff recruitment replacing manual, paper-based processes with a transparent, efficient, and auditable platform.
 Tech Stack
 Frontend: React.js + Vite 
 Backend: Node.js + Express.js 
Database: MongoDB Atlas 
Authentication: JWT (JSON Web Tokens) 
 Password Security: bcryptjs
 File Uploads: Multer 
API Architecture: RESTful API
System Modules
 Module 1 — ICT Help Desk System
User Management
- Role-based access control (Administrator, ICT Officer, Staff, Student)
- Secure login with institutional email (@tuc.ac.ke)
- User profile management
Ticket Management
- Submit ICT requests and incidents (network issues, hardware repair, software installation, etc.)
- Attach screenshots and documents to tickets
- Auto-generated ticket numbers (TUC-YEAR-XXXX-XXX)
- Ticket prioritization (Low, Medium, High, Critical)
- Real-time status tracking (Open, In Progress, Resolved, Closed)
 ICT Staff Dashboard
- View and manage all assigned tickets
- Update progress and add resolution notes
- Reassign or escalate tickets to other officers
- Track service turnaround time with SLA timestamps
User Dashboard (Staff & Students)
- Submit and monitor personal tickets
- View status updates and comments
- Receive notifications on ticket activity
Knowledge Base
- FAQs and self-service guides (Wi-Fi setup, password reset, printing help)
- Searchable articles for common ICT problems
Asset Management
- Track ICT equipment and repairs
- Assign equipment to departments or users
- Generate maintenance history reports
Reports & Analytics
- Ticket volume by department or category
- Average resolution time per ICT officer
- Performance dashboards
- Export reports (PDF / Excel)
Notifications & Communication
- Email and SMS alerts for ticket updates
- Internal messaging between users and ICT officers
Admin Panel
- Manage users, roles, and departments
- Define service categories and priorities
- Configure SLAs (Service Level Agreements)
 Module 2 — HR Recruitment Portal
 Job Advertisement Management
- Create and publish job adverts (Academic, Administrative, Technical)
- Define qualification requirements, experience, and application deadlines
- Auto-close adverts after deadline
- Publish internally and externally
 Applicant Management
- Online applicant registration and profile management
- Document uploads — CV, academic certificates, professional certificates, National ID (PDF only)
- Multiple job applications per applicant
- Real-time application status tracking
Shortlisting Module
- Automated shortlisting based on minimum qualifications and experience
- Manual override with justification
- Shortlisting approval workflow
 Interview Management
- Schedule interviews (physical or online)
- Assign interview panels to candidates
- Scoring templates with automatic total computation
- Panel comments and recommendations
Approval & Appointment Module
- Generate ranked candidate lists for management review
- Management approval interface
- Appointment letter generation
- Regret letter generation for unsuccessful candidates
Reporting & Analytics
- Number of applicants per position
- Shortlisted vs rejected candidates
- Interview scores and rankings
- Gender balance and diversity statistics
- Recruitment timelines
- Full audit trail reports
- Export reports (PDF / Excel)
User Roles
ICT Help Desk Roles
Administrator: Full system access — manage users, tickets, reports, and settings
ICT Officer: View and manage assigned tickets, update status, add resolution notes
Staff: Submit tickets, track own tickets, receive notifications
 Student: Submit tickets, track own tickets, receive notifications
 HR Recruitment Roles
System Administrator: User management, system configuration, audit logs 
 HR Officer: Create job adverts, manage applications, schedule interviews, generate reports Selection Panel Member: View assigned applications, score candidates, add recommendations
Applicant: Register, apply for positions, upload documents, track application status
 Approving Authority: Review recommendations, approve or reject recruitment outcomes
Development Progress
Phase 1: Project Setup & MongoDB Atlas Connection; ✅Complete 
Phase 2: User Management & Authentication; ✅ Complete 
 Phase 3: Ticket Management;  ✅ Complete 
 Phase 4: ICT Staff Dashboard; 🔄 In Progress 
 Phase 5:  Knowledge Base; ⏳ Pending 
Phase 6: Asset Management; ⏳ Pending 
 Phase 7: Reports & Analytics; ⏳ Pending
 Phase 8: Notifications & Communication; ⏳ Pending 
 Phase 9: HR Recruitment Portal; ⏳ Pending 
Phase 10: Frontend (React); ⏳ Pending 
 Getting Started
Prerequisites
- Node.js v18+
- MongoDB Atlas account
- npm v9+
Installation
1. Clone the repository
   ```bash
   git clone https://github.com/Onunga123/Helpdesk-system.git
   cd Helpdesk-system
2.	Install server dependencies
3.	cd server
4.	npm install
5.	Install client dependencies
6.	cd ../client
7.	npm install
8.	Configure environment variables — create server/.env
9.	PORT=5000
10.	NODE_ENV=development
11.	MONGO_URI=your_mongodb_atlas_connection_string
12.	JWT_SECRET=your_jwt_secret_key
13.	JWT_EXPIRE=30d
14.	Run the server
15.	cd server
16.	npm run dev
17.	Run the client
18.	cd client
19.	npm run dev
Server runs on http://localhost:5000 Client runs on http://localhost:5173
Project Structure
Helpdesk-system/
├── client/                        # React + Vite frontend
│   └── src/
│       ├── App.jsx
│       └── main.jsx
└── server/                        # Node.js + Express backend
    ├── config/
    │   └── db.js                  # MongoDB Atlas connection
    ├── controllers/
    │   ├── authController.js      # Register, login, profile
    │   └── ticketController.js    # Ticket CRUD + stats
    ├── middleware/
    │   ├── authMiddleware.js      # JWT protect + role authorize
    │   ├── errorMiddleware.js     # Global error handler
    │   └── uploadMiddleware.js    # Multer file upload config
    ├── models/
    │   ├── userModel.js           # User schema + password hashing
    │   └── ticketModel.js         # Ticket schema + comment sub-schema
    ├── routes/
    │   ├── authRoutes.js          # Auth API routes
    │   └── ticketRoutes.js        # Ticket API routes
    ├── utils/
    │   └── generateToken.js       # JWT token generator
    ├── uploads/                   # Uploaded files storage
    └── server.js                  # App entry point
Security Features
•	Passwords hashed with bcryptjs (never stored in plain text)
•	JWT tokens with expiry for stateless authentication
•	Role-based access control on all sensitive routes
•	Deactivated users blocked from logging in
•	File upload restricted to images and documents (5MB max)
•	Environment variables for all sensitive configuration
•	Tickets can only be assigned to ICT Officers or Admins
Compliance
•	Kenyan Data Protection Act (2019)
•	Public Service recruitment standards
•	University institutional data governance policies
Institution
Turkana University College Lodwar, Turkana County, Kenya ICT Department
Push to GitHub
```powershell
cd C:\Users\LENOVO\tuc-helpdesk
git add README.md
git commit -m "docs: add comprehensive README for TUC Help Desk and HR Recruitment Portal"
git push origin master

