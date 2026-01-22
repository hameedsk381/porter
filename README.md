# Porter Logistics Platform

A complete logistics and transport booking platform similar to Porter, built with React Native (Expo) for mobile apps and Node.js + Express backend with MongoDB.

## 🚀 Features

### Customer App
- **Authentication**: Phone OTP login with Google OAuth support
- **Booking**: Real-time fare estimation and booking with multiple vehicle types
- **Tracking**: Live driver tracking with maps integration
- **Payments**: Multiple payment options (UPI, Cards, NetBanking, COD)
- **History**: Complete booking history with invoices
- **Notifications**: Push notifications for booking updates
- **Multi-language**: Support for English and Indian languages
- **Dark Mode**: Complete dark mode support

### Driver App
- **KYC Verification**: Document upload and verification system
- **Availability Toggle**: Online/offline status management
- **Booking Management**: Accept/reject booking requests
- **Live Navigation**: Google Maps integration for navigation
- **Earnings Dashboard**: Daily, weekly, monthly earnings reports
- **Ratings & Reviews**: Customer feedback system

### Admin Panel
- **Dashboard**: Real-time analytics and statistics
- **User Management**: Customer and driver management
- **Booking Management**: View, cancel, and assign bookings
- **Driver KYC**: Approval workflow for driver verification
- **Payment Management**: Transaction monitoring and refunds
- **Reports**: Comprehensive analytics and reporting

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Redis** for caching and real-time features
- **Socket.IO** for WebSocket communication
- **JWT** for authentication
- **Razorpay & Stripe** for payments
- **Cloudinary** for file storage
- **Twilio** for SMS OTP

### Mobile Apps
- **React Native** with Expo
- **React Navigation** for navigation
- **Zustand** for state management
- **React Query** for data fetching
- **React Native Maps** for maps integration
- **Expo Notifications** for push notifications
- **React Native Paper** for UI components

### Admin Panel
- **React** with Material-UI
- **React Router** for routing
- **React Query** for data fetching
- **Recharts** for data visualization
- **React Hook Form** for form handling

## 📁 Project Structure

```
porter/
├── server.js                 # Main server file
├── package.json             # Backend dependencies
├── docker-compose.yml       # Docker configuration
├── nginx.conf              # Nginx configuration
├── models/                  # Database models
│   ├── User.js
│   ├── Booking.js
│   └── Payment.js
├── routes/                  # API routes
│   ├── auth.js
│   ├── bookings.js
│   ├── drivers.js
│   ├── payments.js
│   └── admin.js
├── services/                # Business logic services
│   ├── otpService.js
│   ├── razorpayService.js
│   └── cloudinaryService.js
├── middleware/              # Express middleware
│   ├── auth.js
│   └── errorHandler.js
├── customer-app/            # React Native customer app
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── stores/
│   │   └── services/
│   └── package.json
├── driver-app/              # React Native driver app
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── stores/
│   │   └── services/
│   └── package.json
└── admin-panel/             # React admin panel
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── stores/
    │   └── services/
    └── package.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 4.4+
- Redis 6+
- Docker & Docker Compose (optional)

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd porter
   ```

2. **Install dependencies**
   ```bash
   # Backend
   npm install
   
   # Customer app
   cd customer-app && npm install
   
   # Driver app
   cd ../driver-app && npm install
   
   # Admin panel
   cd ../admin-panel && npm install
   ```

3. **Environment Configuration**
   ```bash
   # Copy environment file
   cp env.example .env
   
   # Edit .env with your configuration
   nano .env
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB and Redis
   # Using Docker Compose (recommended)
   docker-compose up -d mongodb redis
   
   # Or start services manually
   mongod
   redis-server
   ```

5. **Start the backend**
   ```bash
   npm run dev
   ```

6. **Start mobile apps**
   ```bash
   # Customer app
   cd customer-app
   npm start
   
   # Driver app (in another terminal)
   cd driver-app
   npm start
   ```

7. **Start admin panel**
   ```bash
   cd admin-panel
   npm start
   ```

### Docker Deployment

1. **Build and start all services**
   ```bash
   docker-compose up -d
   ```

2. **View logs**
   ```bash
   docker-compose logs -f
   ```

3. **Stop services**
   ```bash
   docker-compose down
   ```

## 🔧 Configuration

### Required Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/porter-logistics
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=your-refresh-token-secret-here
REFRESH_TOKEN_EXPIRE=30d

# OTP (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Payment Gateways
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key

# Cloud Storage
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Google Maps
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Firebase (Push Notifications)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
```

## 📱 Mobile App Setup

### Expo Configuration

1. **Install Expo CLI**
   ```bash
   npm install -g @expo/cli
   ```

2. **Start development server**
   ```bash
   cd customer-app
   expo start
   ```

3. **Build for production**
   ```bash
   # Android
   eas build --platform android
   
   # iOS
   eas build --platform ios
   ```

### Required Expo Configuration

```json
{
  "expo": {
    "name": "Porter Customer",
    "slug": "porter-customer",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "plugins": [
      "expo-location",
      "expo-notifications",
      "expo-secure-store"
    ],
    "android": {
      "package": "com.porter.customer",
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA",
        "READ_EXTERNAL_STORAGE"
      ]
    },
    "ios": {
      "bundleIdentifier": "com.porter.customer",
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "This app needs access to location to find nearby drivers and provide accurate fare estimates."
      }
    }
  }
}
```

## 🔌 API Documentation

### Authentication Endpoints
- `POST /api/auth/send-otp` - Send OTP to phone number
- `POST /api/auth/verify-otp` - Verify OTP and login
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Booking Endpoints
- `POST /api/bookings/estimate` - Get fare estimate
- `POST /api/bookings` - Create new booking
- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/:id` - Get specific booking
- `PUT /api/bookings/:id/accept` - Driver accept booking
- `PUT /api/bookings/:id/start` - Start trip
- `PUT /api/bookings/:id/complete` - Complete trip
- `PUT /api/bookings/:id/cancel` - Cancel booking

### Payment Endpoints
- `POST /api/payments/initiate` - Initiate payment
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/history` - Get payment history
- `POST /api/payments/refund` - Process refund

## 🧪 Testing

```bash
# Run backend tests
npm test

# Run customer app tests
cd customer-app && npm test

# Run driver app tests
cd driver-app && npm test

# Run admin panel tests
cd admin-panel && npm test
```

## 🚀 Deployment

### Production Deployment

1. **Build all applications**
   ```bash
   # Backend
   npm run build
   
   # Admin panel
   cd admin-panel && npm run build
   ```

2. **Deploy with Docker**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Deploy mobile apps**
   ```bash
   # Customer app
   cd customer-app
   eas build --platform all --profile production
   eas submit --platform all
   
   # Driver app
   cd driver-app
   eas build --platform all --profile production
   eas submit --platform all
   ```

## 📊 Monitoring

- **Health Check**: `GET /health`
- **Metrics**: Prometheus metrics available at `/metrics`
- **Logs**: Structured logging with Winston
- **Error Tracking**: Sentry integration (optional)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@porter.com or join our Slack channel.

## 🔄 Roadmap

- [ ] Real-time chat between customer and driver
- [ ] Advanced analytics and reporting
- [ ] Multi-city support
- [ ] Driver scheduling and shifts
- [ ] Fleet management
- [ ] Integration with third-party logistics providers
- [ ] AI-powered route optimization
- [ ] Carbon footprint tracking
