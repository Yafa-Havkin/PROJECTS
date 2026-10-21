const SOURCE_HEADING_PATTERN =
  /^\s*(?:#{1,6}\s*)?(?:\*{1,2})?מקורות(?:\*{1,2})?\s*:/i;
const MARKDOWN_LINK_PATTERN =
  /\[([^\]]+)\]\((?:\[[^\]]+\]\([^)]*\)|[^)])*\)/g;
const MARKDOWN_IMAGE_PATTERN =
  /!\[([^\]]*)\]\((?:\[[^\]]+\]\([^)]*\)|[^)])*\)/g;
const URL_PATTERN = /https?:\/\/[^\s<>()\]]+/gi;

/** Keep links and source lists in the dedicated sources section only. */
export function sanitizeAnswerContent(content: string): string {
  const answerLines: string[] = [];
  for (const line of content.split(/\r?\n/)) {
    if (SOURCE_HEADING_PATTERN.test(line)) {
      break;
    }
    answerLines.push(line);
  }

  return answerLines
    .join("\n")
    .replace(MARKDOWN_IMAGE_PATTERN, "$1")
    .replace(MARKDOWN_LINK_PATTERN, "$1")
    .replace(URL_PATTERN, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}
