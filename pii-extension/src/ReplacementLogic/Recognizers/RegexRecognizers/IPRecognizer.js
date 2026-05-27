class Pattern {
  constructor(name, regex, score) {
    this.name = name;
    this.regex = regex;
    this.score = score;
  }
}

class PatternRecognizer {
  constructor({
    supportedEntity,
    patterns,
    context = [],
    supportedLanguage = "en",
    name = null
  }) {
    this.supportedEntity = supportedEntity;
    this.patterns = patterns;
    this.context = context;
    this.supportedLanguage = supportedLanguage;
    this.name = name;
  }

  recognize(text) {
    const results = [];

    for (const pattern of this.patterns) {
      const matches = text.matchAll(pattern.regex);

      for (const match of matches) {
        const raw = match[0];

        const isInvalid = this.invalidateResult
          ? this.invalidateResult(raw)
          : false;

        const confidence = this.computeConfidence({
          baseScore: pattern.score,
          isInvalid
        });

        results.push({
          entity: this.supportedEntity,
          pattern: pattern.name,
          match: raw,
          start: match.index,
          end: match.index + raw.length,
          confidence,
          valid: !isInvalid,
          reasons: this.buildReasons({
            pattern,
            isInvalid
          })
        });
      }
    }

    return this.resolveOverlaps(results);
  }

  computeConfidence({ baseScore, isInvalid }) {
    let score = baseScore;
    if (!isInvalid) score += 0.4;
    return Math.min(score, 1);
  }

  buildReasons({ pattern, isInvalid }) {
    const reasons = [];
    reasons.push(`Matched pattern: ${pattern.name}`);
    if (isInvalid) reasons.push("Invalid IP");
    else reasons.push("Valid IP");
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

class IpRecognizer extends PatternRecognizer {
  static PATTERNS = [
    new Pattern(
      "IPv4_mapped",
      /(?<![\w:])::(?:ffff(?::0{1,4})?:)?(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/(?:12[0-8]|1[01]\d|[1-9]?\d))?\b/g,
      0.6
    ),
    new Pattern(
      "IPv4_embedded",
      /(?<![\w:])(?:(?:[0-9A-Fa-f]{1,4}:){1,5}:(?:[0-9A-Fa-f]{1,4}:){0,4}|(?:[0-9A-Fa-f]{1,4}:){6})(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/(?:12[0-8]|1[01]\d|[1-9]?\d))?\b/g,
      0.6
    ),
    new Pattern(
      "IPv4",
      /\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/(?:[0-2]?\d|3[0-2]))?\b/g,
      0.6
    ),
    new Pattern(
      "IPv6",
      /(?<![\w:])(?:(?:[0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}|(?:[0-9A-Fa-f]{1,4}:){1,7}:|:(?::[0-9A-Fa-f]{1,4}){1,7}|(?:[0-9A-Fa-f]{1,4}:){1,6}:[0-9A-Fa-f]{1,4}|(?:[0-9A-Fa-f]{1,5}(?::[0-9A-Fa-f]{1,4}){1,2})|(?:[0-9A-Fa-f]{1,4}:){1,4}(?::[0-9A-Fa-f]{1,4}){1,3}|(?:[0-9A-Fa-f]{1,3}(?::[0-9A-Fa-f]{1,4}){1,4})|(?:[0-9A-Fa-f]{1,2}(?::[0-9A-Fa-f]{1,4}){1,5})|[0-9A-Fa-f]{1,4}:(?::[0-9A-Fa-f]{1,4}){1,6}|:(?::[0-9A-Fa-f]{1,4}){1,6})(?:%[0-9a-zA-Z]+)?(?:\/(?:12[0-8]|1[01]\d|[1-9]?\d))?(?![\w:]|\.\d)/g,
      0.6
    ),
    new Pattern(
      "IPv6_unspecified",
      /(?<![\w:])::(?:\/(?:12[0-8]|1[01]\d|[1-9]?\d))?(?![\w:])/g,
      0.1
    )
  ];

  static CONTEXT = ["ip", "ipv4", "ipv6"];

  constructor() {
    super({
      supportedEntity: "IP_ADDRESS",
      patterns: IpRecognizer.PATTERNS,
      context: IpRecognizer.CONTEXT
    });
  }

  isIP(str) {
    // IPv4
    const ipv4 =
      /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

    if (ipv4.test(str)) return 4;

    // IPv6 (simple but practical check)
    const ipv6 =
      /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;

    if (ipv6.test(str)) return 6;

    return 0;
  }

  invalidateResult(patternText) {
    try {
      const [ip] = patternText.split("/");
      return this.isIP(ip) === 0;
    } catch {
      return true;
    }
  }
}


export default IpRecognizer;