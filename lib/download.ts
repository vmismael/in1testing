/** Triggers a browser download for in-memory data without any server round trip. */
export function downloadBlob(data: BlobPart, filename: string, type: string): void {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Removes the extension from a filename ("report.pdf" -> "report"). */
export function stripExtension(name: string): string {
  return name.replace(/\.[^./\\]+$/, "");
}
