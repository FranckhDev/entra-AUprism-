# Entra AUPrism — Product Specification

> Version: 0.1 — Draft  
> Status: In progress  
> Built with: GitHub Copilot  

---

## Table of Contents

1. [Overview & Problem Statement](#1-overview--problem-statement)
2. [Design Principles](#2-design-principles)
3. [User Personas](#3-user-personas)
4. [Glossary — Business Language Mapping](#4-glossary--business-language-mapping)
5. [Architecture](#5-architecture)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Graph API Wrapper — Next.js API Routes](#7-graph-api-wrapper--nextjs-api-routes)
8. [Feature Specifications — V1 Scope](#8-feature-specifications--v1-scope)
   - 8.1 [Shell & Navigation](#81-shell--navigation)
   - 8.2 [AU Switcher](#82-au-switcher)
   - 8.3 [Team Member Management (Users)](#83-team-member-management-users)
   - 8.4 [Group Management (Static Groups)](#84-group-management-static-groups)
   - 8.5 [Device Management](#85-device-management)
9. [UI/UX Conventions](#9-uiux-conventions)
10. [Security Considerations](#10-security-considerations)
11. [Deployment](#11-deployment)
12. [Testing Strategy](#12-testing-strategy)
13. [Future Considerations (Post V1)](#13-future-considerations-post-v1)

---

## 1. Overview & Problem Statement

### What is Entra AUPrism?

**Entra AUPrism** is a web portal that gives delegated Business Unit (BU) administrators a simple, safe, and business-friendly way to manage their team's identities in Microsoft Entra ID — without needing access to the full Microsoft Entra Admin Center.

### The Core Problem

Microsoft Entra ID uses **Administrative Units (AUs)** to let organizations scope admin permissions to a subset of users, groups, and devices. A central IT team can grant a BU admin the right to manage only their department's slice of the directory.

However, the official Microsoft Entra Admin Center is built for global IT administrators:

- It exposes the full tenant, not just the BU admin's AU
- UI language is IT-centric ("Create a user object", "Assign a license SKU")
- Workflows are complex and require understanding of Entra concepts
- BU admins can accidentally navigate to tenant-wide settings
- There is no guided workflow for common day-to-day HR operations

**The result:** Central IAM teams become bottlenecks for routine operations, or BU admins are granted broader permissions than necessary — creating a security risk.

### The Solution

Entra AUPrism is a **thin, scoped portal** that:
- Shows only the resources inside the signed-in admin's Administrative Unit
- Uses **plain business language** (no IT jargon)
- Exposes only the operations that are safe and relevant for a BU admin
- Enforces scope strictly — the Graph API wrapper prevents any call outside the AU
- Is deployable as an Azure Static Web App with a single App Registration

---

## 2. Design Principles

These principles apply to every decision in this product — UI, API, and architecture.

| # | Principle | What it means in practice |
|---|---|---|
| 1 | **Business language first** | Never use Entra/Azure/IT jargon in the UI. "Team member" not "user object". "Team" not "group". "Computer" not "device". |
| 2 | **Scope is sacred** | The API wrapper must enforce AU scope on every single Graph API call. It is never acceptable to return or mutate resources outside the AU. |
| 3 | **One task at a time** | Every workflow is a guided, step-by-step flow. No raw forms with 20 fields at once. |
| 4 | **Confirmation before destruction** | Any action that disables, removes, or deletes must show a clear confirmation dialog with plain-language consequences. |
| 5 | **Fail safe** | If the AU context cannot be established at login, the user sees an error page — they are never shown an empty or unconstrained view. |
| 6 | **Minimal permissions** | The app requests only the Graph API permissions it actually uses. No over-permissioning. |
| 7 | **Rebuild-friendly** | This spec is the single source of truth. Any agent or developer must be able to rebuild the entire product from this document alone. |
| 8 | **i18n-ready from day one** | V1 ships in English only, but every UI string must go through the translation system from the very first commit. No hardcoded strings in JSX. This makes adding a second language a translation task, not a code refactor. |

---

## 3. User Personas

### Primary Persona: The BU Admin (Alex)

- **Job title:** HR Business Partner, Office Manager, or Regional IT Coordinator
- **Technical level:** Zero IT background. Comfortable with Microsoft 365 (Outlook, Teams, SharePoint) but has never used the Azure portal or Entra Admin Center.
- **Goal:** Add a new hire to the directory, disable a leaver's account, manage their team's shared mailbox groups, see which computers are enrolled in their department.
- **Fear:** Breaking something outside their department. Getting an error they don't understand. Accidentally modifying a global setting.
- **Mental model:** "I manage my team. I should see my team. I should not see anyone else."

### Secondary Persona: The Central IAM Admin (Jordan)

- **Job title:** Identity & Access Management Engineer
- **Technical level:** Expert. Manages Entra tenant globally.
- **Role in AUPrism:** Does NOT use AUPrism directly. Sets up the AUs, assigns BU admins to AU-scoped roles, registers the AUPrism app, and deploys the portal.
- **Goal:** Reduce IAM help desk tickets. Safely delegate operations to BU admins.

### Out of Scope Personas

- End users (employees who are members of an AU) — they do not use this portal.
- Global admins who want a full tenant view — they use the Entra Admin Center.

---

## 4. Glossary — Business Language Mapping

This table defines every term used in the UI and maps it to the underlying Entra/Graph concept. **The UI must always use the Business Term column.**

| Business Term (UI) | Entra / IT Term | Graph Resource |
|---|---|---|
| Team Member | User | `user` |
| Team | Group | `group` |
| Computer / Device | Device | `device` |
| My Department | Administrative Unit (AU) | `administrativeUnit` |
| Add a team member | Create user | `POST /users` |
| Remove from department | Remove member from AU | `DELETE /administrativeUnits/{id}/members/{id}/$ref` |
| Disable account | Block sign-in | `PATCH /users/{id}` → `accountEnabled: false` |
| Enable account | Unblock sign-in | `PATCH /users/{id}` → `accountEnabled: true` |
| Reset password | Reset password | `POST /users/{id}/authentication/methods/password/resetPassword` |
| Job title | Job title | `jobTitle` |
| Manager | Manager | `manager` |
| Sign-in blocked | accountEnabled: false | `accountEnabled` |
| Shared group | M365 / Security Group | `group` (type varies) |
| Department label | AU display name | `administrativeUnit.displayName` |

---

## 5. Architecture

### 5.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (BU Admin)                       │
│                                                                 │
│   React/Next.js SPA — business-friendly UI                      │
│   MSAL.js — Entra sign-in, token acquisition                    │
└───────────────────────┬─────────────────────────────────────────┘
                        │  HTTPS — Bearer token (from MSAL)
                        │  Calls only: /api/*
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│             Next.js API Routes  (Graph API Wrapper)             │
│                                                                 │
│  • Validates the incoming Bearer token (JWT)                    │
│  • Resolves the caller's AU assignment from Entra               │
│  • Rewrites every Graph call to be AU-scoped                    │
│  • Returns only AU-scoped data to the frontend                  │
│  • Translates Graph errors to business-friendly messages        │
└───────────────────────┬─────────────────────────────────────────┘
                        │  HTTPS — app-level or delegated token
                        │  to Microsoft Graph API
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Microsoft Graph API                          │
│                                                                 │
│   /administrativeUnits                                          │
│   /administrativeUnits/{id}/members                             │
│   /users, /groups, /devices                                     │
└─────────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│               Microsoft Entra ID Tenant                         │
│                                                                 │
│   Administrative Units with scoped role assignments             │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Routing Strategy — App Router + Route Handlers

**Decision:** Use Next.js 14 **App Router exclusively** — both for pages and for API routes.

- Pages live under `app/(portal)/...` as React Server Components or Client Components.
- API routes use **Route Handlers** (`app/api/.../route.ts`) — NOT `pages/api/`. Do not mix the two routers.
- Middleware lives in `middleware.ts` at the project root (not `pages/api/_middleware.ts`).

> **Why not Pages Router for API?** Mixing App Router pages with `pages/api` routes is technically supported but creates confusion about which router is active, breaks consistent error handling, and will be deprecated. Keep everything in App Router.

### 5.3 MSAL.js + App Router — Critical Constraints

MSAL.js requires the browser's JavaScript environment. Next.js App Router renders components on the server by default. This creates a hard constraint:

**Rules that MUST be followed:**

1. **`MsalProvider` must live in a Client Component.** Create `app/providers.tsx` with `'use client'` at the top. The root `app/layout.tsx` (a Server Component) imports and renders `<Providers>` which wraps `<MsalProvider>`.

2. **Any component using MSAL hooks** (`useMsal`, `useAccount`, `useIsAuthenticated`) **must have `'use client'` at the top.**

3. **Auth redirect handling:** Use `@azure/msal-react`'s `<AuthenticatedTemplate>` / `<UnauthenticatedTemplate>` components inside the portal layout client component to guard routes — not Next.js middleware (which runs server-side and cannot access MSAL state).

4. **Token acquisition for API calls:** Use `instance.acquireTokenSilent()` inside client components before calling `/api/*`. The Bearer token is attached manually to `fetch` headers — MSAL does not automatically inject it.

5. **Theme flash prevention:** The theme preference is read from `localStorage` in a `useEffect` (client-only). To avoid a flash of the wrong theme on load, inject a blocking inline `<script>` in `app/layout.tsx` that reads `localStorage` and sets a `data-theme` attribute on `<html>` before React hydrates.

### 5.4 Project Structure

```
entra-auprism/
├── app/
│   ├── layout.tsx               # Root Server Component layout — renders <Providers>
│   ├── providers.tsx            # 'use client' — MsalProvider + FluentProvider wrapper
│   ├── page.tsx                 # Root redirect → /dashboard (or /login if unauthenticated)
│   ├── (auth)/
│   │   └── login/page.tsx       # 'use client' — Login page with MSAL redirect trigger
│   ├── (portal)/
│   │   ├── layout.tsx           # 'use client' — Portal shell: AuthenticatedTemplate guard,
│   │   │                        #   AppShell, Sidebar, AUSwitcher, AUContext provider
│   │   ├── dashboard/page.tsx   # 'use client' — Home dashboard (summary stats)
│   │   ├── members/
│   │   │   ├── page.tsx         # 'use client' — Member list
│   │   │   ├── [id]/page.tsx    # 'use client' — Member detail
│   │   │   └── new/page.tsx     # 'use client' — Add new member wizard
│   │   ├── teams/
│   │   │   ├── page.tsx         # 'use client' — Group list
│   │   │   └── [id]/page.tsx    # 'use client' — Group detail / membership
│   │   └── devices/
│   │       ├── page.tsx         # 'use client' — Device list
│   │       └── [id]/page.tsx    # 'use client' — Device detail
│   └── error/page.tsx           # Error boundary (no AU, access denied, etc.)
│
├── app/api/                     # Route Handlers (Graph API wrapper)
│   ├── health/route.ts          # GET — liveness check (no auth required)
│   ├── me/
│   │   ├── au/route.ts          # GET — resolve caller's AU(s)
│   │   └── domains/route.ts     # GET — resolve tenant's verified domains (for UPN picker)
│   ├── members/
│   │   ├── route.ts             # GET (list), POST (create)
│   │   └── [id]/route.ts        # GET, PATCH, DELETE (remove from AU)
│   ├── groups/
│   │   ├── route.ts             # GET (list)
│   │   └── [id]/
│   │       ├── route.ts         # GET
│   │       └── members/route.ts # GET, POST, DELETE
│   └── devices/
│       ├── route.ts             # GET (list)
│       └── [id]/route.ts        # GET, PATCH (enable/disable)
│
├── middleware.ts                # Root middleware: token validation on all /api/* routes
│
├── lib/
│   ├── graph/
│   │   ├── client.ts            # Authenticated Graph client factory (uses `jose`-validated token)
│   │   ├── au.ts                # AU resolution helpers
│   │   ├── users.ts             # User Graph operations
│   │   ├── groups.ts            # Group Graph operations
│   │   └── devices.ts           # Device Graph operations
│   ├── auth/
│   │   ├── msal-config.ts       # MSAL browser config (clientId, tenantId, scopes)
│   │   └── token-validator.ts   # Server-side JWT validation using `jose`
│   └── utils/
│       ├── error-mapper.ts      # Graph errors → business-friendly messages
│       └── scope-guard.ts       # Verifies auId is caller's AU + resource is in AU
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx         # 'use client' — Main layout wrapper
│   │   ├── Sidebar.tsx          # 'use client' — Navigation sidebar + theme switcher
│   │   └── AUSwitcher.tsx       # 'use client' — AU context selector
│   ├── members/
│   │   ├── MemberList.tsx       # 'use client'
│   │   ├── MemberCard.tsx       # 'use client'
│   │   └── MemberForm.tsx       # 'use client'
│   ├── teams/
│   │   ├── TeamList.tsx         # 'use client'
│   │   └── TeamMemberList.tsx   # 'use client'
│   ├── devices/
│   │   └── DeviceList.tsx       # 'use client'
│   └── shared/
│       ├── ConfirmDialog.tsx     # 'use client' — Reusable confirmation modal
│       ├── StatusBadge.tsx       # Server-compatible — pure display
│       └── EmptyState.tsx        # Server-compatible — pure display
│
├── hooks/
│   ├── useAUContext.ts           # Swap point: mock or real based on USE_MOCK flag
│   ├── useGraphFetch.ts          # Wrapper around fetch that injects Bearer token from MSAL
│   ├── useMembers.ts             # Swap point → useMembers.mock or useMembers.real
│   ├── useMembers.real.ts        # Phase 2: SWR + real /api/members calls
│   ├── useTeams.ts               # Swap point → useTeams.mock or useTeams.real
│   ├── useTeams.real.ts          # Phase 2: SWR + real /api/groups calls
│   ├── useDevices.ts             # Swap point → useDevices.mock or useDevices.real
│   └── useDevices.real.ts        # Phase 2: SWR + real /api/devices calls
│
├── mocks/                        # Phase 1 only — mock data and hook implementations
│   ├── data/
│   │   ├── au.json               # Fake AU context (id, displayName, memberCount)
│   │   ├── members.json          # 15-20 realistic fake members (mix of active/blocked)
│   │   ├── groups.json           # 3-5 fake groups (Security + M365, one with outside members)
│   │   └── devices.json          # 8-10 fake devices (Windows + macOS, one disabled)
│   ├── handlers/
│   │   ├── useAUContext.mock.ts  # Returns fake AU from au.json
│   │   ├── useMembers.mock.ts    # Returns members from members.json, simulates mutations
│   │   ├── useTeams.mock.ts      # Returns groups from groups.json
│   │   └── useDevices.mock.ts    # Returns devices from devices.json
│   └── MockAuthProvider.tsx      # 'use client' — replaces MsalProvider with fake MOCK_USER
│
├── types/
│   ├── member.ts                 # Frontend-friendly Member type
│   ├── team.ts                   # Frontend-friendly Team type
│   └── device.ts                 # Frontend-friendly Device type
│
├── messages/                     # next-intl translation files (see §9.7)
│   ├── en.json                   # English — V1 only locale, source of truth for all keys
│   └── fr.json                   # French — placeholder, V2+ (do not populate in V1)
│
├── i18n.ts                       # next-intl configuration (supported locales, default locale)
├── staticwebapp.config.json      # Azure SWA routing rules (fallback to index for SPA)
├── .env.local                    # Local env (gitignored)
├── .env.example                  # Template — see §11.2
├── next.config.js
├── tsconfig.json
└── package.json
```

### 5.3 Data Flow for a Typical Request

Example: BU admin clicks "Disable Account" for a team member.

```
1. User clicks "Block this member" in the UI
2. ConfirmDialog renders: "Are you sure you want to block Alex Smith?
   They will not be able to sign in until you re-enable them."
3. User confirms.
4. Frontend calls: PATCH /api/members/{userId}  { accountEnabled: false }
   with Authorization: Bearer <MSAL access token>
5. API route middleware validates the JWT:
   - Signature valid
   - Not expired
   - Audience matches the app's client ID
6. scope-guard resolves the caller's AU from the token claims + Graph
7. scope-guard verifies that {userId} is a member of the caller's AU
   - If not → 403 Forbidden, never touches Graph
8. Graph client calls: PATCH /users/{userId}  { accountEnabled: false }
9. Success → 200 returned to frontend
10. UI shows toast: "Alex Smith has been blocked and can no longer sign in."
```

---

## 6. Authentication & Authorization

### 6.1 App Registration Requirements

The following must be configured in the Entra App Registration by the central IAM admin (Jordan):

**Authentication:**
- Platform: Single-page application (SPA)
- Redirect URIs: `https://<your-domain>/` and `http://localhost:3000/` (for dev)
- Enable implicit grant: ID tokens (checked), Access tokens (checked)

**API Permissions (Delegated — signed-in user acts on their behalf):**

| Permission | Reason |
|---|---|
| `openid`, `profile`, `email` | Basic identity claims for the signed-in admin |
| `AdministrativeUnit.Read.All` | Resolve which AU(s) the signed-in user administers |
| `User.ReadWrite.All` | List, create, update, and disable users within the AU |
| `Group.ReadWrite.All` | List, create, update, and manage group membership within the AU |
| `Device.ReadWrite.All` | View and enable/disable devices within the AU |

> **Important:** Delegated permissions are used so that the signed-in user's own AU-scoped role assignment in Entra limits what Graph actually returns. The wrapper adds a second layer of enforcement, but the delegated model is the primary security boundary.

### 6.2 Token Flow

```
Browser                         Entra ID                   API Route
  │                                │                            │
  │── redirect to /authorize ─────►│                            │
  │◄── id_token + auth_code ───────│                            │
  │── acquire access_token ────────►│                            │
  │◄── access_token ───────────────│                            │
  │                                                            │
  │── PATCH /api/members/{id}  Bearer <access_token> ─────────►│
  │                                                 validate JWT│
  │                                                 resolve AU  │
  │                                                 scope check │
  │                                                 → Graph     │
  │◄── 200 OK ─────────────────────────────────────────────────│
```

### 6.3 AU Context Resolution

On every API call, the wrapper must:

1. Extract the `oid` (user object ID) from the validated JWT.
2. Call `GET /me/memberOf/$/microsoft.graph.administrativeUnit` to fetch the AUs the signed-in user is a member of, OR call `GET /roleAssignments?$filter=principalId eq '{oid}'` to find the AU-scoped roles the user has been assigned.
3. Cache this result in-memory per request (or short TTL cache) to avoid redundant Graph calls.
4. If the user has zero AU assignments → return a specific error code `NO_AU_SCOPE` to the frontend.
5. If the user has multiple AU assignments → return all of them to the frontend for the AU Switcher to display.

### 6.4 Scope Guard — Per-Resource Enforcement

The scope guard has **two layers** that must both pass before any operation proceeds:

**Layer 1 — AU ownership check (every request):**
Before processing any request that includes `auId`, the wrapper must verify that the `auId` in the query parameter is one of the AUs returned by the caller's AU resolution (§6.3). This prevents a caller from passing an arbitrary AU ID they don't administer.

```
resolvedAUs = AU resolution result for this caller (from JWT oid)
if auId NOT IN resolvedAUs → 403 Forbidden immediately
```

**Layer 2 — Resource membership check (mutations only):**
Before any write operation (PATCH, DELETE, POST member to group), verify the target resource is actually a member of the validated AU:

- **Users:** `GET /administrativeUnits/{auId}/members/{userId}` — returns 404 if not in AU.
- **Groups:** `GET /administrativeUnits/{auId}/members/{groupId}` — same.
- **Devices:** `GET /administrativeUnits/{auId}/members/{deviceId}` — same.

If either layer fails → **return 403, do not call Graph for the mutation.**

---

## 7. Graph API Wrapper — Next.js Route Handlers

### 7.1 Middleware (`middleware.ts` — project root)

Applied to all `/api/*` routes except `/api/health`. Uses Next.js middleware (Edge Runtime compatible).

**JWT validation library: `jose`** — chosen because it is Edge Runtime compatible (no Node.js-only crypto APIs), well-maintained, and works correctly in both Next.js middleware and Route Handlers.

Responsibilities:
1. Extract `Authorization: Bearer <token>` header.
2. Validate JWT using `jose`:
   - Fetch JWKS from `https://login.microsoftonline.com/{tenantId}/discovery/v2.0/keys` (cached by `jose`)
   - Verify signature, expiry, audience (`clientId`), and issuer (`https://login.microsoftonline.com/{tenantId}/v2.0`)
3. Attach decoded token claims to the request (via a custom header or request context).
4. If validation fails → 401 Unauthorized.

### 7.2 API Route Catalogue

#### `GET /api/health`
Liveness check. No authentication required. Returns `{ "status": "ok" }`. Used by Azure SWA and monitoring tools.

---

#### `GET /api/me/au`
Resolves the AU(s) the signed-in user administers.

**Response:**
```json
{
  "administrativeUnits": [
    { "id": "uuid", "displayName": "Sales EMEA", "memberCount": 47 }
  ]
}
```

**Error:** `{ "code": "NO_AU_SCOPE", "message": "..." }` → triggers error page in UI.

---

#### `GET /api/members?auId={id}&search={q}&skip={n}&top={n}`
List team members in the active AU.

**Graph call:** `GET /administrativeUnits/{auId}/members/microsoft.graph.user?$select=id,displayName,jobTitle,accountEnabled,mail,department&$search="displayName:{q}"&$top={n}&$skiptoken={token}`

> **Required header:** When `search` is provided, include `ConsistencyLevel: eventual` in the Graph request. Without this header, Graph returns HTTP 400 for `$search` queries. Also add `$count=true` to get accurate result counts alongside search results.

**Response (transformed):**
```json
{
  "members": [
    {
      "id": "uuid",
      "displayName": "Alex Smith",
      "jobTitle": "Account Executive",
      "email": "asmith@contoso.com",
      "department": "Sales",
      "isActive": true
    }
  ],
  "nextLink": "..."
}
```

---

#### `GET /api/members/{id}?auId={id}`
Get a single team member's details.

**Scope check:** Verify user is a member of the AU before returning.

**Graph call:** `GET /users/{id}?$select=id,displayName,jobTitle,mail,department,accountEnabled,manager,city,country,officeLocation,userPrincipalName`

**Response:** Full member object (business fields only — no raw Graph properties exposed).

---

#### `GET /api/me/domains`
Resolves the tenant's verified domains, used by the UPN picker in the Add Member wizard.

**Graph call:** `GET /domains?$select=id,isVerified,isDefault&$filter=isVerified eq true`

**Response:**
```json
{
  "domains": [
    { "id": "contoso.com", "isDefault": true },
    { "id": "contoso.onmicrosoft.com", "isDefault": false }
  ]
}
```

> This endpoint is called once on app load and the result is cached in React context. The Add Member wizard uses it to populate the domain dropdown next to the email prefix field.

---

#### `POST /api/members?auId={id}`
Add a new team member to the directory AND to the AU.

**Body:**
```json
{
  "firstName": "Jordan",
  "lastName": "Lee",
  "jobTitle": "Sales Analyst",
  "emailPrefix": "jlee",
  "domain": "contoso.com",
  "department": "Sales"
}
```

**Password generation:** The server generates a cryptographically random temporary password (min 12 chars, upper + lower + digit + special). This is **never** generated client-side. The Graph call includes `forceChangePasswordNextSignIn: true` so the user must set their own password on first login.

**Graph calls (in order):**
1. `POST /users` with `userPrincipalName: "{emailPrefix}@{domain}"`, `displayName: "{firstName} {lastName}"`, `mailNickname: "{emailPrefix}"`, `passwordProfile: { password: "<generated>", forceChangePasswordNextSignIn: true }`, `accountEnabled: true`.
2. `POST /administrativeUnits/{auId}/members/$ref` — add user to AU.

**On failure of step 2:** attempt to delete the user created in step 1 (compensating transaction).

**Response on success:** Returns the generated temporary password (shown once in the UI — never logged).

---

#### `PATCH /api/members/{id}?auId={id}`
Update a team member's details or change their account status.

**Scope check:** mandatory before any mutation (both layers — §6.4).

**Allowed patch fields:**
```json
{
  "displayName": "...",
  "jobTitle": "...",
  "department": "...",
  "city": "...",
  "officeLocation": "...",
  "accountEnabled": true | false
}
```

**Graph call:** `PATCH /users/{id}` with only the fields present in the request body (never pass fields not included).

---

#### `DELETE /api/members/{id}?auId={id}`
**Removes the user from the AU only — does NOT delete the user account from the tenant.**

This is a deliberate V1 constraint. Permanent account deletion is a destructive, tenant-wide operation that must remain with the central IAM team. BU admins can only "remove from department" (AU) or "block sign-in" (PATCH accountEnabled).

**Scope check:** mandatory (both layers).

**Graph call:** `DELETE /administrativeUnits/{auId}/members/{userId}/$ref`

---

#### `GET /api/groups?auId={id}`
List all groups (teams) in the AU.

**Graph call:** `GET /administrativeUnits/{auId}/members/microsoft.graph.group?$select=id,displayName,description,groupTypes,membershipRule,mailEnabled`

---

#### `GET /api/groups/{id}/members?auId={id}`
List members of a specific group (does NOT require members to be AU members — see Microsoft constraint note).

**Graph call:** `GET /groups/{id}/members?$select=id,displayName,mail,jobTitle`

> **Note:** Group members returned here may not all be members of the AU. The UI must display this information clearly (e.g., "Some members may be from outside your department").

---

#### `POST /api/groups/{id}/members?auId={id}`
Add a user to a group (team).

**Scope check:** Verify group is in AU. The user being added does NOT need to be in the AU (this is by Microsoft design).

**Graph call:** `POST /groups/{id}/members/$ref`

---

#### `DELETE /api/groups/{id}/members/{userId}?auId={id}`
Remove a user from a group.

**Scope check:** Verify group is in AU.

**Graph call:** `DELETE /groups/{id}/members/{userId}/$ref`

---

#### `GET /api/devices?auId={id}&search={q}`
List devices in the AU.

**Graph call:** `GET /administrativeUnits/{auId}/members/microsoft.graph.device?$select=id,displayName,operatingSystem,operatingSystemVersion,accountEnabled,approximateLastSignInDateTime,deviceId`

**Response (transformed):**
```json
{
  "devices": [
    {
      "id": "uuid",
      "name": "LAPTOP-ALEXS",
      "operatingSystem": "Windows",
      "osVersion": "11",
      "isEnabled": true,
      "lastSeen": "2026-06-01T14:22:00Z"
    }
  ]
}
```

---

#### `PATCH /api/devices/{id}?auId={id}`
Enable or disable a device.

**Scope check:** mandatory.

**Allowed fields:** `{ "isEnabled": true | false }` → mapped to `{ "accountEnabled": true | false }`.

**Graph call:** `PATCH /devices/{id}`

---

### 7.3 Error Mapper

All Graph errors must be translated before reaching the frontend. Never expose raw Graph error codes or messages in the UI.

| Graph Error | HTTP Status | Business Message |
|---|---|---|
| `Authorization_RequestDenied` | 403 | "You don't have permission to perform this action. Contact your IT administrator." |
| `Request_ResourceNotFound` | 404 | "This record could not be found. It may have been removed." |
| `Request_BadRequest` | 400 | "Some of the information provided is invalid. Please check and try again." |
| `ObjectConflict` | 409 | "A team member with this email address already exists." |
| `TooManyRequests` | 429 | "Too many requests. Please wait a moment and try again." |
| Any 5xx | 502 | "Microsoft services are temporarily unavailable. Please try again in a few minutes." |

---

## 8. Feature Specifications — V1 Scope

### 8.1 Shell & Navigation

#### Layout
The portal uses a two-column layout:
- **Left sidebar** (240px): Navigation + AU Switcher + theme selector
- **Main content area**: Page content

#### Navigation Items
| Label (UI) | Route | Icon concept |
|---|---|---|
| Home | `/dashboard` | House |
| My Team | `/members` | People |
| Groups | `/teams` | People group |
| Computers | `/devices` | Monitor |

#### Header
- App name: "**AUPrism**" with a subtle logo
- Top-right: Signed-in user's name + "Sign out" link

#### Error Page (`/error`)
Shown when:
- The signed-in user has no AU scope (`NO_AU_SCOPE`)
- Token validation fails
- An unexpected server error occurs

Content: Plain-language explanation + a "Contact IT support" CTA + a "Try again" link.

---

### 8.1a Dashboard Page (`/dashboard`)

**Purpose:** Give the BU admin an at-a-glance overview of their department's current state. This is the first screen they see after login.

**UI Elements:**

**Welcome banner:**
> "Welcome back, Alex. You're managing **Sales EMEA**."

**Summary cards (4 cards in a row):**
| Card | Value | Source |
|---|---|---|
| Team Members | Total count | `GET /api/members?auId={id}&top=1` — use `@odata.count` |
| Active | Count with `accountEnabled: true` | Same call with `$filter=accountEnabled eq true` |
| Blocked | Count with `accountEnabled: false` | Derived: total minus active |
| Computers | Total device count | `GET /api/devices?auId={id}&top=1` — use `@odata.count` |

**Quick actions (prominent buttons):**
- "Add a new team member" → `/members/new`
- "View my team" → `/members`

**Recent activity (last 5 members, sorted by creation date descending):**
- A compact list showing: Name, Job Title, date added ("Added 3 days ago")
- "View all" link → `/members`
- Data source: `GET /api/members?auId={id}&top=5&$orderby=createdDateTime desc`

> **Note:** If the AU has no members yet, replace the activity list with an onboarding empty state: "Your department has no team members yet. Start by adding your first one."

---

### 8.2 AU Switcher

**Location:** Top of the left sidebar, below the app name.

**Behavior:**
- On load, call `GET /api/me/au` to fetch the user's AUs.
- If exactly one AU → display it as a non-interactive label: "Department: Sales EMEA"
- If multiple AUs → display a dropdown selector labeled "Department:"
- The selected AU ID is stored in React context (`AUContext`) and in `sessionStorage`.
- Every subsequent API call includes `?auId={selectedId}`.
- Switching AU triggers a full data reload for the current page.

> **Note for future discussion:** The multi-AU experience (AU switcher vs. unified view vs. cross-AU reports) should be revisited as usage grows. The current switcher model is a conservative starting point. See §13 for post-v1 considerations.

---

### 8.3 Team Member Management (Users)

#### 8.3.1 Member List Page (`/members`)

**Purpose:** Give the BU admin an overview of everyone in their department.

**UI Elements:**
- Page title: "My Team"
- Search bar: "Search by name or email..."
- Filter chips: "All" | "Active" | "Blocked"
- Member list/table:
  - Columns: Name, Job Title, Email, Status (Active / Blocked badge), Actions
  - Clicking a row → navigates to Member Detail page
  - "Add team member" primary button (top right)
- Pagination: "Load more" button (cursor-based, not page numbers)

**Data source:** `GET /api/members?auId={id}&search={q}`

**Empty state:** "Your team has no members yet. Add your first team member to get started."

**Status Badge:**
- Active → green badge "Active"
- Blocked → red badge "Blocked"

---

#### 8.3.2 Member Detail Page (`/members/{id}`)

**Purpose:** View and manage a single team member.

**Sections:**

**Profile section:**
- Full name (large, top)
- Job title, Department, Email, Office location, City, Country
- "Edit details" button → inline edit mode

**Account Status section:**
- Current status badge
- If Active: "Block sign-in" button (secondary, destructive color)
- If Blocked: "Re-enable sign-in" button (primary)
- Both trigger a ConfirmDialog before acting.

**ConfirmDialog — Block sign-in:**
> "Block sign-in for Alex Smith?  
> They will immediately lose the ability to sign in to any Microsoft service.  
> Their account and data will not be deleted."
> [Cancel] [Block sign-in]

**ConfirmDialog — Re-enable sign-in:**
> "Re-enable sign-in for Alex Smith?  
> They will regain access to all Microsoft services assigned to them."
> [Cancel] [Re-enable]

---

#### 8.3.3 Add Team Member Page (`/members/new`)

**Purpose:** Create a new user account for a new hire.

**Form fields** (step-by-step wizard, 2 steps):

**Step 1 — Personal details:**
- First name * 
- Last name *
- Job title
- Department (pre-filled with AU name, editable)
- Office location

**Step 2 — Account details:**
- Work email: two fields side by side: **"Email prefix"** text input (e.g. `jlee`) + **"@domain"** dropdown pre-populated from `GET /api/me/domains`, defaulting to the tenant's default domain.
- The full email address is shown as a preview below: `jlee@contoso.com`
- Password: "A temporary password will be auto-generated" — informational text only, not a field. The password is generated server-side and shown after account creation.

**Summary confirmation screen before submit:**
> "You are about to create an account for Jordan Lee (Sales Analyst).  
> They will receive a temporary password and must change it on first sign-in."
> [Back] [Create account]

**On success:** Show a success panel with:
- The generated temporary password (shown once, copyable)
- "Done" button returns to member list

---

#### 8.3.4 Edit Member Details

**Accessible from:** Member Detail page → "Edit details" button.

**Inline edit mode:** The profile section fields become editable in-place.

**Editable fields:** Display name, Job title, Department, Office location, City, Country.

**Read-only fields (shown but not editable):** Email address (UPN), Object ID.

**Save/Cancel buttons** appear at the bottom when any field is changed.

---

### 8.4 Group Management (Static Groups)

#### 8.4.1 Group List Page (`/teams`)

**Purpose:** Show all groups (teams) in the AU.

**UI Elements:**
- Page title: "Groups"
- Group list/table:
  - Columns: Name, Description, Member Count, Actions
  - Clicking a row → Group Detail page
- Note: Group creation is out of scope for V1 (read + member management only).

> **V1 constraint:** Group creation is excluded from V1. BU admins can only manage membership of existing AU-scoped groups. The central IAM team creates and assigns groups to AUs.

---

#### 8.4.2 Group Detail Page (`/teams/{id}`)

**Purpose:** View and manage membership of a specific group.

**Sections:**

**Group Info:**
- Name, Description
- Type badge: "Security Group" or "Microsoft 365 Group"

**Member List:**
- Columns: Name, Email, Job Title, (Source: "In your department" or "Outside your department")
- Search within members: "Search members..."
- "Add member" button: opens a person picker (searches `GET /api/members?auId={id}&search={q}`) — only shows AU members.
- "Remove" action per row → ConfirmDialog:
  > "Remove Jordan Lee from Sales Team?  
  > They will lose access to anything this group provides."
  > [Cancel] [Remove]

> **Important UI note:** Members who are in the group but NOT in the AU should be displayed with a subtle indicator ("Outside your department") and be non-editable (no remove button). This reflects the Microsoft constraint that groups can have members outside the AU. See §4 of the Microsoft AU docs.

---

### 8.5 Device Management

#### 8.5.1 Device List Page (`/devices`)

**Purpose:** Give the BU admin a view of all computers/devices in their department.

**UI Elements:**
- Page title: "Computers"
- Search bar: "Search by computer name..."
- Filter: "All" | "Active" | "Disabled"
- Device list/table:
  - Columns: Name, OS, OS Version, Status, Last Seen, Actions
- Clicking a row → Device Detail page

**Data source:** `GET /api/devices?auId={id}&search={q}`

---

#### 8.5.2 Device Detail Page (`/devices/{id}`)

**Purpose:** View details and enable/disable a device.

**Sections:**

**Device Info:**
- Computer name
- Operating System + version
- Last seen date (human-readable: "3 days ago")
- Device ID (shown for IT reference, labeled "Device ID")

**Status:**
- Current status badge (Active / Disabled)
- "Disable this computer" or "Re-enable this computer" button

**ConfirmDialog — Disable:**
> "Disable LAPTOP-ALEXS?  
> This computer will not be able to access company resources until re-enabled.  
> The user's data on this device is not affected."
> [Cancel] [Disable computer]

**ConfirmDialog — Re-enable:**
> "Re-enable LAPTOP-ALEXS?  
> This computer will regain access to company resources."
> [Cancel] [Re-enable]

---

## 9. UI/UX Conventions

### 9.1 Technology Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR flexibility + API routes in one project |
| UI Library | Fluent UI v9 (React) | Microsoft's design system — familiar to M365 users |
| Auth | MSAL.js (`@azure/msal-react`) | Official Microsoft library |
| Data fetching | SWR | Lightweight, built-in cache/revalidation |
| State | React Context (AUContext) | Simple, no complex state needed for V1 |
| Styling | Fluent UI tokens + CSS modules | Consistent with design system |
| Language | TypeScript (strict) | Type safety, especially for Graph response mapping |
| i18n | `next-intl` | App Router-native, works in server + client components, TypeScript-first, built-in locale detection |

### 9.2 Language Rules

- **Never** use these words in the UI: user, object, tenant, principal, role, claim, token, graph, API, Azure, Entra, AAD, UPN, GUID, UUID.
- **Always** use business equivalents from the Glossary (§4).
- Error messages must explain **what happened** and **what the user can do** — never raw error codes.

### 9.3 Loading States

- All data-fetching operations show a skeleton loader (not a spinner) that matches the shape of the content being loaded.
- Mutations (PATCH, POST) show a loading state on the action button (disabled + spinner icon).

### 9.4 Success & Error Toasts

- Success: green toast, bottom-right, auto-dismisses after 5 seconds.
- Error: red toast, bottom-right, stays until dismissed, includes the business-friendly error message.

### 9.5 Responsiveness

- V1 targets desktop (1024px+) as primary form factor.
- Basic tablet support (768px+): sidebar collapses to icon-only.
- Mobile is out of scope for V1.

### 9.6 Theme & Color Scheme

#### Supported Themes

Fluent UI v9 ships a full token-based theming system. V1 supports three modes:

| Theme | Fluent UI object | Description |
|---|---|---|
| **Light** | `webLightTheme` | Default. Clean white backgrounds. |
| **Dark** | `webDarkTheme` | Dark backgrounds, reduced eye strain. |
| **System** | Auto-detect via `prefers-color-scheme` | Follows the OS setting (Windows or macOS). |

The app wraps its entire component tree in Fluent UI's `<FluentProvider theme={activeTheme}>`. Switching themes requires only swapping the `theme` prop — no page reload.

#### Theme Selector

- Location: bottom of the left sidebar, below the navigation items.
- Control: a three-option segmented button — "Light" | "System" | "Dark".
- Default: "System" (respects the OS preference on first visit).

#### Persistence — `localStorage`

The selected theme is saved in `localStorage`, keyed by the user's `oid` from the MSAL token. This ensures:
- Each user on a shared machine has their own preference.
- The preference survives page reloads and browser restarts.
- No server-side storage or extra Graph permissions are needed.
- Works correctly on both **Windows** and **macOS** laptops (the only supported platforms for V1).

```ts
// Key format
const key = `auprism.theme.${oid}` // e.g. "auprism.theme.a1b2c3-..."

// Save on change
localStorage.setItem(key, 'dark') // 'light' | 'dark' | 'system'

// Load on app init (before first render to avoid flash)
const saved = localStorage.getItem(key) ?? 'system'
```

> **Note:** `localStorage` is browser-scoped and device-scoped. If the user switches to a different browser or a different device, the preference resets to "System". Cross-device persistence is a post-V1 consideration — see §13.

### 9.7 Internationalization (i18n)

#### Goal

V1 ships in **English only**. However, the architecture must support adding new languages with zero code changes — only a new translation file. AUPrism is designed for multinational organizations; French, German, Spanish, and others are expected post-V1 additions.

#### Library: `next-intl`

`next-intl` is the standard i18n solution for Next.js App Router. It works in both Server Components and Client Components, is TypeScript-first, and integrates with Next.js middleware for locale detection.

#### File Structure

All UI strings live in locale message files under `messages/`. V1 ships with English only:

```
messages/
  en.json          ← V1: the only locale shipped
  fr.json          ← V2+ (French)
  de.json          ← V2+ (German)
  es.json          ← V2+ (Spanish)
```

The `en.json` file is organized by feature area, mirroring the glossary in §4:

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "loading": "Loading...",
    "errorGeneric": "Something went wrong. Please try again."
  },
  "nav": {
    "home": "Home",
    "myTeam": "My Team",
    "groups": "Groups",
    "computers": "Computers"
  },
  "members": {
    "pageTitle": "My Team",
    "searchPlaceholder": "Search by name or email...",
    "addButton": "Add team member",
    "statusActive": "Active",
    "statusBlocked": "Blocked",
    "emptyState": "Your team has no members yet. Add your first team member to get started.",
    "blockConfirmTitle": "Block sign-in for {name}?",
    "blockConfirmBody": "They will immediately lose the ability to sign in to any Microsoft service. Their account and data will not be deleted.",
    "blockConfirmAction": "Block sign-in"
  },
  "groups": {
    "pageTitle": "Groups",
    "typeSecurityGroup": "Security Group",
    "typeM365Group": "Microsoft 365 Group",
    "outsideDepartment": "Outside your department"
  },
  "devices": {
    "pageTitle": "Computers",
    "disableConfirmTitle": "Disable {name}?",
    "disableConfirmBody": "This computer will not be able to access company resources until re-enabled. The user's data on this device is not affected."
  },
  "errors": {
    "noAuScope": "You don't have permission to manage any department yet. Please contact your IT administrator.",
    "forbidden": "You don't have permission to perform this action. Contact your IT administrator.",
    "notFound": "This record could not be found. It may have been removed.",
    "conflict": "A team member with this email address already exists."
  }
}
```

#### The No-Hardcoded-Strings Rule (Design Principle #8)

**Every visible string in JSX must be a `t('key')` call.** No exceptions.

```tsx
// ❌ FORBIDDEN — hardcoded string
<h1>My Team</h1>

// ✅ CORRECT
const t = useTranslations('members')
<h1>{t('pageTitle')}</h1>
```

This applies to: page titles, button labels, placeholder text, toast messages, error messages, confirmation dialog copy, empty state messages, and ARIA labels.

The `next-intl` TypeScript plugin enforces this at compile time — it will error if you reference a key that doesn't exist in `en.json`. Configure it in `tsconfig.json` from day one.

#### Locale Detection — Cookie-based (no URL prefix)

For a business portal (not a public website), cookie-based locale detection is the right choice:
- URLs remain clean: `/dashboard` not `/en/dashboard`
- Language preference is personal, not shareable via URL
- Simpler routing setup

Locale preference is stored in a cookie (`NEXT_LOCALE`) via `next-intl`'s built-in detection. The `middleware.ts` already present for JWT validation also handles locale injection — no additional middleware file needed.

Default locale: `en`. If no cookie is set, the app defaults to English.

#### Interpolation and Plurals

For strings that include dynamic values (names, counts), always use `next-intl`'s interpolation — never string concatenation:

```tsx
// en.json: "blockConfirmTitle": "Block sign-in for {name}?"
t('members.blockConfirmTitle', { name: member.displayName })
```

For plural forms (e.g., "1 member" vs "3 members"), use `next-intl`'s ICU message format:
```json
"memberCount": "{count, plural, =1 {1 team member} other {# team members}}"
```

#### Glossary as Translation Source of Truth

The business term mapping in §4 is the **authoritative source** for translation keys. Every business term in that table must have a corresponding key in `en.json`. When adding a new language, the translator works from §4 — not from reading the source code.

---

## 10. Security Considerations

### 10.1 Token Handling

- Access tokens are stored in-memory by MSAL (not in localStorage or sessionStorage) using the default MSAL cache strategy.
- The API wrapper never logs tokens or passes them downstream.
- Token expiry is handled automatically by `@azure/msal-react`'s `useMsal` hook via silent refresh.

### 10.2 Scope Enforcement (Defense in Depth)

Two independent layers prevent out-of-scope access:

1. **Entra Delegated Permissions:** Graph API itself limits what the signed-in user can see based on their AU-scoped role. This is the primary boundary.
2. **Wrapper Scope Guard:** The API route explicitly verifies every resource ID against the AU before executing any mutation. This prevents logic errors or parameter tampering from bypassing the first layer.

### 10.3 Input Validation

- All user input is validated server-side in the API routes using a schema validation library (e.g., `zod`).
- Only whitelisted fields are forwarded to Graph (no pass-through of raw request bodies).
- Email/UPN format is validated before calling Graph.

### 10.4 HTTPS Everywhere

- The app must only be served over HTTPS. Azure Static Web Apps enforces this by default.
- `NEXT_PUBLIC_REDIRECT_URI` for production must be HTTPS.

### 10.5 CORS

- API routes are not intended to be called from other origins. Configure `next.config.js` to restrict CORS headers on `/api/*` to the app's own origin.

### 10.6 No Secrets in Frontend

- `NEXT_PUBLIC_*` variables contain only the App Registration's `clientId` and `tenantId` — these are public by design in MSAL's SPA flow.
- No client secrets, certificates, or sensitive config are exposed to the browser.

### 10.7 Audit Considerations

- All write operations (create, patch, disable) performed through the portal are logged natively in the Entra audit log (the signed-in delegated user appears as the actor).
- No additional logging infrastructure is required for V1.

---

## 11. Deployment

### 11.1 Target Environment

- **Hosting:** Azure Static Web Apps (Free or Standard tier)
- **Region:** Any Azure region (SWA is global CDN-backed)
- **Database:** None required — all state is in Microsoft Entra via Graph
- **Build:** `next build && next export` (or SWA-managed build)

### 11.2 Environment Variables

| Variable | Where set | Example |
|---|---|---|
| `NEXT_PUBLIC_CLIENT_ID` | SWA App Settings | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `NEXT_PUBLIC_TENANT_ID` | SWA App Settings | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `NEXT_PUBLIC_REDIRECT_URI` | SWA App Settings | `https://auprism.contoso.com` |
| `NEXT_PUBLIC_APP_NAME` | SWA App Settings | `AUPrism` (customizable per deployment) |

All variables are prefixed `NEXT_PUBLIC_` and are intentionally visible in the browser. They contain no secrets — see §10.6.

**`.env.example` contents** (committed to repo, used as a setup template):
```env
# Entra App Registration
NEXT_PUBLIC_CLIENT_ID=your-app-registration-client-id
NEXT_PUBLIC_TENANT_ID=your-entra-tenant-id

# Must match the Redirect URI registered in the App Registration
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000

# Display name shown in the UI header
NEXT_PUBLIC_APP_NAME=AUPrism
```

### 11.3 Azure Static Web Apps Routing (`staticwebapp.config.json`)

Required so that SWA correctly routes all paths to the Next.js app (SPA fallback), and to prevent the CDN from returning 404 on deep links:

```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/api/*", "/_next/*", "/favicon.ico"]
  },
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["authenticated"]
    },
    {
      "route": "/api/health",
      "allowedRoles": ["anonymous"]
    }
  ]
}
```

This file must be placed at the project root and committed to the repository.

### 11.4 Deployment Steps

1. Fork / clone this repository.
2. Create an Entra App Registration (see §6.1).
3. Create an Azure Static Web App, link to the GitHub repo.
4. Set the environment variables in SWA App Settings.
5. Add the SWA URL as a Redirect URI in the App Registration.
6. Central IAM admin (Jordan) assigns BU admins to AU-scoped roles in Entra.
7. BU admins navigate to the SWA URL and sign in.

### 11.5 Multi-Tenant Considerations (Future)

V1 is single-tenant (one `tenantId` per deployment). Multi-tenant support is explicitly out of scope for V1.

---

## 12. Testing Strategy

### 12.1 Unit Tests

- All `lib/graph/*.ts` helper functions must have unit tests mocking the Graph client.
- All API route handlers must be tested with mock JWT tokens (valid, expired, wrong audience, no AU scope).
- Error mapper must be fully unit-tested.
- Scope guard must be unit-tested for: in-scope resource, out-of-scope resource, non-existent resource.

**Framework:** Jest + `@testing-library/react`

### 12.2 Integration Tests

- API routes tested end-to-end against a Graph mock server (e.g., `msw` — Mock Service Worker).
- MSAL token acquisition mocked using `@azure/msal-react`'s test utilities.

### 12.3 E2E Tests

**Framework:** Playwright

**Critical paths to cover:**
1. Sign in → AU resolved → Member list loads.
2. Sign in with no AU scope → Error page shown.
3. Create a new team member (full wizard flow).
4. Disable a team member (confirm dialog → success toast).
5. Add a member to a group.
6. Disable a device.

---

## 13. Future Considerations (Post V1)

The following features are explicitly **out of scope for V1** but should be kept in mind when making architectural decisions.

| Feature | Notes |
|---|---|
| **Multi-AU unified view** | The AU Switcher (§8.2) is a placeholder. A future version may offer a cross-AU aggregated dashboard. This decision was consciously deferred — the model needs to be reviewed with real BU admin users before committing to a design. |
| **Dynamic group management** | Static groups are V1. Dynamic membership rule editing requires AU admin to have sufficient Graph permissions and adds significant UI complexity. |
| **Access Package (ELM) management** | Entitlement Management is not part of AU scope in the Microsoft API — it requires separate ELM permissions and is architecturally separate from AU-scoped operations. |
| **Access Reviews** | Requires `AccessReview.ReadWrite.All` and a more complex workflow. Good candidate for V2. |
| **Audit log dashboard** | `AuditLog.Read.All` is a high-privilege permission. A filtered, AU-relevant view of sign-in and directory logs would be high value but needs careful scope definition. |
| **Role assignment within AU** | Allowing a BU admin to sub-delegate within their AU is powerful but risky. Requires `RoleManagement.ReadWrite.Directory` scoped to the AU. Needs a separate UX design. |
| **Restricted Management Administrative Units (RMAU)** | RMAUs have special behavior where even Global Admins are restricted. The current scope guard logic will need to be extended to detect RMAU context and adjust UI affordances accordingly. |
| **Password reset** | `POST /users/{id}/authentication/methods/password/resetPassword` — high-value for help desk scenarios. |
| **License assignment** | `POST /users/{id}/assignLicense` — AU-scoped license management is supported but was deferred for V1. |
| **Group creation** | Allowing BU admins to create new groups within their AU. Currently the central IAM team creates groups and assigns them to AUs. |
| **Mobile responsive design** | V1 targets desktop. A mobile-friendly version would require a redesigned navigation model. |
| **Notification / email** | Email notification to a new hire when their account is created. Requires an email service integration (e.g., Azure Communication Services). |
| **Automated installer / one-click deployment** | Today, setting up AUPrism requires ~20 manual steps across the Entra portal and Azure portal (App Registration, Graph permissions, admin consent, SWA creation, env vars). A future installer should reduce this to a single command or a GitHub "Deploy to Azure" button. Options to evaluate: a Node.js CLI script (cross-platform, no extra prerequisites since Node 18+ is already required), a PowerShell script (familiar to Windows IT admins), or a Bicep + GitHub Actions workflow with a "Deploy to Azure" button in the README. The Entra App Registration step (which ARM/Bicep cannot handle) will always require either Graph API calls or manual portal steps — this is the key design challenge for any installer. |
| **Cross-device theme persistence** | V1 saves theme preference in `localStorage` (device-scoped). Cross-device persistence requires a storage decision: Entra open extension on the user object (`PATCH /users/{oid}` with a schema extension) is the cleanest option as it requires no extra infrastructure — but needs the IAM admin to register the extension schema first. Azure Cosmos DB / Table Storage keyed by `oid` is the alternative. Both are post-V1. |
| **Additional languages** | V1 ships English only. The i18n architecture (§9.7) is in place from day one so adding a language requires only: (1) create `messages/{locale}.json` with translated keys, (2) add the locale to `next-intl` config, (3) test. No code changes needed. Priority languages to consider based on typical enterprise deployments: French (`fr`), German (`de`), Spanish (`es`), Dutch (`nl`), Japanese (`ja`). |
| **Right-to-left (RTL) language support** | Arabic (`ar`) and Hebrew (`he`) require RTL layout. Fluent UI v9 has built-in RTL support via the `dir` prop on `FluentProvider`. The main architectural change needed is ensuring no CSS uses fixed `left`/`right` properties — use logical properties (`margin-inline-start` etc.) instead. This should be a deliberate decision made before adding any RTL locale. |

---

## 14. Development Phases

AUPrism is built in two sequential phases. Phase 1 produces a fully functional, demonstrable UI. Phase 2 connects it to real Microsoft Entra data.

---

### Phase 1 — UI with Mock Data (no Azure required)

**Goal:** Build and validate the entire UI, workflows, and UX — with no dependency on an Entra tenant, App Registration, or Microsoft Graph.

**What is built:**
- The complete Next.js app structure (all pages, components, hooks, layouts)
- All feature screens: dashboard, member list/detail/create, group management, device management
- All UI states: loading skeletons, empty states, error states, confirmation dialogs, success toasts
- Theme switching (light/dark/system)
- i18n wiring (`next-intl`, `en.json` populated)
- AU switcher (driven by mock AU data)

**What is NOT built in Phase 1:**
- `app/api/` Route Handlers (Graph wrapper)
- `middleware.ts` JWT validation
- `lib/graph/` and `lib/auth/`
- Any real MSAL authentication

**Mock infrastructure:**

All mock data lives in `mocks/`. The mock layer uses the exact same TypeScript types as the real layer — if a type mismatch exists, TypeScript will catch it at compile time.

```
mocks/
  data/
    au.json              # Fake AU context: { id, displayName, memberCount }
    members.json         # 15-20 realistic fake members with varied statuses
    groups.json          # 3-5 realistic fake groups with membership
    devices.json         # 8-10 realistic fake devices
  handlers/
    useAUContext.mock.ts
    useMembers.mock.ts
    useTeams.mock.ts
    useDevices.mock.ts
  MockAuthProvider.tsx   # 'use client' — replaces MsalProvider, injects fake user
```

**Fake data realism requirements:**
Mock data must reflect real-world variety to surface edge cases during UI development:
- Members: mix of active and blocked accounts, varied job titles and departments, one member with a very long name (truncation test), one with missing optional fields (job title, city)
- Groups: one Security Group, one M365 Group, one group with members outside the AU
- Devices: mix of Windows and macOS, one disabled device, one with a very old "last seen" date

**The single swap point — env flag:**

```
NEXT_PUBLIC_USE_MOCK=true    # Phase 1
NEXT_PUBLIC_USE_MOCK=false   # Phase 2
```

Every hook file exports a single function and selects its implementation based on this flag:

```ts
// hooks/useMembers.ts
import { useMockMembers } from '@/mocks/handlers/useMembers.mock'
import { useRealMembers } from '@/hooks/useMembers.real'

export const useMembers =
  process.env.NEXT_PUBLIC_USE_MOCK === 'true'
    ? useMockMembers
    : useRealMembers
```

This pattern applies to `useMembers`, `useTeams`, `useDevices`, and `useAUContext`. There must be **no other `if (mock)`** conditions anywhere in the codebase.

**Auth in mock mode:**

`MockAuthProvider` (replaces `MsalProvider` when `USE_MOCK=true`) injects a hardcoded fake user into React context:

```ts
const MOCK_USER = {
  oid: 'mock-user-oid-001',
  name: 'Alex Dubois',
  email: 'alex.dubois@contoso.com'
}
```

The login page in mock mode shows a single "Enter as demo user" button instead of the MSAL redirect. This button is never rendered when `USE_MOCK=false`.

**Phase 1 is complete when:**
- [ ] All pages render correctly with mock data
- [ ] All create/edit/disable/enable workflows function end-to-end with mock data (optimistic updates)
- [ ] All empty states, error states, and loading states are implemented
- [ ] Theme switching works and persists in localStorage
- [ ] i18n wiring is in place (`t('key')` used everywhere, no hardcoded strings)
- [ ] The UI has been reviewed against the persona (Alex — zero IT background) and language rules (§9.2)
- [ ] Basic Playwright E2E tests pass against mock mode

---

### Phase 2 — Graph Connection (real tenant required)

**Goal:** Replace the mock layer with real Microsoft Graph API calls. The UI and components are untouched — only the hook implementations and the API wrapper are built.

**Prerequisites before starting Phase 2:**
- A Microsoft Entra tenant with at least one Administrative Unit configured
- An App Registration created per §6.1
- At least one test user assigned to an AU-scoped role

**What is built:**
- `app/api/` Route Handlers — all endpoints per §7.2
- `middleware.ts` — JWT validation with `jose`
- `lib/graph/` — Graph client and AU-scoped operation helpers
- `lib/auth/` — MSAL config and token validator
- `hooks/useMembers.real.ts`, `hooks/useTeams.real.ts`, `hooks/useDevices.real.ts` — SWR-based implementations calling real `/api/*` routes
- `app/api/me/domains/route.ts` — domain resolution for UPN picker

**Switch to Phase 2:**
Set `NEXT_PUBLIC_USE_MOCK=false` in `.env.local`. Every hook automatically switches to the real implementation. No component or page file changes.

**Phase 2 is complete when:**
- [ ] Sign-in with a real Entra account works via MSAL
- [ ] AU context is resolved from the real tenant
- [ ] All API routes return correct AU-scoped data
- [ ] Scope guard blocks out-of-AU access (tested with a user in a different AU)
- [ ] Creating a real user and adding to AU works end-to-end
- [ ] All Phase 1 Playwright tests pass with `USE_MOCK=false` against a test tenant

---

### Summary

| | Phase 1 | Phase 2 |
|---|---|---|
| **What ships** | Full UI, all screens and workflows | Real data from Microsoft Entra |
| **Azure tenant needed** | No | Yes |
| **MSAL** | Mocked | Real |
| **Graph wrapper** | Not built | Fully built |
| **Env flag** | `USE_MOCK=true` | `USE_MOCK=false` |
| **Can demo to stakeholders** | Yes (with realistic mock data) | Yes (with real data) |
| **E2E tests run in** | Mock mode | Both modes |

---

*End of Specification — Entra AUPrism V1*
