import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apply, createEditor } from "./editor";
import type { LibraryResult } from "./libraryClient";
import { LibrarySync, type SaveToLibrary } from "./librarySync";
import type { Score } from "./score";
import { serialize } from "./scoreFile";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function scoreWith(title: string): Score {
  return apply(createEditor(), { type: "setMetadata", metadata: { title, artist: "" } }).score;
}

type Call = {
  id: string;
  title: string;
  revision: number | "overwrite";
  respond: (result: LibraryResult<{ revision: number }>) => Promise<void>;
};

/** Ett Bibliotek utan nätverk: varje sparning väntar tills testet svarar på den. */
function fakeLibrary() {
  const calls: Call[] = [];
  const save: SaveToLibrary = (id, score, revision) =>
    new Promise((resolve) => {
      calls.push({
        id,
        title: score.metadata.title,
        revision,
        respond: async (result) => {
          resolve(result);
          // Låter synken ta emot svaret innan testet fortsätter
          await vi.advanceTimersByTimeAsync(0);
        },
      });
    });
  return { calls, save };
}

/** En startad synk för ett Partitur som är sparat i revision 1. */
function syncAt(save: SaveToLibrary, score = scoreWith("Sparad")) {
  const sync = new LibrarySync({ id: "p1", revision: 1, savedText: serialize(score), score, save });
  sync.start();
  return sync;
}

describe("Bibliotekssynk: offline och när fliken stängs", () => {
  it("utan nät blir det Ej sparat (offline), och när nätet kommer tillbaka sparas det", async () => {
    const library = fakeLibrary();
    const sync = syncAt(library.save);
    sync.edit(scoreWith("Offline"));
    await vi.advanceTimersByTimeAsync(2000);

    await library.calls[0].respond({ ok: false, reason: "failed" });
    expect(sync.state).toMatchObject({ status: "offline", saved: false, revision: 1 });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(library.calls).toHaveLength(1);

    sync.flush();
    expect(sync.state.status).toBe("saving");
    expect(library.calls.map((c) => c.title)).toEqual(["Offline", "Offline"]);
    await library.calls[1].respond({ ok: true, revision: 2 });
    expect(sync.state).toMatchObject({ status: "saved", revision: 2 });
  });

  it("en ny ändring offline gör ett nytt försök efter väntetiden", async () => {
    const library = fakeLibrary();
    const sync = syncAt(library.save);
    sync.edit(scoreWith("A"));
    await vi.advanceTimersByTimeAsync(2000);
    await library.calls[0].respond({ ok: false, reason: "failed" });

    sync.edit(scoreWith("AB"));
    expect(sync.state.status).toBe("offline");
    await vi.advanceTimersByTimeAsync(2000);

    expect(library.calls.map((c) => c.title)).toEqual(["A", "AB"]);
  });

  it("när fliken döljs eller stängs sparas ändringen direkt", () => {
    const library = fakeLibrary();
    const sync = syncAt(library.save);
    sync.edit(scoreWith("Sista ändringen"));

    sync.flush();

    expect(library.calls.map((c) => c.title)).toEqual(["Sista ändringen"]);
  });

  it("finns inget osparat gör flush ingenting", async () => {
    const library = fakeLibrary();
    const sync = syncAt(library.save);

    sync.flush();

    expect(library.calls).toHaveLength(0);
  });

  it("flush under en pågående sparning sparar inte samma version två gånger", async () => {
    const library = fakeLibrary();
    const sync = syncAt(library.save);
    sync.edit(scoreWith("Pågår"));
    await vi.advanceTimersByTimeAsync(2000);

    sync.flush();
    await library.calls[0].respond({ ok: true, revision: 2 });

    expect(library.calls).toHaveLength(1);
    expect(sync.state.status).toBe("saved");
  });
});

