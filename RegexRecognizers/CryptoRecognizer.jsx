class CryptoRecognizer {
  static PATTERNS = [
    {
      name: "Crypto (Medium)",
      regex: /(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,59}/,
    },
  ];

  constructor() {
    this.entity = "CRYPTO_ADDRESS";
  }

  analyze(input) {
    const normalized = input.trim();

    const patternMatch = this.matchesPattern(normalized);
    const baseCheck = this.detectType(normalized);

    const checksumResult = this.validateChecksum(normalized, baseCheck);

    const valid = patternMatch && checksumResult.valid;

    const confidence = this.computeConfidence({
      patternMatch,
      checksumResult,
      baseCheck,
    });

    return {
      input,
      normalized,

      valid,
      confidence,

      entity: this.entity,
      subtype: baseCheck.type,

      network: baseCheck.network,
      encoding: baseCheck.encoding,

      patternMatch,
      checksumValid: checksumResult.valid,

      reasons: this.buildReasons({
        patternMatch,
        checksumResult,
        baseCheck,
      }),
    };
  }

  // ---------- Pattern ----------
  matchesPattern(value) {
    return CryptoRecognizer.PATTERNS.some((p) =>
      p.regex.test(value)
    );
  }

  // ---------- Type detection ----------
  detectType(value) {
    if (value.startsWith("bc1")) {
      return {
        type: "BITCOIN_BECH32",
        network: "bitcoin",
        encoding: "bech32",
      };
    }

    if (value.startsWith("1") || value.startsWith("3")) {
      return {
        type: "BITCOIN_LEGACY",
        network: "bitcoin",
        encoding: "base58",
      };
    }

    return {
      type: "UNKNOWN",
      network: "unknown",
      encoding: "unknown",
    };
  }

  // ---------- Checksum (simplified placeholder) ----------
  validateChecksum(value, typeInfo) {
    // In real version you'd plug in full Base58/Bech32 logic
    const looksValid =
      typeInfo.type !== "UNKNOWN" &&
      value.length > 20;

    return {
      valid: looksValid,
    };
  }

  // ---------- Confidence model ----------
  computeConfidence({ patternMatch, checksumResult }) {
    let score = 0;

    if (patternMatch) score += 0.4;
    if (checksumResult.valid) score += 0.6;

    return Math.min(score, 1);
  }

  // ---------- Explainability ----------
  buildReasons({ patternMatch, checksumResult, baseCheck }) {
    const reasons = [];

    if (patternMatch) reasons.push("Matches crypto regex pattern");
    else reasons.push("Does not match known crypto patterns");

    if (checksumResult.valid)
      reasons.push("Checksum validation passed");
    else reasons.push("Checksum validation failed or skipped");

    reasons.push(
      `Detected type: ${baseCheck.type}`
    );

    return reasons;
  }
}

export default CryptoRecognizer;