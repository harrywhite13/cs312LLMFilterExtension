class Pattern {
  constructor(name, regex) {
    this.name = name;
    this.regex = regex;
  }
}

class PatternRecognizer {
  constructor({ supportedEntity, patterns }) {
    this.supportedEntity = supportedEntity;
    this.patterns = patterns;
  }

  recognize(text) {
    const results = [];

    for (const pattern of this.patterns) {
      const matches = text.matchAll(pattern.regex);

      for (const match of matches) {
        results.push({
          entity: this.supportedEntity,
          pattern: pattern.name,
          match: match[0],
        });
      }
    }

    return results;
  }
}

class DateRecognizer extends PatternRecognizer {
  static PATTERNS = [
    new Pattern(
      "ISO 8601 datetime",
      /\b\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?(?:[+-][0-2]\d:[0-5]\d|Z)\b/g
    ),
    new Pattern(
      "yyyy-mm-dd",
      /\b\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/g
    ),
    new Pattern(
      "mm/dd/yyyy",
      /\b(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/\d{4}\b/g
    ),
    new Pattern(
      "dd/mm/yyyy",
      /\b(0?[1-9]|[12]\d|3[01])\/(0?[1-9]|1[0-2])\/\d{4}\b/g
    ),
    new Pattern(
      "Month name date",
      /\b(?:Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|September|Oct|October|Nov|November|Dec|December)\s+\d{1,2},\s+\d{4}\b/gi
    ),
    new Pattern(
      "dd-MMM-yyyy",
      /\b\d{1,2}-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{4}\b/gi
    )
  ];

  constructor() {
    super({
      supportedEntity: "DATE_TIME",
      patterns: DateRecognizer.PATTERNS
    });
  }
}

export default DateRecognizer;