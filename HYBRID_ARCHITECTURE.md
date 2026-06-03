# HUDUMALINK KENYA: HYBRID FIREBASE + POSTGRESQL FINTECH ARCHITECTURE
## Enterprise-Grade Escrow & Financial Ledger Specification

---

## 1. Complete System Architecture

To meet stringent auditability, double-entry accounting integrity, and transactional security requirements without sacrificing the rapid prototyping speed of Firebase, HudumaLink implements a **Hybrid FinTech Architecture**. 

- **Firebase (Superset)** manages the dynamic marketplace ecosystem (listings, messaging, notifications, public profiles) where unstructured, noisy web actions require fast reads and real-time subscription streams.
- **Supabase/PostgreSQL (Core)** acts as the financial transactional system of record (wallets, double-entry ledgers, escrow lockers, and withdrawal tracking) where multi-row transactions, foreign keys, constraints, and relational consistency are strictly mandatory.

```
                         +-----------------------+
                         |  React Frontend client |
                         +-----------------------+
                           /                   \
            (Real-time Streams)             (HTTPS Rest APIs)
                   /                                   \
                  v                                     v
       +--------------------+               +-----------------------+
       |   Firebase SDK     |               |    Express API Node    |
       |  - Auth (Tokens)   |               |   - verifyUser ()     |
       |  - Chats / Messages|               |   - Rate Limiter      |
       |  - Notifications   |               |   - Controllers       |
       |  - Public Profiles |               +-----------------------+
       +--------------------+                 /                   \
                                             /                     \
                      (Admin SDK Actions)   /                       \ (PG Client / Prisma)
                                           v                         v
                                   +---------------+       +-----------------------+
                                   | Firestore DB  |       | Supabase PostgreSQL   |
                                   | - Listings    |       | - Double-Entry Ledger |
                                   | - Reviews     |       | - Wallets & Balances  |
                                   | - Static CMS  |       | - Escrow Lockers      |
                                   +---------------+       | - Payout Logs & DLQ   |
                                                           +-----------------------+
                                                                       |
                                                               (API Integration)
                                                                       |
                                                                       v
                                                           +-----------------------+
                                                           | M-Pesa Daraja Gateway |
                                                           | - STK Push (Deposits) |
                                                           | - B2C API (Payouts)   |
                                                           +-----------------------+
```

### Component Interoperability
1. **Authentication Token Parsing**: The React Frontend logs in via Firebase Auth, receives an ID token, and attaches it in the HTTP headers as a Bearer Token (`Authorization` header).
2. **Session Verification inside Express**: The Express Gateway decodes this token using `firebase-admin` to confirm user identity (`req.user.uid`), and queries PostgreSQL using this verified Firebase UID as the relational primary key in the fintech database.
3. **Write Isolation**: No financial operation (escrow funding, payouts, wallet updates) can be initialized via the Firestore client SDK. All write mutations occur exclusively through Express routes communicating directly with PostgreSQL under acid transactions.

---

## 2. Firebase Collections to Keep

The following collections are retained in Firestore, preserving the lightweight, low-latency, and real-time functionality of the marketplace:

| Collection Name | Purpose | Retention Reason |
| :--- | :--- | :--- |
| `users_public` | Non-financial profiles, skills, locations, and bios. | Allows fast, open search profiles and indexing without load on SQL financials. |
| `listings` | Goods, micro-gigs, and service listings across 47 counties. | No SQL relations needed for classified details; media lists fit document structures. |
| `services` | Freelance & artisan hourly/milestone service listings. | Allows dynamic service attributes, descriptions, and categories. |
| `reviews` | Buyer comments, scores, and trust ratings. | Open-ended reads, fits hierarchical nesting; easily cached globally. |
| `chats` | Chat session lists and channels. | Leverages Firestore’s built-in socket sync mechanism for instantaneous messaging. |
| `messages` | Chat room messages, payloads, and system transcripts. | Supports sub-second chat updates between buyers and sellers out-of-the-box. |
| `notifications` | In-app notification feeds and UI banners. | Instant client-side triggers via snapshot listeners without short polling. |
| `favorites` | User bookmarks and saved service providers. | Purely client layout preferences, zero-audit value, high volume writes. |

---

## 3. PostgreSQL Tables to Create

