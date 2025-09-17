# Delivery Pricing Feature

This document explains how to use the new delivery pricing feature in SnapBuy.

## Overview

The delivery pricing feature allows stores to define multiple delivery pricing options stored in a separate database collection. Each delivery price option includes:

- `id`: Unique identifier
- `storeId`: Store identifier for the delivery price
- `name`: Display name for the delivery option
- `description`: Detailed description of the delivery service
- `price`: Price in DA (Algerian Dinar)
- `createdAt`: Timestamp when the price was created
- `uid`: User ID of the store owner

Delivery prices are now stored in a separate `deliveryPrices` collection instead of being embedded in the Store interface, providing better scalability and data management.

## Components

### 1. DeliveryPricesManager

Main component for managing delivery prices for a store.

```tsx
import { DeliveryPricesManager } from "./src/Deliveries/DeliveryPricesManager";

// Usage
<DeliveryPricesManager storeId="store-123" />;
```

### 2. StoreDeliveryPrices

Component that provides a quick access to manage delivery prices from store context.

```tsx
import { StoreDeliveryPrices } from "./src/Deliveries/StoreDeliveryPrices";

// Usage
<StoreDeliveryPrices storeId="store-123" storeName="My Store" />;
```

### 3. DeliveryPricesPreview

Shows a preview of delivery prices in store cards.

```tsx
import { DeliveryPricesPreview } from "./src/Deliveries/StoreDeliveryPrices";

// Usage
<DeliveryPricesPreview storeId="store-123" />;
```

## API Methods

### getStoreDeliveryPrices

Gets all delivery prices for a store from the dedicated collection.

```typescript
const deliveryPrices = await snapbuyApi.getStoreDeliveryPrices(storeId);
```

### addStoreDeliveryPrice

Adds a new delivery price to the deliveryPrices collection.

```typescript
await snapbuyApi.addStoreDeliveryPrice(storeId, {
  id: crypto.randomUUID(),
  name: "Standard Delivery",
  description: "Delivery within 2-3 business days",
  price: 500,
  createdAt: Date.now(),
});
```

### updateStoreDeliveryPrice

Updates an existing delivery price in the collection.

```typescript
await snapbuyApi.updateStoreDeliveryPrice(storeId, {
  id: "existing-id",
  name: "Express Delivery",
  description: "Same day delivery",
  price: 1000,
  createdAt: 1234567890,
});
```

### deleteStoreDeliveryPrice

Deletes a delivery price from the collection.

```typescript
await snapbuyApi.deleteStoreDeliveryPrice(storeId, deliveryPriceId);
```

## Integration

### Store Management

The delivery pricing feature is integrated into the store management interface:

1. **Store Cards**: Each store card now shows a preview of delivery prices
2. **Store Menu**: A "Delivery Prices" option is added to the store context menu
3. **Quick Access**: A settings icon provides direct access to manage delivery prices

### Usage Examples

#### Example 1: Standard and Express Delivery

```json
[
  {
    "id": "std-delivery",
    "name": "Standard Delivery",
    "description": "Delivery within 2-3 business days",
    "price": 500,
    "createdAt": 1640995200000
  },
  {
    "id": "express-delivery",
    "name": "Express Delivery",
    "description": "Same day delivery",
    "price": 1000,
    "createdAt": 1640995200000
  }
]
```

#### Example 2: Location-based Pricing

```json
[
  {
    "id": "local-delivery",
    "name": "Local Delivery",
    "description": "Within city limits",
    "price": 300,
    "createdAt": 1640995200000
  },
  {
    "id": "suburban-delivery",
    "name": "Suburban Delivery",
    "description": "Suburban areas",
    "price": 600,
    "createdAt": 1640995200000
  },
  {
    "id": "remote-delivery",
    "name": "Remote Delivery",
    "description": "Remote or hard-to-reach areas",
    "price": 1200,
    "createdAt": 1640995200000
  }
]
```

## Features

- ✅ Add multiple delivery pricing options
- ✅ Edit existing delivery prices
- ✅ Delete delivery prices
- ✅ Search and filter delivery prices
- ✅ Preview delivery prices in store cards
- ✅ Integrated into store management UI
- ✅ Multi-language support (EN/FR/AR)
- ✅ Type-safe with TypeScript

## Future Enhancements

- [ ] Zone-based delivery pricing integration
- [ ] Automatic pricing based on distance
- [ ] Bulk import/export of delivery prices
- [ ] Analytics and usage tracking
- [ ] Customer selection during checkout
