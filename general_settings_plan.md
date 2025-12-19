# General Settings Implementation Plan - SAS Scuba

**Based on:** Geek Divers Documentation Section 1.1 (`#1-1-general-settings`)

## Objective
Implement a robust "General Settings" module that serves as the backbone for the application's configuration. This will manage company details, operational defaults, financial basics, and customer interaction preferences.

## 1. Module Structure (`/dashboard/settings`)
The settings page will be divided into the following sub-modules (Tabs):

### 1.1 Company Information (Section 1.1.1 & 1.1.11)
- **Goal**: Manage public-facing identity for invoices, emails, and partners.
- **Fields**:
    - **Display Name**: The name shown on the dashboard.
    - **Legal Name**: Used for official invoices.
    - **Company Address**: Physical location.
    - **Contact Details**: Email, Phone, Website.
    - **Logo**: File upload (stored in `public/storage` or S3).
    - **Timezone**: Critical for Booking Calendar operations.
    - **Partner Details**: Specific company details for Partner Invoices (if different).

### 1.2 Units & Localization (Section 1.1.2)
- **Goal**: Define operational standards.
- **Fields**:
    - **Measurement Units**:
        - Depth: Meters vs Feet
        - Pressure: Bar vs PSI
        - Weight: kg vs lbs
        - Temperature: Celsius vs Fahrenheit
    - **Currency**:
        - Default Currency (Fixed once set, e.g., USD, EUR).
        - Sales Tax Name (VAT, GST, HST).
    - **Operation Hours**:
        - Start Time (e.g., 08:00)
        - End Time (e.g., 18:00)
        - *Impact*: Determines the visible range in the Calendar View.

### 1.3 Conversion Rates (Section 1.1.3)
- **Goal**: Handle multi-currency payments.
- **Features**:
    - **Base Currency**: Read-only (from Units).
    - **Exchange Rate Table**:
        - Currency Code (EUR, GBP, AUD, etc.)
        - Rate (relative to Base).
        - Rounding Rules (0 decimals, 2 decimals, etc.).
    - **Interface**: "Add Rate" modal, Table view with inline editing.

### 1.4 Certifications (Section 1.1.4)
- **Goal**: Standardize customer qualification tracking.
- **Features**:
    - **Agencies**: Manage list (PADI, SSI, CMAS, NAUI, etc.).
    - **Levels**: Manage levels per agency (OW, AOW, Rescue, etc.).
    - **Auto-Save**: Option to auto-add new certs entered during customer creation? (Docs hint at "Yes/No" prompt logic). Structure should probably be a pre-defined list that admins can extend.

### 1.5 Tags (Section 1.1.5)
- **Goal**: Customer and Staff segmentation.
- **Features**:
    - **Management**: Create/Delete Tags.
    - **Visuals**: Assign colors to tags (e.g., "VIP" = Gold, "Bad Swimmer" = Red).
    - **Logic**: Prevent deletion if assigned to active entities.

### 1.6 Predefined Discounts (Section 1.1.6)
- **Goal**: Quick-apply discounts for billing.
- **Features**:
    - **Name**: e.g., "Early Bird", "Staff Family".
    - **Value**: Percentage (%) or Fixed Amount.
    - **Applicability**:
        - Entire Bill
        - Specific Item Types (Course, Dive, Equipment)
        - Specific Items.

### 1.7 Payment Methods (Section 1.1.7)
- **Goal**: Configure accepted payment types for Cash Flow.
- **Fields**:
    - **Name**: "Cash USD", "Visa", "PayPal".
    - **Fee**: Percentage added to bill (e.g., +3% for Amex).
    - **Type**: Cash vs Bank/Digital.
    - **Cost Center**: Link to Finance Module (Cash Box, Bank Account) - *Future Integration*.
    - **Visibility**: Toggle for Invoices / Payslips / Portal.

### 1.8 UI Settings (Section 1.1.8)
- **Goal**: Customize the application interface per location.
- **Features**:
    - **Equipment**: Hide irrelevant items (e.g., Hide Drysuits in Maldives).
    - **Roster Columns**: Toggle visibility (Air In/Out, Nitrox %, Weight).
    - **Quick Selections**: Configure "Macro buttons" for frequent add-ons (e.g., "+1 Boat Dive", "+1 Lunch").

### 1.9 Data Protection & Registration Form (Section 1.1.9 & 1.1.10)
- **Goal**: GDPR compliance and Online Guest implementation.
- **Data Protection**:
    - Retention policies (auto-anonymize after X years).
    - Export tools.
- **Registration Form**:
    - **Scope**: Global vs Location-specific URL.
    - **Sections**: Toggle visibility (Personal Data, Medical, Equipment, Address).
    - **Custom Text**: Rich text editor for Liability Release / House Rules.
    - **Consent**: "I Agree" checkbox vs Digital Signature.
    - **Documents**: "Upload Passport" requirement.

## 2. Technical Implementation Architecture

### Database Schema (Modifications)
`dive_centers` table will continue to use the `settings` JSON column, but structured strictly:
```json
{
  "units": { "depth": "m", "pressure": "bar", "currency": "USD" },
  "hours": { "start": "08:00", "end": "18:00" },
  "ui": { "hide_drysuit": true, "roster_columns": ["air_in", "air_out"] },
  "registration": { "global": true, "modules": ["medical", "equipment"] }
}
```
*Separate Tables may be needed for complex relations:*
- `conversion_rates` (One-to-Many with DiveCenter)
- `defined_discounts` (One-to-Many)
- `payment_methods` (One-to-Many)
- `tags` (One-to-Many, Polymorphic relationships to Customers/Staff)

### API Endpoints
- `GET /settings/full`: Aggregated configuration load.
- `PUT /settings/company`: Update Company Info.
- `PUT /settings/preferences`: Update JSON preference block.
- `API Resource /payment-methods`
- `API Resource /discounts`
- `API Resource /conversion-rates`

### Frontend Components (React/Shadcn)
- `SettingsLayout`: Vertical or Horizontal Tabs.
- `Forms`: Heavy use of `react-hook-form` + `zod` schema validation.
- `Dynamic Tables`: For Rates, Discounts, and Payment Methods.

## 3. Phased Rollout
1.  **Phase 1 (Current)**: Company Info, Basic Units, Payment Method List.
2.  **Phase 2**: UI Settings (Roster columns) & Certifications List.
3.  **Phase 3**: Finance Integration (Cost Centers link to Payment Methods).
4.  **Phase 4**: Online Registration Form Configuration (requires public-facing Guest Portal).
