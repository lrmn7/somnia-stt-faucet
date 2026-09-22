# Somnia STT Faucet

A faucet website to claim testnet STT tokens on the Somnia Shannon Testnet.

---

## Where do I put the treasury private key?

> [!CAUTION]
> **NEVER** put the treasury private key in `wrangler.jsonc`, `vars`, frontend source files, or version control.

### 1. For Local Development: `.dev.vars`
Create a file named `.dev.vars` at the project root (this file is strictly ignored by `.gitignore`):

```bash
# .dev.vars (DO NOT COMMIT)
FAUCET_PRIVATE_KEY=your_test_private_key_here
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
IP_HASH_SECRET=any_random_string_for_local_ip_salt
WALLET_HASH_SECRET=any_random_string_for_local_wallet_salt
```

*Note: Use either `.dev.vars` or `.env` for local development (do not use both simultaneously). Wrangler Pages dev automatically loads `.dev.vars`.*

### 2. For Production: Cloudflare Pages Secrets
In production, secrets are stored encrypted inside Cloudflare's infrastructure and accessed server-side via `context.env`.

#### Option A: Via Wrangler CLI
Run the following commands in your terminal:
```bash
npx wrangler pages secret put FAUCET_PRIVATE_KEY --project-name somnia-stt-faucet
npx wrangler pages secret put TURNSTILE_SECRET_KEY --project-name somnia-stt-faucet
npx wrangler pages secret put IP_HASH_SECRET --project-name somnia-stt-faucet
npx wrangler pages secret put WALLET_HASH_SECRET --project-name somnia-stt-faucet
```

#### Option B: Via Cloudflare Dashboard
1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Workers & Pages** -> select your Pages project (`somnia-stt-faucet`).
3. Click **Settings** -> **Variables and Secrets**.
4. Under **Secrets**, click **Add** for each secret:
   * `FAUCET_PRIVATE_KEY`: Your treasury wallet private key (64-character hex).
   * `TURNSTILE_SECRET_KEY`: Secret key from Cloudflare Turnstile dashboard.
   * `IP_HASH_SECRET`: Random high-entropy secret string used to hash IP addresses before storage.
   * `WALLET_HASH_SECRET`: Random high-entropy secret string used to hash wallet addresses before storage.
5. Click **Encrypt** and **Save**.

---

## Network Configuration

This faucet is built strictly for **Somnia Shannon Testnet**:

| Parameter | Value |
|---|---|
| **Network Name** | Somnia Shannon Testnet |
| **Chain ID** | `50312` (`0xc488`) |
| **Native Symbol** | `STT` (Somnia Test Token) |
| **RPC Endpoint** | `https://dream-rpc.somnia.network` |
| **Explorer** | `https://shannon-explorer.somnia.network/` |
| **Payout Amount** | Fixed at `10 STT` (`10000000000000000000` wei) |

*Mainnet (`Chain ID 5031`, RPC `https://api.infra.mainnet.somnia.network`) is NOT used.*

---

## Architecture & Security Model

```text
Browser Client (React + Tailwind CSS + Sonner)
      │
      │ 1. User enters wallet address & clicks "Claim 10 STT"
      │ 2. Turnstile appears dynamically, solves, and disappears
      │ 3. POST /api/claim { walletAddress, turnstileToken, idempotencyKey }
      ▼
Cloudflare Pages Functions (`functions/api/claim.ts`)
      │
      ├── 1. Format & Address Validation (Viem `isAddress`, EIP-55 checksumming)
      ├── 2. Cloudflare Turnstile Server-Side Validation (`challenges.cloudflare.com/turnstile/v0/siteverify`)
      ├── 3. IP Rate Limiting (Keyed SHA-256 IP hash; 5 attempts/10 min, 20 attempts/24h)
      ├── 4. Atomic D1 Claim Reservation (Lock TTL: 600s; Rolling cooldown: 86400s)
      ├── 5. Daily Budget Accounting (`daily_budget` table; default 1000 STT/day)
      ├── 6. Pre-flight Checks (Assert Chain ID 50312 & Treasury balance > 10 STT + gas)
      ├── 7. Native STT Transfer Dispatch (Viem `sendTransaction` with private key)
      ├── 8. State Update (Persist real txHash and status: `submitted`)
      │
      ▼
Client receives response { ok: true, amount: "10", txHash, explorerUrl }
```