Implemented as production-grade SQL with indexes, constraints, and audit trails.

```sql
-- Enable UUID and Decimal functions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. WALLETS (User Escrow Balances & Ledgers)
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(128) NOT NULL UNIQUE, -- Maps directly to Firebase Auth UID
    currency VARCHAR(3) NOT NULL DEFAULT 'KES',
    available_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00 CHECK (available_balance >= 0),
    held_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00 CHECK (held_balance >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wallets_user_id ON wallets(user_id);

-- 2. TRANSACTIONS (Master transaction registry)
CREATE TYPE transaction_type AS ENUM ('mpesa_deposit', 'escrow_hold', 'escrow_release', 'withdrawal', 'fee_deduction', 'refund');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed');

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    fee DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    type transaction_type NOT NULL,
    status transaction_status NOT NULL DEFAULT 'pending',
    reference_id VARCHAR(128) UNIQUE, -- M-PesaReceiptNumber, Ledger ID or External ID
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. ESCROWS (System holdings escrow registry)
CREATE TYPE escrow_status AS ENUM ('pending', 'funded', 'in_progress', 'submitted', 'released', 'disputed', 'refunded');

CREATE TABLE escrows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_transaction_id UUID REFERENCES transactions(id),
    buyer_id VARCHAR(128) NOT NULL REFERENCES wallets(user_id) ON DELETE RESTRICT,
    seller_id VARCHAR(128) NOT NULL REFERENCES wallets(user_id) ON DELETE RESTRICT,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    commission_fee DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    status escrow_status NOT NULL DEFAULT 'pending',
    release_date TIMESTAMP WITH TIME ZONE,
    auto_release_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_escrows_buyer_id ON escrows(buyer_id);
CREATE INDEX idx_escrows_seller_id ON escrows(seller_id);
CREATE INDEX idx_escrows_status ON escrows(status);

-- 4. DOUBLE-ENTRY LEDGER ENTRIES (System immutable records)
CREATE TYPE ledger_account AS ENUM ('buyer_deposit', 'escrow_locker', 'vendor_available', 'platform_commission', 'mpesa_clearing');
CREATE TYPE entry_direction AS ENUM ('debit', 'credit');

CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
    account ledger_account NOT NULL,
    direction entry_direction NOT NULL,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ledger_transaction ON ledger_entries(transaction_id);

-- 5. WITHDRAWALS (M-Pesa B2C vendor payouts)
CREATE TYPE withdrawal_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'retry_queued');

CREATE TABLE withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    processing_fee DECIMAL(15, 2) NOT NULL DEFAULT 15.00,
    phone_number VARCHAR(15) NOT NULL, -- Destination Safaricom No.
    status withdrawal_status NOT NULL DEFAULT 'pending',
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    daraja_conversation_id VARCHAR(128),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. DISPUTES
CREATE TYPE dispute_status AS ENUM ('opened', 'under_review', 'resolved_refunded', 'resolved_released');

CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escrow_id UUID NOT NULL REFERENCES escrows(id) ON DELETE RESTRICT,
    reporter_id VARCHAR(128) NOT NULL,
    reason TEXT NOT NULL,
    evidence_urls TEXT[],
    status dispute_status NOT NULL DEFAULT 'opened',
    assigned_admin VARCHAR(128),
    resolution_details TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. REFUNDS
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escrow_id UUID NOT NULL REFERENCES escrows(id) ON DELETE RESTRICT,
    dispute_id UUID REFERENCES disputes(id),
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. COMMISSIONS (Platform Earnings Accounting)
CREATE TABLE commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escrow_id UUID NOT NULL REFERENCES escrows(id),
    total_amount DECIMAL(15, 2) NOT NULL,
    commission_percentage DECIMAL(5, 2) NOT NULL,
    commission_earned DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. KYC STATUS HISTORY & TRANSITIONS (Identity Registry)
CREATE TYPE kyc_action AS ENUM ('submitted', 'approved', 'rejected');

CREATE TABLE kyc_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(128) NOT NULL,
    action kyc_action NOT NULL,
    performed_by VARCHAR(128) REFERENCES wallets(user_id), -- Admin uid
    rejection_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Double-Entry Ledger Design

In fintech, we **never edit** user balance fields directly using mathematical overrides in isolated update operations. Doing so leads to race conditions, currency duplication, and un-auditable discrepancy holes. Instead, wallets balances are derived as the sum of credit and debit journals in a double-entry ledger.

To guarantee reliability, we assert:
$$\text{Sum of All Debits} = \text{Sum of All Credits}$$

### Account Structuring
- **`buyer_deposit`**: Active capital stored by the system allocated for specific listings.
- **`escrow_locker`**: Internal systemic vault keeping active disputes and unreleased milestones.
- **`vendor_available`**: Settled funds withdrawable by providers.
- **`platform_commission`**: Corporate fee revenue.
- **`mpesa_clearing`**: Reconciliation transient clearing line.

### Flow Example: Buying a Service for KES 5,000 (10% Platform fee is KES 500)
Every escrow status change triggers dual entries in an single SQL transaction block:

#### Phase A: Buyer deposits funding for Escrow (KES 5,000)
1. **DR** `mpesa_clearing` (KES 5,000)
2. **CR** `buyer_deposit` (KES 5,000)

#### Phase B: Buyer signs contract, lock funds in Escrow
1. **DR** `buyer_deposit` (KES 5,000)
2. **CR** `escrow_locker` (KES 5,000)

#### Phase C: Escrow Release (Milestone completed)
1. **DR** `escrow_locker` (KES 5,000)
2. **CR** `vendor_available` (KES 4,500) — Net Earnings
3. **CR** `platform_commission` (KES 500) — System Earnings

### Balance Calculation Database Integrity Check
To verify current wallet statuses, a trigger executes dynamic balance reconciliation. The database continuously verifies that:
$$\text{wallet.available\_balance} = \sum (\text{credits in vendor\_available}) - \sum (\text{debits in vendor\_available})$$

If a discrepancy occurs from manual DB interference, all wallet activities lock immediately.

---

## 5. Escrow State Machine

The escrow ledger implements strict state flows. Every transition produces a system ledger entry.

```
       +------------------+
       |   1. PENDING     | (Escrow created, waiting on Daraja STK callback)
       +------------------+
               |
               | (M-Pesa STK Success Received)
               v
       +------------------+
       |    2. FUNDED     | (Capital secured in system escrow_locker account)
       +------------------+
               |
               | (Provider starts task / Commenced click)
               v
       +------------------+
       |  3. IN_PROGRESS  | (Contractor executes work)
       +------------------+
               |
               | (Provider submits deliverable with evidence)
               v
       +------------------+
       |   4. SUBMITTED   | (Clock begins on 72-hour auto-release)
       +------------------+
          /          \         \
         /            \         \ (Buyer raises Issue within 72 hrs)
        /              \         v
       |                |      +------------------+
       | (Release Click)|      |   5. DISPUTED    | (Milestone locked / Admin review)
       |                |      +------------------+
       v                v           /            \
 +--------------+  +-------------+ /              \
 | 6. RELEASED  |  | 7. REFUNDED |<     (Refund)   > (Admin Release Decision)
 +--------------+  +-------------+                 \
       |                 |                          v
       | (Clear Hold)    |                    +--------------+
       v                 v                     | 6. RELEASED  |
 +------------------+                      +--------------+
 | 8. WITHDRAWABLE  |
 +------------------+
