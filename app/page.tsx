import Link from "next/link";
import { isOwnerInPage } from "@/lib/auth";
import { withBasePath } from "@/lib/basePath";
import { TOOLS } from "@/lib/tools";
import styles from "./page.module.css";

export default async function Home() {
  const owner = await isOwnerInPage();

  return (
    <main className={styles.main}>
      <h1>Guitar</h1>
      <p>Tools for guitarists: write tabs with notation, and see scales on the fretboard.</p>
      <ul className={styles.tools}>
        {TOOLS.map((tool) => {
          const content = (
            <>
              <h2>{tool.title}</h2>
              <p>{tool.description}</p>
            </>
          );
          return (
            <li key={tool.title}>
              {tool.href ? (
                <Link href={tool.href} className={styles.card}>
                  {content}
                </Link>
              ) : (
                // Ingen länk än: kortet går varken att klicka på eller tabba till.
                <div className={`${styles.card} ${styles.comingSoon}`}>
                  {content}
                  <p className={styles.badge}>Coming soon</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {/* Diskret länk för Ägaren. Det finns ingen registrering. */}
      <footer className={styles.footer}>
        {owner ? (
          <>
            <Link href="/library" className={styles.authLink}>
              Library
            </Link>
            <form action={withBasePath("/api/logout")} method="post">
              <button type="submit" className={styles.authLink}>
                Log out
              </button>
            </form>
          </>
        ) : (
          <Link href="/login" className={styles.authLink}>
            Log in
          </Link>
        )}
      </footer>
    </main>
  );
}
