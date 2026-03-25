# Order Form Profile System - SnapBuy E-commerce

## Overview

The Order Form Profile System allows sellers to create **reusable configuration profiles** that control how customers place orders. Instead of having one fixed order form, sellers can create multiple profiles and assign them to:

- **Store-level**: Apply to all products by default
- **Product-level**: Override store settings for specific products

## Key Features

### 1. **Quantity Control**

- **Enabled**: Customers can select how many items they want (0, 1, 2, 3, etc.)
- **Disabled**: Fixed quantity of 1 item per order (quick purchase)

### 2. **Buyer Notes**

- **Optional**: Customers can add special instructions if they want
- **Required**: Customers must provide delivery/order notes
- **Customizable**: Set placeholder text and max character length

### 3. **Product Display**

- Show/hide product images
- Show/hide product descriptions

### 4. **Order Options**

- Allow single or multiple products per order
- Require delivery address (mandatory or optional)
- Require phone number (mandatory or optional)
- Show/hide store information

### 5. **Custom Welcome Message**

- Add a personalized message at the top of the order form

## System Architecture

```
Store
├── Default Profile (Store-level settings)
├── Order Form Profiles
│   ├── Profile 1: "Quick Purchase"
│   ├── Profile 2: "Detailed Order"
│   └── Profile 3: "Bulk Order"
└── Products
    ├── Product A → Uses Profile 1
    ├── Product B → Uses Profile 2
    └── Product C → Uses Store Default
```

## Data Structure

### OrderFormProfile

```typescript
{
  id: string;                        // UUID
  storeId: string;                   // Store owner
  name: string;                      // e.g., "Quick Purchase"
  description?: string;              // Profile purpose
  allowQuantityControl: boolean;     // Allow 0+ quantities
  requireBuyerNotes: boolean;        // Require notes
  notesPlaceholder: string;          // Helper text
  maxNotesLength: number;            // Character limit
  showProductImages: boolean;
  showProductDescription: boolean;
  allowMultipleProducts: boolean;    // Can order multiple products
  requireDeliveryAddress: boolean;
  requirePhoneNumber: boolean;
  showStoreInformation: boolean;
  customMessage?: string;            // Welcome message
  isDefault?: boolean;               // Store default
  createdAt: number;
  updatedAt: number;
  usageCount?: number;               // Products using this
}
```

### Storage Location

```
projects/
└── snapbuy/
    └── stores/{storeId}/
        └── orderFormProfiles/
            ├── {profileId1}/
            ├── {profileId2}/
            └── {profileId3}/

products/{productId}/
└── orderFormProfileId: "{profileId}"  // Profile reference
```

## Components

### 1. OrderFormProfilesList

**Purpose**: Main management page for profiles
**Location**: `src/routes/Stores/OrderFormProfilesList.tsx`

**Features**:

- View all profiles in grid layout
- Quick preview of profile settings
- Create new profile
- Edit existing profile
- Duplicate profile
- Delete profile (except default)
- Search profiles
- See usage count per profile

### 2. OrderFormProfileEditor

**Purpose**: Create and edit individual profiles
**Location**: `src/routes/Stores/OrderFormProfileEditor.tsx`

**Features**:

- Profile name and description
- Toggle all features on/off
- Configure buyer notes settings
- Customize product display options
- Set store-level defaults
- Preview settings before saving

### 3. ProductProfileAssignment

**Purpose**: Assign profiles to specific products
**Location**: `src/routes/Stores/ProductProfileAssignment.tsx`

**Features**:

- Visual profile selector with preview
- Show all available profiles
- Display profile features in grid
- Quick summary of selected profile
- Assign or use store default

### 4. OrderFormSettings (Legacy)

**Purpose**: Alternative interface for store-wide settings
**Location**: `src/routes/Stores/OrderFormSettings.tsx`

## APIs

### Core Functions (orderFormProfiles.ts)

```typescript
// Create a new profile
await createOrderFormProfile(storeId, profileData);

// Get all profiles for store
const profiles = await getAllOrderFormProfiles(storeId);

// Get specific profile
const profile = await getOrderFormProfile(storeId, profileId);

// Update profile
await updateOrderFormProfile(storeId, profileId, updates);

// Delete profile
await deleteOrderFormProfile(storeId, profileId);

// Set store default
await setStoreDefaultProfile(storeId, profileId);

// Get store default
const defaultProfile = await getStoreDefaultProfile(storeId);

// Assign to product
await assignProfileToProduct(productId, profileId);

// Get product profile (or fall back to store default)
const profile = await getProductOrderFormProfile(productId, storeId);

// Duplicate profile
await duplicateOrderFormProfile(storeId, sourceId, newName);

// Get usage count
const count = await getProfileUsageCount(storeId, profileId);
```

