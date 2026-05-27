import { env, pipeline } from '@xenova/transformers';

// Force single thread to prevent crashing at inference (USED AI to find this bug)
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.simd = false;

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
      { device: 'cpu', aggregation_strategy: 'simple' }
    );
    const nerResults = this.mergeEntities(await ner(text));
    return nerResults;
  }
}

export default NERRecognizer;