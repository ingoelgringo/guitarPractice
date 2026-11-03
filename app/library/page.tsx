import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LibraryActions } from "@/components/LibraryActions";
import { LibraryScoreLink } from "@/components/LibraryScoreLink";
import { isOwnerInPage } from "@/lib/auth";
import { listScores, type LibraryEntry } from "@/lib/library";
import { MESSAGES, type Messages } from "@/lib/messages";
import { siteLanguageInPage } from "@/lib/siteLanguageInPage";
import styles from "../page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const messages = MESSAGES[await siteLanguageInPage()];
  return { title: `${messages.library} · ${messages.siteTitle}`, robots: { index: false } };
}

function titleOf(score: LibraryEntry, messages: Messages): string {
  return score.title || messages.untitled;
}

/** Ägarens Bibliotek. För en Gäst finns sidan inte. */
export default async function LibraryPage() {
  if (!(await isOwnerInPage())) notFound();
  const [scores, language] = await Promise.all([listScores(), siteLanguageInPage()]);
  const messages = MESSAGES[language];
  const updatedFormat = new Intl.DateTimeFormat(messages.dateLocale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Stockholm",
  });

  return (
    <main className={styles.main}>
      <h1>{messages.library}</h1>
      <p>
        <Link href="/tab-editor">{messages.backToTabEditor}</Link>
      </p>
      {scores.length === 0 ? (
        <p>{messages.libraryEmpty}</p>
      ) : (
        <table className={styles.library}>
          <thead>
            <tr>
              <th>{messages.columnTitle}</th>
              <th>{messages.columnArtist}</th>
              <th>{messages.columnLastChanged}</th>
              <th>
                <span className={styles.visuallyHidden}>{messages.columnActions}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {scores.map((score) => (
              <tr key={score.id}>
                <td>
                  <LibraryScoreLink id={score.id} revision={score.revision} confirmMessage={messages.confirmOpenScore}>
                    {titleOf(score, messages)}
                  </LibraryScoreLink>
                </td>
                <td>{score.artist}</td>
                <td>
                  <time dateTime={score.updatedAt}>{updatedFormat.format(new Date(score.updatedAt))}</time>
                </td>
                <td>
                  <LibraryActions id={score.id} title={titleOf(score, messages)} language={language} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
