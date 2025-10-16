# Souqify - E-commerce Management Platform

A comprehensive e-commerce management platform built with React, TypeScript, and Firebase. Souqify provides powerful tools for online store management, order processing, delivery management, and customer engagement with a modern, responsive interface.

## 🚀 Features

### 📦 Order Management

- **Real-time Order Processing**: Create, view, edit, and track orders with real-time updates
- **Order Status Tracking**: Comprehensive order lifecycle management (pending, processing, delivered, etc.)
- **Order Filtering & Search**: Advanced filtering by status, delivery options, date ranges, and custom criteria
- **Invoice Generation**: Automated PDF invoice generation with QR codes
- **Client Information Management**: Store and manage customer details, addresses, and order history

### 🚚 Delivery Management

- **Delivery Agent Assignment**: Assign and manage delivery agents for orders
- **Delivery Zones**: Configure delivery zones and pricing for different areas
- **Delivery Pricing**: Flexible delivery pricing options with multiple tiers
- **Real-time Tracking**: Track delivery status and agent assignments
- **Delivery Overview**: Dashboard for delivery statistics and performance metrics

### 🏪 Store Management

- **Multi-store Support**: Manage multiple stores from a single platform
- **Product Management**: Add, edit, and organize products with categories and collections
- **Inventory Tracking**: Monitor stock levels and manage product availability
- **Store Configuration**: Customize store settings, branding, and operational parameters

### 🛒 Shopping Experience

- **Interactive Product Catalog**: Browse products with image galleries and detailed descriptions
- **Shopping Cart**: Add to cart functionality with quantity management
- **Client-facing Store Views**: Optimized customer shopping experience
- **Order Placement**: Streamlined checkout process with customer information collection

### 🔔 Notification System

- **Real-time Notifications**: Browser notifications for new orders, status updates, and important events
- **Configurable Alerts**: Customizable notification preferences for different store events
- **Service Worker Integration**: Notifications work even when the app is closed
- **Multi-event Support**: Notifications for orders, deliveries, inventory, and customer activities

### 📊 Analytics & Reporting

- **Sales Analytics**: Track sales performance, revenue, and order trends
- **Delivery Analytics**: Monitor delivery performance and agent efficiency
- **Customer Insights**: Analyze customer behavior and order patterns
- **Financial Reporting**: Revenue tracking and financial overview

### 🎨 User Interface

- **Modern Design**: Clean, responsive interface built with Tailwind CSS
- **Mobile-Optimized**: Fully responsive design for all device types
- **Dark/Light Themes**: Support for multiple theme options
- **Animation & Transitions**: Smooth animations using Framer Motion
- **Multi-language Support**: Internationalization with translation system

## 🛠 Tech Stack

### Frontend

- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **React Router** - Client-side routing

### Backend & Database

- **Firebase** - Backend-as-a-Service platform
- **Firestore** - NoSQL document database
- **Firebase Authentication** - User authentication and authorization
- **Cloud Functions** - Serverless backend logic

### Mobile & Desktop

- **Capacitor** - Cross-platform native runtime
- **Electron** - Desktop application framework
- **PWA Support** - Progressive Web App capabilities

### Additional Libraries

- **React Leaflet** - Interactive maps for delivery zones
- **QR Code Generation** - Order tracking and invoices
- **Excel.js** - Data export functionality
- **HTML2PDF** - PDF generation for invoices
- **Recharts** - Data visualization and analytics

## 📱 Platform Support

- **Web Application**: Modern browsers with PWA support
- **Mobile Apps**: iOS and Android via Capacitor
- **Desktop Apps**: Windows, macOS, and Linux via Electron

## 🏗 Project Structure

