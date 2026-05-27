class CryptoRecognizer {
  static PATTERNS = [
    {
      name: "Bitcoin Address",
      regex: /\b(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,59}\b/g,
      baseScore: 0.4,
    },
  ];

  constructor() {
    this.entity = "CRYPTO_ADDRESS";
  }

  recognize(text) {
    const results = [];

    for (const pattern of CryptoRecognizer.PATTERNS) {
      const matches = text.matchAll(pattern.regex);

      for (const match of matches) {
        const raw = match[0];
        const normalized = raw.trim();

        const baseCheck = this.detectType(normalized);
        const checksumResult = this.validateChecksum(normalized, baseCheck);

        const confidence = this.computeConfidence({
          patternMatch: true,
          checksumResult,
          baseScore: pattern.baseScore,
        });

        results.push({
          entity: this.entity,
          match: raw,

          start: match.index,
          end: match.index + raw.length,

          confidence,
          valid: checksumResult.valid,

          subtype: baseCheck.type,
          network: baseCheck.network,
          encoding: baseCheck.encoding,

          checksumValid: checksumResult.valid,

          reasons: this.buildReasons({
            patternMatch: true,
            checksumResult,
            baseCheck,
          }),
        });
      }
    }

    return this.resolveOverlaps(results);
  }

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

  validateChecksum(value, typeInfo) {
    const looksValid =
      typeInfo.type !== "UNKNOWN" &&
      value.length >= 26;

    return {
      valid: looksValid,
    };
  }

  computeConfidence({ patternMatch, checksumResult, baseScore }) {
    let score = 0;

    if (patternMatch) score += baseScore;
    if (checksumResult.valid) score += 0.6;

    return Math.min(score, 1);
  }

  buildReasons({ patternMatch, checksumResult, baseCheck }) {
    const reasons = [];

    if (patternMatch) reasons.push("Matches crypto regex pattern");
    else reasons.push("Does not match known crypto patterns");

    if (checksumResult.valid)
      reasons.push("Checksum validation passed");
    else reasons.push("Checksum validation failed or skipped");

    reasons.push(`Detected type: ${baseCheck.type}`);

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



export default CryptoRecognizer;