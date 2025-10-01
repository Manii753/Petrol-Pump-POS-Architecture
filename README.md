# Petrol Pump POS System

A comprehensive Point of Sale system designed specifically for petrol pumps in Pakistan. This system replaces traditional manual registers with a modern, efficient digital solution.

## Features

### Core Functionality
- **Shift Management**: Start/close shifts with attendant login and meter readings
- **Sales Recording**: Record fuel sales with automatic calculations
- **Tank Inventory**: Monitor fuel levels and record deliveries
- **Financial Reports**: Generate daily, monthly, and custom reports
- **Payment Tracking**: Track cash, card, and credit payments separately
- **User Management**: Role-based access control (Admin, Supervisor, Attendant)

### Key Benefits
- ✅ Replaces manual registers with digital system
- ✅ Automatic calculation of litres sold and revenue
- ✅ Real-time tank stock monitoring
- ✅ Comprehensive reporting and analytics
- ✅ Multi-user support with role-based permissions
- ✅ Export reports to PDF and Excel
- ✅ Audit trail for all transactions

## Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** for database
- **JWT** for authentication
- **PDFKit** for PDF generation
- **ExcelJS** for Excel export

### Frontend
- **Next.js** with React
- **TailwindCSS** for styling
- **Axios** for API calls
- **React Hook Form** for form handling

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.0 or higher)
- npm or yarn

### Backend Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd petrol-pump-pos
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start MongoDB service

5. Run the application:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your API URL
```

4. Run the development server:
```bash
npm run dev
```

## Database Schema

The system uses MongoDB with the following main collections:

- **Users**: User accounts and authentication
- **FuelTypes**: Fuel type configurations and pricing
- **Pumps**: Pump configurations
- **Nozzles**: Nozzle assignments to pumps and fuel types
- **Tanks**: Fuel tank inventory
- **Shifts**: Work shift records
- **Sales**: Transaction records
- **Deliveries**: Fuel delivery records

## Sample Data

To populate the database with sample data for testing:

```bash
node sample_data.js
```

This will create:
- 4 sample users (admin, supervisor, 2 attendants)
- 4 fuel types with current Pakistan prices
- 4 pumps with nozzles
- 3 tanks with different fuel types
- Sample shift and sales data

**Default Login Credentials:**
- **Admin**: admin / password123
- **Supervisor**: supervisor1 / password123
- **Attendant**: attendant1 / password123

## Usage Guide

### Getting Started

1. **Login** with your credentials
2. **Start a Shift** (if you're an attendant)
3. **Configure Pumps and Tanks** (admin/supervisor)
4. **Record Sales** during your shift
5. **Close Shift** at end of day
6. **View Reports** for analysis

### Daily Workflow

1. **Attendant starts shift** with opening cash amount
2. **Record pump readings** at shift start
3. **Record fuel sales** throughout the shift
4. **Record closing readings** at shift end
5. **System calculates** total sales and reconciles cash
6. **Generate reports** for management review

### Reports Available

- **Daily Shift Report**: Complete shift summary with sales breakdown
- **Daily Sales Report**: All sales for a specific date
- **Monthly Sales Report**: Monthly sales analysis
- **Tank Variance Report**: Expected vs actual stock levels
- **Payment Summary**: Breakdown by payment method

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/register` - Register new user (admin only)

### Shifts
- `POST /api/shifts/start` - Start new shift
- `PUT /api/shifts/:id/close` - Close shift
- `GET /api/shifts` - Get all shifts
- `GET /api/shifts/current` - Get current open shift

### Sales
- `POST /api/sales` - Record new sale
- `GET /api/sales` - Get sales with filters
- `GET /api/sales/shift-summary/:shiftId` - Get sales summary for shift

### Pumps
- `GET /api/pumps` - Get all pumps
- `POST /api/pumps` - Create new pump (admin only)
- `PUT /api/pumps/:id` - Update pump (admin only)
- `DELETE /api/pumps/:id` - Delete pump (admin only)

### Tanks
- `GET /api/tanks` - Get all tanks
- `POST /api/tanks` - Create new tank (admin only)
- `PUT /api/tanks/:id` - Update tank (admin only)
- `POST /api/tanks/delivery` - Record fuel delivery

### Reports
- `GET /api/reports/daily-shift/:shiftId` - Daily shift report
- `GET /api/reports/daily-sales` - Daily sales report
- `GET /api/reports/monthly-sales` - Monthly sales report
- `GET /api/reports/export-pdf/:shiftId` - Export shift report as PDF

## Configuration

### Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/petrol-pump-pos
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=30d

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5000000
```

### Fuel Pricing

Fuel prices can be updated through the admin interface or directly in the database. Prices are stored per litre and used for automatic sales calculations.

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Different permissions for different user roles
- **Input Validation**: Server-side validation for all inputs
- **Rate Limiting**: API rate limiting to prevent abuse
- **Audit Logging**: Track all changes and transactions

## Deployment

### Production Deployment

1. **Build the frontend**:
```bash
cd frontend
npm run build
```

2. **Set production environment variables**

3. **Start the backend**:
```bash
npm start
```

### Docker Deployment

A Docker configuration can be added for containerized deployment.

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure MongoDB is running and accessible
2. **CORS Issues**: Check FRONTEND_URL in backend .env matches frontend URL
3. **Authentication**: Verify JWT_SECRET is set correctly
4. **Port Conflicts**: Ensure ports 5000 (backend) and 3000 (frontend) are available

### Support

For technical support or questions:
- Check the logs for error messages
- Verify all environment variables are set correctly
- Ensure MongoDB is running
- Check network connectivity between frontend and backend

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Changelog

### Version 1.0.0
- Initial release
- Core POS functionality
- Shift management
- Sales recording
- Basic reporting
- User management
- PDF export capability

---

**Note**: This system is designed specifically for Pakistani petrol pumps and includes local pricing, currency (PKR), and business practices. Customize as needed for other markets.