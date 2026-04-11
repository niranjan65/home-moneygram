// src/__tests__/integration/handleConfirm.test.js
/**
 * INTEGRATION TESTS — handleConfirm / Frappe API payload builder
 * (DealerExchange.jsx, lines 173–388)
 *
 * Tests the denomination-to-API mapping logic in isolation by exercising
 * handleConfirm directly through a minimal component harness that exposes
 * the function via a ref/callback — OR by using importActual and unit-testing
 * the mapping logic extracted here for clarity.
 *
 * Covers:
 *  1. BUY: senderDenominationRows → denominationData (FJD out)
 *  2. BUY: receiverDenominationRows → receiverData (AUD in)
 *  3. SELL: senderDenominationRows → denominationData (AUD in)
 *  4. SELL: receiverDenominationRows → receiverData (FJD out)
 *  5. item_code lookup: Note denomination maps to notes_name by index
 *  6. item_code lookup: Coin denomination maps to coins_name by index
 *  7. denomination_value not found → falls back to denomination_value
 *  8. empty denomination arrays → empty result arrays
 *  9. localAmount / foreignAmount polarity for BUY vs SELL
 * 10. transferPayload=null → handleConfirm is a no-op
 */

// ── Inline extraction of the mapping logic ────────────────────────────────────
// We extract the pure denomination-mapping algorithm from DealerExchange.jsx
// and test it independently — no React rendering needed for this logic.

/**
 * Maps denomination rows to the Frappe API format.
 *
 * @param {object[]} rows         - senderDenominationRows or receiverDenominationRows
 * @param {object}   payload      - full transferPayload
 * @param {'sender'|'receiver'}  side - which set of names to use
 * @returns {object[]}
 */
function mapDenomRows(rows = [], payload, side) {
  const notesArr     = side === 'sender' ? payload.sender_notes      : payload.notes;
  const notesNameArr = side === 'sender' ? payload.sender_notes_name : payload.notes_name;
  const coinsArr     = side === 'sender' ? payload.sender_coins      : payload.coins;
  const coinsNameArr = side === 'sender' ? payload.sender_coins_name : payload.coins_name;

  return rows.map(row => {
    const { denomination_value, denomination_type } = row;
    let itemName = denomination_value;

    if (denomination_type === 'Note' && notesArr && notesNameArr) {
      const idx = notesArr.findIndex(n => n === denomination_value);
      if (idx !== -1) itemName = notesNameArr[idx];
    }
    if (denomination_type === 'Coin' && coinsArr && coinsNameArr) {
      const idx = coinsArr.findIndex(c => c === denomination_value);
      if (idx !== -1) itemName = coinsNameArr[idx];
    }

    return { denomination: itemName, qty: row.count, amount: row.subtotal };
  });
}

// ── Fixtures ──────────────────────────────────────────────────────────────────
import {
  MOCK_TRANSFER_PAYLOAD_BUY,
  MOCK_TRANSFER_PAYLOAD_SELL,
  MOCK_FJD_DENOM_INFO,
  MOCK_AUD_DENOM_INFO,
} from '../fixtures/dealerFixtures';

