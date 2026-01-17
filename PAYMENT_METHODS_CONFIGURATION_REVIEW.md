# Payment Methods Configuration - Current Status Review

**Date:** January 2025  
**Location:** Settings → Payment Methods (`/dashboard/settings?tab=billing`)

---

## Current Implementation Status

### ✅ **Implemented Features**

#### 1. **Basic Configuration**
- **Method Type**: 5 types supported
  - Cash
  - Credit Card
  - Bank Transfer
  - Wallet
  - Crypto

- **Name**: Custom name for each payment method
  - Example: "Cash (USD)", "POS Terminal #1", "BML Transfer"

- **Active/Inactive Status**: Toggle to enable/disable payment methods
  - Active methods appear in payment forms
  - Inactive methods are hidden from selection

#### 2. **CRUD Operations**
- ✅ **Create**: Add new payment methods
- ✅ **Read**: List all payment methods (including inactive)
- ✅ **Update**: Edit existing payment methods
- ✅ **Delete**: Remove payment methods (with protection if used)

#### 3. **UI Features**
- ✅ Visual icons for each method type
- ✅ Status badges (Active/Inactive)
- ✅ Dropdown menu for actions
- ✅ Edit dialog with form validation
- ✅ Delete confirmation dialog
- ✅ Loading states
- ✅ Empty state when no methods exist

#### 4. **Backend Features**
- ✅ Multi-tenant support (dive center isolation)
- ✅ Authorization checks
- ✅ Protection against deleting used payment methods
- ✅ Settings field (JSON) for additional configuration
- ✅ Filtering by method type and active status

---

## Current Configuration Fields

### **Frontend Form Fields** (Currently Exposed)
1. **Method Type** (Required)
   - Dropdown selection
   - Options: Cash, Credit Card, Bank Transfer, Wallet, Crypto

2. **Name** (Required)
   - Text input
   - Max 255 characters
   - Example: "Cash (USD)", "POS Terminal #1"

3. **Active Status** (Boolean)
   - Toggle switch
   - Default: Active (true)

### **Backend Fields** (Available but Not Exposed in UI)
4. **Settings** (JSON Object)
   - Currently stored but not editable in UI
   - Can contain:
     - `currency` (for Cash methods)
     - `terminal_id` (for Credit Card methods)
     - `bank_name`, `account_number` (for Bank Transfer)
     - `wallet_type` (for Wallet methods)
     - `crypto_type` (for Crypto methods)
     - `fee_percentage` (transaction fee)
     - `description` (additional notes)

---

## Planned Features (From Requirements)

According to `general_settings_plan.md`, payment methods should support:

### ⚠️ **Not Yet Implemented**

1. **Fee Percentage**
   - Percentage added to bill (e.g., +3% for Amex)
   - **Status**: Backend supports in `settings`, but not in UI

2. **Cost Center**
   - Link to Finance Module (Cash Box, Bank Account)
   - **Status**: Not implemented

3. **Visibility Settings**
   - Toggle for Invoices / Payslips / Portal
   - **Status**: Not implemented

4. **Advanced Settings UI**
   - Method-specific configuration fields
   - **Status**: Settings field exists but not editable in UI

---

## Current Data Structure

### **Database Schema**
```php
payment_methods:
  - id
  - dive_center_id (foreign key)
  - method_type (enum: Cash, Credit Card, Bank Transfer, Wallet, Crypto)
  - name (string, max 255)
  - is_active (boolean)
  - settings (JSON, nullable)
  - created_at
  - updated_at
```

### **API Endpoints**
- `GET /api/v1/payment-methods` - List all (with filters)
- `POST /api/v1/payment-methods` - Create new
- `GET /api/v1/payment-methods/{id}` - Get single
- `PUT /api/v1/payment-methods/{id}` - Update
- `DELETE /api/v1/payment-methods/{id}` - Delete

### **API Request/Response Example**

**Create Request:**
```json
{
  "method_type": "Credit Card",
  "name": "POS Terminal #1",
  "is_active": true,
  "settings": {
    "terminal_id": "POS-001",
    "fee_percentage": 2.5,
    "description": "Visa/Mastercard Terminal"
  }
}
```

**Response:**
```json
{
  "id": 1,
  "dive_center_id": 1,
  "method_type": "Credit Card",
  "name": "POS Terminal #1",
  "is_active": true,
  "settings": {
    "terminal_id": "POS-001",
    "fee_percentage": 2.5,
    "description": "Visa/Mastercard Terminal"
  },
  "created_at": "2025-01-20T10:00:00.000000Z",
  "updated_at": "2025-01-20T10:00:00.000000Z"
}
```

