import type { ExpectedRevision } from "./library";
import type { LibraryResult } from "./libraryClient";
import type { Score } from "./score";
import { serialize } from "./scoreFile";

/**
 * Bibliotekssynken: håller ett Partitur i Biblioteket sparat medan Ägaren arbetar. Den sparar
 * automatiskt en stund efter senaste ändringen och vet hela tiden om Partituret är sparat. Den
 * känner inte till DOM:en eller nätverket: webbläsarens händelser och anropen till Biblioteket
 * kommer utifrån.
 */

/** Sparar Partituret med den förväntade revisionen, eller oavsett revision med "overwrite". */
export type SaveToLibrary = (
  id: string,
  score: Score,
  revision: ExpectedRevision,
) => Promise<LibraryResult<{ revision: number }>>;

/**
 * - `saved`: Sparat.
 * - `saving`: Sparar… En ändring väntar eller sparas just nu.
 * - `offline`: Ej sparat (offline). Biblioteket gick inte att nå, och ändringarna finns bara i Utkastet.
 * - `unauthorized`: Ej sparat, eftersom Ägaren har loggats ut.
 * - `conflict`: Partituret har sparats på en annan flik eller enhet. Den automatiska sparningen
 *   har stoppats tills Ägaren väljer vad som gäller.
 * - `notFound`: Partituret finns inte längre i Biblioteket och sparas inte mer.
 */
export type SyncStatus = "saved" | "saving" | "offline" | "unauthorized" | "conflict" | "notFound";

type Problem = Exclude<SyncStatus, "saved" | "saving">;

export type SyncState = {
  id: string;
  /** Den senast kända revisionen i Biblioteket. */
  revision: number;
  /** Om Partituret är detsamma som den revisionen. */
  saved: boolean;
  status: SyncStatus;
  /** Revisionen i Biblioteket vid en konflikt. */
  serverRevision?: number;
};

/** Hur länge synken väntar efter senaste ändringen innan den sparar. */
export const SAVE_DELAY_MS = 2000;

export class LibrarySync {
  private readonly id: string;
  private readonly save: SaveToLibrary;
  private revision: number;
  /** Partiturfilen som den senast kända revisionen motsvarar, eller null när den inte är känd. */
  private savedText: string | null;
  private score: Score;
  private text: string;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private inFlight = false;
  /** Varför den senaste sparningen inte blev av, tills en sparning lyckas. */
  private problem: Problem | null = null;
  private serverRevision: number | undefined;
  /** Ägaren har valt Skriv över, och det är inte gjort än. */
  private overwriting = false;
  private running = false;
  /** Ökar när synken stoppas, så att svar på sparningar från före stoppet ignoreras. */
  private generation = 0;
  private readonly listeners = new Set<(state: SyncState) => void>();
  private snapshot: SyncState;

  /** Skapar synken utan att starta den. Inget sparas förrän `start` har anropats. */
  constructor(options: { id: string; revision: number; savedText: string | null; score: Score; save: SaveToLibrary }) {
    this.id = options.id;
    this.revision = options.revision;
    this.savedText = options.savedText;
    this.score = options.score;
    this.text = serialize(options.score);
    this.save = options.save;
    this.snapshot = this.currentState();
  }

  /** Det aktuella tillståndet. Det är samma objekt tills något har ändrats. */
  get state(): SyncState {
    return this.snapshot;
  }

  /** Prenumererar på nya tillstånd. Ger en funktion som avslutar prenumerationen. */
  subscribe = (listener: (state: SyncState) => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** Startar den automatiska sparningen. Det som inte är sparat, t.ex. från offline före en omladdning, sparas. */
  start(): void {
    if (this.running) return;
    this.running = true;
    if (!this.isSaved() && !this.paused()) this.schedule();
    this.changed();
  }

  /** Stoppar synken, t.ex. när ett annat Partitur tar det nuvarandes plats. Svar som kommer sedan ignoreras. */
  stop(): void {
    this.running = false;
    this.generation++;
    this.inFlight = false;
    this.cancelTimer();
  }

  /** Partituret har ändrats. */
  edit(score: Score): void {
    if (!this.running) return;
    this.score = score;
    this.text = serialize(score);
    if (!this.paused()) {
      if (this.isSaved() && !this.inFlight) this.cancelTimer();
      else this.schedule();
    }
    this.changed();
  }

  /**
   * Sparar direkt det som inte är sparat: när fliken döljs eller stängs och när nätet kommer
   * tillbaka. Pågår en sparning sparas resten när den är klar.
   */
  flush(): void {
    if (!this.running) return;
    this.cancelTimer();
    if (!this.isSaved() && !this.inFlight && !this.paused()) void this.saveNow();
    this.changed();
  }

  /** Skriv över: sparar Partituret oavsett vad som har sparats på andra flikar eller enheter. */
  overwrite(): void {
    if (!this.running || this.problem !== "conflict" || this.inFlight) return;
    this.problem = null;
    // Gäller tills överskrivningen har lyckats, även om den första inte når fram
    this.overwriting = true;
    void this.saveNow();
  }

  private isSaved(): boolean {
    return this.text === this.savedText;
  }

  /** Den automatiska sparningen står still tills Ägaren har valt vad som gäller. */
  private paused(): boolean {
    return this.problem === "conflict" || this.problem === "notFound";
  }

  private currentState(): SyncState {
    const saved = this.isSaved();
    return {
      id: this.id,
      revision: this.revision,
      saved,
      status: this.status(saved),
      ...(this.problem === "conflict" && { serverRevision: this.serverRevision }),
    };
  }

  private status(saved: boolean): SyncStatus {
    if (this.inFlight) return "saving";
    if (this.problem) return this.problem;
    return saved && !this.timer ? "saved" : "saving";
  }

  /** Berättar för prenumeranterna om tillståndet har ändrats. */
  private changed(): void {
    const next = this.currentState();
    if (JSON.stringify(next) === JSON.stringify(this.snapshot)) return;
    this.snapshot = next;
    for (const listener of this.listeners) listener(next);
  }

  private cancelTimer(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private schedule(): void {
    this.cancelTimer();
    this.timer = setTimeout(() => {
      this.timer = null;
      // Pågår en sparning sparas ändringen när den är klar
      if (!this.inFlight) void this.saveNow();
    }, SAVE_DELAY_MS);
  }

  private async saveNow(): Promise<void> {
    const generation = this.generation;
    const text = this.text;
    this.inFlight = true;
    this.changed();
    const result = await this.save(this.id, this.score, this.overwriting ? "overwrite" : this.revision);
    if (generation !== this.generation) return;
    this.inFlight = false;
    this.settle(result, text);
    this.changed();
  }

  private settle(result: LibraryResult<{ revision: number }>, text: string): void {
    if (!result.ok) {
      // Ändringarna ligger kvar i Utkastet. Utom vid en konflikt eller ett borttaget Partitur gör
      // nästa ändring, eller att nätet kommer tillbaka, ett nytt försök.
      this.problem = result.reason === "failed" ? "offline" : result.reason;
      if (result.reason === "conflict") this.serverRevision = result.revision;
      this.cancelTimer();
      return;
    }
    this.problem = null;
    this.overwriting = false;
    this.revision = result.revision;
    this.savedText = text;
    // Ändringar under sparningen, vars väntetid redan har gått ut
    if (!this.isSaved() && !this.timer) void this.saveNow();
  }
}
