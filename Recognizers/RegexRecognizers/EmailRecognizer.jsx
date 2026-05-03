const tldextract = require("tldts"); // closest JS equivalent

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

class EmailRecognizer extends PatternRecognizer {
    static PATTERNS = [
        new Pattern(
            "Email (Medium)",
            /\b((([!#$%&'*+\-/=?^_`{|}~\w])|([!#$%&'*+\-/=?^_`{|}~\w][!#$%&'*+\-/=?^_`{|}~.\w]{0,}[!#$%&'*+\-/=?^_`{|}~\w]))[@]\w+([-.]\w+)*\.\w+([-.]\w+)*)\b/,
            0.5
        )
    ];

    static CONTEXT = ["email"];

    constructor({
        patterns = null,
        context = null,
        supportedLanguage = "en",
        supportedEntity = "EMAIL_ADDRESS",
        name = null
    } = {}) {
        super({
            supportedEntity,
            patterns: patterns || EmailRecognizer.PATTERNS,
            context: context || EmailRecognizer.CONTEXT,
            supportedLanguage,
            name
        });
    }

    validateResult(patternText) {
        const result = tldextract.parse(patternText);
        return result.domain !== null && result.hostname !== null;
    }
}

module.exports = { Pattern, PatternRecognizer, EmailRecognizer };