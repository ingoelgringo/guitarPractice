"use client";

import dynamic from "next/dynamic";

// alphaTab behöver webbläsaren, så editorn renderas aldrig på servern.
export const TabEditorLoader = dynamic(
  () => import("./TabEditor").then((m) => m.TabEditor),
  { ssr: false },
);
