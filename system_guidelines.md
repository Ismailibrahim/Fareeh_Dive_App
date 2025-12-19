# System Architecture & Development Guidelines

This document outlines the design patterns, architectural decisions, and configuration standards used in the **SAS Scuba** application. Refer to this guide when creating new features to ensure consistency.

---

## 1. Frontend Architecture (Next.js)

### 1.1 Responsive Data Display
We use a **dual-view strategy** for displaying data lists to ensure optimal usability on all devices.

*   **Desktop View (Prominent Table):**
    *   Use the `Table` component from `shadcn/ui`.
    *   Rich columns (Name, Contact, Details, Actions).
    *   Wrap in a container with `hidden md:block` to show **only** on medium screens and up.
    
    ```tsx
    // Example Pattern
    <div className="hidden md:block border rounded-md">
       <Table>...</Table> 
    </div>
    ```

*   **Mobile View (Card Grid):**
    *   Use a CSS Grid layout (`grid-cols-1`).
    *   Each item is rendered as a stylized **Card**.
    *   Wrap in a container with `md:hidden` to show **only** on small screens.
    *   Hide complex headers; display data in detailed key-value pairs.
    
    ```tsx
    // Example Pattern
    <div className="grid grid-cols-1 md:hidden gap-4">
       {items.map(item => <Card key={item.id} ... />)}
    </div>
    ```

### 1.2 Resource Management (CRUD)
We prioritize **Dedicated Pages** over Modals for "Create" and "Edit" actions to support better deep-linking, mobile usability, and complex forms.

*   **Create Page**: `/dashboard/[resource]/create`
*   **Edit Page**: `/dashboard/[resource]/[id]/edit`

**Implementation Pattern:**
1.  **Forms**: Create a reusable form component (e.g., `CustomerForm.tsx`).
    *   Accept optional `initialData` prop.
    *   Accept optional `id` prop.
    *   If `initialData` exists -> **Update Mode** (API `PUT`).
    *   If no `initialData` -> **Create Mode** (API `POST`).

2.  **Delete Action**:
    *   Use `AlertDialog` for confirmation.
    *   Never delete immediately on click.

### 1.3 Component Structure
*   **`src/components/[feature]/`**: Feature-specific components (e.g., `customers/CustomerForm.tsx`).
*   **`src/components/ui/`**: Reusable primitives (buttons, inputs, cards).
*   **`src/lib/api/services/`**: API service layer.

---

## 2. Backend Architecture (Laravel API)

### 2.1 API Configuration & CORS
The backend acts as a standalone API service authenticated via **Laravel Sanctum (Cookie-based)**.

**Key Configurations (`config/cors.php`):**
*   `'supports_credentials' => true`: **Critical**. Allows cookies to be shared between frontend (port 3000) and backend (port 8000).
*   `'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:3000')]`: Explicitly allow the frontend origin.

**Environment Setup (`.env`):**
*   `SANCTUM_STATEFUL_DOMAINS=localhost:3000`: Tells Sanctum to verify stateful requests from this domain.
*   `SESSION_DOMAIN=localhost`: Ensures cookies are set on the root domain (or localhost during dev).

### 2.2 Standard Controller Pattern
Controllers should follow standard RESTful resource methods:
*   `index()`: Return paginated list.
*   `store(Request $request)`: Validate & Create.
*   `show($id)`: Return single resource.
*   `update(Request $request, $id)`: Validate & Update.
*   `destroy($id)`: Delete.

---

## 3. Workflow Checklist for New Features

When adding a new feature (e.g., "Boats"):
1.  [ ] **Backend**: Create Migration, Model, Controller, and API Route.
2.  [ ] **Frontend Service**: Add `boat.service.ts` in `src/lib/api`.
3.  [ ] **Frontend Pages**:
    *   `.../boats/page.tsx` (List with Responsive Table/Card view).
    *   `.../boats/create/page.tsx`.
    *   `.../boats/[id]/edit/page.tsx`.
4.  [ ] **Component**: Create `BoatForm.tsx` (reusable).
5.  [ ] **Navigation**: Add to Sidebar in `DashboardLayout`.
