class CreditCardRecognizer {
  static CANDIDATE_REGEX =
    /\b(?:\d[ -]*?){13,19}\b/g; // captures 13–19 digit sequences with spaces/dashes

  static PATTERNS = [
    {
      name: "Visa",
      regex: /^4\d{12}(\d{3})?$/,
      type: "VISA",
    },
    {
      name: "Mastercard",
      regex: /^(5[1-5]\d{14}|2(2[2-9]\d{2}|[3-6]\d{3}|7[01]\d{2}|720)\d{12})$/,
      type: "MASTERCARD",
    },
    {
      name: "Amex",
      regex: /^3[47]\d{13}$/,
      type: "AMEX",
    },
    {
      name: "Discover",
      regex: /^6(?:011|5\d{2})\d{12}$/,
      type: "DISCOVER",
    },
  ];

  constructor({ replacementPairs = null } = {}) {
    this.entity = "CREDIT_CARD";

    this.replacementPairs = replacementPairs || [
      ["-", ""],
      [" ", ""],
    ];
  }

  recognize(text) {
    const results = [];

    const matches = text.matchAll(CreditCardRecognizer.CANDIDATE_REGEX);

    for (const match of matches) {
      const raw = match[0];
      const sanitized = this.sanitizeValue(raw);

      if (!/^\d{13,19}$/.test(sanitized)) continue;

      const cardType = this.detectCardType(sanitized);
      const luhnValid = this.luhnChecksum(sanitized);

      const confidence = this.computeConfidence({
        cardType,
        luhnValid,
      });

      results.push({
        entity: this.entity,
        match: raw,

        start: match.index,
        end: match.index + raw.length,

        sanitized,

        confidence,
        valid: luhnValid && cardType.type !== "UNKNOWN",

        cardType: cardType.type,
        cardName: cardType.name,

        checksumValid: luhnValid,

        reasons: this.buildReasons({
          cardType,
          luhnValid,
        }),
      });
    }

    return this.resolveOverlaps(results);
  }

  sanitizeValue(text) {
    let result = text;
    this.replacementPairs.forEach(([target, replacement]) => {
      result = result.split(target).join(replacement);
    });
    return result;
  }

  detectCardType(number) {
    for (const pattern of CreditCardRecognizer.PATTERNS) {
      if (pattern.regex.test(number)) {
        return {
          type: pattern.type,
          name: pattern.name,
        };
      }
    }
    return {
      type: "UNKNOWN",
      name: "Unknown",
    };
  }

  luhnChecksum(value) {
    const digits = value.split("").map((d) => parseInt(d, 10));

    let sum = 0;
    let shouldDouble = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = digits[i];

      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  }

  computeConfidence({ cardType, luhnValid }) {
    let score = 0;

    if (cardType.type !== "UNKNOWN") score += 0.5;
    if (luhnValid) score += 0.5;

    return Math.min(score, 1);
  }

  buildReasons({ cardType, luhnValid }) {
    const reasons = [];

    if (cardType.type !== "UNKNOWN")
      reasons.push(`Matches ${cardType.name} pattern`);
    else reasons.push("No known card pattern match");

    if (luhnValid)
      reasons.push("Luhn checksum passed");
    else reasons.push("Luhn checksum failed");

    return reasons;
  }

  resolveOverlaps(results) {
    results.sort((a, b) => {
      if (b.confidence !== a.confidence)
        return b.confidence - a.confidence;
      return (b.end - b.start) - (a.end - a.start);
    });

    const final = [];

    for (const candidate of results) {
      const overlaps = final.some(existing =>
        !(candidate.end <= existing.start || candidate.start >= existing.end)
      );

      if (!overlaps) {
        final.push(candidate);
      }
    }

    return final.sort((a, b) => a.start - b.start);
  }
}


export default CreditCardRecognizer;