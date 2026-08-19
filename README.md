# IPO Management System

A modern, mobile-first IPO subscription management application built with Next.js (full-stack) featuring role-based access control.

## Features

### Roles
- **Super Admin (dineshkumar)**: Full access to all features
  - Add/Edit/Delete IPOs
  - Add/Edit/Delete Users
  - View all IPO entries
  - Approve/Reject IPO entries
  - Update allotment status
  - Approve deletion requests

- **Regular User**: Limited access
  - View all IPOs
  - Apply for IPOs (create entries)
  - View their own IPO entries only
  - Request deletion of their entries
  - Update their own profile (name, password only)

### IPO Management
- Create, Read, Update, Delete IPOs
- IPO fields: name, symbol, start/end dates, rumor GMP, price, lot size, cost in rupees, status, listing date, allotment date
- Status types: PENDING, ACTIVE, CLOSED

### IPO Entry Management
- Users can apply for IPOs with UPI ID
- Super Admin can create entries for any user
- Status workflow: PENDING -> ACCEPTED/REJECTED
- Allotment status: ALLOTED, NOT_ALLOTED
- Deletion request workflow for regular users

### Authentication
- JWT-based authentication
- Cookie-based sessions
- Default Super Admin credentials:
  - Username: `dineshkumar`
  - Password: `Jaipur@2026`

## Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom orange theme
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT tokens with jose library
- **Password Hashing**: bcryptjs
- **Language**: TypeScript

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. Clone the repository:
```bash
cd ipo
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` file and update the JWT_SECRET if needed.

4. Initialize and seed the database:
```bash
npx prisma db push
npx prisma db seed
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Login
- Navigate to `/login`
- Use default credentials:
  - Username: `dineshkumar`
  - Password: `Jaipur@2026`

### Super Admin Features
1. **Add IPO**: Go to Dashboard > Add New IPO
2. **Manage Users**: Go to Dashboard > Users
3. **View All Entries**: Go to Dashboard > All Entries
4. **Approve Entries**: In All Entries page, change status from PENDING to ACCEPTED/REJECTED
5. **Update Allotment**: For ACCEPTED entries, set allotment status
6. **Approve Deletion**: Review and approve deletion requests from users

### Regular User Features
1. **View IPOs**: Go to Dashboard > All IPOs
2. **Apply for IPO**: Go to Dashboard > My Entries > Apply for New IPO
3. **View My Entries**: Go to Dashboard > My Entries
4. **Request Deletion**: Click "Request Delete" on your pending entries
5. **Update Profile**: Go to Dashboard > Profile

## Project Structure

```
ipo/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Initial data seeding
├── src/
│   ├── app/
│   │   ├── (auth)/        # Authentication pages
│   │   │   └── login/
│   │   ├── (dashboard)/   # Protected dashboard pages
│   │   │   ├── ipos/      # IPO management
│   │   │   ├── entries/   # Entry management
│   │   │   ├── users/     # User management
│   │   │   └── profile/   # User profile
│   │   ├── api/           # API routes
│   │   │   ├── auth/      # Authentication endpoints
│   │   │   ├── ipos/      # IPO API endpoints
│   │   │   ├── entries/   # Entry API endpoints
│   │   │   ├── users/     # User API endpoints
│   │   │   └── profile/   # Profile API endpoints
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx      # Main page (redirects)
│   ├── components/        # React components
│   │   ├── AuthProvider.tsx
│   │   ├── Navbar.tsx
│   │   └── Sidebar.tsx
│   ├── lib/
│   │   ├── db.ts         # Prisma client
│   │   ├── auth.ts       # Authentication utilities
│   │   └── client-auth.ts # Client-side auth utilities
│   └── styles/
│       └── globals.css   # Global styles with orange theme
├── .env                 # Environment variables
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username and password
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### IPOs
- `GET /api/ipos` - Get all IPOs
- `POST /api/ipos` - Create IPO (Super Admin only)
- `GET /api/ipos/:id` - Get single IPO
- `PUT /api/ipos/:id` - Update IPO (Super Admin only)
- `DELETE /api/ipos/:id` - Delete IPO (Super Admin only)

### Entries
- `GET /api/entries` - Get entries (Super Admin: all, User: own only)
- `POST /api/entries` - Create entry
- `GET /api/entries/:id` - Get single entry
- `PUT /api/entries/:id` - Update entry (Super Admin: status/allotment, User: deletion request)
- `DELETE /api/entries/:id` - Delete entry or request deletion

### Users
- `GET /api/users` - Get all users (Super Admin only)
- `POST /api/users` - Create user (Super Admin only)
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Super Admin only)

### Profile
- `GET /api/profile` - Get current user profile
- `PUT /api/profile` - Update current user profile

## Styling

The application features a modern orange color theme:
- Primary color: `#f97316` (orange-500)
- Primary dark: `#ea580c` (orange-600)
- Background: `#fef3e2` (orange-50)
- Text colors: Dark brown shades for contrast

Custom CSS classes available:
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-success`
- `.card` - White card with shadow
- `.form-input`, `.form-label` - Form elements
- `.badge-*` - Status badges
- `.alert-*` - Alert messages
- `.spinner` - Loading spinner
- `.modal-overlay`, `.modal` - Modal dialog

## Security Notes

1. Always use HTTPS in production
2. Change the JWT_SECRET in production
3. Consider using a more secure database in production
4. Implement rate limiting for login attempts
5. Regularly update dependencies

## Default Super Admin

- **Username**: `dineshkumar`
- **Password**: `Jaipur@2026`
- **Role**: Super Admin

You can add more Super Admins through the Users management page after logging in.

## Mobile First Design

The application is designed with mobile-first approach:
- Responsive layout for all screen sizes
- Touch-friendly buttons and inputs
- Optimized for mobile viewing
- Sidebar collapses to hamburger menu on mobile

## License

This project is created for personal use. Feel free to customize and extend as needed.