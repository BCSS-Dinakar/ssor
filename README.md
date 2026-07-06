# SSOR — State Sexual Offender Register

> A secure, conviction-based, colour-coded sexual offender register built for the **Government of Telangana, State Police** — enabling verified background checks for institutions and structured monitoring for the police, without ever becoming an open public list.

---

## Overview

SSOR is a controlled-access register designed to protect women and children. It follows the **controlled-disclosure model** (similar to UK, Canada, Australia, Ireland) rather than the fully public model of the United States. Only **convicted persons** are held in the disclosable register — accused persons are never listed.

The system provides **two separate portals**:

- **Citizen & Institution Portal** — For schools, creches, transport operators, care employers, parents, and guardians
- **Police & Administration Portal** — Restricted to authorised officers with recorded clearance (every action is audited)

---

## Features

### Citizen & Institution Services

| Feature | Description |
|---|---|
| **Clearance Certificate** | Apply for a background-verification certificate for employees/volunteers in child- or women-facing roles |
| **Track Application** | Check the status of a clearance request using a reference number |
| **Limited Disclosure** | Request the police to check a specific, identified risk to a particular child |
| **Report an Offence** | Report a sexual offence or unsafe conduct (anonymous reporting supported) |
| **Institution Registration** | Register a school, creche, or academy for a licence-linked clearance account |
| **Awareness & Resources** | Guidance on safe recruitment, POCSO obligations, and support services |

### Police & Administration

| Feature | Description |
|---|---|
| **Dashboard** | Live overview with stat cards, risk-tier donut chart, pending queues, and recent activity |
| **Offender Register** | Searchable, filterable register of all convicted offender records with full detail modals |
| **New Registration** | Register a convicted offender (requires a valid conviction order reference) |
| **Clearance Requests** | Process institutional clearance applications — verify candidates against the register |
| **Disclosure Requests** | Approve or decline limited disclosure requests (requires DSP rank or above) |
| **Access Audit Log** | Immutable, tamper-proof log of every access event |
| **Retention & Review** | Track records approaching their review or expiry date |

---

## 7-Colour Risk Tier Classification

Each convicted offender is assigned a colour tier based on the nature and severity of the offence:

| Tier | Label | Legal Sections | Retention |
|---|---|---|---|
| 🔴 **Red** | Dangerous / Gang rape | BNS 63–66, 70; POCSO 5–6 | Lifetime |
| 🟠 **Orange** | Repeat offender | BNS 71 + base section | 25 years |
| 🔵 **Blue** | Cyber sexual offence | IT Act 67A/67B; BNS 77–78; POCSO 11–14 | 25 years |
| ⚫ **Black** | Trafficking | BNS 143–144, 111; ITPA 3–7 | Lifetime |
| ⚪ **Silver** | Juvenile (internal only) | JJ Act 2015 | Sealed |
| 🩷 **Pink** | Harassment | BNS 74–75, 78–79 | 15 years |
| 🟢 **Green** | Isolated / Low severity | BNS 74–75 | 15 years |

---

## Legal Framework

The register is built on the following statutory framework:

- **Bharatiya Nyaya Sanhita (BNS) 2023** — Primary criminal law for sexual offences
- **POCSO Act 2012** — Protection of Children from Sexual Offences
- **Information Technology Act 2000** — Cyber sexual offences (Sections 67A/67B)
- **Juvenile Justice (JJ) Act 2015** — Juvenile records (sealed, internal only)
- **Immoral Traffic (Prevention) Act (ITPA)** — Trafficking offences
- **Digital Personal Data Protection Act 2023** — Data handling, storage, and privacy compliance
- **K.S. Puttaswamy v. Union of India (2017)** — Right to privacy constitutional benchmark

---

## Safeguards

1. **Conviction-based entry only** — No accused person is listed; only convicted offenders
2. **Proportionality** — Every entry and disclosure satisfies the tests of legality, necessity, and proportionality (Puttaswamy)
3. **Juvenile protection** — No juvenile is placed in any disclosable or public tier
4. **Correction & expungement** — Records can be corrected or expunged on acquittal, wrongful entry, or retention expiry
5. **Audit of access** — Every access is logged and auditable, with disciplinary and penal consequences for misuse
6. **Rehabilitation** — Classification does not operate as a permanent, disproportionate stigma
7. **No public search** — Institutions receive only a verified clear/refer result through the police; offender details are never published

---

## Access Control — Three Levels

| Level | Who | What |
|---|---|---|
| **Full Access** | Authorised police officers with recorded clearance | Complete register access, record management, all admin functions |
| **Clearance Checks** | Schools, creches, sports academies, transport operators, caregivers | Background verification via police — receive only clear/refer decision |
| **Limited Disclosure** | Named parent, guardian, or institution head | Permitted only where a registered offender presents an identified risk to a particular child, under written protocol |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js (Create React App) |
| **Styling** | Tailwind CSS |
| **Fonts** | Archivo (display), Inter (body), IBM Plex Mono (monospace) |
| **Routing** | React Router |

---

## Project Structure

```
ssor/
├── frontend/               # React application
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page-level components
│   │   ├── utils/          # Utility functions and constants
│   │   ├── App.js          # Root component with routing
│   │   ├── index.js        # Entry point
│   │   └── index.css       # Global styles
│   ├── tailwind.config.js
│   └── package.json
├── README.md
└── reference/
    ├── SOR Portal prototype.html          # UI/UX prototype
    └── Sexual_Offender_Register_Concept_Note.docx  # Policy concept note
```

---

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/BCSS-Dinakar/ssor.git
cd ssor

# Install frontend dependencies
cd frontend
npm install

# Start the development server
npm start
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Data Model

### Offender Record
| Field | Description |
|---|---|
| `id` | Unique register ID (e.g. `SOR-2024-0417`) |
| `name` | Full name and known aliases |
| `age` | Age of offender |
| `area` | Area / jurisdiction |
| `policeStation` | Registering police station |
| `tier` | Colour-coded risk tier |
| `offence` | Offence of conviction |
| `courtCase` | Court case reference (e.g. `CC 412/2024`) |
| `convictionDate` | Date of conviction |
| `retentionPeriod` | Duration record is held (per tier) |
| `status` | Active / Due review / Closed |
| `nextReview` | Next scheduled review date |
| `biometrics` | Fingerprints, DNA (where lawfully collected) |

### Clearance Request
| Field | Description |
|---|---|
| `id` | Reference number (e.g. `CLR-2026-00471`) |
| `institution` | Requesting institution name |
| `type` | Institution type (School, Creche, Sports academy, etc.) |
| `role` | Role being filled |
| `candidate` | Candidate name |
| `submittedDate` | Date of submission |
| `status` | Pending / Cleared / Referred |

### Disclosure Request
| Field | Description |
|---|---|
| `id` | Reference number (e.g. `DIS-2026-0033`) |
| `requestedBy` | Requester identity and relationship |
| `concern` | Person of concern and nature of risk |
| `riskType` | Specific (identified) or General |
| `submittedDate` | Date of submission |
| `status` | Pending / Approved / Declined |

---

## Emergency Contacts

| Service | Number |
|---|---|
| Police Emergency | **100 / 112** |
| Women Safety (SHE Teams) | **100** |
| Childline | **1098** |
| Cyber Crime | **1930** |

---

## License

This project is developed for the Government of Telangana, State Police. All rights reserved.

---

> **Disclaimer:** This is a prototype for demonstration purposes. All records shown in test data are fictional. Section numbers and statutory references should be verified against the current official text.
