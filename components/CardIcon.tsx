import type { ReactNode } from "react";
import styles from "./Card.module.css";

/** Ikonerna i kortens rubriker, ritade i en 24×24-ruta med kontur. */
const PATHS = {
  tonnetz: (
    <>
      <path d="M12 4 4 18h16z" />
      <path d="M8 11h8" />
      <circle cx="12" cy="4" r="2" />
      <circle cx="4" cy="18" r="2" />
      <circle cx="20" cy="18" r="2" />
    </>
  ),
  circle: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3.5V8" />
    </>
  ),
  progression: <path d="M4 7h16M4 12h16M4 17h16" />,
  editor: (
    <>
      <path d="M14.5 5.5a4 4 0 0 0 4.9 4.9L12 17.8 7 20l-1-1 2.2-5 7.4-7.4z" />
      <path d="M14.5 5.5 17 3l4 4-2.5 2.5" />
    </>
  ),
  library: <path d="M6 3.5h12v17l-6-4-6 4z" />,
} satisfies Record<string, ReactNode>;

export type CardIconName = keyof typeof PATHS;

export function CardIcon({ name }: { name: CardIconName }) {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
