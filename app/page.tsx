import Link from "next/link";
import { isOwnerInPage } from "@/lib/auth";
import { TOOLS } from "@/lib/tools";
import styles from "./page.module.css";

export default async function Home() {
  const owner = await isOwnerInPage();

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
      {/* Diskret länk för Ägaren. Det finns ingen registrering. */}
      <footer className={styles.footer}>
        {owner ? (
          <form action="/api/logout" method="post">
            <button type="submit" className={styles.authLink}>
              Log out
            </button>
          </form>
        ) : (
          <Link href="/login" className={styles.authLink}>
            Log in
          </Link>
        )}
      </footer>
    </main>
  );
}