## Usage Examples

### Example 1: Create "Quick Purchase" Profile

```typescript
const quickPurchase = await createOrderFormProfile(storeId, {
  name: "Quick Purchase",
  description: "Fast checkout - quantity 1 only, no notes",
  allowQuantityControl: false, // Fixed to 1
  requireBuyerNotes: false, // Optional notes
  allowMultipleProducts: false, // Single product only
  showProductImages: true,
  showProductDescription: false, // Minimal info
  requireDeliveryAddress: true,
  requirePhoneNumber: true,
});

// Assign to fast-selling products
await assignProfileToProduct("product-123", quickPurchase.id);
```

### Example 2: Create "Detailed Order" Profile

```typescript
const detailedOrder = await createOrderFormProfile(storeId, {
  name: "Detailed Order",
  description: "Full control - customize everything",
  allowQuantityControl: true, // Choose quantity
  requireBuyerNotes: true, // Requires special instructions
  maxNotesLength: 500,
  notesPlaceholder: "Please describe your requirements in detail...",
  allowMultipleProducts: true, // Mix products
  showProductImages: true,
  showProductDescription: true, // Full details
  requireDeliveryAddress: true,
  requirePhoneNumber: true,
  customMessage: "Welcome! Take your time to customize your order.",
});

// Set as store default
await setStoreDefaultProfile(storeId, detailedOrder.id);
```

### Example 3: Assign Different Profiles to Products

```typescript
// Premium products use detailed profile
await assignProfileToProduct("premium-product-1", detailedProfile.id);

// Budget products use quick purchase
await assignProfileToProduct("budget-product-1", quickPurchase.id);

// Standard products use store default
// (no assignment needed - falls back automatically)
```

## Integration with Checkout Form

When displaying the order form to customers, use:

```typescript
import { getProductOrderFormProfile } from "./apis/orderFormProfiles";

// In your checkout component
const profile = await getProductOrderFormProfile(productId, storeId);

// Use profile settings to conditionally show/hide form fields
if (profile.allowQuantityControl) {
  // Show quantity selector
}

if (profile.requireBuyerNotes) {
  // Make notes field required
}

if (profile.allowMultipleProducts) {
  // Show multi-product selector
}
```

## Default Values

If no profile is created:

```typescript
{
  allowQuantityControl: true,
  requireBuyerNotes: false,
  notesPlaceholder: "Add any special instructions or preferences...",
  maxNotesLength: 500,
  showProductImages: true,
  showProductDescription: true,
  allowMultipleProducts: true,
  requireDeliveryAddress: true,
  requirePhoneNumber: true,
  showStoreInformation: true,
}
```

## File Structure

```
src/
├── apis/
│   ├── orderFormProfiles.ts       # Core API functions
│   └── orderSettings.ts           # Legacy (kept for compatibility)
│
└── routes/Stores/
    ├── OrderFormProfilesList.tsx    # Main profile management
    ├── OrderFormProfileEditor.tsx   # Create/edit profile
    ├── ProductProfileAssignment.tsx # Assign to products
    ├── OrderFormSettings.tsx        # Legacy interface
    └── index.profiles.ts            # Exports
```

## Roadmap for Sellers

1. **Navigate to Order Form Settings** (in Store Management)
2. **Create Profiles**:
   - Click "New Profile"
   - Configure settings for your use case
   - Save as "Default" or keep as special profile
3. **Assign to Products**:
   - In product editor, click "Change Order Form Profile"
   - Select appropriate profile
   - Save
4. **Monitor Usage**:
   - See how many products use each profile
   - Duplicate popular profiles for variations
5. **Optimize**:
   - Get feedback from customers
   - Update profiles based on order patterns

## Future Enhancements

- [ ] Template library (pre-built profiles for common uses)
- [ ] A/B testing profiles for conversion optimization
- [ ] Analytics per profile (orders, conversion rate)
- [ ] Profile versioning and history
- [ ] Bulk assignment to product categories
- [ ] Profile-specific pricing or discounts
- [ ] Mobile-specific profile variants

## Support

For issues or feature requests, contact the development team.