describe("Bibliotekssynk: automatisk sparning", () => {
  it("en ändring sparas 2 sekunder efter senaste ändringen", async () => {
    const library = fakeLibrary();
    const sync = syncAt(library.save);

    sync.edit(scoreWith("Ändrad"));
    await vi.advanceTimersByTimeAsync(1999);
    expect(library.calls).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(1);

    expect(library.calls.map(({ id, title, revision }) => ({ id, title, revision }))).toEqual([
      { id: "p1", title: "Ändrad", revision: 1 },
    ]);
    expect(sync.state.status).toBe("saving");
    await library.calls[0].respond({ ok: true, revision: 2 });
    expect(sync.state).toMatchObject({ status: "saved", revision: 2, saved: true });
  });

  it("snabba ändringar ger en enda sparning med den senaste versionen", async () => {
    const library = fakeLibrary();
    const sync = syncAt(library.save);

    sync.edit(scoreWith("A"));
    await vi.advanceTimersByTimeAsync(1500);
    sync.edit(scoreWith("AB"));
    await vi.advanceTimersByTimeAsync(1500);
    sync.edit(scoreWith("ABC"));
    await vi.advanceTimersByTimeAsync(2000);

    expect(library.calls.map((c) => c.title)).toEqual(["ABC"]);
  });

  it("en ändring under en pågående sparning sparas efteråt med den nya revisionen", async () => {
    const library = fakeLibrary();
    const sync = syncAt(library.save);
    sync.edit(scoreWith("Först"));
    await vi.advanceTimersByTimeAsync(2000);

    sync.edit(scoreWith("Sedan"));
    await vi.advanceTimersByTimeAsync(2000);
    expect(library.calls).toHaveLength(1);
    await library.calls[0].respond({ ok: true, revision: 2 });
    expect(sync.state).toMatchObject({ status: "saving", revision: 2, saved: false });

    expect(library.calls.map(({ title, revision }) => ({ title, revision }))).toEqual([
      { title: "Först", revision: 1 },
      { title: "Sedan", revision: 2 },
    ]);
    await library.calls[1].respond({ ok: true, revision: 3 });
    expect(sync.state).toMatchObject({ status: "saved", revision: 3, saved: true });
  });

  it("en ändring som ångras tillbaka till det sparade sparas inte", async () => {
    const library = fakeLibrary();
    const sync = syncAt(library.save, scoreWith("Sparad"));

    sync.edit(scoreWith("Ändrad"));
    sync.edit(scoreWith("Sparad"));

    expect(sync.state.status).toBe("saved");
    await vi.advanceTimersByTimeAsync(5000);
    expect(library.calls).toHaveLength(0);
  });

  it("ett Utkast med osparade ändringar sparas när synken startar", async () => {
    const library = fakeLibrary();
    const sync = new LibrarySync({ id: "p1", revision: 4, savedText: null, score: scoreWith("Offline"), save: library.save });
    expect(sync.state).toMatchObject({ status: "saving", saved: false });
    await vi.advanceTimersByTimeAsync(5000);
    expect(library.calls).toHaveLength(0);

    sync.start();
    await vi.advanceTimersByTimeAsync(2000);

    expect(library.calls.map(({ title, revision }) => ({ title, revision }))).toEqual([
      { title: "Offline", revision: 4 },
    ]);
  });
});

describe("Bibliotekssynk: konflikt", () => {
  async function inConflict() {
    const library = fakeLibrary();
    const sync = syncAt(library.save);
    sync.edit(scoreWith("Min version"));
    await vi.advanceTimersByTimeAsync(2000);
    await library.calls[0].respond({ ok: false, reason: "conflict", revision: 5 });
    return { library, sync };
  }

  it("vid 409 visas konflikten och den automatiska sparningen stoppas", async () => {
    const { library, sync } = await inConflict();

    expect(sync.state).toMatchObject({ status: "conflict", saved: false, revision: 1, serverRevision: 5 });
    sync.edit(scoreWith("Min version, ändrad igen"));
    await vi.advanceTimersByTimeAsync(10_000);
    sync.flush();
    expect(library.calls).toHaveLength(1);
    expect(sync.state.status).toBe("conflict");
  });

  it("Skriv över sparar den senaste versionen oavsett revision, och sedan sparas det automatiskt igen", async () => {
    const { library, sync } = await inConflict();
    sync.edit(scoreWith("Min version, ändrad igen"));

    sync.overwrite();
    expect(sync.state.status).toBe("saving");
    await library.calls[1].respond({ ok: true, revision: 6 });

    expect(library.calls.map(({ title, revision }) => ({ title, revision }))).toEqual([
      { title: "Min version", revision: 1 },
      { title: "Min version, ändrad igen", revision: "overwrite" },
    ]);
    expect(sync.state).toMatchObject({ status: "saved", revision: 6, saved: true });
    sync.edit(scoreWith("Efter överskrivningen"));
    await vi.advanceTimersByTimeAsync(2000);
    expect(library.calls[2]).toMatchObject({ title: "Efter överskrivningen", revision: 6 });
  });
});

