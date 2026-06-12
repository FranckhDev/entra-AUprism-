# Entra AUPrism

> A business-friendly admin portal scoped to Microsoft Entra Administrative Units.

> [!WARNING]
> **Work in progress — mock UI only.** The current version (Phase 1) runs entirely on local mock data with no connection to Microsoft Entra or Microsoft Graph. It is intended for UI validation and design feedback only. Phase 2 will wire in real Graph API calls and MSAL authentication.

---

## The Problem

The Microsoft Entra Admin Center is designed for global IT administrators. It exposes the full breadth of identity controls — which is exactly what a central IAM team needs, but creates friction for **delegated Business Unit administrators** who only need to manage their own slice of the directory.

Common pain points reported by organizations using Administrative Units (AUs):

- The portal shows resources and settings outside the BU admin's scope
- UI language and workflows are IT-centric, not business-friendly
- No guided experience for day-to-day AU-scoped operations (users, groups, devices, access packages)
- Central IAM teams become bottlenecks for operations that BU admins should handle autonomously

The result: either the central IAM team is overwhelmed, or BU admins are given broader permissions than necessary.

---

## The Solution

**Entra AUPrism** is a lightweight web portal that sits on top of Microsoft Graph API and **surfaces only what is relevant to the signed-in admin's Administrative Unit**.

- Business-friendly language and simplified workflows
- Strict scope enforcement — a BU admin sees and manages only their AU
- No broader Entra permissions required beyond the user's own AU role assignment
- Deployable as an Azure Static Web App, registered as an Entra App

---

## Key Features (Target)

| Feature | Description |
|---|---|
| **Scoped User Management** | List, search, create, and update users within the AU |
| **Group Management** | Manage AU-scoped groups and dynamic membership rules |
| **Device Management** | View and manage devices registered to the AU |
| **Access Package Delegation** | Create and manage ELM access packages for the BU |
| **Access Reviews** | Launch and track AU-scoped access reviews |
| **Audit Dashboard** | Simplified view of sign-in and directory activity logs for the AU |
| **Role Assignment** | Delegate admin roles within the AU boundary |

---

## Architecture

```
┌─────────────────────────────────┐
│         BU Admin (browser)      │
└────────────┬────────────────────┘
             │  MSAL (Entra login)
             ▼
┌─────────────────────────────────┐
│       Entra AUPrism (SPA)       │
│       React / Next.js           │
└────────────┬────────────────────┘
             │  Microsoft Graph API
             │  (scoped to user's AU)
             ▼
┌─────────────────────────────────┐
│     Microsoft Entra ID          │
│     Administrative Units        │
└─────────────────────────────────┘
```

**Stack:**
- **Frontend**: React + Next.js
- **Auth**: MSAL.js (Microsoft Authentication Library)
- **API**: Microsoft Graph (AU-scoped calls)
- **Hosting**: Azure Static Web Apps
- **Built with**: GitHub Copilot

---

## Getting Started

### Prerequisites

- Node.js 18+
- An Azure / Microsoft Entra tenant
- An App Registration in Entra with the following Graph API permissions:
  - `AdministrativeUnit.Read.All`
  - `User.ReadWrite.All` (scoped via AU)
  - `Group.ReadWrite.All` (scoped via AU)
  - `Device.ReadWrite.All` (scoped via AU)
  - `EntitlementManagement.ReadWrite.All`

### Installation

```bash
git clone https://github.com/<your-org>/entra-auprism.git
cd entra-auprism
npm install
```

### Configuration

Create a `.env.local` file at the root:

```env
NEXT_PUBLIC_CLIENT_ID=<your-app-registration-client-id>
NEXT_PUBLIC_TENANT_ID=<your-tenant-id>
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000
```

### Run locally

```bash
npm run dev
```

---

## Roadmap

- [ ] AU-scoped user list and search
- [ ] User creation / update / disable
- [ ] Group management (static + dynamic)
- [ ] Device inventory
- [ ] ELM access package management
- [ ] Access review dashboard
- [ ] Audit log viewer
- [ ] Multi-AU support (for admins with cross-AU scope)
- [ ] Role assignment within AU
- [ ] Azure Static Web App deployment template

---

## Contributing

Contributions are welcome. Please open an issue first to discuss what you would like to change.

This project is built with GitHub Copilot and welcomes AI-assisted contributions.

---

## License

MIT

---

## Related Resources

- [Microsoft Entra Administrative Units documentation](https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/administrative-units)
- [Microsoft Graph API — Administrative Units](https://learn.microsoft.com/en-us/graph/api/resources/administrativeunit)
- [MSAL.js documentation](https://learn.microsoft.com/en-us/entra/identity-platform/msal-overview)

