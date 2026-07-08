# SSOR Frontend

This is the React frontend application for the **State Sexual Offender Register (SSOR)** system, built for the Government of Telangana, State Police.

For the full project overview, architecture, and legal framework, please see the [Main Project README](../README.md) in the root directory.

---

## 🎨 Frontend Architecture

The application uses a modern React functional component architecture, heavily utilizing Hooks and Context API for state management.

### Key Technologies
- **Framework**: React.js 18
- **Routing**: React Router DOM (v6)
- **Styling**: Tailwind CSS (Utility-first CSS framework)
- **Icons**: Lucide React
- **Typography**: Google Fonts (Inter, Archivo, IBM Plex Mono)

### Directory Structure

```text
src/
├── components/          # Reusable UI components
│   ├── portal/          # Shared dashboard components (Badges, Stats, Modals)
│   └── Marketing.js     # Landing page UI blocks
├── context/
│   └── DataContext.js   # Global State Management (Clearances, Offenders, Auth)
├── layout/
│   ├── MarketingLayout.js # Wrapper for public-facing pages
│   └── PortalLayout.js    # Wrapper for secure authenticated dashboards
├── pages/               # Route-level Page Components
│   ├── portal/
│   │   ├── organization/ # Organization-facing views
│   │   └── police/       # Police/Admin-facing views
│   └── ...              # Public pages (Landing, Login, Services)
└── utils/
    └── data/
        ├── portalData.js # Static Seed Data & Status Enums
        └── authData.js   # Authentication & Role Definitions
```

---

## 🚀 Running the App Locally

In the project directory, you can run:

### `npm install`
Installs all required dependencies.

### `npm start`
Runs the app in the development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes. You may also see any lint errors in the console.

### `npm run build`
Builds the app for production to the `build` folder.
It correctly bundles React in production mode and optimizes the build for the best performance.

---

## 🛡️ State Management (DataContext)

Because this is a prototype/demo application, it currently runs entirely client-side without a real backend database.
All data mutation, vetting workflows, and authorization flows are managed globally by the **`DataContext`**:

- **Offender Records (`register`)**: Seeded array of known convicted offenders.
- **Vetting Requests (`clearances`)**: State array tracking applications through `pending`, `verifying`, `cleared`, and `rejected` states.
- **Workflow Actions**: `startVerifying()`, `decideClearance()`, `addOffender()` simulate backend business logic.

---

## 💅 Styling Philosophy

- **Tailwind CSS**: Custom classes (`btn-primary`, `card`) are abstracted in `index.css` using `@apply` for reusability.
- **Color Coding**: Statuses and Risk Tiers heavily utilize standardized Tailwind color palettes (e.g., Emerald for Clean, Red for Dangerous, Amber for Verifying) for immediate visual recognition.
