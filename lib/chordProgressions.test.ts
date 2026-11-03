import { describe, expect, it } from "vitest";
import {
  type Chord,
  CIRCLE_OF_FIFTHS,
  chordCopies,
  chordName,
  chordVertices,
  circleLabel,
  clickedChord,
  isDrag,
  latticeKey,
  majorTriangle,
  minorTriangle,
  noteNameOf,
  type Point,
  sameChord,
  shownChord,
  stepInCircle,
  triangleCenter,
  vertexPitch,
  vertexPosition,
  type VisibleTriangle,
  visibleTriangles,
  visibleVertices,
} from "./chordProgressions";

const C = 0;
const major = (root: number): Chord => ({ root, quality: "major" });
const minor = (root: number): Chord => ({ root, quality: "minor" });

describe("Kvintcirkeln", () => {
  it("har tolv platser med två Ackord var, 24 sammanlagt", () => {
    expect(CIRCLE_OF_FIFTHS).toHaveLength(12);
    const all = CIRCLE_OF_FIFTHS.flatMap((place) => [place.major, place.minor]);
    expect(new Set(all.map((chord) => `${chord.root}${chord.quality}`)).size).toBe(24);
  });

  it("har C överst och durackorden i kvintordning medurs", () => {
    expect(CIRCLE_OF_FIFTHS.map((place) => chordName(place.major, "english"))).toEqual([
      "C", "G", "D", "A", "E", "B", "F♯", "D♭", "A♭", "E♭", "B♭", "F",
    ]);
  });

  it("har det parallella mollackordet innanför varje durackord", () => {
    expect(CIRCLE_OF_FIFTHS.map((place) => chordName(place.minor, "english"))).toEqual([
      "Am", "Em", "Bm", "F♯m", "C♯m", "G♯m", "E♭m", "B♭m", "Fm", "Cm", "Gm", "Dm",
    ]);
    for (const place of CIRCLE_OF_FIFTHS) {
      expect(place.minor.root).toBe((place.major.root + 9) % 12);
    }
  });

  it("skriver F♯/G♭ på F♯-platsen och annars Ackordets namn", () => {
    expect(circleLabel(CIRCLE_OF_FIFTHS[6].major, "english")).toBe("F♯/G♭");
    expect(circleLabel(CIRCLE_OF_FIFTHS[6].minor, "english")).toBe("E♭m");
    expect(circleLabel(CIRCLE_OF_FIFTHS[5].major, "swedish")).toBe("H");
  });
});

