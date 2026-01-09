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
## API Routes

- `/api/auth/[...nextauth]` - Authentication
- `/api/health` - Health check endpoint
- Additional API routes for CRUD operations on each module

## Deployment

For comprehensive deployment instructions, see [docs/deployment/DEPLOYMENT.md](docs/deployment/DEPLOYMENT.md).

### Quick Start - VPS Deployment

Use the deployment helper script:

```bash
# Setup environment
export VPS_IP=your-vps-ip
export VPS_USER=your-ssh-user

# Initial setup (first time only)
bash deploy-helper.sh setup

# Deploy application
bash deploy-helper.sh deploy

# Check status
bash deploy-helper.sh status
```

### Docker Deployment

```bash
# 1. Configure environment
cp .env.docker.example .env.docker
nano .env.docker  # Edit with your values

# 2. Start containers
docker-compose up -d --build

# 3. Run migrations
docker-compose exec app npx prisma migrate deploy

# 4. Seed database
docker-compose exec app npm run seed

# 5. Check status
docker-compose ps
docker-compose logs -f app
```

### GitHub Actions CI/CD

Automated deployment is configured via `.github/workflows/deploy.yml`:

1. Push to `main` branch triggers automatic build and deployment
2. Manual deployment via GitHub Actions UI
3. Includes retry logic and health checks
4. Build artifacts cached for faster deployments

See [docs/deployment/DEPLOYMENT.md](docs/deployment/DEPLOYMENT.md) for setup instructions.

## Documentation

### Guides
- [Getting Started](docs/guides/GETTING_STARTED.md) - Local development setup
- [Seeding Guide](docs/guides/SEEDING_GUIDE.md) - Database initialization

### Deployment
- [Deployment Guide](docs/deployment/DEPLOYMENT.md) - Comprehensive deployment instructions
- [Deployment Checklist](docs/deployment/DEPLOYMENT_CHECKLIST.md) - Pre-deployment verification

### Reference
- [Permission Matrix](docs/reference/PERMISSION_MATRIX.md) - RBAC rules and access levels
- [Quick Reference](docs/reference/QUICK_REFERENCE.md) - Common commands and patterns
- [Validation Rules](docs/reference/VALIDATION_RULES.md) - Input validation standards

### Security
- [Security Audit](docs/security/) - Security assessment reports

## Project Structure

```
hims-app/
├── src/
│   ├── app/                    # Next.js App Router (pages & API routes)
│   ├── components/             # Reusable React components
│   ├── lib/                    # Core utilities (auth, RBAC, crypto)
│   └── styles/                 # Global styles
├── prisma/
│   ├── schema.prisma           # Database schema (single source of truth)
│   └── migrations/             # Migration history
├── docs/
│   ├── deployment/             # Deployment guides and checklists
│   ├── guides/                 # User guides and tutorials
│   ├── reference/              # Technical reference docs
│   └── security/               # Security audits and findings
├── public/                     # Static assets
├── tests/                      # Test files and fixtures
├── deploy-helper.sh            # Deployment helper script
├── backup-uploads.sh           # Automated backup script
├── monitor-disk.sh             # Disk monitoring script
└── .github/workflows/          # CI/CD pipeline

```

## Maintenance Scripts

Essential scripts for operations:

- `deploy-helper.sh` - Comprehensive deployment helper
- `backup-uploads.sh` - Automated uploads backup (schedule with cron)
- `monitor-disk.sh` - Disk space monitoring (schedule with cron)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting:
   ```bash
   npm run lint
   npm run typecheck
   npm run build
   ```
5. Submit a pull request

## Support

For issues or questions:
1. Check documentation in `docs/` folder
2. Review [GitHub Issues](https://github.com/frogman715/hims-app/issues)
3. Check application logs: `pm2 logs hims-app` (VPS) or `docker-compose logs -f app` (Docker)

## License

This project is proprietary software for Hanmarine.
