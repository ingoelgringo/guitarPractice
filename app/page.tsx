import Link from "next/link";
import { isOwnerInPage } from "@/lib/auth";
import { withBasePath } from "@/lib/basePath";
import { MESSAGES } from "@/lib/messages";
import { siteLanguageInPage } from "@/lib/siteLanguageInPage";
import { TOOLS } from "@/lib/tools";
import styles from "./page.module.css";

export default async function Home() {
  const [owner, language] = await Promise.all([isOwnerInPage(), siteLanguageInPage()]);
  const messages = MESSAGES[language];

  return (
    <main className={styles.main}>
      <h1>{messages.siteTitle}</h1>
      <p>{messages.guitarIntro}</p>
      <ul className={styles.tools}>
        {TOOLS.map((tool) => {
          const content = (
            <>
              <h2>{tool.title}</h2>
              <p>{tool.description[language]}</p>
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
                  <p className={styles.badge}>{messages.comingSoon}</p>
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
              {messages.library}
            </Link>
            <form action={withBasePath("/api/logout")} method="post">
              <button type="submit" className={styles.authLink}>
                {messages.logOut}
              </button>
            </form>
          </>
        ) : (
          <Link href="/login" className={styles.authLink}>
            {messages.logIn}
          </Link>
        )}
      </footer>
    </main>
  );
}
