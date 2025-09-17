# SnapBuy - E-commerce Management Platform

A comprehensive e-commerce platform built with React, TypeScript, and Firebase that provides powerful tools for online store management, order processing, delivery management, and customer engagement.

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
src/
├── components/          # Reusable UI components
├── routes/             # Page components and routing
│   ├── Stores/         # Store management pages
│   ├── Clients/        # Customer-facing pages
│   └── Collections/    # Product collection management
├── Deliveries/         # Delivery management system
├── Forms/              # Form components and order forms
├── Links/              # Order and product linking components
├── apis/               # API integration and data fetching
├── utils/              # Utility functions and helpers
├── assets/             # Static assets and images
└── animations/         # Animation components and hooks
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn package manager
- Firebase project setup

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/ilyestearti5/SnapBuy.git
cd SnapBuy
```

2. **Install dependencies**

```bash
npm install
```

3. **Environment Setup**
   Create a `.env` file with your Firebase configuration:

```env
VITE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_DATABASE_URL=your-database-url
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
```

4. **Development Server**

```bash
npm run dev
```

5. **Build for Production**

```bash
npm run build
```

### Mobile Development

**Android**

```bash
npm run electron.build
npx cap add android
npx cap run android
```

**iOS**

```bash
npm run electron.build
npx cap add ios
npx cap run ios
```

### Desktop Development

**Windows**

```bash
npm run electron.windows.build
```

**macOS**

```bash
npm run electron.macos.build
```

**Linux**

```bash
npm run electron.linux.build
```

## 📋 Key Features Implementation

### Order Management System

- Create orders with customer details and product selection
- Track order status through customizable workflow stages
- Generate and export order invoices with QR codes
- Search and filter orders by multiple criteria

### Delivery Management

- Assign delivery agents to orders
- Configure delivery zones and pricing tiers
- Track delivery progress and completion
- Manage delivery agent accounts and permissions

### Notification System

- Real-time browser notifications for store events
- Configurable notification preferences per store
- Service worker integration for offline notifications
- Support for order, delivery, and inventory alerts

### Multi-store Architecture

- Single platform supporting multiple independent stores
- Store-specific configurations and branding
- Isolated data and user permissions per store
- Centralized management with store switching

## 🔧 Configuration

The application uses a modular configuration system:

- **`project.json`** - Project-specific settings
- **`capacitor.config.ts`** - Mobile app configuration
- **`firebase.json`** - Firebase hosting and functions setup
- **`tailwind.config.js`** - UI styling configuration

## 📖 Documentation

- [Notification System Guide](./NOTIFICATION_SYSTEM.md)
- [Delivery Pricing Implementation](./DELIVERY_PRICING_FEATURE.md)
- [Mobile Header Implementation](./MOBILE_HEADER_IMPLEMENTATION.md)
- [Brand Implementation Guide](./BRAND_IMPLEMENTATION.md)

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

## 🔗 Links

- **Production**: [https://snapbuy.biqpod.com](https://snapbuy.biqpod.com)
- **Documentation**: Project documentation in markdown files
- **Support**: Contact through the application's feedback system

---

Built with ❤️ using modern web technologies for scalable e-commerce management.
