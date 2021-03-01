import yargs from 'yargs';
import { readFileSync, writeFileSync } from 'fs';
import {ReadonlyTrieTree} from '.';

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

const keywords = readFileSync(argv.input).toString().trim().split("\n");
const tree = new ReadonlyTrieTree(keywords);
console.log(`loaded ${keywords.length} words.`);
console.log(`first 3 words: ${keywords.slice(0,3)}`);

tree.dumpFileSync(argv.output);
