# Username Support Testing Guide

## Summary of Changes

The user access management system has been successfully updated to support both email and username identification for store access.

### Updated Components

1. **Type Definitions (`src/vite-env.d.ts`)**

   - Modified `Biqpod.Snapbuy.StoreUserAccess` interface
   - Made `userEmail` optional and added optional `username` field
   - Both fields are optional to support either identification method

2. **API Functions (`src/apis/index.ts`)**

   - Updated `addUserAccessToStore` to accept both `email` and `username` parameters
   - Updated `getUserAccessToStore` to support both identifier types with `type` parameter
   - Maintains backward compatibility with existing email-based access

3. **UpsertAccessUsertoStore Component (`src/Integrations/UpsertAccessUsertoStore.tsx`)**

   - Added identifier type selection (Email Address / Username)
   - Implemented dual validation logic for email and username formats
   - Username validation: 3-20 characters, alphanumeric and underscores only
   - Dynamic form fields based on selected identifier type
   - Properly detects existing access type for editing

4. **UsersAccessListForStore Component (`src/Integrations/UsersAccessListForStore.tsx`)**
   - Added helper functions to display either email or username
   - Shows identifier type next to the user identifier
   - Updated confirmation messages to use appropriate identifier

### Features Implemented

✅ **Email Support** (existing functionality)

- Email validation with regex pattern
- Email-based user access management

✅ **Username Support** (new functionality)

- Username validation (3-20 chars, alphanumeric + underscore)
- Username-based user access management
- Clear visual indicator of identifier type

✅ **UI/UX Enhancements**

- Dynamic form labels and placeholders
- Identifier type selection for new users
- Automatic detection of identifier type for existing users
- Helpful validation messages for both formats

✅ **Data Management**

- Flexible API that accepts either email or username
- Proper data structure updates in Firebase/Firestore
- Backward compatibility with existing email-based records

## Testing Instructions

### Test Case 1: Add User with Email

1. Navigate to Integrations → User Access Management
2. Click "Invite User"
3. Select "Email Address" as identifier type
4. Enter a valid email (e.g., test@example.com)
5. Select permission level
6. Submit and verify success

### Test Case 2: Add User with Username

1. Navigate to Integrations → User Access Management
2. Click "Invite User"
3. Select "Username" as identifier type
4. Enter a valid username (e.g., testuser123)
5. Select permission level
6. Submit and verify success

### Test Case 3: Username Validation

1. Try usernames with invalid formats:
   - Less than 3 characters: "ab"
   - More than 20 characters: "verylongusernamethatexceedslimit"
   - Special characters: "test@user"
   - Spaces: "test user"
2. Verify appropriate validation messages appear

### Test Case 4: Edit Existing Access

1. Edit an existing user access record
2. Verify that identifier field is disabled and shows correct type
3. Verify permission changes work correctly
4. Test with both email-based and username-based records

### Test Case 5: Display Consistency

1. Verify user list shows correct identifiers
2. Check that identifier type is displayed (email/username)
3. Confirm removal confirmation shows correct identifier
4. Test with mixed email and username records

## Implementation Notes

- The system is designed to be flexible and can handle both email and username simultaneously
- Existing email-based records continue to work without migration
- New records can use either identifier type
- The UI automatically adapts based on the chosen identifier type
- All animations and interactions remain smooth and consistent

## Validation Rules

### Email Validation

- Must match pattern: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Cannot be empty
- Must be valid email format

### Username Validation

- Must match pattern: `/^[a-zA-Z0-9_]{3,20}$/`
- 3-20 characters in length
- Only letters, numbers, and underscores allowed
- Cannot be empty

## Future Enhancements

- Could add user search by either email or username
- Could implement username uniqueness checking
- Could add bulk user import with mixed identifier types
- Could add user profile pictures/avatars based on identifier type
