# Trie-LOUDS
[![Node.js CI](https://github.com/Yosshi999/trie-louds/actions/workflows/node.js.yml/badge.svg)](https://github.com/Yosshi999/trie-louds/actions/workflows/node.js.yml)
[![codecov](https://codecov.io/gh/Yosshi999/trie-louds/branch/master/graph/badge.svg?token=Y0XIT9GJS8)](https://codecov.io/gh/Yosshi999/trie-louds)

Readonly but memory-sufficient data structure for dictionaries by utilizing LOUDS.

## Install
```
$ npm install --save trie-louds
```

## Usage
```
const {ReadonlyTrieTree} = require("trie-louds");
const tree = new ReadonlyTrieTree(["She", "sells", "seashells", "by", "the", "seashore"]);

console.log(tree.contains("She")); // true
console.log(tree.contains("she")); // false
console.log(tree.getWords("sea")); // [ 'seashells', 'seashore' ] (search the words with given prefix)
console.log(tree.getValue("seashells")); // 2 (index of keywords)
console.log(tree.getValue("sell")); // null (not found)

tree.dumpFileSync("tree.dat"); // You can dump the tree data.
const loadedTree = ReadonlyTrieTree.loadFileSync("tree.dat");
console.log(loadedTree.getWords("sea")); // [ 'seashells', 'seashore' ]
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

## TODO
- Succinct Bit Vector
- setup npm repo
