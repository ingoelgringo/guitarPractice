import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isOwnerInPage } from "@/lib/auth";
import { LoginForm } from "./LoginForm";
import styles from "../page.module.css";

export const metadata: Metadata = {
  title: "Log in · Guitar Practice",
  robots: { index: false },
};

export default async function LoginPage() {
  if (await isOwnerInPage()) redirect("/");

  return (
    <main className={`${styles.main} ${styles.narrow}`}>
      <h1>Log in</h1>
      <LoginForm />
    </main>
  );
}
