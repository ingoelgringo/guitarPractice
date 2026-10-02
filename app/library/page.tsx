import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LibraryScoreLink } from "@/components/LibraryScoreLink";
import { isOwnerInPage } from "@/lib/auth";
import { listScores } from "@/lib/library";
import styles from "../page.module.css";

export const metadata: Metadata = {
  title: "Library · Guitar Practice",
  robots: { index: false },
};

const updatedFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Stockholm",
});

/** Ägarens Bibliotek. För en Gäst finns sidan inte. */
export default async function LibraryPage() {
  if (!(await isOwnerInPage())) notFound();
  const scores = await listScores();

  return (
    <main className={styles.main}>
      <h1>Library</h1>
      <p>
        <Link href="/tab-editor">Back to the Tab Editor</Link>
      </p>
      {scores.length === 0 ? (
        <p>The library is empty. New scores you create in the Tab Editor are added here.</p>
      ) : (
        <table className={styles.library}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Artist</th>
              <th>Last changed</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((score) => (
              <tr key={score.id}>
                <td>
                  <LibraryScoreLink id={score.id} revision={score.revision}>
                    {score.title || "Untitled"}
                  </LibraryScoreLink>
                </td>
                <td>{score.artist}</td>
                <td>
                  <time dateTime={score.updatedAt}>{updatedFormat.format(new Date(score.updatedAt))}</time>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
