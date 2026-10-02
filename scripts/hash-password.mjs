// Skapar bcrypt-hashen till OWNER_PASSWORD_HASH: `npm run hash-password`.
// Lösenordet läses från stdin och inte som argument, så att det inte hamnar i skalets historik.
// Det går också att skicka in det: `printf '%s' 'lösenord' | npm run --silent hash-password`.
import { createInterface } from "node:readline";
import bcrypt from "bcryptjs";

// Samma kostnad som DUMMY_HASH i lib/auth.ts.
const COST = 12;

const password = await readPassword();
if (!password) {
  console.error("No password given.");
  process.exit(1);
}
console.log(bcrypt.hashSync(password, COST));

async function readPassword() {
  if (!process.stdin.isTTY) {
    let input = "";
    for await (const chunk of process.stdin) input += chunk;
    return input.replace(/\r?\n$/, "");
  }

  const rl = createInterface({ input: process.stdin, output: process.stderr, terminal: true });
  // Skriv inte ut det som knappas in.
  rl._writeToOutput = (text) => {
    if (text.startsWith("Password: ")) process.stderr.write(text);
  };
  const answer = await new Promise((resolve) => rl.question("Password: ", resolve));
  rl.close();
  process.stderr.write("\n");
  return answer;
}
