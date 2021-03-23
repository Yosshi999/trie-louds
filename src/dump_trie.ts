import yargs from 'yargs';
import { createReadStream, writeFileSync } from 'fs';
import {ReadonlyTrieTree} from '.';
import { createInterface } from 'readline';

export const main = async () => {
  let argv: any;
  try {
    argv = yargs(process.argv.slice(2))
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
      .exitProcess(false)
      .fail((msg, err, yargs) => {
        if (err) throw err;
        console.error(msg);
        console.error(yargs.help());
        throw null;
      })
      .argv;
  } catch (err) {
    if (err) console.error(err);
    return 0;
  }

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

  await new Promise((resolve, reject) => {
    const indices = new Uint32Array(entries + 1);
    indices[0] = 0;
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
      console.log(`loaded ${entries} words.`);
      const tree = ReadonlyTrieTree.fromBufferIndices(buf, indices, true);
      console.log(`finish building Trie.`);
      writeFileSync(argv.output, tree.dump());
      resolve(true);
    });
  });
};
