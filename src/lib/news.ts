/** True when a notice title explicitly names an academic cycle that has ended. */
export async function loadNewsWithFallback<T>(
  loadPrimary: () => Promise<T[]>,
  loadFallback: () => Promise<T[]>,
): Promise<T[]> {
  const items = await loadPrimary();
  return items.length > 0 ? items : loadFallback();
}

export function mentionsPastAcademicCycle(title: string, academicEndYear?: number): boolean {
  const now = new Date();
  const currentCycleEnd = academicEndYear ?? now.getFullYear() + (now.getMonth() >= 5 ? 1 : 0);
  const cycles = title.matchAll(/\b(20\d{2})[-–](\d{2}|20\d{2})\b/g);
  for (const [, startText, endText] of cycles) {
    const startYear = Number(startText);
    let endYear = endText.length === 2
      ? Math.floor(startYear / 100) * 100 + Number(endText)
      : Number(endText);
    if (endYear < startYear) endYear += 100;
    if (endYear < currentCycleEnd) return true;
  }
  return false;
}