describe("Bibliotekssynk: Skriv över utan nät", () => {
  it("en Skriv över som inte nådde fram skriver över när nätet kommer tillbaka", async () => {
    const library = fakeLibrary();
    const sync = syncAt(library.save);
    sync.edit(scoreWith("Min version"));
    await vi.advanceTimersByTimeAsync(2000);
    await library.calls[0].respond({ ok: false, reason: "conflict", revision: 5 });

    sync.overwrite();
    await library.calls[1].respond({ ok: false, reason: "failed" });
    expect(sync.state.status).toBe("offline");
    sync.flush();

    expect(library.calls[2]).toMatchObject({ title: "Min version", revision: "overwrite" });
  });
});

describe("Bibliotekssynk: när Biblioteket inte tar emot Partituret", () => {
  it("utloggad visas det, och nästa ändring gör ett nytt försök", async () => {
    const library = fakeLibrary();
    const sync = syncAt(library.save);
    sync.edit(scoreWith("A"));
    await vi.advanceTimersByTimeAsync(2000);

    await library.calls[0].respond({ ok: false, reason: "unauthorized" });
    expect(sync.state).toMatchObject({ status: "unauthorized", saved: false });
    sync.edit(scoreWith("AB"));
    await vi.advanceTimersByTimeAsync(2000);

    expect(library.calls.map((c) => c.title)).toEqual(["A", "AB"]);
  });

  it("ett Partitur som inte längre finns i Biblioteket sparas inte mer", async () => {
    const library = fakeLibrary();
    const sync = syncAt(library.save);
    sync.edit(scoreWith("A"));
    await vi.advanceTimersByTimeAsync(2000);

    await library.calls[0].respond({ ok: false, reason: "notFound" });
    sync.edit(scoreWith("AB"));
    await vi.advanceTimersByTimeAsync(2000);
    sync.flush();

    expect(sync.state.status).toBe("notFound");
    expect(library.calls).toHaveLength(1);
  });
});

describe("Bibliotekssynk: prenumeration, stopp och omstart", () => {
  it("den som prenumererar får varje nytt tillstånd", async () => {
    const library = fakeLibrary();
    const sync = syncAt(library.save);
    const seen: string[] = [];
    sync.subscribe((state) => seen.push(state.status));

    sync.edit(scoreWith("Ändrad"));
    await vi.advanceTimersByTimeAsync(2000);
    await library.calls[0].respond({ ok: false, reason: "failed" });
    sync.flush();
    await library.calls[1].respond({ ok: true, revision: 2 });

    expect(seen.at(-1)).toBe("saved");
    expect(seen).toContain("offline");
    expect(seen).toContain("saving");
  });

  it("en stoppad synk sparar inget och berättar inget mer", async () => {
    const library = fakeLibrary();
    const sync = syncAt(library.save);
    const listener = vi.fn();
    sync.subscribe(listener);
    sync.edit(scoreWith("Ändrad"));
    listener.mockClear();

    sync.stop();
    await vi.advanceTimersByTimeAsync(5000);
    sync.flush();

    expect(library.calls).toHaveLength(0);
    expect(listener).not.toHaveBeenCalled();
  });

  it("svaret på en sparning som pågick när synken stoppades ignoreras", async () => {
    const library = fakeLibrary();
    const sync = syncAt(library.save);
    sync.edit(scoreWith("Ändrad"));
    await vi.advanceTimersByTimeAsync(2000);
    const listener = vi.fn();
    sync.subscribe(listener);

    sync.stop();
    sync.edit(scoreWith("Ändrad igen"));
    await library.calls[0].respond({ ok: true, revision: 2 });

    expect(library.calls).toHaveLength(1);
    expect(listener).not.toHaveBeenCalled();
  });

  it("en stoppad och omstartad synk sparar det som inte är sparat", async () => {
    const library = fakeLibrary();
    const sync = syncAt(library.save);
    sync.edit(scoreWith("Ändrad"));

    sync.stop();
    sync.start();
    await vi.advanceTimersByTimeAsync(2000);

    expect(library.calls.map((c) => c.title)).toEqual(["Ändrad"]);
  });

  it("tillståndet är samma objekt tills något har ändrats", () => {
    const sync = syncAt(fakeLibrary().save);
    const before = sync.state;

    sync.edit(scoreWith("Sparad"));

    expect(sync.state).toBe(before);
    sync.edit(scoreWith("Ändrad"));
    expect(sync.state).not.toBe(before);
  });
});
