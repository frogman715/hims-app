# HANMARINE INTEGRATED MANAGEMENT SYSTEM (HIMS)

A comprehensive maritime management system built with Next.js, Prisma, and PostgreSQL.

## Features

### Core Modules
- **Dashboard**: Real-time overview with role-based widgets and KPI tracking
- **Crewing Module**: Manage seafarer applications, assignments, documents, training, and medical records
- **HR & Office Module**: Employee management, attendance, leaves, and disciplinary actions
- **Accounting Module**: Wage payments, allotments, petty cash, and financial records
- **Quality / ISO Module**: Document control, audits, risk management, and corrective actions

### External Compliance Integration (NEW 2025)
- **KOSMA (Korea)**: Track 3-hour online training certificates (1-year validity)
- **Dephub Indonesia**: Validate seafarer certificates and seaman books
- **Schengen Visa NL**: Manage visa applications for EU tanker operations

### Security Features
- **Role-Based Access Control (RBAC)**: 6 distinct roles with granular permissions
- **AES-256-GCM Encryption**: Secure storage for sensitive RED data
- **Data Masking**: AMBER data protection for non-privileged users
- **Security Headers**: HSTS, CSP, X-Frame-Options, and more
- **Rate Limiting**: Protection against brute force attacks
- **Error Boundaries**: Graceful error handling with fallback UI

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Deployment**: Docker

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL (via Docker)

### 🔐 Security First (CRITICAL)

**Before installation, generate secure environment variables:**

```bash
# Generate secrets
openssl rand -base64 32  # For NEXTAUTH_SECRET
openssl rand -base64 32  # For HIMS_CRYPTO_KEY
openssl rand -base64 24  # For database password

# Copy environment template
cp .env.example .env

# Edit .env and replace ALL CHANGE_ME_* values with generated secrets
nano .env
```

⚠️ **NEVER use default secrets in production!**

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hims-app
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your generated secrets
nano .env
```

3. Verify environment configuration:
```bash
bash scripts/verify-env.sh
```

4. Install dependencies:
```bash
npm install
```

5. Start the database:
```bash
docker-compose up -d db
```

6. Set up the database:
```bash
npx prisma migrate deploy
npx prisma generate
```

5. Seed initial data:
```bash
npm run seed
```

6. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Default Login

- **Email**: admin@hanmarine.com
- **Password**: admin123

⚠️ **IMPORTANT**: Change this password immediately after first login!

## External Compliance Systems

HIMS integrates with three maritime regulatory systems:

### 1. KOSMA Certificate (Korea)
- **Portal**: https://www.marinerights.or.kr
- **Purpose**: 3-hour online training for Korea-flagged vessels
- **Validity**: 1 year (renew before each Korean vessel contract)
- **Access in HIMS**: Dashboard → External Compliance Widget or `/compliance/external`

### 2. Dephub Certificate (Indonesia)
- **Portal**: https://pelaut.dephub.go.id/login-perusahaan
- **Purpose**: Validate Indonesian seafarer certificates (sijil/seaman book)
- **Requirements**: Company SIUPAK account
- **Features**: Online/offline certificate verification

### 3. Schengen Visa NL (Netherlands)
- **Portal**: https://consular.mfaservices.nl
- **Purpose**: Visa applications for crew on tanker vessels
- **Use Case**: Crew joining vessels in EU ports without visa

**Dashboard Integration**: All three systems display real-time status on the main dashboard with direct portal links

## Project Structure

```
src/
├── app/
│   ├── api/auth/[...nextauth]/    # Authentication API
│   ├── auth/signin/               # Sign-in page
│   ├── dashboard/                 # Main dashboard
│   ├── crewing/                   # Crewing module
│   ├── hr/                        # HR module
│   ├── accounting/                # Accounting module
│   ├── quality/                   # Quality/ISO module
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Home page
├── components/                    # Reusable components
├── lib/
│   ├── auth.ts                    # NextAuth configuration
│   └── prisma.ts                  # Prisma client
prisma/
├── schema.prisma                 # Database schema
└── migrations/                   # Database migrations
```

## Database Schema

The system includes comprehensive models for:

- User management and roles
- Principal and vessel information
- Seafarer profiles and documents
- Assignments and contracts
- HR and employee data
- Accounting transactions
- Quality management and audits

## API Routes

- `/api/auth/[...nextauth]` - Authentication
- Additional API routes for CRUD operations on each module

## Deployment

1. Build the application:
```bash
npm run build
```

2. Start production server:
```bash
npm start
```

For Docker deployment, use the provided `docker-compose.yml`.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is proprietary software for Hanmarine.
