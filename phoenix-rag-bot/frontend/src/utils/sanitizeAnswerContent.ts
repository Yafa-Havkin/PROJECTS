const SOURCE_HEADING_PATTERN =
  /^\s*(?:#{1,6}\s*)?(?:\*{1,2})?מקורות:?(?:\*{1,2})?\s*:?\s*$/;
const URL_PATTERN = /https?:\/\/[^\s<>()\]]+/gi;

function findClosingDelimiter(
  text: string,
  start: number,
  open: string,
  close: string,
): number {
  let depth = 0;
  for (let index = start; index < text.length; index += 1) {
    if (text[index] === "\\") {
      index += 1;
      continue;
    }
    if (text[index] === open) {
      depth += 1;
    } else if (text[index] === close) {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function removeMarkdownLinks(text: string): string {
  let result = "";
  for (let index = 0; index < text.length; ) {
    const isImage = text[index] === "!" && text[index + 1] === "[";
    const openBracket = isImage ? index + 1 : index;
    if (text[openBracket] !== "[") {
      result += text[index];
      index += 1;
      continue;
    }

    const labelEnd = findClosingDelimiter(text, openBracket, "[", "]");
    if (labelEnd < 0 || text[labelEnd + 1] !== "(") {
      result += text[index];
      index += 1;
      continue;
    }

    const targetEnd = findClosingDelimiter(text, labelEnd + 1, "(", ")");
    if (targetEnd < 0) {
      result += text[index];
      index += 1;
      continue;
    }

    if (!isImage) {
      result += removeMarkdownLinks(text.slice(openBracket + 1, labelEnd));
    }
    index = targetEnd + 1;
  }
  return result;
}

/** Keep links and source lists in the dedicated sources section only. */
export function sanitizeAnswerContent(content: string): string {
  const answerLines: string[] = [];
  for (const line of content.split(/\r?\n/)) {
    if (SOURCE_HEADING_PATTERN.test(line)) {
      break;
    }
    answerLines.push(line);
  }

  return removeMarkdownLinks(answerLines.join("\n"))
    .replace(URL_PATTERN, "")
    .replace(/[ \t]+([.,!?;:])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}
