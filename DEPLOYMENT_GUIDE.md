# Deployment Guide

## Quick Start (5 Minutes)

### 1. Clone and Install
```bash
git clone https://github.com/yourusername/quantrails-trading-journal.git
cd quantrails-trading-journal
npm install
```

### 2. Environment Setup
```bash
# Create environment file
cp .env.example .env

# Edit with your settings
DATABASE_URL=postgresql://user:password@localhost:5432/trading_journal
SESSION_SECRET=your-secure-random-string-here
NODE_ENV=production
PORT=5000
```

### 3. Database Setup
```bash
# Push schema to database
npm run db:push

# Verify database connection
npm run db:studio
```

### 4. Start Application
```bash
# Development
npm run dev

# Production with PM2
npm install -g pm2
npm run build
pm2 start ecosystem.config.js
```

### 5. Access Dashboard
- **URL**: http://localhost:5000
- **Default Login**: admin / UncleTom91456!!!Kathy!!!

## Production Deployment Options

### Option 1: Digital Ocean Droplet (Recommended)

#### Server Setup
```bash
# Create Ubuntu 22.04 droplet (1GB RAM minimum)
# SSH into your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PostgreSQL
apt install postgresql postgresql-contrib -y

# Install PM2 globally
npm install -g pm2
```

#### Application Deployment
```bash
# Create application directory
mkdir -p /var/www/trading-dashboard
cd /var/www/trading-dashboard

# Upload your code (via git, scp, or rsync)
git clone https://github.com/yourusername/quantrails-trading-journal.git .

# Install dependencies
npm install

# Build application
npm run build

# Setup environment
cp .env.example .env
# Edit .env with production values

# Setup database
npm run db:push

# Start with PM2
pm2 start ecosystem.config.js --name trading-dashboard
pm2 save
pm2 startup
```

#### Firewall Configuration
```bash
# Allow HTTP/HTTPS and SSH
ufw allow ssh
ufw allow 5000
ufw enable
```

### Option 2: Vercel (Frontend + Serverless)

#### Vercel Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
# DATABASE_URL, SESSION_SECRET, etc.
```

### Option 3: Railway (Full Stack)

#### Railway Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Option 4: Heroku (Traditional PaaS)

#### Heroku Deployment
```bash
# Install Heroku CLI
# Create Heroku app
heroku create your-trading-dashboard

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set SESSION_SECRET=your-secret-here

# Deploy
git push heroku main
```

## Database Configuration

### PostgreSQL Setup

#### Local Development
```bash
# Install PostgreSQL
# Ubuntu/Debian:
sudo apt install postgresql postgresql-contrib

# macOS:
brew install postgresql

# Start PostgreSQL service
sudo systemctl start postgresql  # Linux
brew services start postgresql   # macOS

# Create database and user
sudo -u postgres createuser trading_user --pwprompt
sudo -u postgres createdb trading_journal --owner=trading_user
```

#### Production Database
```bash
# Create production database
sudo -u postgres createdb trading_journal_prod

# Create user with appropriate permissions
sudo -u postgres psql
CREATE USER trading_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE trading_journal_prod TO trading_user;
\q
```

### Environment Variables
```env
# Database Configuration
DATABASE_URL=postgresql://trading_user:password@localhost:5432/trading_journal_prod

# Session Security
SESSION_SECRET=your-very-secure-random-string-at-least-32-characters

# Application Settings
NODE_ENV=production
PORT=5000

# Optional: External Services
# Add any API keys for external services here
```

## Security Configuration

### SSL/HTTPS Setup (Nginx)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### PM2 Configuration (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'trading-dashboard',
    script: 'server/index.js',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

## Monitoring and Maintenance

### PM2 Process Management
```bash
# Check status
pm2 status

# View logs
pm2 logs trading-dashboard

# Restart application
pm2 restart trading-dashboard

# Monitor resources
pm2 monit

# Save configuration
pm2 save

# Setup auto-restart on boot
pm2 startup
```

### Database Backup
```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump trading_journal_prod > /backups/trading_journal_$DATE.sql

# Schedule with cron (daily at 2 AM)
crontab -e
0 2 * * * /path/to/backup-script.sh
```

### Log Management
```bash
# Setup log rotation
sudo nano /etc/logrotate.d/trading-dashboard

/var/www/trading-dashboard/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    copytruncate
}
```

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check database logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

#### Memory Issues (1GB Servers)
```bash
# Monitor memory usage
free -h
htop

# Optimize build for low memory
NODE_OPTIONS="--max-old-space-size=768" npm run build

# Consider removing heavy dependencies if needed
npm uninstall jspdf jspdf-autotable  # If PDF generation causes issues
```

#### Port Conflicts
```bash
# Check what's using port 5000
sudo lsof -i :5000

# Kill process if needed
sudo kill -9 <PID>

# Use different port
PORT=3000 npm start
```

### Performance Optimization

#### Database Optimization
```sql
-- Add indexes for better query performance
CREATE INDEX idx_trades_date ON trades(trade_date);
CREATE INDEX idx_trades_ticker ON trades(ticker);
CREATE INDEX idx_trades_user_id ON trades(user_id);
```

#### Application Optimization
```bash
# Enable gzip compression
# Add to nginx config:
gzip on;
gzip_types text/css text/javascript application/javascript;

# Enable caching for static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Scaling Considerations

### Horizontal Scaling
- Use load balancer (nginx, HAProxy)
- Multiple application instances with PM2 cluster mode
- Shared PostgreSQL database
- Redis for session storage (optional)

### Database Scaling
- Read replicas for analytics queries
- Connection pooling (PgBouncer)
- Database partitioning for large datasets

### CDN Integration
- Static asset delivery via CDN
- Image optimization
- Global distribution

This deployment guide covers everything needed to get your trading dashboard running in production with proper security, monitoring, and maintenance procedures.