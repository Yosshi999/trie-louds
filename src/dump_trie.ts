/* istanbul ignore file */
import yargs from 'yargs';
import { createReadStream, writeFileSync } from 'fs';
import {ReadonlyTrieTree} from '.';
import { createInterface } from 'readline';

const argv = yargs
  .option('input', {
    description: 'keywords file (one keyword per line)',
    demandOption: true,
    type: 'string'
  })
  .option('output', {
    description: 'output file',
    demandOption: true,
    type: 'string'
  })
  .help()
  .argv;

(async () => {
  let byteLength = 0;
  let entries = 0;

  await new Promise((resolve, reject) => {
    const stream = createReadStream(argv.input);
    const reader = createInterface(stream);
    reader.on('line', (inpt) => {
      if (inpt.length === 0) return;
      entries++;
      byteLength += Buffer.from(inpt, 'ucs2').byteLength;
    })
    reader.on('close', resolve);
  });
  console.log(`found ${entries} entries.`);

  let data = "";
  const indices = new Uint32Array(entries + 1);
  indices[0] = 0;
  await new Promise((resolve, reject) => {
    const buf = Buffer.allocUnsafe(byteLength);

    const stream = createReadStream(argv.input);
    const reader = createInterface(stream);
    let i = 0;
    let wrote = 0;
    reader.on('line', (inpt) => {
      if (inpt.length === 0) return;
      i++;
      indices[i] = indices[i-1] + inpt.length;
      const word = Buffer.from(inpt, 'ucs2');
      buf.set(word, wrote);
      wrote += word.length;
    });
    reader.on('close', () => {
      data = buf.toString('ucs2');
      resolve(true);
    });
  });

  console.log(`loaded ${entries} words.`);
  const tree = ReadonlyTrieTree.fromDataIndices(data, indices, true);
  console.log(`finish building Trie.`);
  tree.dumpFileSync(argv.output);
})();

