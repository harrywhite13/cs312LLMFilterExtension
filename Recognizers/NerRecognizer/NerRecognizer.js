import { pipeline } from '@xenova/transformers';
import { createHash } from 'node:crypto';

class NERRecognizer {
  mergeEntities(tokens) {
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

  async ReplacePII(text) {
    const ner = await pipeline(
    'token-classification',
    'Xenova/bert-base-NER-uncased',
    { device: 'cpu', aggregation_strategy: "simple" }
    );
    const nerResults = this.mergeEntities(await ner(text));
    return nerResults;
  }
}

export default NERRecognizer;