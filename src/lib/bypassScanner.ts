/**
 * Sanitizes chat messages against off-platform escrow-bypass and payment coordination fraud vectors.
 * Flags phone numbers, Paybill/Till coordinates, and off-channel referral redirects like WhatsApp.
 */
export interface ScanResult {
  isBlocked: boolean;
  maskedText: string;
  foundPattern: string | null;
}

export function scanForBypassFraud(text: string): ScanResult {
  const lowercaseText = text.toLowerCase();
  
  // High-fidelity regex models
  const phonePattern = /(?:(?:\+?254|0)[17]\d{8})/g;
  const paybillTillPattern = /(?:till\s*(?:no\.?|number)?\s*(?:is)?\s*\d{5,7})|(?:paybill\s*(?:no\.?|number)?\s*(?:is)?\s*\d{5,7})/i;
  const genericNumberSeq = /\b\d{5,10}\b/g;
  const socialBypassKeywords = /\b(whatsapp|telegram|tele|insta|fb|facebook|viber|signal|nipigie|tuma kwa hii|tuma kwa namba|pay directly|tuma direct|bypass|off-platform|direct payout|m-pesa direct)\b/i;

  let isBlocked = false;
  let foundPattern: string | null = null;
  let cleanText = text;

  // 1. Kenyan Phone Number Inspection
  if (phonePattern.test(text)) {
    isBlocked = true;
    foundPattern = "Phone number exposure";
    cleanText = cleanText.replace(phonePattern, "[REDACTED PHONE NUMBER]");
  }

  // 2. Till / Paybill Bypass Strings
  if (paybillTillPattern.test(text)) {
    isBlocked = true;
    foundPattern = "Till / Paybill coordination bypass";
    cleanText = cleanText.replace(paybillTillPattern, "[REDACTED ESCROW BYPASS DETAILS]");
  }

  // 3. Generic Numerical Coordinate Extraction with contextual reinforcement
  if (genericNumberSeq.test(text)) {
    const contextTerms = ["pay", "till", "send", "tuma", "namba", "pesa", "shilingi", "cash", "mpesa", "buy", "direct", "checkout", "deposit"];
    const hasContext = contextTerms.some(term => lowercaseText.includes(term));
    if (hasContext) {
      isBlocked = true;
      foundPattern = "Numerical coordinate layout";
      cleanText = cleanText.replace(genericNumberSeq, "[REDACTED COORD]");
    }
  }

  // 4. Remote Communication redirects
  if (socialBypassKeywords.test(text)) {
    isBlocked = true;
    const match = text.match(socialBypassKeywords);
    foundPattern = `Off-platform redirection: "${match ? match[0] : 'bypass redirect'}"`;
    cleanText = cleanText.replace(socialBypassKeywords, "[REDACTED CONTACT REF]");
  }

  return { isBlocked, maskedText: cleanText, foundPattern };
}
