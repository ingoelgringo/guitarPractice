/** Låter webbläsaren spara `text` som en fil med namnet `name`. */
export function downloadText(text: string, name: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  // Vissa webbläsare avbryter nedladdningen om adressen släpps direkt
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
