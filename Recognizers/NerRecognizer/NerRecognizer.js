import { pipeline } from '@xenova/transformers';
const ner = await pipeline(
    'token-classification',
    'Xenova/bert-base-NER-uncased',
    { device: 'cpu' },
    {aggregation_strategy: "simple"}
  );

import { createHash } from 'node:crypto';


function mergeEntities(tokens) {
  const entities = [];
  let current = null;

  for (const token of tokens) {
    const parts = token.entity.split('-');
    const prefix = parts[0];
    const label = parts[1];

    if (prefix === 'B') {
      if (current) {
        entities.push(current);
      }
      current = {
        entity: label,
        text: token.word,
        score: token.score,
      };
    } else if (prefix === 'I' && current && current.entity === label) {
      current.text += ' ' + token.word;
      current.score = Math.min(current.score, token.score);
    } else {
      if (current) {
        entities.push(current);
        current = null;
      }
    }
  }
  if (current) {
    entities.push(current);
  }
  return entities;
}

async function ReplacePII(text) {
  text = text.toLowerCase()

  const nerResults = mergeEntities(await ner(text, {aggregation_strategy: "simple"}));
  const wordtoplaceholder = {};

  nerResults.forEach(element => {
    wordtoplaceholder[element.text] = element.entity
  });
  Object.entries(wordtoplaceholder).forEach(([key, value]) => {
     //replace
     const hash = createHash('sha256').update(value).digest('hex');
     wordtoplaceholder[key] = value + "_" + hash.substring(0,4)
     text = text.replaceAll(key, `{{Redacted ${value + "_" + hash.substring(0,4)} }}`)
  });

  return [text, wordtoplaceholder];
}


console.log(await ReplacePII("My name is harry white and I am from northwestern university PA and I am from PA"))
