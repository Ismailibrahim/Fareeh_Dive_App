# Implementation Plan - SAS Scuba

## Goal Description
Implement the "Settings" module for SAS Scuba, mirroring the "General Settings" functionality described in the Geek Divers documentation (#1-settings). This includes Company Info, Units, and UI customizations.

## User Review Required
> [!IMPORTANT]
> The Finance/Cost Center module is a prerequisite for "Payment Methods" in the reference docs. I will implement a simplified version of Payment Methods first (just the list) and add Cost Centers later when we tackle the Finance module.

## Proposed Changes

### Settings Module
- `src/app/dashboard/settings/page.tsx`: Main settings dashboard/layout.
- **Tabs/Sections**:
    1.  **General**: Company Name, Logo, Timezone, Legal Info.
    2.  **Units & Localization**: Currency (USD/EUR), Measurement Units (Metric/Imperial), Time format (12h/24h).
    3.  **Payment Methods**: List of accepted payments (Cash, Card, Transfer) - *Initial implementation*.
    4.  **UI Preferences**: Toggle optional modules (e.g., Accommodation, Tech Diving columns).

### Components
- `src/components/settings/SettingsSidebar.tsx`: Local navigation for settings subsections.
- `src/components/settings/CompanyForm.tsx`: Form for `dive_centers` table updates.
- `src/components/settings/PreferencesForm.tsx`: JSON-based settings for `dive_centers.settings` column.

### Backend
- Ensure `DiveCenterController` supports updating the `settings` JSON column.
- Update `DiveCenter` model casts: `'settings' => 'array'`.

## Verification Plan
### Automated Tests
- Test that `settings` JSON is correctly saved and retrieved via API.
- Verify UI renders current settings state.

### Manual Verification
- Navigate to `/dashboard/settings`.
- Update Company Name -> Verify persistence.
- Change Currency Unit -> Verify persistence.
