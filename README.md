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
# Note: Use PUPPETEER_SKIP_DOWNLOAD if you encounter network issues
PUPPETEER_SKIP_DOWNLOAD=true npm install
```

> **Troubleshooting**: If you encounter errors during installation, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

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
├── app/                           # Next.js App Router pages & APIs
├── components/                    # Reusable UI components
├── lib/                           # Auth, RBAC, utilities
├── styles/                        # Global styling (Tailwind)
└── ...
prisma/
├── schema.prisma                  # Database schema
└── migrations/                    # Prisma migration history
deploy/
├── config/
│   ├── docker/                    # Dockerfile & compose stack
│   ├── nginx/                     # Reverse proxy templates
│   └── pm2/                       # PM2 ecosystem config
└── scripts/                       # Deployment & maintenance scripts
docs/
├── manuals/                       # Product manuals & role guides
├── deployment/                    # Deployment runbooks & checklists
├── reports/                       # Audits & status reports
├── reference/                     # ERDs, matrices, SOP references
└── ...
tests/
└── samples/                       # Fixture PDFs for QA/manual testing
```

Refer to `docs/reports/RESTRUCTURE_PLAN.md` for the latest file relocation map.

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
node .next/standalone/server.js
```

### Docker Deployment

1. Copy the template: `cp .env.docker.example .env.docker` and update the secrets.
2. Build and start the stack: `docker compose up -d --build`.
3. Apply migrations and seed accounts (inside the running container):
	```bash
	docker compose exec app node scripts/create-users.js
	```
4. Check health status: `docker compose ps` and `docker compose logs app`.

The application will be available on [http://localhost:3000](http://localhost:3000). Adjust `NEXTAUTH_URL` in `.env.docker` when exposing the container behind a reverse proxy.

> **Note**: Set `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` (32-byte base64) in every environment before building. Reuse the same key across deployments so server actions stay valid between restarts.

### Domain Setup & Production Deployment

For production deployment with a custom domain (e.g., `https://app.hanmarine.co`):

**📖 See [DOMAIN_SETUP_GUIDE.md](./DOMAIN_SETUP_GUIDE.md) for comprehensive setup instructions**

Quick checklist:
- ✅ Update `NEXTAUTH_URL` to your production domain (use `https://`)
- ✅ Configure DNS A records pointing to your VPS
- ✅ Setup Nginx reverse proxy with SSL (Let's Encrypt)
- ✅ Generate unique production secrets (never reuse dev secrets)
- ✅ Verify all environment variables are set correctly

Common production deployment guides:
- [VPS Deployment](./docs/deployment/DEPLOY_TO_VPS.md)
- [Niagahoster/Hostinger](./docs/deployment/DEPLOYMENT_PRODUCTION_NIAGAHOSTER.md)
- [General Production Guide](./docs/deployment/DEPLOYMENT_PRODUCTION_GUIDE.md)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is proprietary software for Hanmarine.
