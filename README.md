# QuantRails Trading Journal

YouTube Video
[![FREE Open Source Options Trading Journal 2025](https://img.youtube.com/vi/Ypfo3eybn6I/hqdefault.jpg)](https://www.youtube.com/watch?v=Ypfo3eybn6I)

A comprehensive options trading journal application built with React, TypeScript, and Express. Features real-time performance tracking, strategy management, trade analysis, and professional reporting capabilities.

<img width="1920" height="1080" alt="photo-collage png" src="https://github.com/user-attachments/assets/3c5304ea-95f3-4bcb-80f9-2c5d15fc4a3c" />

## 🚀 Features

### Core Trading Functions
- **Trade Logging**: Manual entry and bulk CSV import from Fidelity/E*TRADE
- **Options Trading Support**: Complete calls/puts tracking with strike prices and expiration dates
- **Real-time P&L Tracking**: Automatic profit/loss calculations with live updates
- **Date Selection**: Assign specific dates to imported trades for accurate calendar placement
- **Trade Editing**: Full edit capabilities for existing trades with pre-populated forms

### Analytics & Performance
- **Performance Calendar**: Visual daily P&L with color-coded profitability indicators
- **Win Rate Analysis**: Track success percentages and comprehensive trade statistics
- **Account Growth Tracking**: Monitor balance progression over time with growth metrics
- **Strategy Performance**: Analyze which strategies work best with detailed breakdowns
- **Advanced Filtering**: Filter trades by date, strategy, ticker, and performance

### Strategy Management
- **Playbook System**: Create and categorize custom trading strategies
- **Strategy Assignment**: Link trades to specific playbook entries for analysis
- **Entry/Exit Reason Tracking**: Document decision-making process for each trade
- **Trade Analysis**: Comprehensive post-trade review and learning documentation
- **Strategy Performance Metrics**: Track profitability by strategy type

### Market Research Tools
- **Premarket Analysis**: Daily market preparation and planning documentation
- **Intraday Notes**: Real-time market observations and trading thoughts
- **Date-filtered Views**: Review analysis by specific trading days
- **Market Sentiment Tracking**: Record market conditions and their impact

### Mobile & Accessibility
- **Responsive Design**: Full functionality on phones and tablets
- **Cross-device Access**: Network accessible for multi-device usage
- **Touch-friendly Interface**: Optimized for mobile trading on-the-go
- **Offline Capability**: Core features work without internet connection

### Admin & Data Management
- **Bulk Import/Export**: JSON and CSV data portability for backups
- **PDF Reports**: Professional trading reports for taxes and record-keeping
- **Data Backup**: Complete database export capabilities
- **Account Settings**: Configure starting balance, commissions, and preferences
- **Database Optimization**: Clear and optimize database performance

### Professional Infrastructure
- **Authentication System**: Secure login with session-based authentication
- **Production Ready**: Designed for deployment on cloud platforms
- **Data Persistence**: PostgreSQL database support for reliability
- **24/7 Availability**: Always accessible for trade logging
- **Error Handling**: Comprehensive error handling and validation

### Tax & Business Features
- **MTM Trader Documentation**: Professional record-keeping for Mark-to-Market tax status
- **Audit Trail**: Complete trade history with timestamps and analysis
- **Professional Reports**: IRS-ready documentation with comprehensive data
- **Business Expense Tracking**: Track all trading-related business operations

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **Shadcn/UI** for consistent, professional components
- **TailwindCSS** for responsive styling
- **TanStack Query** for efficient data fetching and caching
- **React Hook Form** for form management
- **Wouter** for client-side routing
- **Framer Motion** for smooth animations

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** for database management
- **PostgreSQL** for production data storage
- **Session-based Authentication** with secure session management
- **RESTful API** design with comprehensive endpoints
- **Input Validation** with Zod schemas

### Database Schema
- **Users**: Authentication and user management
- **Trades**: Complete trade records with P&L tracking
- **Strategies**: Playbook strategy definitions
- **Trade Analysis**: Post-trade review and analysis
- **Premarket Analysis**: Daily market preparation
- **Intraday Notes**: Real-time trading observations
- **Settings**: User preferences and configuration

## 📁 Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── ui/       # Shadcn/UI components
│   │   │   ├── sections/ # Main dashboard sections
│   │   │   ├── charts/   # Chart components
│   │   │   └── forms/    # Form components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions
│   │   ├── pages/        # Page components
│   │   └── styles/       # CSS and styling
│   └── public/           # Static assets
├── server/                # Express backend
│   ├── db.ts            # Database configuration
│   ├── storage.ts       # Data access layer
│   ├── routes.ts        # API routes
│   ├── auth.ts          # Authentication middleware
│   └── index.ts         # Server entry point
├── shared/               # Shared types and schemas
│   └── schema.ts        # Database schema and types
├── migrations/          # Database migrations
└── docs/               # Additional documentation
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+ (or use in-memory storage for development)
- npm or yarn

### Local Development
```bash
# Clone the repository
git clone https://github.com/yourusername/quantrails-trading-journal.git
cd quantrails-trading-journal

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database configuration

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

### Production Deployment
```bash
# Build the application
npm run build

# Start production server
npm start

# Or use PM2 for process management
pm2 start ecosystem.config.js
```

### Environment Variables
```env
DATABASE_URL=postgresql://username:password@localhost:5432/trading_journal
SESSION_SECRET=your-secret-key-here
NODE_ENV=production
PORT=5000
```

## 📊 Usage

### Daily Trading Workflow
1. **Premarket Analysis**: Record market conditions and trading plan
2. **Trade Execution**: Log trades manually or import from CSV
3. **Intraday Notes**: Document market observations during trading
4. **Trade Analysis**: Review and analyze completed trades
5. **Performance Review**: Check daily P&L and strategy performance

### CSV Import Format
Supports CSV exports from Fidelity and E*TRADE with columns:
- Symbol (e.g., -SPY250703C618)
- Basis/Share (entry price)
- Proceeds/Share (exit price)
- Quantity

### Strategy Management
- Create custom playbook strategies
- Assign strategies to trades
- Track strategy performance over time
- Document entry and exit reasons

## 🔧 Configuration

### Database Configuration
The application supports both PostgreSQL and in-memory storage:
- **Production**: PostgreSQL for data persistence
- **Development**: In-memory storage for quick setup

### Authentication
- Session-based authentication with secure cookies
- Configurable session timeout and security settings
- User management with role-based access

### Customization
- Configurable account starting balance
- Customizable commission rates
- Flexible strategy categories
- Personalized dashboard layouts

## 📈 Performance

### Optimizations
- Efficient database queries with Drizzle ORM
- Client-side caching with TanStack Query
- Optimized bundle size with Vite
- Lazy loading for better initial load times

### Scalability
- Designed for high-volume trading data
- Efficient data structures for large datasets
- Optimized queries for performance
- Horizontal scaling capabilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

Copyright (c) QuantRails. This project is licensed under CC BY-NC 4.0. Commercial use requires separate licensing - contact creator for licensing.

This work is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License. See the [LICENSE](LICENSE) file for full details.

## 👨‍💻 Author

Copyright (c) 2025 QuantRails. This project is licensed under CC BY-NC 4.0.
Professional Day Trading Dashboard & Journal System

## 🙏 Acknowledgments

- Built with modern web technologies for optimal performance
- Designed for professional day traders and trading businesses
- Optimized for Mark-to-Market trader tax documentation
- Responsive design for multi-device trading

## 📞 Support

For support or commercial licensing inquiries, contact tim@quantrails.io or open an issue on GitHub.

---

**Note**: This is a project trading journal application. Always consult with a qualified tax professional for advice on Mark-to-Market trader status and tax implications.
