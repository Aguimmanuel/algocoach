import { describe, it, expect } from "vitest";
import {
  activateLocalAccount,
  archiveLocalAccount,
} from "../../src/lib/accountStorage";
class MemoryStorage implements Storage {
  data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}
describe("Google account device profile isolation", () => {
  it("first Google sign-in preserves unowned legacy progress but discards old bearer tokens", () => {
    const storage = new MemoryStorage();
    storage.setItem("algocoach-learned", '["brute"]');
    storage.setItem("algocoach-token", "obsolete");
    activateLocalAccount(1, storage);
    expect(storage.getItem("algocoach-learned")).toBe('["brute"]');
    expect(storage.getItem("algocoach-token")).toBeNull();
  });
  it("different users do not inherit notes or lessons; returning users recover their archive", () => {
    const storage = new MemoryStorage();
    activateLocalAccount(1, storage);
    storage.setItem("algocoach-notes", "private first");
    storage.setItem("algocoach-learning", '{"first":true}');
    activateLocalAccount(2, storage);
    expect(storage.getItem("algocoach-notes")).toBeNull();
    expect(storage.getItem("algocoach-learning")).toBeNull();
    storage.setItem("algocoach-notes", "second");
    activateLocalAccount(1, storage);
    expect(storage.getItem("algocoach-notes")).toBe("private first");
    expect(storage.getItem("algocoach-learning")).toBe('{"first":true}');
  });
  it("sign-out archives device-only work without deleting other site data", () => {
    const storage = new MemoryStorage();
    storage.setItem("unrelated", "kept");
    activateLocalAccount(1, storage);
    storage.setItem("algocoach-notes", "saved");
    archiveLocalAccount(storage);
    expect(storage.getItem("algocoach-notes")).toBeNull();
    expect(storage.getItem("unrelated")).toBe("kept");
    activateLocalAccount(1, storage);
    expect(storage.getItem("algocoach-notes")).toBe("saved");
  });
  it("a quota error does not clear the current user's data before backing it up", () => {
    const storage = new MemoryStorage();
    activateLocalAccount(1, storage);
    storage.setItem("algocoach-notes", "do not lose");
    storage.setItem = () => {
      throw Error("QuotaExceeded");
    };
    expect(() => activateLocalAccount(2, storage)).toThrow();
    expect(storage.getItem("algocoach-notes")).toBe("do not lose");
    expect(storage.getItem("algocoach-local-owner")).toBe("1");
  });
  it("cannot restore tokens or unrelated entries from a local archive", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "algocoach-account-cache-2",
      JSON.stringify({
        "algocoach-notes": "ok",
        "algocoach-token": "never",
        "other-site-key": "no",
      }),
    );
    activateLocalAccount(2, storage);
    expect(storage.getItem("algocoach-notes")).toBe("ok");
    expect(storage.getItem("algocoach-token")).toBeNull();
    expect(storage.getItem("other-site-key")).toBeNull();
  });
});

it("a partial restore can be retried without overwriting the previous account archive", () => {
  const storage = new MemoryStorage();
  activateLocalAccount(1, storage);
  storage.setItem("algocoach-notes", "first original");
  storage.setItem(
    "algocoach-account-cache-2",
    JSON.stringify({ "algocoach-notes": "second original" }),
  );
  const write = storage.setItem.bind(storage);
  storage.setItem = (key, value) => {
    if (key === "algocoach-notes") throw Error("QuotaExceeded");
    write(key, value);
  };
  expect(() => activateLocalAccount(2, storage)).toThrow();
  storage.setItem = write;
  activateLocalAccount(2, storage);
  expect(storage.getItem("algocoach-notes")).toBe("second original");
  activateLocalAccount(1, storage);
  expect(storage.getItem("algocoach-notes")).toBe("first original");
});
