class CreditCardRecognizer {
  static PATTERNS = [
    {
      name: "Visa",
      regex: /^4\d{12}(\d{3})?$/,
      type: "VISA",
    },
    {
      name: "Mastercard",
      regex: /^5[1-5]\d{14}$/,
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
    this.replacementPairs = replacementPairs || [
      ["-", ""],
      [" ", ""],
    ];
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

  validate(patternText) {
    const sanitized = this.sanitizeValue(patternText);

    const cardType = this.detectCardType(sanitized);
    const isValid = this.luhnChecksum(sanitized);

    return {
      input: patternText,
      sanitized,
      isValid,
      cardType: cardType.type,
      cardName: cardType.name,
    };
  }
}

export default CreditCardRecognizer;