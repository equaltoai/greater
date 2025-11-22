declare module '@equaltoai/greater-components/utils' {
  export function relativeTime(date: string | number | Date): string;
  export function sanitizeHtml(input: string): string;
  export function linkifyMentions(input: string): string;
}