---

## Seed Data

### **Currently Seeded Payment Methods** (8 per dive center)

1. **Cash (USD)** - Active
   - Type: Cash
   - Settings: `{ "currency": "USD", "description": "Petty cash box at reception" }`

2. **Cash (MVR)** - Active
   - Type: Cash
   - Settings: `{ "currency": "MVR", "description": "Local currency cash payments" }`

3. **POS Terminal #1** - Active
   - Type: Credit Card
   - Settings: `{ "terminal_id": "POS-001", "description": "Visa/Mastercard Terminal", "fee_percentage": 0 }`

4. **POS Terminal #2** - Active
   - Type: Credit Card
   - Settings: `{ "terminal_id": "POS-002", "description": "Backup card terminal", "fee_percentage": 0 }`

5. **BML Transfer** - Active
   - Type: Bank Transfer
   - Settings: `{ "bank_name": "Bank of Maldives", "account_number": "****1234", "description": "Bank of Maldives Account" }`

6. **Wire Transfer** - Active
   - Type: Bank Transfer
   - Settings: `{ "bank_name": "International Wire", "description": "International bank transfer" }`

7. **Mobile Wallet** - Active
   - Type: Wallet
   - Settings: `{ "wallet_type": "Mobile", "description": "Mobile payment wallet" }`

8. **Bitcoin** - Inactive
   - Type: Crypto
   - Settings: `{ "crypto_type": "BTC", "description": "Bitcoin cryptocurrency payments" }`

---

## How to Use

### **Accessing Payment Methods Settings**
1. Navigate to: `http://localhost:3000/dashboard/settings`
2. Click on "Payment Methods" tab (or use `?tab=billing` in URL)

### **Adding a Payment Method**
1. Click "Add Method" button
2. Select method type from dropdown
3. Enter a name (e.g., "Cash (USD)")
4. Toggle active status
5. Click "Create"

### **Editing a Payment Method**
1. Click the three-dot menu (⋮) on any payment method
2. Click "Configure"
3. Modify fields as needed
4. Click "Update"

### **Deleting a Payment Method**
1. Click the three-dot menu (⋮) on any payment method
2. Click "Delete"
3. Confirm deletion
   - **Note**: Cannot delete if payment method has been used in payments

---

## Current Limitations

### ⚠️ **Missing Features**

1. **Settings Field Not Editable**
   - The `settings` JSON field exists in the database and API
   - But it's not exposed in the UI form
   - Users cannot configure:
     - Transaction fees
     - Terminal IDs
     - Account numbers
     - Currency for cash methods
     - Other method-specific settings

2. **No Fee Configuration**
   - Cannot set transaction fees per payment method
   - Fee percentage not visible or editable

3. **No Cost Center Integration**
   - Cannot link payment methods to cash boxes or bank accounts
   - Future integration not yet implemented

4. **No Visibility Controls**
   - Cannot control where payment methods appear (Invoices/Payslips/Portal)
   - All active methods appear everywhere

---

## Recommendations for Enhancement

### **Priority 1: Expose Settings Field**
Add a collapsible "Advanced Settings" section in the form to edit:
- Transaction fee percentage
- Method-specific configuration (terminal ID, account number, etc.)
- Description/notes

### **Priority 2: Add Fee Configuration**
- Add fee percentage field to main form
- Calculate fees automatically when processing payments
- Display fees in payment forms

### **Priority 3: Method-Specific Fields**
Show different fields based on selected method type:
- **Cash**: Currency selector
- **Credit Card**: Terminal ID, Card types accepted
- **Bank Transfer**: Bank name, Account number (masked)
- **Wallet**: Wallet type selector
- **Crypto**: Crypto type selector

### **Priority 4: Visibility Controls**
- Add checkboxes for:
  - Show in Invoices
  - Show in Payslips
  - Show in Customer Portal

---

## Summary

### ✅ **What Works**
- Basic CRUD operations
- Method type selection
- Active/inactive status
- Multi-tenant support
- Delete protection
- Seed data available

### ⚠️ **What's Missing**
- Settings field not editable in UI
- Fee percentage not configurable
- Method-specific fields not shown
- Cost center integration
- Visibility controls

### 📊 **Overall Status**
**Current Implementation: 70% Complete**

The core functionality is working well, but advanced configuration options are not yet exposed in the UI. The backend supports these features, but the frontend form needs enhancement to make them accessible.

---

**Last Updated:** January 2025  
**Component:** `PaymentMethodsList.tsx`  
**API Controller:** `PaymentMethodController.php`

