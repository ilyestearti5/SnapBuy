# Store Delivery Pricing Components

This document provides examples of how to use the new delivery pricing components.

## Components

### StoreDeliveryPricingList

A component that displays a list of delivery prices for a store with options to add, edit, and delete.

```tsx
import { StoreDeliveryPricingList } from "../components";

// Usage with explicit store ID
<StoreDeliveryPricingList storeId="your-store-id" />

// Usage with current store context (will use useStoreId hook)
<StoreDeliveryPricingList />
```

### UpsertStoreDeliveryPrice

A popup/modal component for adding or editing a delivery price.

```tsx
import { UpsertStoreDeliveryPrice } from "../components";

// For adding a new delivery price
<UpsertStoreDeliveryPrice storeId="your-store-id" />

// For editing an existing delivery price
<UpsertStoreDeliveryPrice
  storeId="your-store-id"
  deliveryPrice={existingDeliveryPrice}
/>
```

## Integration Example

Here's how you might integrate these components into a store management page:

```tsx
import React from "react";
import { StoreDeliveryPricingList } from "../components";
import { useStoreId } from "../utils";

export const StoreSettingsPage = () => {
  const storeId = useStoreId();

  return (
    <div className="space-y-6">
      <h1>Store Settings</h1>

      {/* Other store settings components */}

      <div>
        <h2>Delivery Pricing</h2>
        <StoreDeliveryPricingList storeId={storeId} />
      </div>
    </div>
  );
};
```

## Features

- **List View**: Displays all delivery prices with name, description, price, and creation date
- **Add New**: Button to add new delivery pricing options
- **Edit**: Edit existing delivery prices
- **Delete**: Remove delivery prices with confirmation
- **Responsive**: Works on both desktop and mobile
- **Animations**: Smooth transitions and loading states
- **Translations**: Supports the app's translation system

## API Methods Used

The components use these API methods from `snapbuyApi`:

- `getStoreDeliveryPrices(storeId)` - Get all delivery prices for a store
- `addStoreDeliveryPrice(storeId, deliveryPrice)` - Add new delivery price
- `updateStoreDeliveryPrice(storeId, deliveryPrice)` - Update existing delivery price
- `deleteStoreDeliveryPrice(storeId, deliveryPriceId)` - Delete delivery price

Note: Delivery prices are now stored in a separate `deliveryPrices` collection instead of being embedded in the Store interface.

## Props

### StoreDeliveryPricingList Props

| Prop    | Type   | Required | Description                                      |
| ------- | ------ | -------- | ------------------------------------------------ |
| storeId | string | No       | Store ID (if not provided, uses useStoreId hook) |

### UpsertStoreDeliveryPrice Props

| Prop          | Type                  | Required | Description                         |
| ------------- | --------------------- | -------- | ----------------------------------- |
| storeId       | string                | Yes      | Store ID                            |
| deliveryPrice | Souqify.DeliveryPrice | No       | Existing delivery price for editing |
