# SSOR Frontend

This is the client-side Single Page Application (SPA) for the State Sexual Offender Register (SSOR) portals.

---

## 🛠️ Tech Stack

- **React 18**: The core UI library used to build the interactive interfaces.
- **Tailwind CSS**: A utility-first CSS framework for rapid, highly-customized, and responsive styling.
- **React Router Dom (v6)**: Client-side routing to seamlessly transition between pages without reloading.
- **Context API (`AuthContext`)**: Global state management for tracking the current authenticated user session.
- **Axios**: The HTTP client used to interface with the backend API.
- **Lucide React**: A beautiful, consistent icon library used throughout the UI.

---

## 🔄 Project Flow & Architecture

### 1. Global Authentication State (`AuthContext.js`)
- The entire app is wrapped in an `AuthProvider`. On initial load, it immediately calls `GET /api/auth/me` to check if the user has an active session (via their HTTP-only cookie).
- The `AuthContext` provides global functions like `login`, `logout`, and exposes the current `auth` object (containing the user's role and profile data) to any component that needs it.

### 2. Client-Side Routing & Protection (`App.js`)
- Routes are protected by custom wrapper components like `<ProtectedRoute>`. 
- If an unauthenticated user attempts to access `/portal`, they are instantly redirected to `/login`.
- The UI dynamically branches based on the user's role. A police officer navigating to the portal will see the `OrganizationApprovals` dashboard, while an organization will see their own specific dashboard.

### 3. API Communication (`api.js`)
- An Axios instance is configured globally with `withCredentials: true`. This ensures that every API request automatically includes the secure HTTP-only JWT cookie.
- It also uses interceptors to catch `401 Unauthorized` responses globally, allowing the frontend to automatically log the user out if their session expires.

### 4. Complex Form Handling (`LoginPage.js`)
- The Registration process is handled entirely within `LoginPage.js` using a sophisticated multi-step state machine (`regStep`).
- It collects extensive organizational data (using custom components like `SearchableSelect` for precise location tracking) and processes multipart `FormData` for document uploads before submitting to the backend.

### 5. Secure Document Viewing
- Instead of relying on direct file URLs (which would be insecure), components like `Profile.js` fetch document Blobs via authenticated API calls.
- These Blobs are converted into temporary Object URLs (`URL.createObjectURL`), allowing sensitive PDFs and Images to be rendered securely inside modals without exposing permanent public links.

---

## 🚀 Getting Started

Please refer to the `setup.md` file in the root directory for instructions on how to start the frontend development server.
