class IBANRecognizer {
  constructor() {
    this.entity = " IBAN ";

    const regexPerCountry = {
      AL: "(AL)[0-9]{2}[ ]?[0-9]{4}[ ]?[0-9]{4}",
      AD: "(AD)[0-9]{2}[ ]?[0-9]{4}[ ]?[0-9]{4}",
      AT: "(AT)[0-9]{2}[ ]?[0-9]{4}[ ]?[0-9]{4}",
      AZ: "(AZ)[0-9]{2}[A-Z0-9]{4}[0-9]{4}",
      BE: "(BE)[0-9]{2}[0-9]{3}[0-9]{7}",
      DE: "(DE)[0-9]{2}[0-9]{8}[0-9]{10}",
      GB: "(GB)[0-9]{2}[A-Z]{4}[0-9]{14}"
    };

    const patterns = Object.values(regexPerCountry).map(p => `(${p})`);
    this.regex = new RegExp(`\\b(${patterns.join("|")})\\b`, "g");
  }

  recognize(text) {
    const results = [];
    const matches = text.matchAll(this.regex);

    for (const match of matches) {
      const raw = match[0];
      const normalized = this.normalize(raw);
      const isValid = this.validateIBAN(normalized);
      const country = normalized.slice(0, 2);
      const confidence = this.computeConfidence(isValid);

      results.push({
        entity: this.entity,
        match: raw,
        start: match.index,
        end: match.index + raw.length,
        normalized,
        country,
        valid: isValid,
        confidence,
        reasons: this.buildReasons({ isValid, country })
      });
    }

    return this.resolveOverlaps(results);
  }

  normalize(value) {
    return value.replace(/\s+/g, "");
  }

  validateIBAN(iban) {
    if (!/^[A-Z0-9]+$/.test(iban)) return false;

    const rearranged = iban.slice(4) + iban.slice(0, 4);

    const numeric = rearranged
      .split("")
      .map(char => (/[A-Z]/.test(char) ? char.charCodeAt(0) - 55 : char))
      .join("");

    let remainder = numeric;

    while (remainder.length > 2) {
      const block = remainder.slice(0, 9);
      remainder = (parseInt(block, 10) % 97) + remainder.slice(block.length);
    }

    return parseInt(remainder, 10) % 97 === 1;
  }

  computeConfidence(isValid) {
    return isValid ? 0.95 : 0.5;
  }

  buildReasons({ isValid, country }) {
    return [
      `Detected country: ${country}`,
      isValid
        ? "Valid IBAN checksum (mod 97)"
        : "Failed IBAN checksum"
    ];
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

      if (!overlaps) final.push(candidate);
    }

    return final.sort((a, b) => a.start - b.start);
  }
}

export default IBANRecognizer;