export function fuzzyRankedSearch<T>(
  query: string,
  items: T[],
  labelKey: keyof T
): T[] {
  const normalize = (str: string): string => str.toLowerCase();
  const normalizedQuery = normalize(query);
  const ranked: { item: T; score: number }[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const label = item[labelKey];
    if (typeof label !== "string") continue;
    const normalizedText = normalize(label);
    let score = 0;
    let lastMatchIndex = -1;
    let matched = true;
    for (let j = 0; j < normalizedQuery.length; j++) {
      const char = normalizedQuery[j];
      const index = normalizedText.indexOf(char, lastMatchIndex + 1);
      if (index === -1) {
        matched = false;
        break;
      }
      score += 10 - index;
      if (index === lastMatchIndex + 1) score += 5;
      lastMatchIndex = index;
    }
    if (!matched) continue;
    if (normalizedText.startsWith(normalizedQuery)) {
      score += 100;
    }
    // Insert in descending order
    let insertIndex = ranked.length;
    while (insertIndex > 0 && score > ranked[insertIndex - 1].score) {
      insertIndex--;
    }
    ranked.splice(insertIndex, 0, { item, score });
  }
  return ranked.map(({ item }) => item);
}
