# Store Delivery Pricing Components Implementation

## Summary

I have successfully implemented two new components for managing delivery prices in SnapBuy stores as requested:

## 1. StoreDeliveryPricingList Component

**Location**: `src/components/StoreDeliveryPricing.tsx`

**Features**:

- Displays a list of all delivery prices for a store
- Shows price name, description, price amount, and creation date
- Add new delivery price button
- Edit and delete actions for each price
- Empty state with helpful messaging
- Loading states and animations
- Responsive design for mobile and desktop
- Confirmation dialog for deletions

**Props**:

- `storeId?: string` - Optional store ID (uses `useStoreId()` hook if not provided)

## 2. UpsertStoreDeliveryPrice Component

**Location**: `src/components/StoreDeliveryPricing.tsx`

**Features**:

- Modal/popup form for adding or editing delivery prices
- Form fields: Name, Description (optional), Price
- Form validation (required name, positive price)
- Supports both add and edit modes
- Success/error toast notifications
- Responsive design

**Props**:

- `storeId: string` - Required store ID
- `deliveryPrice?: SnapBuy.DeliveryPricing` - Optional existing price for editing

## Integration

### 1. Added to Store Configuration

The `StoreDeliveryPricingList` component has been integrated into the existing store configuration page at:
`src/routes/Stores/components/StoreConfiguration.tsx`

It appears as a new "Delivery Pricing" tab alongside Store Settings, Forms, and Notifications.

### 2. Component Exports

Both components are exported from `src/components/index.ts` for easy importing.

### 3. Demo Page

Created a demo page at `src/routes/DeliveryPricingDemo.tsx` to showcase both components.

## Usage Examples

### Basic List View

```tsx
import { StoreDeliveryPricingList } from "../components";

// Use with current store context
<StoreDeliveryPricingList />

// Use with specific store ID
<StoreDeliveryPricingList storeId="store-123" />
```

### Manual Form Usage

```tsx
import { UpsertStoreDeliveryPrice } from "../components";
import { showPopup } from "@biqpod/app/ui/hooks";

// Add new delivery price
const handleAdd = () => {
  showPopup(<UpsertStoreDeliveryPrice storeId={storeId} />);
};

// Edit existing delivery price
const handleEdit = (price: SnapBuy.DeliveryPricing) => {
  showPopup(
    <UpsertStoreDeliveryPrice storeId={storeId} deliveryPrice={price} />
  );
};
```

## API Methods Used

The components utilize existing API methods from `snapbuyApi`:

- `getStore(storeId)` - Retrieves store data including delivery prices
- `addStoreDeliveryPrice(storeId, deliveryPrice)` - Adds new delivery price
- `updateStoreDeliveryPrice(storeId, deliveryPrice)` - Updates existing delivery price
- `deleteStoreDeliveryPrice(storeId, deliveryPriceId)` - Deletes delivery price

## Type Safety

The components are fully typed using the existing `SnapBuy.DeliveryPricing` interface from `vite-env.d.ts`:

```typescript
interface DeliveryPricing {
  id?: string;
  description: string;
  price: number;
  name: string;
  createdAt: number;
}
```

## UI/UX Features

- **Responsive Design**: Works on both desktop and mobile
- **Animations**: Smooth transitions using Framer Motion
- **Loading States**: Proper loading indicators
- **Empty States**: Helpful messages when no data exists
- **Validation**: Form validation with error messages
- **Confirmations**: Delete confirmation dialogs
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Internationalization**: Uses the app's translation system

## Files Created/Modified

### New Files:

1. `src/components/StoreDeliveryPricing.tsx` - Main components
2. `src/components/StoreDeliveryPricing.examples.md` - Usage documentation
3. `src/routes/DeliveryPricingDemo.tsx` - Demo page

### Modified Files:

1. `src/components/index.ts` - Added component exports
2. `src/routes/Stores/components/StoreConfiguration.tsx` - Added delivery pricing tab

## Testing

The components can be tested by:

1. Navigating to a store's configuration page
2. Clicking the "Delivery Pricing" tab
3. Using the demo page at `/delivery-pricing-demo` (if routed)
4. Testing add, edit, and delete functionality

The implementation is ready for use and follows the existing code patterns and conventions in the SnapBuy application.