```

### Auto-Release Rules
- **Submit action sets standard time constraint**: `auto_release_at = NOW() + INTERVAL '72 hours'`.
- A daily background worker in Node.js queries the PostgreSQL databases for any escrow where `status = 'submitted'` and `auto_release_at <= NOW()`.
- Express processes an automatic atomic double-entry transition to **RELEASED** and unlocks vendor payouts.

---

## 6. M-Pesa Integration Design

Integrating the Safaricom Daraja API with full error-proofing, callback queues, and idempotency guarantees.

```
+------------+                  +---------------+                  +-------------------+
|  Consumer  | -- STK Initi --> | HudumaLink API | -- STK Push ---> | Safaricom Gateway |
+------------+                  +---------------+                  +-------------------+
                                        |                                    |
                                        | (Returns CheckoutID)               | (M-Pesa Processing)
                                        |                                    |
                                        v                                    v
                                +----------------+                 +-------------------+
                                | Checkouts Table|                 |   Safaricom API   |
                                +----------------+                 +-------------------+
                                                                             |
                                                                             | (Asynchronous HTTP Post)
                                                                             v
                                                                   +-------------------+
                                                                   | Callback Listener |
                                                                   +-------------------+
                                                                             |
                                          Is Duplicate Check? / Idempotent  |
                                                                             v
                                                                 +-----------------------+
                                                                 |  Success/Failure Flow |
                                                                 +-----------------------+
