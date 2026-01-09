#!/bin/bash
###############################################################################
# HIMS Deployment Helper Script v2.0
# 
# Purpose: Assist with HIMS deployment to VPS
# Usage: bash deploy-helper.sh [command]
#
# Commands:
#   setup     - Initial VPS setup (first time only)
#   deploy    - Deploy/update application
#   rollback  - Rollback to previous version
#   status    - Check deployment status
#   logs      - View application logs
#   help      - Show this help message
#
# Prerequisites:
#   - SSH access to VPS configured
#   - PostgreSQL database created
#   - Environment variables in .env file
#
# For detailed deployment instructions, see: docs/deployment/DEPLOYMENT.md
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration (override with environment variables)
VPS_IP="${VPS_IP:-}"
VPS_USER="${VPS_USER:-}"
APP_DIR="${APP_DIR:-/var/www/hims-app}"
PM2_APP_NAME="${PM2_APP_NAME:-hims-app}"

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if [ -z "$VPS_IP" ] || [ -z "$VPS_USER" ]; then
        log_error "VPS_IP and VPS_USER environment variables must be set"
        echo ""
        echo "Example:"
        echo "  export VPS_IP=31.97.223.11"
        echo "  export VPS_USER=hanmarine"
        echo "  bash deploy-helper.sh deploy"
        exit 1
    fi
    
    # Check SSH connectivity
    if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "$VPS_USER@$VPS_IP" exit 2>/dev/null; then
        log_error "Cannot connect to VPS via SSH"
        log_info "Make sure SSH key authentication is configured"
        exit 1
    fi
    
    log_success "Prerequisites OK"
}

# Initial VPS setup
cmd_setup() {
    log_info "Starting initial VPS setup..."
    check_prerequisites
    
    ssh "$VPS_USER@$VPS_IP" << 'EOFSH'
    set -e
    
    # Update system
    echo "📦 Updating system packages..."
    sudo apt update && sudo apt upgrade -y
    
    # Install Node.js 20.x
    echo "📦 Installing Node.js 20.x..."
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt install -y nodejs
    fi
    
    # Install PM2
    echo "📦 Installing PM2..."
    if ! command -v pm2 &> /dev/null; then
        sudo npm install -g pm2
        pm2 startup | tail -n 1 | sudo bash
    fi
    
    # Install PostgreSQL (if not already installed)
    echo "📦 Installing PostgreSQL..."
    if ! command -v psql &> /dev/null; then
        sudo apt install -y postgresql postgresql-contrib
    fi
    
    # Install Nginx
    echo "📦 Installing Nginx..."
    if ! command -v nginx &> /dev/null; then
        sudo apt install -y nginx
    fi
    
    echo "✓ VPS setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Create PostgreSQL database"
    echo "2. Clone repository to /var/www/hims-app"
    echo "3. Configure .env file"
    echo "4. Run: bash deploy-helper.sh deploy"
EOFSH
    
    log_success "VPS setup completed successfully!"
}

# Deploy or update application
cmd_deploy() {
    log_info "Starting deployment..."
    check_prerequisites
    
    ssh "$VPS_USER@$VPS_IP" << EOFSH
    set -e
    cd $APP_DIR
    
    echo "📁 Pulling latest code..."
    git fetch origin
    git pull origin main
    
    echo "📦 Installing dependencies..."
    PUPPETEER_SKIP_DOWNLOAD=true npm install --production=false
    
    echo "🔧 Generating Prisma client..."
    npx prisma generate
    
    echo "🗃️  Running database migrations..."
    npx prisma migrate deploy
    
    echo "🏗️  Building application..."
    npm run build
    
    echo "🔄 Restarting application..."
    pm2 delete $PM2_APP_NAME || true
    pm2 start ecosystem.config.js
    pm2 save
    
    echo "⏳ Waiting for application to start..."
    sleep 5
    
    echo "🏥 Running health check..."
    for i in {1..10}; do
        if curl -f http://localhost:3000/api/health &> /dev/null; then
            echo "✅ Health check passed!"
            pm2 status
            exit 0
        fi
        echo "⏳ Attempt \$i/10..."
        sleep 2
    done
    
    echo "❌ Health check failed!"
    pm2 logs $PM2_APP_NAME --lines 50
    exit 1
EOFSH
    
    if [ $? -eq 0 ]; then
        log_success "Deployment completed successfully!"
        log_info "Application is running at: http://$VPS_IP"
    else
        log_error "Deployment failed! Check logs above for details."
        exit 1
    fi
}

