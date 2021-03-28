# Trie-LOUDS
[![npm package](https://badge.fury.io/js/trie-louds.svg)](https://npmjs.org/package/trie-louds)
[![Node.js CI](https://github.com/Yosshi999/trie-louds/actions/workflows/node.js.yml/badge.svg)](https://github.com/Yosshi999/trie-louds/actions/workflows/node.js.yml)
[![codecov](https://codecov.io/gh/Yosshi999/trie-louds/branch/master/graph/badge.svg?token=Y0XIT9GJS8)](https://codecov.io/gh/Yosshi999/trie-louds)

Readonly but memory-sufficient data structure for dictionaries by utilizing LOUDS.

## Install
```
$ npm install --save trie-louds
```

## API
### static fromKeywordList(keys, verbose=false)
Build a tree from list of keywords.

**Parameters**
- `keys: string[]` List of keywords.
- `verbose: boolean` If true, some debug logs will be printed.

**Returns**
- `tree: ReadonlyTrieTree`

**Example**

```js
const {ReadonlyTrieTree} = require("trie-louds");
const tree = ReadonlyTrieTree.fromKeywordList(["She", "sells", "seashells", "by", "the", "seashore"]);
```

### contains(word)
Returns `true` if it contains the given word.
This is case-sensitive.

**Parameters**
- `word: string`

**Returns**
- `answer: boolean`

**Example**

```js
const {ReadonlyTrieTree} = require("trie-louds");
const tree = ReadonlyTrieTree.fromKeywordList(["She", "sells", "seashells", "by", "the", "seashore"]);

console.log(tree.contains("She")); // true
console.log(tree.contains("she")); // false
```

### getValue(word)
Returns `word`'s index in the keyword list.
If it doesn't contain `word`, this returns `null`.

**Parameters**
- `word: string`

**Returns**
- `index: number|null`

**Example**

```js
const {ReadonlyTrieTree} = require("trie-louds");
const tree = ReadonlyTrieTree.fromKeywordList(["She", "sells", "seashells", "by", "the", "seashore"]);

console.log(tree.getValue("She")); // 0
console.log(tree.getValue("sells")); // 1
console.log(tree.getValue("seashells")); // 2
console.log(tree.getValue("sell")); // null (not found)
```

### getWords(prefix, limit=1000)
Search the words which have the given prefix.
If more than `limit` words are found, property `hasMore` become `true`.

**Parameters**
- `prefix: string`
- `limit: number` The maximum number of words in the result.

**Returns**
- `result: SearchResult`
  - `words: string[]` Found words.
  - `values: number[]` Indices of found words.
  - `hasMore: boolean` If true, there are unsearched words.
  - `temporaryInfo?: TempInfo` This exists iff `hasMore` is `true`. See `getMoreWords()`.

**Example**

```js
const {ReadonlyTrieTree} = require("trie-louds");
const tree = ReadonlyTrieTree.fromKeywordList(["She", "sells", "seashells", "by", "the", "seashore"]);

console.log(tree.getWords("").words); // [ 'She', 'by', 'seashells', 'seashore', 'sells', 'the' ] (searched words are sorted)

const limited = tree.getWords("", 3);
console.log(limited.words); // [ 'She', 'by', 'seashells' ]
console.log(limited.hasMore); // true
```

### getWords(prefix, setting)
You can set more detailed search settings.

**Parameters**
- `prefix: string`
- `setting: OptSearchSetting`
  - `limit?: number` Default is `1000`. Same as `limit` in `getWords(prefix, limit)`.
  - `maxLength?: number` If this exists, words longer than this will be excluded.
  - `minLength?: number` If this exists, words shorter than this will be excluded.

**Returns**
- `result: SearchResult` Same as the output of `getWords(prefix, limit)`.

### getMoreWords(temporaryInfo, limit=1000)
You can continue searching by calling this with `temporaryInfo` returned by `getWords` function.

**Parameters**
- `temporaryInfo: TempInfo`
- `limit: number` The maximum number of words in the result.

**Returns**
- `result: SearchResult`
  - `words: string[]` Found words.
  - `values: number[]` Indices of found words.
  - `hasMore: boolean` If true, there are unsearched words.
  - `temporaryInfo?: TempInfo` This exists iff `hasMore` is `true`.

**Example**

```js
const {ReadonlyTrieTree} = require("trie-louds");
const tree = ReadonlyTrieTree.fromKeywordList(["She", "sells", "seashells", "by", "the", "seashore"]);

const limited = tree.getWords("", 3);
console.log(limited.words); // [ 'She', 'by', 'seashells' ]
console.log(limited.hasMore); // true
console.log(tree.getMoreWords(limited.temporaryInfo).words); // [ 'seashore', 'sells', 'the' ]
```

### getMoreWords(temporaryInfo, setting)
You can set more detailed search settings.

**Parameters**
- `temporaryInfo: TempInfo`
- `setting: OptSearchSetting`

**Returns**
- `result: SearchResult`

### countWords(prefix, setting)
Count the words which meets the given setting and prefix.
It will take the same computational cost as `getWords` function.
If you don't need detailed settings, `countWordsFaster` is suitable.

**Parameters**
- `prefix: string`
- `setting: OptSearchSetting`
  - `limit?: number` This option doesn't work in this function. It will search all.
  - `maxLength?: number` If this exists, words longer than this will be excluded.
  - `minLength?: number` If this exists, words shorter than this will be excluded.

**Returns**
- `count: number`

**Example**

```js
const {ReadonlyTrieTree} = require("trie-louds");
const tree = ReadonlyTrieTree.fromKeywordList(["She", "sells", "seashells", "by", "the", "seashore"]);

console.log(tree.countWords("")); // 6
console.log(tree.countWords("s")); // 3
```

### countWordsFaster(prefix)
Counts the words which have the given prefix. This is much faster than `countWords()`.

**Parameters**
- `prefix: string`

**Returns**
- `count: number`

### dump()
You can dump the tree to `Buffer`.

**Returns**
- `buf: Buffer`

**Example**

```js
const fs = require("fs");
fs.writeFileSync("tree.dat", tree.dump());
```

### static load(buffer)
You can load the tree from dumped data.

**Parameters**
- `buffer: Buffer`

**Returns**
- `tree: ReadonlyTrieTree`

**Example**

```js
const loadedTree = ReadonlyTrieTree.load(fs.readFileSync("tree.dat"));
console.log(loadedTree.getWords("sea").words); // [ 'seashells', 'seashore' ]
```

## Command
You can dump the tree data by command.
### example
1. run `trie-dump --input examples/keyword.txt --output examples/trie.dat`
2. then you have `trie.dat` in `examples/` folder.
3. execute:
```
const {ReadonlyTrieTree} = require("trie-louds");
const tree = ReadonlyTrieTree.loadFileSync("examples/trie.dat");
console.log(tree.getWords(""));
```
### enwiki trie tree
You can create the trie tree of wikipedia-en keywords.
```
> cat enwiki-20210220-pages-articles-multistream-index.txt | sed -e 's/.*://g' > enwiki-keywords.txt
> trie-dump --input ..\loudstest\enwiki-keywords.txt --output enwiki.dat
```
In this case, we can store 20993072 words in this trie tree and dump it.
The size of `enwiki-keywords.txt` is about 495MiB and the size of `enwiki.dat` is about 512MiB.

```
const {ReadonlyTrieTree} = require("trie-louds");
const {readFileSync} = require("fs");
const tree = ReadonlyTrieTree.load(readFileSync("./enwiki.dat"));
console.log(process.memoryUsage());
console.log(tree.getWords("Undertale"));

--- output ---
{ rss: 682528768,
  heapTotal: 10731520,
  heapUsed: 5398648,
  external: 658583438 }

{ words:
   [ 'Undertale',
     'Undertale (game)',
     'Undertale (video game)',
     'Undertale - Hopes and Dreams.ogg',
     'Undertale 2',
     'Undertale Combat Example.png',
     'Undertale Kickstarter Promotional Art.png',
     'Undertale character redirects to lists',
     'Undertale fandom',
     'Undertale soundtrack' ],
  values:
   [ 19574893,
     15834775,
     16217668,
     15772089,
     18495783,
     15198496,
     19989624,
     17975151,
     20721313,
     18488239 ],
  hasMore: false }
```
And it takes about 651MiB when you load this trie tree on memory.
