# CredLayer

**AI-adjudicated under-collateralized lending on GenLayer**

CredLayer is a decentralised lending protocol that uses GenLayer Intelligent Contracts and on-chain AI inference to evaluate creditworthiness in real time. Borrowers can access loans with little or no collateral based on a composite reputation score built from identity, repayment history, wallet behaviour, income signals, and governance participation. Every credit decision is reached through validator consensus — not a centralised risk team.

Live deployment → **https://credlayer-nine.vercel.app**
GitHub → **https://github.com/Ifem1/Credlayer**

---

## Table of Contents

1. [How It Works](#how-it-works)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Smart Contract](#smart-contract)
5. [Reputation & Credit Scoring](#reputation--credit-scoring)
6. [Liquidity Pools](#liquidity-pools)
7. [KYC & Identity Verification](#kyc--identity-verification)
8. [Proof Trail](#proof-trail)
9. [Project Structure](#project-structure)
10. [API Reference](#api-reference)
11. [Local Development](#local-development)
12. [Environment Variables](#environment-variables)
13. [Database Setup](#database-setup)
14. [Deploying the Contract](#deploying-the-contract)
15. [Deploying to Vercel](#deploying-to-vercel)
16. [Testing](#testing)

---

## How It Works

### For Borrowers

1. **Connect your wallet** — MetaMask or any injected Web3 wallet.
2. **Create a borrower profile** — name, country, occupation, monthly income, and loan purpose are stored on-chain via the GenLayer contract.
3. **Complete KYC** — upload your identity document (passport / national ID / driver's licence), a selfie, and proof of address. Files are hashed locally in your browser using SHA-256; only the cryptographic hash is sent to the blockchain. The AI on GenLayer then verifies the submission and returns a KYC decision.
4. **Apply for a loan** — choose loan type, amount, duration, and collateral. GenLayer validators run an AI credit assessment, reach consensus on the offer (interest rate, collateral ratio, credit score, risk level), and lock the terms immutably on-chain.
5. **Accept the offer** — if approved, accept the conditional offer to activate the loan and receive funds from the matching liquidity pool.
6. **Repay** — repayments are recorded on-chain and improve your reputation score for future loans.

### For Lenders

1. Connect your wallet.
2. Browse liquidity pools on the **Explore** page — each pool has a risk tier (LOW / MEDIUM / HIGH), target yield, minimum borrower credit score, and maximum loan amount.
3. Deposit funds into a pool of your choice. Your deposit earns yield from origination fees and interest payments as loans are repaid.
4. Withdraw your share at any time (subject to pool liquidity).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (Next.js)                    │
│  wagmi + viem  ──►  MetaMask / injected wallet              │
│  React UI      ──►  /apply  /dashboard  /explore  /risk     │
└────────────────────────────┬────────────────────────────────┘
                             │  API calls (fetch)
┌────────────────────────────▼────────────────────────────────┐
│                   Next.js API Routes (Edge/Node)            │
│  /api/profile          /api/loan/request                    │
│  /api/profile/verify-identity   /api/loan/repay             │
│  /api/pool/deposit     /api/pool/withdraw                   │
│  /api/reputation       /api/treasury                        │
│  /api/genlayer/sync    /api/notifications                   │
└───────────┬────────────────────────────┬────────────────────┘
            │                            │
┌───────────▼───────────┐   ┌────────────▼──────────────────┐
│   GenLayer Studionet  │   │        Supabase (Postgres)     │
│                       │   │                                │
│  CredLayer Intelligent│   │  profiles        loans         │
│  Contract (Python)    │   │  credit_profiles repayments    │
│                       │   │  liquidity_pools proofs        │
│  AI credit scoring    │   │  notifications   audit_logs    │
│  KYC verification     │   │  risk_assessments transactions │
│  Reputation engine    │   │                                │
│  Loan lifecycle       │   │  (cache / index only —         │
│  Liquidity pools      │   │   GenLayer is source of truth) │
└───────────────────────┘   └────────────────────────────────┘
```

**GenLayer is the source of truth.** Supabase is used purely as a read cache, search index, notification store, and proof audit trail. If Supabase and GenLayer ever disagree, GenLayer wins. The `/api/genlayer/sync` route can be called to resync any entity.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Wallet | wagmi v2, viem v2, MetaMask / injected connector |
| Intelligent Contract | GenLayer (Python), `gl.exec_prompt_non_comparative` |
| AI Inference | GenLayer on-chain AI via validator consensus |
| Database / Cache | Supabase (Postgres), Row Level Security |
| Charts | Recharts |
| Validation | Zod |
| Testing | Jest, React Testing Library |
| Deployment | Vercel (frontend + API), GenLayer Studionet (contract) |

---

## Smart Contract

**File:** `contracts/credlayer.py`
**Address:** `0xc0a683EE52676B36a5e2325bca42E12B47f57D47`
**Network:** GenLayer Studionet
**Owner:** `0xE3A26A71b2B26aC623A1F1447D28afc6cac0Fb9c`

The contract is written in GenLayer's Python-based Intelligent Contract language. It uses `TreeMap` for on-chain key-value storage and `gl.eq_principle.prompt_non_comparative` for non-deterministic AI inference that reaches consensus across multiple validators.

### Public Write Methods

| Method | Who can call | Description |
|--------|-------------|-------------|
| `create_borrower_profile` | Any wallet | Creates a new borrower profile stored under the caller's address |
| `update_borrower_profile` | Profile owner | Updates name, occupation, income, and purpose |
| `submit_identity_verification` | Profile owner | Submits KYC documents (hashes); triggers AI verification |
| `request_loan` | KYC-verified borrower | Submits a loan application; triggers AI credit assessment |
| `accept_conditional_offer` | Loan borrower | Accepts an approved loan offer to activate it |
| `cancel_loan_request` | Loan borrower | Cancels a pending loan request |
| `activate_loan` | Contract owner | Activates a loan against a specific pool |
| `repay_loan` | Loan borrower | Records a full or partial repayment |
| `mark_default` | Contract owner | Marks a loan as defaulted |
| `create_pool` | Contract owner | Creates a new liquidity pool |
| `deposit_liquidity` | Any wallet (lender) | Deposits funds into a pool |
| `withdraw_liquidity` | Lender | Withdraws deposited funds from a pool |
| `close_pool` | Contract owner | Closes a pool to new deposits |
| `withdraw_protocol_fees` | Contract owner | Withdraws accumulated protocol fees |

### Public View Methods

| Method | Returns |
|--------|---------|
| `get_borrower(wallet)` | Full borrower profile |
| `get_credit_profile(wallet)` | Credit scores and tier |
| `get_loan(loan_id)` | Full loan record |
| `get_pool(pool_id)` | Pool state |
| `get_treasury()` | Global treasury stats |
| `get_protocol_fees()` | Fee configuration and totals |
| `get_repayment_history(wallet)` | List of repayment records |
| `get_risk_assessment(loan_id)` | AI risk assessment details |
| `get_loans_by_wallet(wallet)` | All loans for a borrower |
| `get_all_pools()` | All liquidity pools |
| `get_reputation(wallet)` | Full reputation breakdown |

### AI Integration

Two functions use `gl.eq_principle.prompt_non_comparative` — this means the AI result is produced by the leader validator and checked for equivalence by all other validators before being accepted:

- **`_evaluate_creditworthiness`** — takes 16 borrower and loan parameters, prompts the AI for a structured JSON credit assessment including decision (APPROVE/REJECT), credit score, risk level, interest rate, collateral ratio, confidence, reasoning, positive factors, and risk factors.
- **`submit_identity_verification`** — prompts the AI to verify KYC document hashes and return a verification status (VERIFIED/REJECTED), identity score, KYC level (BASIC/ENHANCED/INSTITUTIONAL), and rejection reason if applicable.

---

## Reputation & Credit Scoring

Each borrower has a composite credit score (0–850) built from five weighted components:

| Component | Weight | Signal |
|-----------|--------|--------|
| Identity Score | 25% | KYC verification level and quality |
| Repayment Score | 35% | On-time repayment history, late payments, defaults |
| Wallet Trust Score | 20% | Wallet age, transaction count, average balance |
| Income Score | 15% | Verified monthly income documents |
| Governance Score | 5% | DAO voting participation, GitHub contributions |

### Reputation Tiers

| Tier | Credit Score Range | Benefits |
|------|--------------------|---------|
| Unverified | 0 | No loans available — complete KYC first |
| Bronze | 1–299 | Small loans, high collateral requirement |
| Silver | 300–499 | Moderate loans, reduced collateral |
| Gold | 500–649 | Larger loans, competitive rates |
| Platinum | 650–749 | High loan limits, low collateral |
| Institutional | 750–850 | Maximum loan limits, best rates |

Reputation is updated automatically after every repayment, default, and KYC event.

---

## Liquidity Pools

Pools are the capital reserves that fund approved loans. Each pool has:

- **Risk Tier** — LOW, MEDIUM, or HIGH. Determines what credit score a borrower needs to draw from this pool.
- **Min Credit Score** — borrowers below this score cannot use the pool.
- **Max Loan Amount** — the largest single loan the pool will fund.
- **Target Return (bps)** — the annualised yield target for lenders (in basis points; 500 = 5%).

Pool utilisation, available liquidity, total borrowed, and total repaid are all tracked on-chain in real time and displayed on the `/risk` analytics page.

Pools are created by the contract owner. Lenders deposit and withdraw via the `/dashboard/lender` page. Protocol fees (origination: 1%, late: 2%, default penalty: 5%) accumulate separately and can be withdrawn by the owner.

---

## KYC & Identity Verification

CredLayer implements a three-document KYC flow:

1. **Identity Document** — passport, national ID, or driver's licence.
2. **Selfie** — a photo of the applicant holding their ID.
3. **Proof of Address** — bank statement, utility bill, or official letter dated within 3 months.

**How it works:**
- Documents are selected via the file upload UI on the `/apply` page.
- Each file is hashed in the browser using the Web Crypto API (`SubtleCrypto SHA-256`). The actual file never leaves the device.
- The three 64-character hex hashes are submitted to the GenLayer contract via `submit_identity_verification`.
- GenLayer validators run an AI verification prompt and reach consensus on the result.
- The KYC status transitions: `PENDING → UNDER_REVIEW → VERIFIED` (or `REJECTED`).

**Supported file formats:** PDF, PNG, JPG, JPEG, WEBP, HEIC, BMP, TIFF, GIF — up to 10 MB per file.

---

## Proof Trail

Every state-changing action creates a `ProofEntry` record stored in Supabase with:

| Field | Description |
|-------|-------------|
| `action` | What happened (e.g. `profile_created`, `loan_requested`, `loan_repaid_full`) |
| `contract_address` | The GenLayer contract address at time of action |
| `tx_hash` | The GenLayer transaction hash |
| `state_before` | Human-readable state before the action |
| `state_after` | Human-readable state after the action |
| `proof_hash` | SHA-256 hash of the action + wallet + timestamp |

The full proof trail is visible on the borrower dashboard under the **GenLayer Proof Trail** panel. This creates a tamper-evident audit log of every on-chain interaction.

---

## Project Structure

```
CREDLAYER/
├── app/
│   ├── page.tsx                        # Landing page
│   ├── apply/page.tsx                  # Loan application (3-step flow)
│   ├── dashboard/page.tsx              # Borrower dashboard
│   ├── dashboard/lender/page.tsx       # Lender dashboard
│   ├── explore/page.tsx                # Pool explorer
│   ├── loan/[loanId]/page.tsx          # Loan detail + repay/accept/cancel
│   ├── profile/[wallet]/page.tsx       # Public borrower profile
│   ├── risk/page.tsx                   # Risk analytics (charts)
│   ├── treasury/page.tsx               # Protocol treasury stats
│   └── api/
│       ├── profile/route.ts            # POST: create profile
│       ├── profile/[wallet]/route.ts   # GET: fetch profile + loans + proofs
│       ├── profile/verify-identity/    # POST: submit KYC
│       ├── loan/request/route.ts       # POST: request a loan
│       ├── loan/repay/route.ts         # POST: repay a loan
│       ├── loan/accept/route.ts        # POST: accept loan offer
│       ├── loan/cancel/route.ts        # POST: cancel loan request
│       ├── loan/[loanId]/route.ts      # GET: fetch single loan
│       ├── pool/all/route.ts           # GET: all pools
│       ├── pool/deposit/route.ts       # POST: deposit liquidity
│       ├── pool/withdraw/route.ts      # POST: withdraw liquidity
│       ├── reputation/[wallet]/        # GET: reputation breakdown
│       ├── treasury/route.ts           # GET: treasury + fees
│       ├── notifications/[wallet]/     # GET/PATCH: notifications
│       └── genlayer/sync/route.ts      # POST: sync GenLayer → Supabase
│
├── components/
│   ├── credit/
│   │   ├── CreditScoreCard.tsx         # SVG arc gauge
│   │   ├── IdentityVerificationPanel.tsx # File upload KYC
│   │   ├── RiskAssessmentPanel.tsx
│   │   ├── ReputationBadge.tsx
│   │   ├── FraudRiskBadge.tsx
│   │   ├── InterestRateCard.tsx
│   │   └── CollateralRequirementCard.tsx
│   ├── loan/
│   │   ├── LoanRequestForm.tsx         # 2-step loan form
│   │   ├── LoanStatusPanel.tsx
│   │   ├── BorrowerProfileCard.tsx
│   │   └── RepaymentTimeline.tsx
│   ├── pool/
│   │   ├── PoolCard.tsx
│   │   └── PoolBoard.tsx
│   ├── dashboard/
│   │   ├── DashboardStats.tsx
│   │   ├── TreasuryPanel.tsx
│   │   ├── GenLayerProofPanel.tsx
│   │   └── NotificationBell.tsx
│   └── layout/
│       ├── Navbar.tsx
│       ├── Footer.tsx
│       ├── WalletProvider.tsx
│       └── ConnectWalletButton.tsx
│
├── contracts/
│   └── credlayer.py                    # GenLayer Intelligent Contract
│
├── lib/
│   ├── genlayer/
│   │   ├── client.ts                   # GenLayer client + per-user key derivation
│   │   └── contract.ts                 # Read/write helpers for all contract methods
│   ├── supabase/
│   │   ├── client.ts                   # Anon + service role clients
│   │   ├── queries.ts                  # All DB CRUD operations
│   │   └── database.types.ts           # Generated Supabase types
│   ├── wagmi/config.ts                 # Wallet connector config
│   ├── validation.ts                   # Zod schemas for all API inputs
│   └── utils.ts                        # formatUSD, hashString, computeProofHash, etc.
│
├── supabase/migrations/
│   ├── 001_initial_schema.sql          # All 10 tables + indexes + triggers
│   ├── 002_rls_policies.sql            # Row Level Security policies
│   └── 003_grants.sql                  # Role privilege grants
│
├── scripts/
│   └── deploy-contract.ts              # GenLayer contract deployment script
│
├── __tests__/
│   ├── api/                            # Zod schema validation tests
│   ├── contracts/                      # Pure contract logic tests
│   └── components/                     # React component + utility tests
│
├── types/index.ts                      # All TypeScript domain types
├── .env.example                        # Environment variable template
└── .env.local                          # Local secrets (gitignored)
```

---

## API Reference

All endpoints return `{ success: boolean, data?: T, error?: string }`.

### Profile

| Method | Endpoint | Body / Params | Description |
|--------|----------|---------------|-------------|
| `POST` | `/api/profile` | `full_name, email_hash, country, occupation, monthly_income_usd, loan_purpose, wallet` | Create borrower profile |
| `GET` | `/api/profile/:wallet` | — | Fetch profile, credit profile, loans, and proofs |
| `POST` | `/api/profile/verify-identity` | `document_type, document_hash, selfie_hash, proof_of_address_hash, wallet` | Submit KYC verification |

### Loans

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/loan/request` | `amount_usd, duration_days, loan_type, purpose, collateral_amount, wallet_age_days, total_transactions, avg_balance_usd, github_contributions, dao_votes, income_documents_hash, wallet` | Request a loan (triggers AI assessment) |
| `GET` | `/api/loan/:loanId` | — | Fetch single loan |
| `POST` | `/api/loan/accept` | `loan_id, wallet` | Accept a conditional loan offer |
| `POST` | `/api/loan/cancel` | `loan_id, wallet` | Cancel a pending loan |
| `POST` | `/api/loan/repay` | `loan_id, amount_usd, wallet` | Make a repayment |

### Pools

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET` | `/api/pool/all` | — | List all liquidity pools |
| `POST` | `/api/pool/deposit` | `pool_id, amount_usd, wallet` | Deposit into a pool |
| `POST` | `/api/pool/withdraw` | `pool_id, amount_usd, wallet` | Withdraw from a pool |

### Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reputation/:wallet` | Reputation breakdown + repayment history |
| `GET` | `/api/treasury` | Treasury stats, protocol fees, pool summary |
| `GET` | `/api/notifications/:wallet` | List notifications |
| `PATCH` | `/api/notifications/:wallet` | Mark notifications as read |
| `POST` | `/api/genlayer/sync` | Sync GenLayer state → Supabase cache |

---

## Local Development

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [GenLayer Studio](https://studio.genlayer.com) account

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/Ifem1/Credlayer.git
cd Credlayer

# 2. Install dependencies
npm install

# 3. Copy and fill environment variables
cp .env.example .env.local
# Edit .env.local with your actual values

# 4. Run database migrations
# Go to https://supabase.com/dashboard/project/<your-ref>/sql/new
# Paste and run supabase/migrations/001_initial_schema.sql
# Then paste and run supabase/migrations/002_rls_policies.sql
# Then paste and run supabase/migrations/003_grants.sql

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in every value:

```env
# GenLayer
GENLAYER_RPC_URL=https://studio.genlayer.com/api
GENLAYER_CHAIN=studionet
GENLAYER_CONTRACT_ADDRESS=0xc0a683EE52676B36a5e2325bca42E12B47f57D47
GENLAYER_OWNER_ADDRESS=0xE3A26A71b2B26aC623A1F1447D28afc6cac0Fb9c
GENLAYER_PRIVATE_KEY=0x_your_server_private_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**`GENLAYER_PRIVATE_KEY`** is a server-side private key used as an HMAC master secret to derive a unique, deterministic GenLayer signing account for each user wallet. Generate one with:
```bash
node -e "const {generatePrivateKey} = require('genlayer-js'); console.log(generatePrivateKey());"
```

---

## Database Setup

Run the three migration files in order in the Supabase SQL editor:

| File | Purpose |
|------|---------|
| `001_initial_schema.sql` | Creates all 10 tables with indexes and `updated_at` triggers |
| `002_rls_policies.sql` | Enables Row Level Security with per-role access policies |
| `003_grants.sql` | Grants table privileges to `anon`, `authenticated`, and `service_role` |

### Tables

| Table | Description |
|-------|-------------|
| `profiles` | Borrower profiles mirrored from GenLayer |
| `credit_profiles` | Credit scores and reputation tiers |
| `loans` | Loan records with full assessment data |
| `repayments` | Individual repayment transactions |
| `risk_assessments` | AI credit assessments per loan |
| `liquidity_pools` | Pool state mirrored from GenLayer |
| `transactions` | On-chain transaction log |
| `notifications` | User notification inbox |
| `audit_logs` | Admin-level audit trail |
| `proofs` | GenLayer proof trail (on-chain verification hashes) |

---

## Deploying the Contract

Use the included deployment script to deploy a new version of the contract to GenLayer:

```bash
# Set your environment variables first
export GENLAYER_RPC_URL=https://studio.genlayer.com/api
export DEPLOYER_ADDRESS=0xYourWalletAddress

npx ts-node --project tsconfig.json scripts/deploy-contract.ts
```

The script will:
1. Read `contracts/credlayer.py`
2. Deploy it to the configured GenLayer endpoint
3. Wait for the deployment transaction to be finalised
4. Print the new contract address
5. Automatically update `GENLAYER_CONTRACT_ADDRESS` in `.env.local`

After deploying, update `GENLAYER_CONTRACT_ADDRESS` in your Vercel environment variables and redeploy.

---

## Deploying to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (first time — sets up project)
vercel

# Add all environment variables
vercel env add GENLAYER_CONTRACT_ADDRESS production
vercel env add GENLAYER_PRIVATE_KEY production
vercel env add GENLAYER_RPC_URL production
vercel env add GENLAYER_CHAIN production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Deploy to production
vercel --prod
```

---

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run a specific suite
npm test -- __tests__/api/profile.test.ts
```

### Test Suites

| Suite | What it covers |
|-------|---------------|
| `__tests__/api/profile.test.ts` | `createProfileSchema` Zod validation |
| `__tests__/api/loan.test.ts` | `loanRequestSchema`, `repayLoanSchema` |
| `__tests__/api/pool.test.ts` | `depositSchema`, `withdrawSchema` |
| `__tests__/contracts/credlayer.test.ts` | Credit tier logic, interest rates, collateral ratios, reputation scoring |
| `__tests__/components/CreditScoreCard.test.tsx` | React component rendering |
| `__tests__/components/utils.test.ts` | `formatUSD`, `hashString`, `shortenAddress`, `creditScoreColor`, etc. |

53 tests, 6 suites, all passing.

---

## Security Notes

- **Files never leave the browser.** KYC document files are hashed client-side using `crypto.subtle.digest("SHA-256")`. Only the hex hash is transmitted.
- **No private keys in the frontend.** All GenLayer transaction signing happens server-side in API routes.
- **Per-user key derivation.** Each user wallet gets a unique GenLayer signing account derived deterministically via `HMAC-SHA256(masterKey, userWallet)`. This enables true multi-user support without storing per-user keys.
- **Row Level Security.** All Supabase tables have RLS enabled. Borrowers can only read their own loans, repayments, and notifications.
- **Zod validation.** Every API route validates its input against a strict Zod schema before touching GenLayer or Supabase.
- **Immutable approvals.** Once a loan offer is approved, the credit terms (`approval_hash`, `approval_timestamp`, `consensus_id`) are locked on-chain and cannot be modified.

---

## License

MIT
