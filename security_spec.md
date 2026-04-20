# Security Specification for HudumaLink Kenya

## Data Invariants
1. A Listing cannot exist without a valid User ID (author).
2. A Transaction must reference a Listing, a Buyer, and a Seller.
3. A User can only withdraw funds if they have an Escrow Balance >= the requested amount.
4. KYC sensitive data is strictly isolated and only accessible to the owner and admins.
5. Account status fields (isVerified, isFlagged, escrowBalance) are immutable by the owner; only admins or system logic can change them.

## The "Dirty Dozen" Payloads (Red Team Audit)
1. **Identity Spoofing**: Attempt to create a listing as another user. (`authorId` != `auth.uid`)
2. **Privilege Escalation**: Attempt to update own user profile to set `role: 'admin'`.
3. **Ghost Update**: Update a completed transaction status back to `pending`.
4. **Balance Hijack**: Add `escrowBalance: 1000000` to own profile via `update()`.
5. **ID Poisoning**: Inject a 2KB string as a `listingId` to hit storage limits.
6. **PII Leak**: Fetch another user's KYC documents using their `userId`.
7. **Bypass Moderation**: Update a `removed` listing status back to `active` without admin review.
8. **Self-Review**: Create a review for a listing where the user is the author.
9. **Fake M-Pesa Request**: Create a transaction as `status: 'deposited'` without any system verification check (actually impossible with client-only rules, but rules must limit who can set this status).
10. **Shadow Field Injection**: Add `isAdmin: true` to a listing document.
11. **Negative Withdrawal**: Request a withdrawal of KES -1000.
12. **Status Shortcutting**: Release escrow funds on a transaction that is still `pending` deposit.

## Verification Workflow
- These rules will be implemented with strict `affectedKeys().hasOnly()` gates.
- All IDs will be limited in size and regex-checked.
- Sensitive fields will be locked behind `isAdmin()` or checked for immutability.
