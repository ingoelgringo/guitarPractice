// Stämmarens service worker (public/sw.js) körs i en egen kontext med en låtsad `self`, `caches`
// och `fetch`, så att cachestrategierna går att pröva utan webbläsare.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import { beforeEach, describe, expect, it } from "vitest";

const SOURCE = readFileSync(join(__dirname, "..", "public", "sw.js"), "utf8");
const ORIGIN = "https://ingemar.berghult.com";
const PAGE = `${ORIGIN}/guitar/tuner`;
const CHUNK = `${ORIGIN}/guitar/_next/static/chunks/app-123.js`;

/** Cachar i minnet, med nyckeln utan frågan när `ignoreSearch` är satt. */
class MemoryCaches {
  stores = new Map<string, Map<string, Response>>();

  async open(name: string) {
    if (!this.stores.has(name)) this.stores.set(name, new Map());
    const store = this.stores.get(name)!;
    const key = (request: Request | string) => (typeof request === "string" ? new URL(request, ORIGIN).href : request.url);
    return {
      match: async (request: Request | string, options?: { ignoreSearch?: boolean }) => {
        const wanted = new URL(key(request));
        if (options?.ignoreSearch) wanted.search = "";
        const found = [...store.entries()].find(([url]) => {
          const candidate = new URL(url);
          if (options?.ignoreSearch) candidate.search = "";
          return candidate.href === wanted.href;
        });
        return found?.[1].clone();
      },
      put: async (request: Request | string, response: Response) => void store.set(key(request), response),
      delete: async (request: Request | string) => store.delete(key(request)),
      keys: async () => [...store.keys()].map((url) => new Request(url)),
    };
  }

  async match(request: Request | string, options?: { ignoreSearch?: boolean }) {
    for (const name of this.stores.keys()) {
      const found = await (await this.open(name)).match(request, options);
      if (found) return found;
    }
    return undefined;
  }

  async keys() {
    return [...this.stores.keys()];
  }

  async delete(name: string) {
    return this.stores.delete(name);
  }
}

type Listener = (event: unknown) => void;

function startWorker(
  network: (url: string) => Response | Promise<Response>,
  timers: { setTimeout: (callback: () => void, ms: number) => unknown } = { setTimeout },
) {
  const listeners = new Map<string, Listener>();
  const caches = new MemoryCaches();
  const requests: string[] = [];
  let claimed = false;
  let skipped = false;
  const self = {
    location: new URL(`${ORIGIN}/guitar/sw.js`),
    addEventListener: (type: string, listener: Listener) => listeners.set(type, listener),
    skipWaiting: async () => void (skipped = true),
    clients: { claim: async () => void (claimed = true) },
  };
  const fetch = async (input: Request | string) => {
    const url = typeof input === "string" ? new URL(input, ORIGIN).href : input.url;
    requests.push(url);
    return network(url);
  };
  vm.runInNewContext(SOURCE, {
    self,
    caches,
    fetch,
    URL,
    Request,
    Response,
    Promise,
    Set,
    console,
    setTimeout: timers.setTimeout,
    clearTimeout: () => {},
  });

  /** Skickar en händelse och väntar in allt den startar. */
  async function dispatch(type: string, fields: Record<string, unknown> = {}) {
    const waits: Promise<unknown>[] = [];
    let response: Promise<Response> | undefined;
    listeners.get(type)?.({
      ...fields,
      waitUntil: (promise: Promise<unknown>) => waits.push(promise),
      respondWith: (promise: Promise<Response>) => (response = Promise.resolve(promise)),
    });
    await Promise.all(waits);
    return response;
  }

  return {
    caches,
    requests,
    claimed: () => claimed,
    skipped: () => skipped,
    install: () => dispatch("install"),
    activate: () => dispatch("activate"),
    message: (data: unknown) => dispatch("message", { data }),
    fetch: (url: string, mode: RequestMode = "no-cors") =>
      dispatch("fetch", { request: { url, method: "GET", mode } as Request }),
    post: (url: string) => dispatch("fetch", { request: { url, method: "POST", mode: "cors" } as Request }),
  };
}

const offline = () => Promise.reject(new TypeError("Failed to fetch"));

