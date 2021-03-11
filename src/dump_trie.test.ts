const dummyFS = new Map<string, Buffer>();
jest.mock("fs", () => ({
  ...jest.requireActual('fs') as {},
  writeFileSync: (path: string, data: Buffer) => dummyFS.set(path, data),
}));

import {ReadonlyTrieTree} from '.';

describe("cli", () => {
  const oldProcess: {argv: string[]} = {argv: []};

  it("main", async () => {
    process.argv = ['node', 'app', '--input', './examples/keyword.txt', '--output', './output.dat'];
    const {main} = require('./dump_trie');
    await main();

    expect(dummyFS.has('./output.dat')).toBe(true);

    const trie = ReadonlyTrieTree.load(dummyFS.get('./output.dat')!);
    expect(trie.contains("sells")).toBe(true);
    expect(trie.contains("selll")).toBe(false);

    expect(trie.getWords("Sh").words.length).toBe(1);
    expect(trie.getWords("sea").words.length).toBe(2);
    expect(trie.getWords("s").words.length).toBe(4);
  });

  it("no option error", async () => {
    let spy: {console?: any} = {};
    let logs = "";
    spy.console = jest.spyOn(console, 'error').mockImplementation((data) => {logs += data.toString();});

    process.argv = ['node', 'app'];
    const {main} = require('./dump_trie');
    await main();
    console.log(logs);
    expect(logs.length).toBeGreaterThan(0);

    spy.console.mockRestore();
  });
});
