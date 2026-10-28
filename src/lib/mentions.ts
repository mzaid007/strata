/** Parse @Name tokens from comment body (basic, case-insensitive name match). */
export function extractMentionNames(body: string): string[] {
  const found = new Set<string>();
  const re = /@([A-Za-z][\w.-]*(?:\s+[A-Za-z][\w.-]*)?)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const name = m[1]?.trim();
    if (name) found.add(name.toLowerCase());
  }
  return [...found];
}

export function resolveMentionedUserIds(
  body: string,
  members: { id: string; name: string }[],
): string[] {
  const tokens = extractMentionNames(body);
  if (tokens.length === 0) return [];

  const ids = new Set<string>();
  for (const token of tokens) {
    for (const member of members) {
      const name = member.name.trim().toLowerCase();
      if (!name) continue;
      if (name === token || name.startsWith(token) || token.startsWith(name.split(" ")[0]!)) {
        ids.add(member.id);
      }
    }
  }
  return [...ids];
}