describe("Stämmarens service worker", () => {
  let online: boolean;
  let version: number;
  let status: number;
  let worker: ReturnType<typeof startWorker>;

  beforeEach(() => {
    online = true;
    version = 1;
    status = 200;
    worker = startWorker((url) => (online ? new Response(`${url} v${version}`, { status }) : offline()));
  });

  it("cachar Stämmarsidan när den installeras och tar över direkt", async () => {
    await worker.install();
    expect(worker.requests).toEqual([PAGE]);
    expect(worker.skipped()).toBe(true);
    await worker.activate();
    expect(worker.claimed()).toBe(true);
  });

  it("installeras även utan nät", async () => {
    online = false;
    await expect(worker.install()).resolves.toBeUndefined();
  });

  it("hämtar Stämmarsidan från nätet först och sparar den senaste", async () => {
    await (await worker.fetch(PAGE, "navigate"))!.text();
    version = 2;
    expect(await (await worker.fetch(PAGE, "navigate"))!.text()).toBe(`${PAGE} v2`);
    online = false;
    expect(await (await worker.fetch(`${PAGE}?x=1`, "navigate"))!.text()).toBe(`${PAGE} v2`);
  });

  it("sparar inte ett felsvar för Stämmarsidan", async () => {
    await worker.fetch(PAGE, "navigate");
    version = 2;
    status = 500;
    expect((await worker.fetch(PAGE, "navigate"))!.status).toBe(500);
    online = false;
    expect(await (await worker.fetch(PAGE, "navigate"))!.text()).toBe(`${PAGE} v1`);
  });

  it("visar den sparade Stämmarsidan när nätet är för segt", async () => {
    await worker.fetch(PAGE, "navigate");
    let waited = 0;
    const slow = startWorker(() => new Promise<Response>(() => {}), {
      setTimeout: (callback, ms) => {
        waited = ms;
        callback();
      },
    });
    slow.caches.stores = worker.caches.stores;
    expect(await (await slow.fetch(PAGE, "navigate"))!.text()).toBe(`${PAGE} v1`);
    expect(waited).toBeGreaterThanOrEqual(2000);
  });

  it("väntar på nätet för Stämmarsidan när ingen sparad sida finns", async () => {
    const slow = startWorker(() => new Promise<Response>((resolve) => setTimeout(() => resolve(new Response("sent")), 20)), {
      setTimeout: (callback) => callback(),
    });
    expect(await (await slow.fetch(PAGE, "navigate"))!.text()).toBe("sent");
  });

  it("hämtar Next-filerna från cachen först", async () => {
    await worker.fetch(CHUNK);
    version = 2;
    expect(await (await worker.fetch(CHUNK))!.text()).toBe(`${CHUNK} v1`);
    expect(worker.requests).toEqual([CHUNK]);
  });

  it("släpper igenom allt annat", async () => {
    expect(await worker.fetch(`${ORIGIN}/guitar/api/library`)).toBeUndefined();
    expect(await worker.fetch(`${ORIGIN}/guitar/tab-editor`, "navigate")).toBeUndefined();
    expect(await worker.fetch(`https://cdn.example.com/guitar/_next/static/x.js`)).toBeUndefined();
    expect(await worker.post(PAGE)).toBeUndefined();
  });

  const cachedUrls = () => [...worker.caches.stores.values()].flatMap((store) => [...store.keys()]);

  it("sparar sidans filer när sidan skickar dem, men inget utanför Next-filerna", async () => {
    await worker.message({ type: "cache-static", urls: [CHUNK, `${ORIGIN}/guitar/api/library`] });
    online = false;
    expect(await (await worker.fetch(CHUNK))!.text()).toBe(`${CHUNK} v1`);
    expect(cachedUrls()).toEqual([CHUNK]);
  });

  it("behåller filer som sidan laddar senare så länge cachen är liten", async () => {
    const later = `${ORIGIN}/guitar/_next/static/chunks/later.js`;
    await worker.fetch(later);
    await worker.message({ type: "cache-static", urls: [CHUNK] });
    expect(cachedUrls()).toEqual([later, CHUNK]);
  });

  it("rensar bort filer som sidan inte använder när cachen har vuxit", async () => {
    for (let i = 0; i < 100; i++) await worker.fetch(`${ORIGIN}/guitar/_next/static/chunks/old-${i}.js`);
    await worker.message({ type: "cache-static", urls: [CHUNK] });
    expect(cachedUrls()).toEqual([CHUNK]);
  });

  it("rensar gamla cachar när en ny version aktiveras", async () => {
    await worker.fetch(CHUNK);
    await worker.caches.open("tuner-static-v0");
    await worker.caches.open("någon-annans-cache");
    const current = await worker.caches.keys();
    await worker.activate();
    expect(await worker.caches.keys()).toEqual(
      current.filter((name) => name !== "tuner-static-v0"),
    );
  });
});
