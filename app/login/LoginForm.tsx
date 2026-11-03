"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { withBasePath } from "@/lib/basePath";
import { MESSAGES, type Messages } from "@/lib/messages";
import type { SiteLanguage } from "@/lib/siteLanguage";
import styles from "../page.module.css";

export function LoginForm({ language }: { language: SiteLanguage }) {
  const messages = MESSAGES[language];
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      const response = await fetch(withBasePath("/api/login"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
      });
      if (response.ok) {
        router.replace("/");
        router.refresh();
        return;
      }
      setError(errorMessage(response.status, messages));
    } catch {
      setError(messages.loginUnreachable);
    }
    setPending(false);
  }

  return (
    <form className={styles.loginForm} onSubmit={submit}>
      <label>
        {messages.username}
        <input name="username" autoComplete="username" required autoFocus />
      </label>
      <label>
        {messages.password}
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <button type="submit" disabled={pending}>
        {pending ? messages.loggingIn : messages.logIn}
      </button>
    </form>
  );
}

/**
 * Meddelandet på Sajtspråket utifrån svarets status. API:ets egna meddelanden är på engelska, och
 * Nginx svarar 429 med en egen HTML-sida. Ett serverfel får det allmänna meddelandet.
 */
function errorMessage(status: number, messages: Messages): string {
  switch (status) {
    case 400:
      return messages.loginMissingFields;
    case 401:
      return messages.loginWrongCredentials;
    case 429:
      return messages.loginTooManyAttempts;
    default:
      return messages.loginFailed;
  }
}