```

### Callback Processing & Duplicate Prevention
Safaricom Daraja often sends duplicate webhook calls under varying connection stress. HudumaLink prevents double-booking using the following techniques:

1. **Transaction ID Locking**: Using a unique SQL constraint on transaction reference IDs (`reference_id`).
2. **Two-phase lock (2PL)**: Before updating transactional state, the service runs:
   ```sql
   SELECT status FROM transactions WHERE reference_id = :CheckoutRequestID FOR UPDATE;
   ```
   If the status is already updated from `'pending'`, the system ignores subsequent callback alerts immediately.

### Dead Letter Queue (DLQ)
If a payout callback fails because of a timeout or systemic breakdown, the record is flagged inside PostgreSQL:
```sql
UPDATE withdrawals 
SET status = 'retry_queued', 
    error_message = :err, 
    updated_at = NOW() 
WHERE id = :withdrawalId;
```
A Cron Job reads this queue periodically to auto-retry before flagging for manual Admin verification.

---

## 7. Firebase to PostgreSQL Synchronization

### User Mapping Protocol
PostgreSQL references individual actors by a stable `user_id` mapped directly to their unique Firebase Auth UID string. This allows complete lookup parity between Supabase query tables and Firestore document stores.

```
+-------------------------------------------------+
|               FIREBASE AUTHENTICATION            |
|                  Uid: xiPQnBjC...               |
+-------------------------------------------------+
                         |
                 (Direct Parity Sync)
                         v
+-------------------------------------------------+
|               POSTGRESQL WALLETS                |
|           user_id (VARCHAR): xiPQnBjC...        |
+-------------------------------------------------+
```

### Sync Service Architecture
To create matching PostgreSQL records, two processes execute:
1. **Real-time Gateway Sync Hook**: When a client successfully establishes an account on Firebase via the UI, the frontend issues a `POST /api/wallets/create` call with their Auth token. Express validates the token and runs:
   ```sql
   INSERT INTO wallets (user_id) VALUES (:verified_uid) ON CONFLICT (user_id) DO NOTHING;
   ```
2. **Dynamic Lazy-Creation Fallback**: If a legacy user is authenticated but has no PostgreSQL footprint because of previous architectural phases, the transactional server automatically provisions a ledger footprint before proceeding with payment calls.

### Account Erasing (Storage vs Auth vs Firestore)
It is crucial to understand the partition between storage assets and database records when auditing user states:
- **Firebase Storage**: Retains only uploaded blobs (images, KYC photo documents). Removing files from folders does *not* delete user databases.
- **Firebase Auth**: Identifies registration status. Accounts deleted from Auth will trigger errors on token decoding.
- **Firestore Users / PostgreSQL Wallets**: Retains transactional historical traces. To fully deactivate user accounts under compliance audits:
  1. Terminate user inside of Firebase Auth.
  2. Flag User Database records with `is_deleted = TRUE` to preserve audit records for compliance. **Never run hard DELETE actions on financial records!**

---

## 8. Business Analytics Engine

To support real-time Vendor metrics, Supabase queries live database tables rather than polling Firestore arrays.

### 1. Vendor Gross & Net Revenue Tracker
```sql
SELECT 
    seller_id,
    SUM(amount) AS gross_revenue_kes,
    SUM(commission_fee) AS platform_fees_paid,
    SUM(amount - commission_fee) AS net_revenue_kes
FROM escrows
WHERE status = 'released' AND seller_id = :VendorID
GROUP BY seller_id;
```

### 2. Provider Health Tracker (Completed vs Disputed Conversion Rate)
```sql
SELECT 
    seller_id,
    COUNT(CASE WHEN status = 'released' THEN 1 END) AS completed_orders,
    COUNT(CASE WHEN status = 'disputed' THEN 1 END) AS disputed_orders,
    (COUNT(CASE WHEN status = 'disputed' THEN 1 END)::FLOAT / NULLIF(COUNT(*), 0) * 100) AS dispute_rate_percentage
