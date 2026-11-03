import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isOwnerInPage } from "@/lib/auth";
import { MESSAGES } from "@/lib/messages";
import { siteLanguageInPage } from "@/lib/siteLanguageInPage";
import { LoginForm } from "./LoginForm";
import styles from "../page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const messages = MESSAGES[await siteLanguageInPage()];
  return { title: `${messages.logIn} · ${messages.siteTitle}`, robots: { index: false } };
}

export default async function LoginPage() {
  if (await isOwnerInPage()) redirect("/");
  const language = await siteLanguageInPage();

  return (
    <main className={`${styles.main} ${styles.narrow}`}>
      <h1>{MESSAGES[language].logIn}</h1>
      <LoginForm language={language} />
    </main>
  );
}
