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

        const confidence = this.computeConfidence(pattern.score);

        results.push({
          entity: this.supportedEntity,
          pattern: pattern.name,
          match: raw,
          start: match.index,
          end: match.index + raw.length,
          confidence,
          valid: true,
          reasons: this.buildReasons(pattern)
        });
      }
    }

    return this.resolveOverlaps(results);
  }

  computeConfidence(baseScore) {
    return Math.min(baseScore + 0.3, 1);
  }

  buildReasons(pattern) {
    return [`Matched pattern: ${pattern.name}`];
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

class UrlRecognizer extends PatternRecognizer {
  static BASE_URL_REGEX = "((www\\d{0,3}[.])?[a-z0-9.\\-]+[.](?:(?:com)|(?:edu)|(?:gov)|(?:int)|(?:mil)|(?:net)|(?:onl)|(?:org)|(?:pro)|(?:red)|(?:tel)|(?:uno)|(?:xxx)|(?:academy)|(?:accountant)|(?:accountants)|(?:actor)|(?:adult)|(?:africa)|(?:agency)|(?:airforce)|(?:apartments)|(?:app)|(?:archi)|(?:army)|(?:art)|(?:asia)|(?:associates)|(?:attorney)|(?:auction)|(?:audio)|(?:auto)|(?:autos)|(?:baby)|(?:band)|(?:bar)|(?:bargains)|(?:beer)|(?:berlin)|(?:best)|(?:bet)|(?:bid)|(?:bike)|(?:bio)|(?:black)|(?:blackfriday)|(?:blog)|(?:blue)|(?:boats)|(?:bond)|(?:boo)|(?:boston)|(?:bot)|(?:boutique)|(?:build)|(?:builders)|(?:business)|(?:buzz)|(?:cab)|(?:cafe)|(?:cam)|(?:camera)|(?:camp)|(?:capital)|(?:car)|(?:cards)|(?:care)|(?:careers)|(?:cars)|(?:casa)|(?:cash)|(?:casino)|(?:catering)|(?:center)|(?:ceo)|(?:cfd)|(?:charity)|(?:chat)|(?:cheap)|(?:christmas)|(?:church)|(?:city)|(?:claims)|(?:cleaning)|(?:click)|(?:clinic)|(?:clothing)|(?:cloud)|(?:club)|(?:codes)|(?:coffee)|(?:college)|(?:com)|(?:community)|(?:company)|(?:computer)|(?:condos)|(?:construction)|(?:consulting)|(?:contact)|(?:contractors)|(?:cooking)|(?:cool)|(?:coupons)|(?:courses)|(?:credit)|(?:creditcard)|(?:cricket)|(?:cruises)|(?:cyou)|(?:dad)|(?:dance)|(?:date)|(?:dating)|(?:day)|(?:degree)|(?:delivery)|(?:democrat)|(?:dental)|(?:dentist)|(?:desi)|(?:design)|(?:dev)|(?:diamonds)|(?:diet)|(?:digital)|(?:direct)|(?:directory)|(?:discount)|(?:doctor)|(?:dog)|(?:domains)|(?:download)|(?:earth)|(?:eco)|(?:education)|(?:email)|(?:energy)|(?:engineer)|(?:engineering)|(?:enterprises)|(?:equipment)|(?:esq)|(?:estate)|(?:events)|(?:exchange)|(?:expert)|(?:exposed)|(?:express)|(?:fail)|(?:faith)|(?:family)|(?:fans)|(?:farm)|(?:fashion)|(?:feedback)|(?:film)|(?:finance)|(?:financial)|(?:fish)|(?:fishing)|(?:fit)|(?:fitness)|(?:flights)|(?:florist)|(?:flowers)|(?:football)|(?:forsale)|(?:foundation)|(?:fun)|(?:fund)|(?:furniture)|(?:futbol)|(?:fyi)|(?:gallery)|(?:game)|(?:games)|(?:garden)|(?:gay)|(?:gdn)|(?:gifts)|(?:gives)|(?:giving)|(?:glass)|(?:global)|(?:gmbh)|(?:gold)|(?:golf)|(?:graphics)|(?:gratis)|(?:green)|(?:gripe)|(?:group)|(?:guide)|(?:guitars)|(?:guru)|(?:hair)|(?:hamburg)|(?:haus)|(?:health)|(?:healthcare)|(?:help)|(?:hiphop)|(?:hockey)|(?:holdings)|(?:holiday)|(?:homes)|(?:horse)|(?:hospital)|(?:host)|(?:hosting)|(?:house)|(?:how)|(?:icu)|(?:info)|(?:ink)|(?:institute)|(?:insure)|(?:international)|(?:investments)|(?:irish)|(?:jewelry)|(?:jetzt)|(?:juegos)|(?:kaufen)|(?:kids)|(?:kitchen)|(?:kiwi)|(?:krd)|(?:kyoto)|(?:land)|(?:lat)|(?:law)|(?:lawyer)|(?:lease)|(?:legal)|(?:lgbt)|(?:life)|(?:lighting)|(?:limited)|(?:limo)|(?:link)|(?:live)|(?:loan)|(?:loans)|(?:lol)|(?:london)|(?:love)|(?:ltd)|(?:ltda)|(?:luxury)|(?:maison)|(?:management)|(?:market)|(?:marketing)|(?:markets)|(?:mba)|(?:media)|(?:melbourne)|(?:meme)|(?:memorial)|(?:men)|(?:miami)|(?:mobi)|(?:moda)|(?:moe)|(?:mom)|(?:money)|(?:monster)|(?:mortgage)|(?:motorcycles)|(?:mov)|(?:movie)|(?:nagoya)|(?:name)|(?:navy)|(?:network)|(?:new)|(?:news)|(?:ngo)|(?:ninja)|(?:now)|(?:nyc)|(?:observer)|(?:okinawa)|(?:one)|(?:ong)|(?:onl)|(?:online)|(?:organic)|(?:osaka)|(?:page)|(?:paris)|(?:partners)|(?:parts)|(?:party)|(?:pet)|(?:phd)|(?:photo)|(?:photography)|(?:photos)|(?:pics)|(?:pictures)|(?:pink)|(?:pizza)|(?:place)|(?:plumbing)|(?:plus)|(?:poker)|(?:porn)|(?:press)|(?:pro)|(?:productions)|(?:prof)|(?:promo)|(?:properties)|(?:property)|(?:protection)|(?:pub)|(?:quest)|(?:racing)|(?:recipes)|(?:red)|(?:rehab)|(?:reise)|(?:reisen)|(?:rent)|(?:rentals)|(?:repair)|(?:report)|(?:republican)|(?:rest)|(?:restaurant)|(?:review)|(?:reviews)|(?:rip)|(?:rocks)|(?:rodeo)|(?:rsvp)|(?:run)|(?:saarland)|(?:sale)|(?:salon)|(?:sarl)|(?:sbs)|(?:school)|(?:schule)|(?:science)|(?:services)|(?:sex)|(?:sexy)|(?:sh)|(?:shoes)|(?:shop)|(?:shopping)|(?:show)|(?:singles)|(?:site)|(?:skin)|(?:soccer)|(?:social)|(?:software)|(?:solar)|(?:solutions)|(?:soy)|(?:space)|(?:spiegel)|(?:study)|(?:style)|(?:sucks)|(?:supply)|(?:support)|(?:surf)|(?:surgery)|(?:systems)|(?:tax)|(?:taxi)|(?:team)|(?:tech)|(?:technology)|(?:tel)|(?:theater)|(?:tips)|(?:tires)|(?:today)|(?:tools)|(?:top)|(?:tours)|(?:town)|(?:toys)|(?:trade)|(?:training)|(?:tube)|(?:uk)|(?:university)|(?:uno)|(?:vacations)|(?:ventures)|(?:vet)|(?:video)|(?:villas)|(?:vin)|(?:vip)|(?:vision)|(?:vlaanderen)|(?:vodka)|(?:vote)|(?:voting)|(?:voyage)|(?:wales)|(?:wang)|(?:watch)|(?:webcam)|(?:website)|(?:wedding)|(?:wiki)|(?:wine)|(?:work)|(?:works)|(?:world)|(?:wtf)|(?:xyz)|(?:yoga)|(?:yokohama)|(?:you)|(?:zone)|(?:ac)|(?:ad)|(?:ae)|(?:af)|(?:ag)|(?:ai)|(?:al)|(?:am)|(?:an)|(?:ao)|(?:aq)|(?:ar)|(?:as)|(?:at)|(?:au)|(?:aw)|(?:ax)|(?:az)|(?:ba)|(?:bb)|(?:bd)|(?:be)|(?:bf)|(?:bg)|(?:bh)|(?:bi)|(?:bj)|(?:bm)|(?:bn)|(?:bo)|(?:br)|(?:bs)|(?:bt)|(?:bv)|(?:bw)|(?:by)|(?:bz)|(?:ca)|(?:cc)|(?:cd)|(?:cf)|(?:cg)|(?:ch)|(?:ci)|(?:ck)|(?:cl)|(?:cm)|(?:cn)|(?:co)|(?:cr)|(?:cu)|(?:cv)|(?:cw)|(?:cx)|(?:cy)|(?:cz)|(?:de)|(?:dj)|(?:dk)|(?:dm)|(?:do)|(?:dz)|(?:ec)|(?:ee)|(?:eg)|(?:er)|(?:es)|(?:et)|(?:eu)|(?:fi)|(?:fj)|(?:fk)|(?:fm)|(?:fo)|(?:fr)|(?:ga)|(?:gb)|(?:gd)|(?:ge)|(?:gf)|(?:gg)|(?:gh)|(?:gi)|(?:gl)|(?:gm)|(?:gn)|(?:gp)|(?:gq)|(?:gr)|(?:gs)|(?:gt)|(?:gu)|(?:gw)|(?:gy)|(?:hk)|(?:hm)|(?:hn)|(?:hr)|(?:ht)|(?:hu)|(?:id)|(?:ie)|(?:il)|(?:im)|(?:in)|(?:io)|(?:iq)|(?:ir)|(?:is)|(?:it)|(?:je)|(?:jm)|(?:jo)|(?:jp)|(?:ke)|(?:kg)|(?:kh)|(?:ki)|(?:km)|(?:kn)|(?:kp)|(?:kr)|(?:kw)|(?:ky)|(?:kz)|(?:la)|(?:lb)|(?:lc)|(?:li)|(?:lk)|(?:lr)|(?:ls)|(?:lt)|(?:lu)|(?:lv)|(?:ly)|(?:ma)|(?:mc)|(?:md)|(?:me)|(?:mg)|(?:mh)|(?:mk)|(?:ml)|(?:mm)|(?:mn)|(?:mo)|(?:mp)|(?:mq)|(?:mr)|(?:ms)|(?:mt)|(?:mu)|(?:mv)|(?:mw)|(?:mx)|(?:my)|(?:mz)|(?:na)|(?:nc)|(?:ne)|(?:nf)|(?:ng)|(?:ni)|(?:nl)|(?:no)|(?:np)|(?:nr)|(?:nu)|(?:nz)|(?:om)|(?:pa)|(?:pe)|(?:pf)|(?:pg)|(?:ph)|(?:pk)|(?:pl)|(?:pm)|(?:pn)|(?:pr)|(?:ps)|(?:pt)|(?:pw)|(?:py)|(?:qa)|(?:re)|(?:ro)|(?:rs)|(?:ru)|(?:rw)|(?:sa)|(?:sb)|(?:sc)|(?:sd)|(?:se)|(?:sg)|(?:sh)|(?:si)|(?:sj)|(?:sk)|(?:sl)|(?:sm)|(?:sn)|(?:so)|(?:sr)|(?:st)|(?:su)|(?:sv)|(?:sx)|(?:sy)|(?:sz)|(?:tc)|(?:td)|(?:tf)|(?:tg)|(?:th)|(?:tj)|(?:tk)|(?:tl)|(?:tm)|(?:tn)|(?:to)|(?:tp)|(?:tr)|(?:tt)|(?:tv)|(?:tw)|(?:tz)|(?:ua)|(?:ug)|(?:uk)|(?:us)|(?:uy)|(?:uz)|(?:va)|(?:vc)|(?:ve)|(?:vg)|(?:vi)|(?:vn)|(?:vu)|(?:wf)|(?:ws)|(?:ye)|(?:yt)|(?:za)|(?:zm)|(?:zw))(?:/[^\\s()<>\"']*)?)";

  static PATTERNS = [
    new Pattern(
      "Standard Url",
      new RegExp(`(?:https?:\\/\\/)${UrlRecognizer.BASE_URL_REGEX}`, "gi"),
      0.6
    ),
    new Pattern(
      "Non schema URL",
      new RegExp(UrlRecognizer.BASE_URL_REGEX, "gi"),
      0.5
    ),
    new Pattern(
      "Quoted URL",
      new RegExp(`[\"'](https?:\\/\\/${UrlRecognizer.BASE_URL_REGEX})[\"']`, "gi"),
      0.6
    ),
    new Pattern(
      "Quoted Non-schema URL",
      new RegExp(`[\"'](${UrlRecognizer.BASE_URL_REGEX})[\"']`, "gi"),
      0.5
    )
  ];

  static CONTEXT = ["url", "website", "link"];

  constructor() {
    super({
      supportedEntity: "URL",
      patterns: UrlRecognizer.PATTERNS,
      context: UrlRecognizer.CONTEXT
    });
  }
}


export default UrlRecognizer;