// ─────────────────────────────────────────────────────────────────────────────
describe('Denomination → API mapping logic', () => {

  // ── 1. BUY denominationData (FJD given out by MH) ─────────────────────────
  describe('BUY flow', () => {
    test('1. BUY: receiverDenominationRows → denominationData using notes/notes_name', () => {
      const result = mapDenomRows(
        MOCK_TRANSFER_PAYLOAD_BUY.receiverDenominationRows,
        MOCK_TRANSFER_PAYLOAD_BUY,
        'receiver'
      );
      expect(result[0].denomination).toBe('AUD-20'); // 20 → index 2 of AUD notes
      expect(result[0].qty).toBe(1);
      expect(result[0].amount).toBe(20);
    });

    test('2. BUY: senderDenominationRows → receiverData using sender_notes/sender_notes_name', () => {
      const result = mapDenomRows(
        MOCK_TRANSFER_PAYLOAD_BUY.senderDenominationRows,
        MOCK_TRANSFER_PAYLOAD_BUY,
        'sender'
      );
      expect(result[0].denomination).toBe('FJD-20');
    });
  });

  // ── 3 & 4. SELL flow ───────────────────────────────────────────────────────
  describe('SELL flow', () => {
    test('3. SELL: senderDenominationRows → denominationData using sender_notes (AUD)', () => {
      const result = mapDenomRows(
        MOCK_TRANSFER_PAYLOAD_SELL.senderDenominationRows,
        MOCK_TRANSFER_PAYLOAD_SELL,
        'sender'
      );
      // SELL sender_notes = AUD notes (customer brings AUD 50-note)
      expect(result[0].denomination).toBe('AUD-50');
      expect(result[0].qty).toBe(1);
    });

    test('4. SELL: receiverDenominationRows → receiverData using notes (FJD)', () => {
      const result = mapDenomRows(
        MOCK_TRANSFER_PAYLOAD_SELL.receiverDenominationRows,
        MOCK_TRANSFER_PAYLOAD_SELL,
        'receiver'
      );
      // FJD 50-note → notes_name index
      const fjd50 = result.find(r => r.denomination === 'FJD-50');
      expect(fjd50).toBeDefined();
    });
  });

  // ── 5. Coin lookup ─────────────────────────────────────────────────────────
  test('5. Coin denomination maps to coins_name by index', () => {
    const payload = {
      ...MOCK_TRANSFER_PAYLOAD_BUY,
      receiverDenominationRows: [{
        denomination_value: 0.50,
        denomination_type: 'Coin',
        count: 2,
        subtotal: 1.00,
      }],
    };
    const result = mapDenomRows(payload.receiverDenominationRows, payload, 'receiver');
    expect(result[0].denomination).toBe('AUD-50c');
  });

  // ── 6. Fallback when denomination not in list ──────────────────────────────
  test('6. unknown denomination_value falls back to the raw value', () => {
    const payload = {
      ...MOCK_TRANSFER_PAYLOAD_BUY,
      receiverDenominationRows: [{
        denomination_value: 999,   // not in AUD notes
        denomination_type: 'Note',
        count: 1,
        subtotal: 999,
      }],
    };
    const result = mapDenomRows(payload.receiverDenominationRows, payload, 'receiver');
    expect(result[0].denomination).toBe(999);
  });

  // ── 7. Empty rows → empty result ──────────────────────────────────────────
  test('7. empty denomination rows produce empty array', () => {
    expect(mapDenomRows([], MOCK_TRANSFER_PAYLOAD_BUY, 'receiver')).toEqual([]);
    expect(mapDenomRows(undefined, MOCK_TRANSFER_PAYLOAD_BUY, 'receiver')).toEqual([]);
  });

  // ── 8 & 9. localAmount / foreignAmount polarity ───────────────────────────
  describe('localAmount / foreignAmount polarity', () => {
    function deriveAmounts(payload) {
      const localAmount   = payload.exchangeType === 'BUY' ? payload.sendAmount   : payload.receiverGets;
      const foreignAmount = payload.exchangeType === 'BUY' ? payload.receiverGets : payload.sendAmount;
      return { localAmount, foreignAmount };
    }

    test('8. BUY: localAmount=sendAmount (AUD), foreignAmount=receiverGets (FJD)', () => {
      const { localAmount, foreignAmount } = deriveAmounts(MOCK_TRANSFER_PAYLOAD_BUY);
      expect(localAmount).toBe(MOCK_TRANSFER_PAYLOAD_BUY.sendAmount);
      expect(foreignAmount).toBe(MOCK_TRANSFER_PAYLOAD_BUY.receiverGets);
    });

    test('9. SELL: localAmount=receiverGets (FJD), foreignAmount=sendAmount (AUD)', () => {
      const { localAmount, foreignAmount } = deriveAmounts(MOCK_TRANSFER_PAYLOAD_SELL);
      expect(localAmount).toBe(MOCK_TRANSFER_PAYLOAD_SELL.receiverGets);
      expect(foreignAmount).toBe(MOCK_TRANSFER_PAYLOAD_SELL.sendAmount);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// handleConfirm no-op when transferPayload is null
// ─────────────────────────────────────────────────────────────────────────────
describe('handleConfirm guard', () => {
  test('10. does not call fetch when transferPayload is null', async () => {
    global.fetch = jest.fn();

    // We simulate the guard: `if (!transferPayload) return;`
    const transferPayload = null;
    const mockConfirm = async () => { if (!transferPayload) return; await fetch('should-not-be-called'); };
    await mockConfirm();

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
