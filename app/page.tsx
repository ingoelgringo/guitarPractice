import Link from "next/link";
import { TOOLS } from "@/lib/tools";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <h1>Guitar Practice</h1>
      <p>Tools for guitarists: write tabs with notation, play them back and print them.</p>
      <ul className={styles.tools}>
        {TOOLS.map((tool) => (
          <li key={tool.href}>
            <Link href={tool.href} className={styles.card}>
              <h2>{tool.title}</h2>
              <p>{tool.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
