export function sanitizeText(text: string): string {
    if (!text) return "";
    return text.replace(/\s+/g, ' ').trim();
}