### Key Security Safeguards
1. **Zero Client Secrets:** Private keys and salts never exist in frontend code or client bundles.
2. **Server-Side Turnstile Verification:** Turnstile tokens are strictly verified server-side with Cloudflare Siteverify. Client tokens are never trusted on their own.
3. **Double-Spend Prevention via Atomic Reservation:** Claims are atomically reserved in D1 before the transaction is broadcast, completely preventing parallel race conditions.
4. **Authoritative 24-Hour Cooldown:** Wallets cannot claim more than once every 86,400 seconds. Clearing browser cache or switching devices cannot bypass this server-enforced cooldown.
5. **Privacy-Preserving Keyed Hashing:** Raw IPs and EVM addresses are hashed with unique secrets before persistence in D1.
6. **Ambiguity Reconciliation:** If a blockchain broadcast times out or enters an uncertain network state, the claim is marked `unknown` and the lock is retained to prevent double-spending.

---

## Local Development Setup

### 1. Prerequisites
* Node.js v20+
* npm

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Local Secrets
Copy `.env.example` to `.dev.vars`:
```bash
cp .env.example .dev.vars
```
For local testing without spending real funds, Cloudflare provides dummy Turnstile keys:
* `TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA`

### 4. Apply Local D1 Database Migrations
```bash
npx wrangler d1 migrations apply DB --local
```

### 5. Build and Start Local Pages Server
```bash
npm run build
npm run pages:dev
```
The application will be live at `http://127.0.0.1:8788`.

---

## Production Deployment to Cloudflare Pages

### 1. Create Remote D1 Database
```bash
npx wrangler d1 create somnia-stt-faucet
```
Update `database_id` in `wrangler.jsonc` with the ID output by the command.

### 2. Apply Migrations to Remote D1
```bash
npx wrangler d1 migrations apply DB --remote
```

### 3. Set Production Secrets
```bash
npx wrangler pages secret put FAUCET_PRIVATE_KEY --project-name somnia-stt-faucet
npx wrangler pages secret put TURNSTILE_SECRET_KEY --project-name somnia-stt-faucet
npx wrangler pages secret put IP_HASH_SECRET --project-name somnia-stt-faucet
npx wrangler pages secret put WALLET_HASH_SECRET --project-name somnia-stt-faucet
```

### 4. Build & Deploy
```bash
npm run build
npx wrangler pages deploy dist --project-name somnia-stt-faucet
```

---

## File Structure

```text
├── .env.example                     # Safe environment template with placeholders
├── .gitignore                       # Production-grade exclusions
├── wrangler.jsonc                   # Cloudflare Pages & D1 configuration
├── package.json                     # Dependencies & scripts
├── functions/                       # Cloudflare Pages Functions
│   ├── _shared/                     # Server-side modules (crypto, db, somnia, turnstile)
│   │   ├── crypto.ts                # Keyed SHA-256 Web Crypto utility
│   │   ├── db.ts                    # D1 reservation & cooldown logic
│   │   ├── somnia.ts                # Viem Somnia Testnet client & transfers
│   │   ├── turnstile.ts             # Cloudflare Siteverify client
│   │   └── types.ts                 # Type definitions
│   └── api/
│       ├── claim.ts                 # POST /api/claim transaction endpoint
│       └── health.ts                # GET /api/health monitoring endpoint
├── migrations/
│   └── 0001_initial.sql             # D1 schema (claims & daily_budget tables)
├── public/
│   ├── bg.mp4                       # Global background video
│   └── favicon.svg                  # Brand favicon {F}
└── src/                             # Frontend single-page React app
    ├── components/
    │   └── faucet/
    │       ├── FaucetForm.tsx       # Form with dynamic Turnstile & claim receipt
    │       ├── GlobalBackground.tsx # Root background video & contrast overlay
    │       ├── Navbar.tsx           # Minimal navbar with {F} and Somnia links
    │       └── TurnstileWidget.tsx  # Cloudflare Turnstile widget wrapper
    ├── lib/
    │   ├── api.ts                   # /api/claim client
    │   └── utils.ts                 # Formatting helpers
    ├── App.tsx                      # Root layout
    ├── index.css                    # Tailwind CSS directives & theme
    └── main.tsx                     # React DOM entry
```
