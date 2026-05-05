import tldts from "tldts";

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
    name = null,
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

        const isValid = this.validateResult(raw);
        const confidence = this.computeConfidence({
          baseScore: pattern.score,
          isValid,
        });

        results.push({
          entity: this.supportedEntity,
          pattern: pattern.name,

          match: raw,
          start: match.index,
          end: match.index + raw.length,

          confidence,
          valid: isValid,

          reasons: this.buildReasons({
            isValid,
            pattern,
          }),
        });
      }
    }

    return this.resolveOverlaps(results);
  }

  computeConfidence({ baseScore, isValid }) {
    let score = baseScore;
    if (isValid) score += 0.4;
    return Math.min(score, 1);
  }

  buildReasons({ isValid, pattern }) {
    const reasons = [];

    reasons.push(`Matched pattern: ${pattern.name}`);

    if (isValid)
      reasons.push("Valid domain and hostname");
    else reasons.push("Invalid domain/hostname");

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

class EmailRecognizer extends PatternRecognizer {
  static PATTERNS = [
    new Pattern(
      "Email (Medium)",
      /\b([!#$%&'*+\-/=?^_`{|}~\w]+(?:\.[!#$%&'*+\-/=?^_`{|}~\w]+)*@\w+(?:[-.]\w+)*\.\w+(?:[-.]\w+)*)\b/g,
      0.5
    ),
  ];

  static CONTEXT = ["email"];

  constructor() {
    super({
      supportedEntity: "EMAIL_ADDRESS",
      patterns: EmailRecognizer.PATTERNS,
      context: EmailRecognizer.CONTEXT,
    });
  }

  validateResult(email) {
    const result = tldts.parse(email);

    return (
      result.domain !== null &&
      result.hostname !== null &&
      result.isIcann !== false 
    );
  }
}



export default EmailRecognizer