describe("ackordnamnen", () => {
  it("stavas fast per tonklass i engelskt Notnamnsläge", () => {
    const names = (quality: Chord["quality"]) =>
      Array.from({ length: 12 }, (_, root) => chordName({ root, quality }, "english"));
    expect(names("major")).toEqual(["C", "D♭", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"]);
    expect(names("minor")).toEqual(["Cm", "C♯m", "Dm", "E♭m", "Em", "Fm", "F♯m", "Gm", "G♯m", "Am", "B♭m", "Bm"]);
  });

  it("heter H och B i svenskt Notnamnsläge där det engelska är B och B♭", () => {
    expect(chordName(major(10), "swedish")).toBe("B");
    expect(chordName(major(11), "swedish")).toBe("H");
    expect(chordName(minor(10), "swedish")).toBe("Bm");
    expect(chordName(minor(11), "swedish")).toBe("Hm");
    expect(chordName(major(C), "swedish")).toBe("C");
    expect(chordName(minor(8), "swedish")).toBe("G♯m");
  });
});

describe("markeringen", () => {
  it("visar det hovrade Ackordet om något hovras, annars det låsta", () => {
    expect(shownChord(major(C), minor(9))).toEqual(minor(9));
    expect(shownChord(major(C), null)).toEqual(major(C));
    expect(shownChord(null, null)).toBeNull();
  });

  it("ett klick låser Ackordet", () => {
    expect(clickedChord(null, major(7))).toEqual(major(7));
    expect(clickedChord(major(C), major(7))).toEqual(major(7));
  });

  it("ett klick på det låsta Ackordet eller utanför släpper låsningen", () => {
    expect(clickedChord(major(7), major(7))).toBeNull();
    expect(clickedChord(major(7), null)).toBeNull();
  });

  it("C-dur och C-moll är olika Ackord", () => {
    expect(sameChord(major(C), minor(C))).toBe(false);
    expect(sameChord(major(C), { root: 0, quality: "major" })).toBe(true);
    expect(sameChord(null, major(C))).toBe(false);
  });
});

describe("tangentbordet i Kvintcirkeln", () => {
  it("höger går medurs och vänster moturs i kvintordning, runt cirkeln", () => {
    expect(stepInCircle(major(C), "ArrowRight")).toEqual(major(7));
    expect(stepInCircle(major(C), "ArrowLeft")).toEqual(major(5));
    expect(stepInCircle(major(5), "ArrowRight")).toEqual(major(C));
    expect(stepInCircle(minor(9), "ArrowRight")).toEqual(minor(4));
  });

  it("upp går till durackordet och ner till mollackordet på samma plats", () => {
    expect(stepInCircle(major(7), "ArrowDown")).toEqual(minor(4));
    expect(stepInCircle(minor(4), "ArrowUp")).toEqual(major(7));
    expect(stepInCircle(major(7), "ArrowUp")).toEqual(major(7));
    expect(stepInCircle(minor(4), "ArrowDown")).toEqual(minor(4));
  });

  it("utan Ackord börjar det på C-dur", () => {
    expect(stepInCircle(null, "ArrowRight")).toEqual(major(C));
  });

  it("andra tangenter flyttar inte", () => {
    expect(stepInCircle(major(C), "a")).toBeNull();
  });
});

describe("Tonnetzens gitter", () => {
  it("hörnet (0,0) är C, (1,0) G, (0,1) E och (-1,1) A", () => {
    expect(vertexPitch(0, 0)).toBe(0);
    expect(vertexPitch(1, 0)).toBe(7);
    expect(vertexPitch(0, 1)).toBe(4);
    expect(vertexPitch(-1, 1)).toBe(9);
  });

  it("kvinter ligger vågrätt och terserna uppåt längs diagonalerna", () => {
    const c = vertexPosition(0, 0, 10);
    const g = vertexPosition(1, 0, 10);
    const e = vertexPosition(0, 1, 10);
    expect(g.y).toBeCloseTo(c.y);
    expect(g.x - c.x).toBeCloseTo(10);
    expect(e.x - c.x).toBeCloseTo(5);
    // Uppåt på skärmen är mindre y
    expect(e.y - c.y).toBeCloseTo(-10 * Math.sqrt(3) / 2);
  });

  it("durtriangeln på (0,0) är C-dur, C E G", () => {
    const triangle = majorTriangle(0, 0);
    expect(triangle.chord).toEqual(major(C));
    expect(triangle.vertices.map(([i, j]) => vertexPitch(i, j)).sort((a, b) => a - b)).toEqual([0, 4, 7]);
  });

  it("C-durs granne är Em, E G B", () => {
    const triangle = minorTriangle(0, 0);
    expect(triangle.chord).toEqual(minor(4));
    expect(triangle.vertices.map(([i, j]) => vertexPitch(i, j)).sort((a, b) => a - b)).toEqual([4, 7, 11]);
  });

  it("tonnamnen stavas fast och följer Notnamnsläget", () => {
    expect(noteNameOf(1, "english")).toBe("D♭");
    expect(noteNameOf(10, "english")).toBe("B♭");
    expect(noteNameOf(10, "swedish")).toBe("B");
    expect(noteNameOf(11, "swedish")).toBe("H");
  });
});

describe("Tonnetzens synliga trianglar", () => {
  const view = { offset: { x: 0, y: 0 }, width: 640, height: 400, edge: 72 };

  const centroid = triangleCenter;

  /** Om punkten ligger i triangeln, med kanterna inräknade. */
  function contains(triangle: VisibleTriangle, x: number, y: number): boolean {
    const [a, b, c] = triangle.points;
    const side = (p: Point, q: Point) => (q.x - p.x) * (y - p.y) - (q.y - p.y) * (x - p.x);
    const d = [side(a, b), side(b, c), side(c, a)];
    return d.every((v) => v >= -1e-6) || d.every((v) => v <= 1e-6);
  }

  it("täcker hela rutan", () => {
    const triangles = visibleTriangles(view);
    for (let x = 0; x <= view.width; x += 20) {
      for (let y = 0; y <= view.height; y += 20) {
        expect(triangles.some((triangle) => contains(triangle, x, y)), `${x},${y}`).toBe(true);
      }
    }
  });

  it("har C-dur mitt i rutan vid förskjutning 0", () => {
    const center = visibleTriangles(view).find((triangle) => contains(triangle, view.width / 2, view.height / 2));
    expect(center?.chord).toEqual(major(C));
    const middle = centroid(center!);
    expect(middle.x).toBeCloseTo(view.width / 2);
    expect(middle.y).toBeCloseTo(view.height / 2);
  });

  it("följer förskjutningen", () => {
    const moved = visibleTriangles({ ...view, offset: { x: 30, y: -20 } });
    const c = moved.find((triangle) => triangle.i === 0 && triangle.j === 0 && triangle.chord.quality === "major")!;
    expect(centroid(c).x).toBeCloseTo(view.width / 2 + 30);
    expect(centroid(c).y).toBeCloseTo(view.height / 2 - 20);
  });

  it("en förskjutning med en hel period ger samma Ackord på samma ställen", () => {
    const placed = (triangles: VisibleTriangle[]) =>
      triangles
        .filter((triangle) => {
          const { x, y } = centroid(triangle);
          return x >= 0 && x <= view.width && y >= 0 && y <= view.height;
        })
        .map((triangle) => {
          const { x, y } = centroid(triangle);
          return `${triangle.chord.root}${triangle.chord.quality}@${Math.round(x)},${Math.round(y)}`;
        })
        .sort();
    const periods = [
      { x: 12 * view.edge, y: 0 },
      { x: 1.5 * view.edge, y: (-3 * view.edge * Math.sqrt(3)) / 2 },
    ];
    for (const offset of periods) {
      expect(placed(visibleTriangles({ ...view, offset }))).toEqual(placed(visibleTriangles(view)));
    }
  });

  it("hörnen finns för varje synlig triangel, med tonklass", () => {
    const vertices = visibleVertices(view);
    const c = vertices.find((vertex) => vertex.i === 0 && vertex.j === 0);
    expect(c?.pitch).toBe(0);
    for (const triangle of visibleTriangles(view)) {
      for (const [i, j] of triangle.vertices) {
        expect(vertices.some((vertex) => vertex.i === i && vertex.j === j), `${i},${j}`).toBe(true);
      }
    }
  });
});

describe("klick eller dragning", () => {
  it("en rörelse på högst 5 px är ett klick", () => {
    expect(isDrag({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(false);
    expect(isDrag({ x: 10, y: 10 }, { x: 13, y: 14 })).toBe(false);
  });

  it("en längre rörelse är en dragning", () => {
    expect(isDrag({ x: 0, y: 0 }, { x: 6, y: 0 })).toBe(true);
    expect(isDrag({ x: 0, y: 0 }, { x: -4, y: 4 })).toBe(true);
  });
});

describe("ett Ackords kopior i Tonnetzen", () => {
  const view = { offset: { x: 0, y: 0 }, width: 640, height: 400, edge: 72 };

  it("hittar alla synliga trianglar för Ackordet och inga andra", () => {
    const copies = chordCopies(view, major(C));
    const cells = copies.map((triangle) => latticeKey(triangle.i, triangle.j));
    // C ligger på (0,0) och en kvint- och terskombination bort: tre stora terser upp, eller fyra kvinter och en ters ner
    expect(cells).toEqual(expect.arrayContaining(["0,0", "0,3", "4,-1"]));
    expect(copies.every((triangle) => sameChord(triangle.chord, major(C)))).toBe(true);
    const all = visibleTriangles(view).filter((triangle) => sameChord(triangle.chord, major(C)));
    expect(all.map((triangle) => latticeKey(triangle.i, triangle.j)).sort()).toEqual([...cells].sort());
  });

  it("hittar kopiorna för mollackord också, t.ex. Em bredvid C-dur", () => {
    const copies = chordCopies(view, minor(4));
    expect(copies.some((triangle) => triangle.i === 0 && triangle.j === 0)).toBe(true);
  });

  it("utan Ackord finns inga kopior och inga hörn", () => {
    expect(chordCopies(view, null)).toEqual([]);
    expect(chordVertices(view, null).size).toBe(0);
  });

  it("hörnen är kopiornas tre hörn, med Ackordets toner", () => {
    const vertices = chordVertices(view, minor(9));
    const copies = chordCopies(view, minor(9));
    expect(vertices.size).toBeGreaterThanOrEqual(3);
    for (const triangle of copies) {
      for (const [i, j] of triangle.vertices) expect(vertices.has(latticeKey(i, j))).toBe(true);
    }
    const pitches = new Set([...vertices].map((key) => vertexPitch(...(key.split(",").map(Number) as [number, number]))));
    expect([...pitches].sort((a, b) => a - b)).toEqual([0, 4, 9]);
  });

  it("nya kopior som dras in i rutan hittas också", () => {
    const moved = { ...view, offset: { x: -6 * view.edge, y: 0 } };
    const keys = (v: typeof view) => chordCopies(v, major(C)).map((t) => latticeKey(t.i, t.j));
    expect(keys(moved)).not.toEqual(keys(view));
    expect(keys(moved).length).toBeGreaterThan(0);
  });
});
