# Variables Feature Implementation

## Overview

This document outlines the implementation of a new "Variables" feature for the SnapBuy application. This feature allows store owners to create, read, update, and delete custom variables that can be used for configuration or data storage purposes within their store.

## What was Implemented

### 1. Database Schema

- **New Interface**: Added `SnapBuy.Var` interface to the types definition
- **Structure**:
  ```typescript
  interface Var {
    id: string;
    name: string;
    value: string;
    createdAt: number;
    storeId?: string;
    uid?: string;
  }
  ```

### 2. API Functions

Added complete CRUD operations for variables in the `snapbuyApi`:

- **upsertVar(variable: SnapBuy.Var)**: Creates or updates a variable
- **getVars(storeId: string)**: Retrieves all variables for a specific store
- **getVar(varId: string)**: Gets a single variable by ID (with caching)
- **deleteVar(varId: string)**: Deletes a variable by ID

### 3. User Interface Components

Created a complete management interface:

- **Vars Component**: Main component for listing and managing variables
- **UpsertVar Component**: Modal component for creating/editing variables
- **Features**:
  - Search functionality
  - Add/Edit/Delete operations
  - Animated list with smooth transitions
  - Empty state with helpful messaging
  - Responsive design

### 4. Store Configuration Integration

- Added new "Variables" tab to the store configuration section
- Icon: `faCodeBranch`
- Positioned between "Forms" and "Notifications" tabs

### 5. Translations

Added multi-language support with translations for:

- English, French, and Arabic
- All UI text related to variables functionality

## File Changes

### Modified Files:

1. **`src/vite-env.d.ts`**

   - Added `SnapBuy.Var` interface definition

2. **`src/apis/index.ts`**

   - Added 4 new API functions for variable CRUD operations
   - Integrated with Firebase/database structure

3. **`src/routes/Stores/components/StoreConfiguration.tsx`**

   - Added "Variables" tab to the store configuration tabs

4. **`src/components/index.ts`**

   - Exported the new Vars component

5. **`src/utils.ts`**
   - Added translations for variables feature

### New Files:

1. **`src/components/Vars.tsx`**
   - Complete variables management component
   - Includes both list view and create/edit functionality

## Features

### Core Functionality

- ✅ Create new variables with name and value
- ✅ View all variables in a searchable list
- ✅ Edit existing variables
- ✅ Delete variables with confirmation
- ✅ Search/filter variables by name or value

### User Experience

- ✅ Smooth animations and transitions
- ✅ Responsive design for mobile and desktop
- ✅ Empty state with helpful call-to-action
- ✅ Loading states and error handling
- ✅ Multi-language support

### Technical Features

- ✅ TypeScript type safety
- ✅ Firebase integration
- ✅ Caching for performance
- ✅ Proper error handling
- ✅ Action-based state management

## Database Structure

Variables are stored in the Firebase collection:

```
projects/{PROJECT_ID}/vars/{VAR_ID}
```

Each variable document contains:

- `id`: Unique identifier
- `name`: Variable name
- `value`: Variable value (string)
- `storeId`: Associated store ID
- `uid`: User ID who created it
- `createdAt`: Timestamp

## Usage

### For Store Owners:

1. Navigate to Store Configuration
2. Click on the "Variables" tab
3. Use the "+" button to add new variables
4. Search existing variables using the search bar
5. Edit or delete variables using the action buttons

### For Developers:

The variables can be accessed via the API:

```typescript
// Get all variables for a store
const variables = await snapbuyApi.getVars(storeId);

// Create or update a variable
await snapbuyApi.upsertVar({
  name: "API_KEY",
  value: "your-api-key-here",
  storeId: "store-123",
});

// Delete a variable
await snapbuyApi.deleteVar(variableId);
```

## Security & Permissions

- Variables are scoped to individual stores
- Users can only access variables for stores they own
- All operations require user authentication
- Variables are created with the authenticated user's UID

## Future Enhancements

Potential improvements for the variables feature:

- Variable types (string, number, boolean, JSON)
- Variable categories/grouping
- Import/export functionality
- Variable usage tracking
- Environment-specific variables (dev/prod)
- Variable validation rules

## Benefits

1. **Flexibility**: Store owners can create custom configuration values
2. **Easy Management**: Simple UI for CRUD operations
3. **Searchable**: Quick finding of specific variables
4. **Secure**: Proper authentication and authorization
5. **Scalable**: Ready for future enhancements
6. **Multi-language**: Supports internationalization

The variables feature is now fully integrated into the SnapBuy application and ready for use!