FROM escrows
WHERE seller_id = :VendorID
GROUP BY seller_id;
```

---

## 9. Fraud Detection System

Fintech applications are targets for velocity abuse, multiple wallet scams, and chargeback scams.

```
                                  +--------------------+
                                  |  Incoming Payout   |
                                  +--------------------+
                                            |
                                            v
                                +----------------------+
                                |   Velocity Check     | --- Count in last 1H > 3? ---> [REJECT & FLAG]
                                +----------------------+
                                            |
                                            v
                                +----------------------+
                                | Multiple Wallet Sync | --- Matching device IDs? -----> [REJECT & LOCK]
                                +----------------------+
                                            |
                                            v
                                +----------------------+
                                |   Escrow Ratio Check | --- Dispute Rate > 15%? ------> [HOLD TRANS]
                                +----------------------+
                                            |
                                            v
                                   [Transaction Success]
```

### Fraud Assessment Logic
- **Frequency (Velocity) Control**: Locks any wallet initiating more than 3 withdrawal payouts within an hour.
- **Device Fingerprint Auditing**: Captures client hardware hashes (`canvas` fingerprints, browser details) and logs them inside of PostgreSQL metadata fields. If three different User IDs use identical device hashes to withdraw money, all associated accounts are locked automatically under suspicion of Sybil activities.
- **Dispute Ratio Lockup**: If a vendor's dispute rate exceeds 15% over their last 20 orders, the system automatically redirects incoming settlements to hold lockups for manual admin mediation.

---

## 10. Cost Optimization Analysis

Moving high-frequency transactional data away from Firestore to a hybrid model avoids the "Firestore Read/Write Cliff" as the platform expands.

### Scaling Read / Write Comparison

| Scale Unit | Firebase Firestore (Only) | Hybrid Model (Firestore + PostgreSQL) | Projected Cost Reduction |
| :--- | :--- | :--- | :--- |
| **10,000 Users** | 3,000,000 Monthly DB reads/writes | 600,000 Reads (Marketplace only) | **50% Costs saved** from DB write reductions |
| **100,000 Users**| 30,000,000 Reads / Writes | 6,000,000 Marketplace reads & writes | **75% Costs saved** by handling transaction logs inside SQL |
| **1,000,000 Users**| 300,000,000 Reads / Writes ($450/month) | 60,000,000 Docs + Supabase Basic DB ($25/mo) | **Over 85% reduction** in direct Firebase usage billing |

---

## 11. Implementation Roadmap

A phased, zero-downtime transition to a PostgreSQL-backed transactional ledger.

```
  PHASE 1 (Week 1)          PHASE 2 (Week 2)          PHASE 3 (Week 3)          PHASE 4 (Week 4)
+------------------+      +------------------+      +------------------+      +------------------+
| Spin up Supabase | ---> | User Wallets DB  | ---> | Escrow Migration | ---> | Daraja & Payouts |
| PostgreSQL schema|      | and Sync hooks   |      | & Stage Engine   |      | switch to PG     |
+------------------+      +------------------+      +------------------+      +------------------+
                                                                                       |
                                                                                       v
                                                                              +------------------+
                                                                              | Phase 5 & 6      |
                                                                              | Ledger Audit &   |
                                                                              | full production  |
                                                                              +------------------+
```

### Phase Transition Matrix
1. **Phase 1: Database Setup**: Provision a Supabase PostgreSQL node; create relational tables with core indices.
2. **Phase 2: Wallet Provisioning**: Run backfill migrations to populate PostgreSQL wallet IDs for existing active Firebase users.
3. **Phase 3: Dual-Write Escrows**: Configure the Express API. Write transaction entries to both Firebase collections and the PostgreSQL `escrows` table simultaneously to ensure logging parity.
4. **Phase 4: Payment Switchover**: Move the M-Pesa Daraja callback listeners to insert directly into PostgreSQL. Set PostgreSQL as the ultimate source of truth for all ledger balances.
5. **Phase 5: Financial Accounting Activation**: Enable the Ledger Posting audit engines.
6. **Phase 6: Production Cleanup**: Deprecate write permissions for money attributes on Firestore. Turn off dual-writes and finalize the migration.
