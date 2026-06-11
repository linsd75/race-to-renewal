# Race to Renewal — 5-minute Azure deploy (hand-off guide)

**For:** anyone with Azure access (any subscription + the ability to use a resource group).
**Goal:** publish this training game at a clean HTTPS link that opens in the browser, signed in
with a Microsoft account. **No storage account, no client secret, no database — it's a static site.**

> The requester (Tony) does **not** have rights to create Azure resource groups. If you do, this
> takes about 5 minutes and costs **$0** (Azure Static Web Apps **Free** tier). When you're done,
> just send the URL back.

---

## What this is
A single, self-contained HTML game (`frontend/index.html`) — no backend data, no customer data,
internal enablement content only. The one tiny Azure Function (`api/GetRoles`) simply restricts
sign-in to the **Microsoft tenant** so only employees can open it. That's the entire app.

```
tminus-swa/
├── frontend/
│   └── index.html                 # the game (static, self-contained)
├── api/
│   ├── host.json · package.json   # no dependencies
│   └── GetRoles/                  # tenant gate (no secret, no storage)
│       ├── function.json
│       └── index.js
├── staticwebapp.config.json       # requires Microsoft-tenant sign-in
└── .gitignore
```

---

## Deploy (Azure Portal — no CLI needed)

### 1. Put this folder in a Git repo
Azure Static Web Apps deploys from GitHub (or Azure DevOps). Easiest:
1. Create a **private GitHub repo** (e.g. `race-to-renewal`).
2. Upload the **contents of this `tminus-swa/` folder** to the repo root, so `frontend/`, `api/`,
   and `staticwebapp.config.json` sit at the top level.

### 2. Create the Static Web App
1. Azure Portal → **Create a resource → Static Web App**.
2. **Plan type:** **Free**.
3. **Resource group:** pick any existing one you have rights to (no need to create a new one).
4. **Name:** `race-to-renewal` (or anything).
5. **Source:** **GitHub** → authorize → choose your repo + the `main` branch.
6. **Build Details → Build Presets:** **Custom**, then set:
   - **App location:** `frontend`
   - **Api location:** `api`
   - **Output location:** *(leave blank)*
7. **Review + create → Create.**

Azure adds a GitHub Actions workflow to your repo and runs the first deployment (1–3 min).

### 3. Get the URL and share it
Static Web App → **Overview → URL** (e.g. `https://race-to-renewal.azurestaticapps.net`).
Open it once to confirm: it prompts for **Microsoft sign-in**, then loads the game. Send that URL
to the requester. Done.

---

## How access control works (nothing to configure)
- Sign-in uses Static Web Apps' **built-in Entra provider** — **no app registration, no secret.**
- `staticwebapp.config.json` requires the custom **`msft`** role on every page.
- `api/GetRoles` grants `msft` only when the signed-in user's **tenant ID** is Microsoft's
  (`72f988bf-86f1-41af-91ab-2d7cd011db47`). Everyone at Microsoft passes; external accounts are denied.
- To allow extra tenants (rarely needed): add an app setting **`ALLOWED_TENANT_IDS`** =
  comma-separated tenant GUIDs (Static Web App → **Settings → Environment variables**).

## Even simpler (optional): no sign-in at all
If you'd rather make it open to anyone with the link (no Microsoft gate), delete the `api/` folder
and replace `staticwebapp.config.json` with just:
```json
{ "navigationFallback": { "rewrite": "/index.html" } }
```
Then App location = `frontend`, Api location = *(blank)*. Everything else is the same.

---

## Notes
- **Cost:** Static Web Apps **Free** tier — $0. No other Azure resources are created.
- **Updates:** push to the repo's `main` branch → it redeploys automatically.
- **Custom domain (optional):** Static Web App → **Custom domains**, if you want a friendlier URL.
- **Tear-down:** delete the Static Web App resource; nothing else to clean up.
