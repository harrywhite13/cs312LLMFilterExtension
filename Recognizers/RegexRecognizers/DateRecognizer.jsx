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
        context,
        supportedLanguage = "en",
        name = null
    }) {
        this.supportedEntity = supportedEntity;
        this.patterns = patterns;
        this.context = context;
        this.supportedLanguage = supportedLanguage;
        this.name = name;
    }
}

class DateRecognizer extends PatternRecognizer {
    static PATTERNS = [
        new Pattern(
            "ISO 8601 datetime",
            /\b(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))\b/,
            0.8
        ),
        new Pattern(
            "mm/dd/yyyy or mm/dd/yy",
            /\b(([1-9]|0[1-9]|1[0-2])\/([1-9]|0[1-9]|[1-2][0-9]|3[0-1])\/(\d{4}|\d{2}))\b/,
            0.6
        ),
        new Pattern(
            "dd/mm/yyyy or dd/mm/yy",
            /\b(([1-9]|0[1-9]|[1-2][0-9]|3[0-1])\/([1-9]|0[1-9]|1[0-2])\/(\d{4}|\d{2}))\b/,
            0.6
        ),
        new Pattern(
            "yyyy/mm/dd",
            /\b(\d{4}\/([1-9]|0[1-9]|1[0-2])\/([1-9]|0[1-9]|[1-2][0-9]|3[0-1]))\b/,
            0.6
        ),
        new Pattern(
            "mm-dd-yyyy",
            /\b(([1-9]|0[1-9]|1[0-2])-([1-9]|0[1-9]|[1-2][0-9]|3[0-1])-\d{4})\b/,
            0.6
        ),
        new Pattern(
            "dd-mm-yyyy",
            /\b(([1-9]|0[1-9]|[1-2][0-9]|3[0-1])-([1-9]|0[1-9]|1[0-2])-\d{4})\b/,
            0.6
        ),
        new Pattern(
            "yyyy-mm-dd",
            /\b(\d{4}-([1-9]|0[1-9]|1[0-2])-([1-9]|0[1-9]|[1-2][0-9]|3[0-1]))\b/,
            0.6
        ),
        new Pattern(
            "dd.mm.yyyy or dd.mm.yy",
            /\b(([1-9]|0[1-9]|[1-2][0-9]|3[0-1])\.([1-9]|0[1-9]|1[0-2])\.(\d{4}|\d{2}))\b/,
            0.6
        ),
        new Pattern(
            "dd-MMM-yyyy or dd-MMM-yy",
            /\b(([1-9]|0[1-9]|[1-2][0-9]|3[0-1])-(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-(\d{4}|\d{2}))\b/,
            0.6
        ),
        new Pattern(
            "MMM-yyyy or MMM-yy",
            /\b((JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-(\d{4}|\d{2}))\b/,
            0.6
        ),
        new Pattern(
            "dd-MMM",
            /\b(([1-9]|0[1-9]|[1-2][0-9]|3[0-1])-(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))\b/,
            0.6
        ),
        new Pattern(
            "mm/yyyy or m/yyyy",
            /\b(([1-9]|0[1-9]|1[0-2])\/\d{4})\b/,
            0.2
        ),
        new Pattern(
            "mm/yy or m/yy",
            /\b(([1-9]|0[1-9]|1[0-2])\/\d{2})\b/,
            0.1
        )
    ];

    static CONTEXT = ["date", "birthday"];

    constructor({
        patterns = null,
        context = null,
        supportedLanguage = "en",
        supportedEntity = "DATE_TIME",
        name = null
    } = {}) {
        super({
            supportedEntity,
            patterns: patterns || DateRecognizer.PATTERNS,
            context: context || DateRecognizer.CONTEXT,
            supportedLanguage,
            name
        });
    }
}

module.exports = { Pattern, PatternRecognizer, DateRecognizer };