# Rollback to previous version
cmd_rollback() {
    log_warning "Rolling back to previous version..."
    check_prerequisites
    
    ssh "$VPS_USER@$VPS_IP" << EOFSH
    set -e
    cd $APP_DIR
    
    echo "🔙 Rolling back git commit..."
    git reset --hard HEAD~1
    
    echo "📦 Installing dependencies..."
    PUPPETEER_SKIP_DOWNLOAD=true npm install --production=false
    
    echo "🔧 Generating Prisma client..."
    npx prisma generate
    
    echo "🏗️  Building application..."
    npm run build
    
    echo "🔄 Restarting application..."
    pm2 restart $PM2_APP_NAME
    
    echo "⏳ Waiting for application to start..."
    sleep 5
    
    if curl -f http://localhost:3000/api/health &> /dev/null; then
        echo "✅ Rollback successful!"
        pm2 status
    else
        echo "❌ Rollback health check failed!"
        pm2 logs $PM2_APP_NAME --lines 30
        exit 1
    fi
EOFSH
    
    log_success "Rollback completed!"
}

# Check deployment status
cmd_status() {
    log_info "Checking deployment status..."
    check_prerequisites
    
    ssh "$VPS_USER@$VPS_IP" << EOFSH
    echo "=== PM2 Status ==="
    pm2 status
    echo ""
    
    echo "=== Application Health ==="
    if curl -f http://localhost:3000/api/health 2>/dev/null; then
        echo "✅ Application is healthy"
    else
        echo "❌ Application health check failed"
    fi
    echo ""
    
    echo "=== Disk Usage ==="
    df -h | grep -E '(Filesystem|/var)'
    echo ""
    
    echo "=== Git Status ==="
    cd $APP_DIR
    git log --oneline -5
    echo ""
    git status
EOFSH
}

# View application logs
cmd_logs() {
    log_info "Fetching application logs..."
    check_prerequisites
    
    ssh "$VPS_USER@$VPS_IP" "pm2 logs $PM2_APP_NAME --lines 100"
}

# Show help
cmd_help() {
    cat << 'EOF'
HIMS Deployment Helper Script v2.0

Usage: bash deploy-helper.sh [command]

Commands:
  setup     - Initial VPS setup (run once on new VPS)
  deploy    - Deploy or update application
  rollback  - Rollback to previous version
  status    - Check deployment and application status
  logs      - View application logs (last 100 lines)
  help      - Show this help message

Environment Variables:
  VPS_IP       - IP address of your VPS (required)
  VPS_USER     - SSH username (required)
  APP_DIR      - Application directory (default: /var/www/hims-app)
  PM2_APP_NAME - PM2 process name (default: hims-app)

Examples:
  # Initial setup on new VPS
  export VPS_IP=31.97.223.11
  export VPS_USER=hanmarine
  bash deploy-helper.sh setup

  # Deploy application
  bash deploy-helper.sh deploy

  # Check status
  bash deploy-helper.sh status

  # View logs
  bash deploy-helper.sh logs

  # Rollback if something went wrong
  bash deploy-helper.sh rollback

For detailed documentation, see: docs/deployment/DEPLOYMENT.md

EOF
}

# Main command dispatcher
main() {
    local command="${1:-help}"
    
    case "$command" in
        setup)
            cmd_setup
            ;;
        deploy)
            cmd_deploy
            ;;
        rollback)
            cmd_rollback
            ;;
        status)
            cmd_status
            ;;
        logs)
            cmd_logs
            ;;
        help|--help|-h)
            cmd_help
            ;;
        *)
            log_error "Unknown command: $command"
            echo ""
            cmd_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
