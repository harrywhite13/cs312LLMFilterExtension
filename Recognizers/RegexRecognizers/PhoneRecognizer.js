import { findPhoneNumbersInText, parsePhoneNumberFromString} from "libphonenumber-js";

class PhoneRecognizer {
  constructor({
    supportedRegions = ["US", "UK", "DE", "FE", "IL", "IN", "CA", "BR"]
  } = {}) {
    this.entity = "PHONE_NUMBER";
    this.supportedRegions = supportedRegions;
    this.baseScore = 0.4;
  }

  recognize(text) {
    const results = [];

    for (const region of this.supportedRegions) {
      const matches = findPhoneNumbersInText(text, region);

      for (const match of matches) {
        const raw = match.number.number;
        const start = match.startsAt;
        const end = match.endsAt;

        let detectedRegion = region;
        let isValid = false;

        try {
          const parsed = parsePhoneNumberFromString(raw, region);
          if (parsed) {
            isValid = parsed.isValid();
            if (parsed.country) detectedRegion = parsed.country;
          }
        } catch {}

        const confidence = this.computeConfidence(isValid);

        results.push({
          entity: this.entity,
          match: text.slice(start, end),

          start,
          end,

          normalized: raw,
          region: detectedRegion,

          valid: isValid,
          confidence,

          reasons: this.buildReasons(isValid, detectedRegion)
        });
      }
    }

    return this.resolveOverlaps(this.removeDuplicates(results));
  }

  computeConfidence(isValid) {
    let score = this.baseScore;
    if (isValid) score += 0.5;
    return Math.min(score, 1);
  }

  buildReasons(isValid, region) {
    const reasons = [];
    if (isValid) reasons.push("Valid phone number");
    else reasons.push("Invalid phone number");
    reasons.push(`Detected region: ${region}`);
    return reasons;
  }

  removeDuplicates(results) {
    const seen = new Set();
    return results.filter(r => {
      const key = `${r.start}-${r.end}-${r.entity}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
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


export default PhoneRecognizer;