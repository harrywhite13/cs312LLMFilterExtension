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

class IpRecognizer extends PatternRecognizer {
    static PATTERNS = [
        new Pattern(
            "IPv4_mapped",
            /(?<![\w:])::(?:ffff(?::0{1,4})?:)?(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/(?:12[0-8]|1[01]\d|[1-9]?\d))?\b/,
            0.6
        ),
        new Pattern(
            "IPv4_embedded",
            /(?<![\w:])(?:(?:[0-9A-Fa-f]{1,4}:){1,5}:(?:[0-9A-Fa-f]{1,4}:){0,4}|(?:[0-9A-Fa-f]{1,4}:){6})(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/(?:12[0-8]|1[01]\d|[1-9]?\d))?\b/,
            0.6
        ),
        new Pattern(
            "IPv4",
            /\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/(?:[0-2]?\d|3[0-2]))?\b/,
            0.6
        ),
        new Pattern(
            "IPv6",
            /(?<![\w:])(?:(?:[0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}|(?:[0-9A-Fa-f]{1,4}:){1,7}:|:(?::[0-9A-Fa-f]{1,4}){1,7}|(?:[0-9A-Fa-f]{1,4}:){1,6}:[0-9A-Fa-f]{1,4}|(?:[0-9A-Fa-f]{1,5}(?::[0-9A-Fa-f]{1,4}){1,2})|(?:[0-9A-Fa-f]{1,4}:){1,4}(?::[0-9A-Fa-f]{1,4}){1,3}|(?:[0-9A-Fa-f]{1,3}(?::[0-9A-Fa-f]{1,4}){1,4})|(?:[0-9A-Fa-f]{1,2}(?::[0-9A-Fa-f]{1,4}){1,5})|[0-9A-Fa-f]{1,4}:(?::[0-9A-Fa-f]{1,4}){1,6}|:(?::[0-9A-Fa-f]{1,4}){1,6})(?:%[0-9a-zA-Z]+)?(?:\/(?:12[0-8]|1[01]\d|[1-9]?\d))?(?![\w:]|\.\d)/,
            0.6
        ),
        new Pattern(
            "IPv6_unspecified",
            /(?<![\w:])::(?:\/(?:12[0-8]|1[01]\d|[1-9]?\d))?(?![\w:])/,
            0.1
        )
    ];

    static CONTEXT = ["ip", "ipv4", "ipv6"];

    constructor({
        patterns = null,
        context = null,
        supportedLanguage = "en",
        supportedEntity = "IP_ADDRESS",
        name = null
    } = {}) {
        super({
            supportedEntity,
            patterns: patterns || IpRecognizer.PATTERNS,
            context: context || IpRecognizer.CONTEXT,
            supportedLanguage,
            name
        });
    }

    invalidateResult(patternText) {
        try {
            // Node.js built-in validation
            const net = require("net");

            // Handle CIDR (e.g., 192.168.1.1/24)
            const [ip] = patternText.split("/");

            if (net.isIP(ip) === 0) {
                return true; // invalid
            }

            return false; // valid
        } catch (e) {
            return true;
        }
    }
}

module.exports = { Pattern, PatternRecognizer, IpRecognizer };