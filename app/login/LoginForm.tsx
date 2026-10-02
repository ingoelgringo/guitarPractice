"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import styles from "../page.module.css";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
      });
      if (response.ok) {
        router.replace("/");
        router.refresh();
        return;
      }
      setError(await errorMessage(response));
    } catch {
      setError("Could not reach the server.");
    }
    setPending(false);
  }

  return (
    <form className={styles.loginForm} onSubmit={submit}>
      <label>
        Username
        <input name="username" autoComplete="username" required autoFocus />
      </label>
      <label>
        Password
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <button type="submit" disabled={pending}>
        {pending ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}

async function errorMessage(response: Response): Promise<string> {
  // Nginx svarar 429 med en egen HTML-sida, så meddelandet kan saknas.
  if (response.status === 429) return "Too many failed attempts. Try again later.";
  try {
    const body = (await response.json()) as { error?: string };
    if (body.error) return body.error;
  } catch {
    // Inget JSON-svar.
  }
  return "Login failed.";
}