```
souqify/
├── public/             # Static public assets
│   ├── routes.json     # Application routes configuration
│   └── places.json     # Location data
├── src/
│   ├── components/     # Reusable UI components
│   ├── routes/         # Page components and routing
│   │   ├── Stores/     # Store management pages
│   │   ├── Clients/    # Customer-facing pages
│   │   ├── Collections/# Product collection management
│   │   └── App/        # Main application pages
│   ├── Deliveries/     # Delivery management system
│   ├── Links/          # Order and product linking components
│   ├── Integrations/   # Third-party integrations
│   ├── apis/           # API integration and data fetching
│   ├── utils/          # Utility functions and helpers
│   ├── assets/         # Static assets and images
│   ├── animations/     # Animation components and hooks
│   ├── hooks/          # Custom React hooks
│   └── config/         # Configuration files
├── electron/           # Electron desktop app configuration
├── capacitor.config.ts # Mobile app configuration
├── vite.config.ts      # Vite build configuration
└── tailwind.config.js  # Tailwind CSS configuration
```

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js 18+** - [Download from nodejs.org](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn** package manager
- **Git** - [Download from git-scm.com](https://git-scm.com/)
- **Firebase account** - [Sign up at firebase.google.com](https://firebase.google.com/)

### 📦 Quick Start - Run from Scratch

Follow these step-by-step instructions to get Souqify running on your local machine:

#### 1. **Clone the Repository**

```bash
git clone https://github.com/ilyestearti5/SnapBuy.git
cd SnapBuy
```

#### 2. **Install Dependencies**

```bash
npm install
```

_This will install all required packages including React, TypeScript, Vite, Firebase, and other dependencies._

#### 3. **Firebase Setup** (Required)

**Option A: Use Existing Firebase Project**

- Contact the project maintainer for Firebase configuration details

**Option B: Create Your Own Firebase Project**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Follow the setup wizard
4. Enable the following services:
   - **Authentication** (Email/Password, Google Sign-in)
   - **Firestore Database** (in production mode)
   - **Storage** (for file uploads)
   - **Hosting** (optional, for deployment)

#### 4. **Environment Configuration**

Create a `.env` file in the root directory with your Firebase configuration:

```env
# Firebase Configuration
VITE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Optional: Measurement ID for Analytics
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

_You can find these values in your Firebase project settings under "General" → "Your apps" → "Web app"_

#### 5. **Start the Development Server**

```bash
npm run dev
```

The application will start and be available at:

- **Local**: `http://localhost:5173`
- **Network**: `http://[your-ip]:5173` (for testing on mobile devices)

#### 6. **First Time Setup**

1. **Open your browser** and navigate to `http://localhost:5173`
2. **Create an account** using the sign-up form
3. **Verify your email** if email verification is enabled
4. **Complete your profile** setup
5. **Create your first store** and start adding products

### 🔧 Additional Setup Options

#### For Mobile Development (Optional)

**Install Capacitor CLI:**

```bash
npm install -g @capacitor/cli
```

**Add mobile platforms:**

```bash
# For Android
npx cap add android

# For iOS (macOS only)
npx cap add ios
```

#### For Desktop Development (Optional)

**Install Electron dependencies:**

```bash
npm install --save-dev electron electron-builder
```

### 🏗️ Build for Production

```bash
# Build web application
npm run build

# Preview production build
npm run preview
```

## 📱 Platform-Specific Development

### Mobile App Development

**Android Development:**

```bash
# Build web assets
npm run build

# Sync with Android
npx cap sync android

# Run on Android device/emulator
npx cap run android

# Open in Android Studio
npx cap open android
```

**iOS Development (macOS only):**

```bash
# Build web assets
npm run build

# Sync with iOS
npx cap sync ios

# Run on iOS device/simulator
npx cap run ios

# Open in Xcode
npx cap open ios
```

### Desktop App Development

**Windows:**

```bash
npm run electron:build-win
```

**macOS:**

```bash
npm run electron:build-mac
```

**Linux:**

```bash
npm run electron:build-linux
```

## 🐛 Troubleshooting

### Common Issues and Solutions

**Issue: `npm install` fails**

```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Issue: Vite dev server won't start**

```bash
# Check if port 5173 is already in use
npx kill-port 5173
npm run dev
```

**Issue: Firebase connection errors**

- Verify your `.env` file has correct Firebase configuration
- Check Firebase project settings and API keys
- Ensure Firebase services are enabled in your project

**Issue: Build fails**

```bash
# Clean build cache
rm -rf dist
npm run build
```

### Development Tips

1. **Hot Reload**: The development server supports hot reload - changes will automatically reflect in the browser
2. **Network Access**: Use `npm run dev -- --host` to access the dev server from other devices on your network
3. **Debug Mode**: Open browser DevTools (F12) to see console logs and debug information
4. **Mobile Testing**: Use your browser's device emulation or access via your mobile device on the same network

## 📋 Key Features Implementation

## 🎯 How to Use Souqify

### For Store Owners

1. **Create Your Account**: Sign up and verify your email
2. **Set Up Your Store**: Add store details, branding, and configuration
3. **Add Products**: Create your product catalog with images and descriptions
4. **Configure Delivery**: Set up delivery zones and pricing
5. **Manage Orders**: Process incoming orders and track their status
6. **Monitor Analytics**: Track sales performance and customer insights

### For Customers

1. **Browse Stores**: Explore available stores and their products
2. **Shop Products**: Add items to cart and place orders
3. **Track Orders**: Monitor order status and delivery progress
4. **Manage Profile**: Update personal information and order history

### For Delivery Agents

1. **Register Account**: Create delivery agent profile
2. **Receive Assignments**: Get notified of delivery assignments
3. **Update Status**: Mark deliveries as picked up, in transit, or completed
4. **Track Performance**: Monitor delivery statistics and earnings

## 📋 Key Features Implementation

### Order Management System

- Create orders with customer details and product selection
- Track order status through customizable workflow stages
- Generate and export order invoices with QR codes
- Search and filter orders by multiple criteria
- Real-time order notifications and updates

### Delivery Management

- Assign delivery agents to orders
- Configure delivery zones and pricing tiers
- Track delivery progress and completion
- Manage delivery agent accounts and permissions
- Route optimization and delivery scheduling

### Notification System

- Real-time browser notifications for store events
- Configurable notification preferences per store
- Service worker integration for offline notifications
- Support for order, delivery, and inventory alerts
- Email and SMS notification integration

### Multi-store Architecture

- Single platform supporting multiple independent stores
- Store-specific configurations and branding
- Isolated data and user permissions per store
- Centralized management with store switching
- White-label store customization

## 🔧 Configuration

The application uses a modular configuration system:

- **`project.json`** - Project-specific settings
- **`capacitor.config.ts`** - Mobile app configuration
- **`firebase.json`** - Firebase hosting and functions setup
- **`tailwind.config.js`** - UI styling configuration

## 🔗 Available Routes

Souqify includes the following main routes and features:

### Store Management Routes

- `/store` - Store listing and management
- `/store/{storeId}/dashboard` - Store analytics and overview
- `/store/{storeId}/sales` - Orders and customer management
- `/store/{storeId}/catalog` - Product and inventory management
- `/store/{storeId}/configuration` - Store settings and customization
- `/store/{storeId}/integrations` - Third-party integrations
- `/store/{storeId}/templates` - Store theme templates

### Customer Routes

- `/client/stores` - Browse available stores
- `/client/stores/{storeId}` - View specific store
- `/client/stores/{storeId}/products` - Shop store products

### Delivery Management Routes

- `/deliveries/overview` - Delivery dashboard
- `/deliveries/orders` - Order assignments
- `/deliveries/accounts` - Agent management
- `/deliveries/pricing` - Delivery configuration
- `/deliveries/settings` - Company settings

### Other Routes

- `/profile` - User profile and dashboard
- `/tracking` - Order tracking
- `/offers` - Special promotions
- `/feedbacks` - Customer support

## 📖 Documentation

For detailed documentation on specific features:

- Check the `routes.json` file for complete route definitions
- Review component documentation in the source code
- See inline comments for implementation details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is part of the Biq Pod Application suite. All rights reserved.

## 👥 Team

Developed by the Biq Pod team for modern e-commerce management.

## 📞 Support & Links

- **Repository**: [https://github.com/ilyestearti5/SnapBuy](https://github.com/ilyestearti5/SnapBuy)
- **Issues**: Report bugs and feature requests on GitHub Issues
- **Documentation**: Available in source code and README files
- **Support**: Contact through the application's feedback system at `/feedbacks`

## 🏆 What's Next?

After getting Souqify running, you can:

1. **Customize the theme** using Tailwind CSS configurations
2. **Add new features** by extending the component system
3. **Integrate additional services** through the integrations system
4. **Deploy to production** using Firebase Hosting or other platforms
5. **Scale the application** with additional Firebase services

## 📝 Development Notes

- The application uses modern React patterns with hooks and context
- State management is handled through custom hooks and Firebase integration
- The UI is fully responsive and supports both light and dark themes
- All routes are defined in `public/routes.json` for easy maintenance
- The project follows TypeScript best practices for type safety

---

Built with ❤️ using React, TypeScript, Firebase, and modern web technologies for scalable e-commerce management.

**Happy coding! 🚀**
