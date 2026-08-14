

## Development Progress

| Module | Status | Notes |
|--------|--------|-------|
| Backend API | ✅ Complete | All endpoints working |
| User Authentication | ✅ Complete | JWT + role-based access |
| Ticket Management | ✅ Complete | Create, update, comment, attach files |
| Admin Dashboard | ✅ Complete | Stats, charts, recent tickets |
| ICT Officer Dashboard | ✅ Complete | Assigned tickets, performance metrics |
| Student/Staff Dashboard | ✅ Complete | Personal tickets, quick submit |
| Knowledge Base | ✅ Complete | Search, categories, voting |
| Asset Management | ✅ Complete | Track, assign, maintain |
| Reports & Analytics | ✅ Complete | Tickets, performance, assets, users |
| Email Notifications | ✅ Complete | Brevo SMTP integration |
| In-App Notifications | ✅ Complete | Bell icon, real-time updates |
| File Uploads | ✅ Complete | Ticket attachments, profile images |
| Frontend Deployment | ✅ Live | Vercel (https://helpdinesk-system-smoky.vercel.app) |
| Backend Deployment | ✅ Live | Render (https://tuc-helpdesk-api.onrender.com) |
| HR Recruitment Portal | ⏳ Pending | Phase 2 feature |

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- npm v9+
- Brevo account (for email notifications)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Onunga123/Helpdesk-system.git
cd Helpdesk-system
```
2. **Install server dependencies**
```bash
cd server
npm install
```
3. **Install client dependencies**
```bash
cd ../client
npm install
```
4. **Configure environment variables**

Create `server/.env`:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
BREVO_SMTP_LOGIN=your_brevo_smtp_login
BREVO_SMTP_KEY=your_brevo_smtp_key
EMAIL_FROM_NAME=TUC ICT Help Desk
EMAIL_FROM_ADDRESS=your_verified_sender_email@gmail.com
CLIENT_URL=http://localhost:3000
```
Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```
5. **Run the server**
```bash
cd server
npm run dev
```
Server runs on **http://localhost:5000**

6. **Run the client** (in a new terminal)
```bash
cd client
npm run dev
```
Client runs on **http://localhost:5173**

## Testing Credentials

## Email Notifications (Brevo Integration)

### Setup Brevo
1. Go to https://www.brevo.com
2. Create a free account
3. Generate SMTP Key under "SMTP & API"
4. Verify sender email address under "Senders & IPs"
5. Add authorized IP addresses (for local: 127.0.0.1)

### Email Triggers
- ✅ Ticket created → email to submitter
- ✅ Ticket assigned → email to ICT officer
- ✅ Ticket status updated → email to submitter
- ✅ New comment → email to ticket owner

### HTML Email Templates
All emails use beautiful branded HTML templates with:
- TUC branding and colors
- Ticket information cards
- Action buttons
- Professional footer

## In-App Notifications

### Features
- ✅ Real-time notification bell in navbar
- ✅ Unread notification badge counter
- ✅ Notification list with timestamps
- ✅ Mark notifications as read
- ✅ Delete notifications
- ✅ Persistent storage in MongoDB
- ✅ Broadcast to multiple users (admins + ICT officers)

### Notification Types
- `ticket_created` — New ticket submitted
- `status_updated` — Ticket status changed
- `assigned` — Ticket assigned to officer
- `commented` — New comment on ticket
- `resolved` — Ticket marked as resolved
## Deployment

### Backend (Render)
1. Push code to GitHub
2. Render auto-deploys on every commit
3. Environment variables set in Render dashboard
4. Free tier: service spins down after 15 minutes of inactivity

### Frontend (Vercel)
1. Push code to GitHub
2. Vercel auto-deploys on every commit
3. Environment variables set in Vercel project settings
4. Instant deployment, global CDN

## Compliance

- ✅ Kenyan Data Protection Act (2019)
- ✅ Public Service recruitment standards
- ✅ University institutional data governance policies

## Future Roadmap

- [ ] HR Recruitment Portal
- [ ] SMS notifications
- [ ] Ticket escalation workflows
- [ ] Service Level Agreements (SLA)
- [ ] Advanced reporting (PDF/Excel export)
- [ ] Chatbot support
- [ ] Integration with Active Directory

## Institution

**Turkana University College**  
Lodwar, Turkana County, Kenya  
ICT Department

## License

Private project for Turkana University College

## Support

For issues or feature requests, contact: ict@tuc.ac.ke

**Last Updated:** July 19, 2026  
**Current Version:** 1.0.0  
**Status:** ✅ Production Ready
