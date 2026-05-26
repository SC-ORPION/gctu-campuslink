"use strict";
/**
 * =============================================================================
 * CampusLink — Immutable Audit Protection Service
 * =============================================================================
 *
 * Provides tamper-evident hash chaining on top of the core AuditLogService.
 * Every audit entry appended to the secured chain receives a SHA-256 hash
 * computed over its content and the previous entry's hash, forming a
 * blockchain-style integrity chain.
 *
 * IMMUTABILITY GUARANTEE
 * ──────────────────────
 * This module intentionally exposes NO methods to:
 *   • delete entries
 *   • modify entries
 *   • clear / reset the chain
 *   • re-order entries
 *
 * Only append operations are permitted. The globalThis backing store is
 * sealed at initialization via Object.seal() on the registry object to
 * prevent property addition/deletion at runtime. Individual chain entries
 * are frozen with Object.freeze() after creation.
 *
 * Any attempt to mutate a frozen SecuredAuditEntry will throw in strict mode
 * and silently fail in sloppy mode — either way the hash chain will detect
 * the inconsistency on the next verifyChainIntegrity() call.
 * =============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImmutableAuditService = void 0;
const crypto_1 = require("crypto");
const GENESIS_HASH = 'GENESIS_BLOCK';
const globalChainRegistry = globalThis;
if (!globalChainRegistry.__campuslink_audit_chain__) {
    globalChainRegistry.__campuslink_audit_chain__ = {
        securedAuditChain: [],
        lastHash: GENESIS_HASH,
        sequenceCounter: 0,
    };
    // Seal the registry object to prevent property addition / deletion.
    Object.seal(globalChainRegistry.__campuslink_audit_chain__);
}
const registry = globalChainRegistry.__campuslink_audit_chain__;
// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------
class ImmutableAuditService {
    // ── Private helpers ──────────────────────────────────────────────────
    /**
     * Compute the SHA-256 hash for a chain entry.
     *
     * The hash covers:
     *   previousHash + sequenceNumber + entry.id + entry.timestamp
     *   + entry.actionType + entry.entityId + JSON.stringify(entry.metadata)
     *
     * Using a deterministic concatenation order ensures any field change
     * invalidates the hash.
     */
    static computeHash(previousHash, sequenceNumber, entry) {
        const payload = [
            previousHash,
            sequenceNumber.toString(),
            entry.id,
            entry.timestamp,
            entry.actionType,
            entry.entityId,
            JSON.stringify(entry.metadata ?? {}),
        ].join('|');
        return (0, crypto_1.createHash)('sha256').update(payload, 'utf8').digest('hex');
    }
    // ── Public API ───────────────────────────────────────────────────────
    /**
     * Append an AuditLogEntry to the secured hash chain.
     *
     * @returns The newly created (and frozen) SecuredAuditEntry.
     */
    static appendToChain(entry) {
        const previousHash = registry.lastHash;
        registry.sequenceCounter += 1;
        const sequenceNumber = registry.sequenceCounter;
        const currentHash = this.computeHash(previousHash, sequenceNumber, entry);
        const secured = {
            originalEntry: entry,
            sequenceNumber,
            previousHash,
            currentHash,
            integrityVerified: true,
        };
        // Freeze the entry to prevent in-memory mutation.
        Object.freeze(secured);
        Object.freeze(secured.originalEntry);
        registry.securedAuditChain.push(secured);
        registry.lastHash = currentHash;
        return secured;
    }
    /**
     * Walk the entire chain and verify every link's hash integrity.
     *
     * Checks performed per entry:
     *   1. Recompute hash from canonical fields — must match `currentHash`.
     *   2. `previousHash` must equal the prior entry's `currentHash`
     *      (or GENESIS_BLOCK for the first entry).
     */
    static verifyChainIntegrity() {
        const chain = registry.securedAuditChain;
        if (chain.length === 0) {
            return { valid: true, details: 'Chain is empty — nothing to verify.' };
        }
        let expectedPreviousHash = GENESIS_HASH;
        for (let i = 0; i < chain.length; i++) {
            const link = chain[i];
            // Check 1 — previousHash linkage
            if (link.previousHash !== expectedPreviousHash) {
                return {
                    valid: false,
                    brokenAtIndex: i,
                    details: `Chain broken at index ${i} (seq #${link.sequenceNumber}): ` +
                        `previousHash mismatch. Expected "${expectedPreviousHash}", ` +
                        `found "${link.previousHash}".`,
                };
            }
            // Check 2 — recompute and compare currentHash
            const recomputed = this.computeHash(link.previousHash, link.sequenceNumber, link.originalEntry);
            if (recomputed !== link.currentHash) {
                return {
                    valid: false,
                    brokenAtIndex: i,
                    details: `Chain broken at index ${i} (seq #${link.sequenceNumber}): ` +
                        `hash mismatch. Stored "${link.currentHash}", ` +
                        `recomputed "${recomputed}". Entry may have been tampered with.`,
                };
            }
            expectedPreviousHash = link.currentHash;
        }
        return {
            valid: true,
            details: `All ${chain.length} entries verified successfully.`,
        };
    }
    /**
     * Return a read-only shallow copy of the full secured chain.
     *
     * Individual entries are already frozen; the returned array is a new
     * reference so callers cannot push/pop on the internal store.
     */
    static getSecuredChain() {
        return [...registry.securedAuditChain];
    }
    /** Return the current number of entries in the chain. */
    static getChainLength() {
        return registry.securedAuditChain.length;
    }
    /** Return the hash of the most recent entry (or GENESIS_BLOCK if empty). */
    static getLatestHash() {
        return registry.lastHash;
    }
}
exports.ImmutableAuditService = ImmutableAuditService;
exports.default = ImmutableAuditService;
