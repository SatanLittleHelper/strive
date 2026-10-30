const RUSSIAN_LOCALE = 'ru-RU';
const FORMS: Partial<Record<Intl.LDMLPluralRule, string>> = {
  one: 'упражнение',
  few: 'упражнения',
};
const DEFAULT_FORM = 'упражнений';
const pluralRules = new Intl.PluralRules(RUSSIAN_LOCALE);

export function formatExerciseCount(count: number): string {
  return `${count} ${FORMS[pluralRules.select(count)] ?? DEFAULT_FORM}`;
}
