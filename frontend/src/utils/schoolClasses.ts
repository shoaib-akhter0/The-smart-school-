/** The school's classes, in order, and a matcher that maps free-text class names onto them. */
export const SCHOOL_CLASSES = [
  'Class PG',
  'Class Nur',
  'Class KG',
  ...Array.from({ length: 10 }, (_, index) => `Class ${index + 1}`),
];

/** "Grade 10-A", "class 10", "10th" -> "Class 10"; "nursery" -> "Class Nur". Unknown -> null. */
export const normalizeClassName = (gradeClass: string): string | null => {
  const normalized = gradeClass.trim().toLowerCase();
  if (/^(?:class\s*)?(pg|pre[- ]?primary)$/.test(normalized)) return 'Class PG';
  if (/^(?:class\s*)?(nur|nursery)$/.test(normalized)) return 'Class Nur';
  if (/^(?:class\s*)?(kg|k\.g\.|kindergarten)$/.test(normalized)) return 'Class KG';

  const match = normalized.match(/^(?:class|grade)?\s*(\d+)(?:st|nd|rd|th)?(?:\s*[- ]\s*[a-z])?$/);
  if (!match) return null;

  const classNumber = Number(match[1]);
  return classNumber >= 1 && classNumber <= 10 ? `Class ${classNumber}` : null;
};
