# Order Client/Customer Enhancement

This update improves the handling of order client information throughout the SnapBuy application to support both `client` and `customer` data structures.

## Changes Made

### 1. Core Utility (`src/utils/orderClientInfo.ts`)

- **`getOrderClientInfo(order)`**: Async function that retrieves client information from either `order.client` or `order.customer`
- **`getOrderClientDisplayName(clientInfo)`**: Helper to get formatted display name
- **`getOrderClientAddress(clientInfo)`**: Helper to get formatted address

### 2. New API Function (`src/apis/index.ts`)

- **`getCustomer(customerId)`**: Added function to retrieve customer data by ID

### 3. Reusable Components (`src/components/OrderClientDisplay.tsx`)

- **`OrderClientDisplay`**: Main component for displaying client/customer info with various options
- **`OrderClientPhone`**: Component for phone display
- **`OrderClientAddress`**: Component for address display
- **`OrderClientWilaya`**: Component for wilaya display
- **`OrderClientLocation`**: Component for location display
- **`OrderClientActions`**: Component for action buttons (call, map)
- **`OrderClientMenuActions`**: Component for menu with all actions
- **`useOrderClientInfo`**: Hook for getting client info in custom components

### 4. Updated Components

- **`ViewClient.tsx`**: Now handles both client and customer data
- **`OrderInvoice.tsx`**: Updated to display correct client/customer information
- **`Orders.tsx`**: Updated order lists to use new components
- **`DeliveryOrders.tsx`**: Updated delivery interface
- **`notifications.ts`**: Updated notification messages

## Usage Examples

### Basic Display

```tsx
<OrderClientDisplay order={order} />
```

### With Additional Information

```tsx
<OrderClientDisplay
  order={order}
  showPhone={true}
  showAddress={true}
  showCustomerBadge={true}
/>
```

### Individual Components

```tsx
<OrderClientPhone order={order} />
<OrderClientAddress order={order} />
<OrderClientWilaya order={order} />
```

### Actions

```tsx
<OrderClientActions order={order} />
<OrderClientMenuActions
  order={order}
  onViewOrder={() => showPopup(<OrderView order={order} />)}
  onAssignAgent={() => showPopup(<AssignAgent order={order} />)}
/>
```

### Hook Usage

```tsx
const clientInfo = useOrderClientInfo(order);
if (clientInfo) {
  const displayName = getOrderClientDisplayName(clientInfo);
  const address = getOrderClientAddress(clientInfo);
}
```

## Order Structure Support

The system now properly handles both:

1. **Client Orders** (`order.client`):

   - Contains full client information including name, phone, address
   - Used for guest/anonymous orders

2. **Customer Orders** (`order.customer`):
   - Contains customer ID reference
   - Fetches customer data from database
   - Used for registered customers

## Benefits

- **Unified Interface**: Same components work for both client and customer orders
- **Type Safety**: Proper TypeScript support with null checks
- **Async Support**: Handles database fetching for customer data
- **Reusable**: Components can be easily used across different parts of the app
- **Flexible**: Options to show/hide different pieces of information
- **Future-Proof**: Easy to extend for additional data types

## Files Modified

### Core Files

- `src/utils/orderClientInfo.ts` (new)
- `src/apis/index.ts` (added getCustomer function)

### Components

- `src/components/OrderClientDisplay.tsx` (new)
- `src/Links/ViewClient.tsx`
- `src/Links/OrderInvoice.tsx`
- `src/Links/Orders.tsx`
- `src/Deliveries/DeliveryOrders.tsx`
- `src/utils/notifications.ts`

### Test File

- `src/utils/orderClientInfoTest.ts` (new, for testing/examples)

All components now properly handle the case where an order might have either client information or customer ID, providing a better and more consistent user experience.
