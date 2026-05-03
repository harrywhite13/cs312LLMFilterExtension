const { findPhoneNumbersInText, parsePhoneNumberFromString } = require("libphonenumber-js");

class AnalysisExplanation {
    constructor({ recognizer, originalScore, textualExplanation }) {
        this.recognizer = recognizer;
        this.originalScore = originalScore;
        this.textualExplanation = textualExplanation;
    }
}

class RecognizerResult {
    static RECOGNIZER_NAME_KEY = "recognizer_name";
    static RECOGNIZER_IDENTIFIER_KEY = "recognizer_id";

    constructor({
        entityType,
        start,
        end,
        score,
        analysisExplanation,
        recognitionMetadata
    }) {
        this.entityType = entityType;
        this.start = start;
        this.end = end;
        this.score = score;
        this.analysisExplanation = analysisExplanation;
        this.recognitionMetadata = recognitionMetadata;
    }

    static removeDuplicates(results) {
        const seen = new Set();
        return results.filter(r => {
            const key = `${r.start}-${r.end}-${r.entityType}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }
}

class EntityRecognizer {
    static removeDuplicates(results) {
        return RecognizerResult.removeDuplicates(results);
    }
}

class LocalRecognizer extends EntityRecognizer {
    constructor({ supportedEntities, supportedLanguage, context, name }) {
        super();
        this.supportedEntities = supportedEntities;
        this.supportedLanguage = supportedLanguage;
        this.context = context;
        this.name = name;
        this.id = name || "PhoneRecognizer";
    }
}

class PhoneRecognizer extends LocalRecognizer {
    static SCORE = 0.4;

    static CONTEXT = [
        "phone",
        "number",
        "telephone",
        "cell",
        "cellphone",
        "mobile",
        "call"
    ];

    static DEFAULT_SUPPORTED_REGIONS = ["US", "UK", "DE", "FE", "IL", "IN", "CA", "BR"];

    constructor({
        context = null,
        supportedLanguage = "en",
        supportedRegions = PhoneRecognizer.DEFAULT_SUPPORTED_REGIONS,
        leniency = 1,
        name = null
    } = {}) {
        super({
            supportedEntities: ["PHONE_NUMBER"],
            supportedLanguage,
            context: context || PhoneRecognizer.CONTEXT,
            name
        });

        this.supportedRegions = supportedRegions;
        this.leniency = leniency;
    }

    load() {
        // no-op (same as Python)
    }

    getSupportedEntities() {
        return ["PHONE_NUMBER"];
    }

    analyze(text, entities, nlpArtifacts = null) {
        let results = [];

        for (const region of this.supportedRegions) {
            const matches = findPhoneNumbersInText(text, region);

            for (const match of matches) {
                const start = match.startsAt;
                const end = match.endsAt;

                let detectedRegion = region;

                try {
                    const parsed = parsePhoneNumberFromString(match.number.number, region);
                    if (parsed && parsed.country) {
                        detectedRegion = parsed.country;
                    }
                } catch (e) {
                    // fallback to original region
                }

                results.push(
                    this._getRecognizerResult(
                        { start, end },
                        text,
                        detectedRegion,
                        nlpArtifacts
                    )
                );
            }
        }

        return EntityRecognizer.removeDuplicates(results);
    }

    _getRecognizerResult(match, text, region, nlpArtifacts) {
        return new RecognizerResult({
            entityType: "PHONE_NUMBER",
            start: match.start,
            end: match.end,
            score: PhoneRecognizer.SCORE,
            analysisExplanation: this._getAnalysisExplanation(region),
            recognitionMetadata: {
                [RecognizerResult.RECOGNIZER_NAME_KEY]: this.name,
                [RecognizerResult.RECOGNIZER_IDENTIFIER_KEY]: this.id
            }
        });
    }

    _getAnalysisExplanation(region) {
        return new AnalysisExplanation({
            recognizer: "PhoneRecognizer",
            originalScore: PhoneRecognizer.SCORE,
            textualExplanation: `Recognized as ${region} region phone number, using PhoneRecognizer`
        });
    }
}

module.exports = {
    PhoneRecognizer,
    LocalRecognizer,
    EntityRecognizer,
    RecognizerResult,
    AnalysisExplanation
};