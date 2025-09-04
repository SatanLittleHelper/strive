import type { SelectOption } from '../types';

/**
 * Генерирует массив SelectOption из объекта с вложенными объектами
 * @param sourceObject - объект типа ActivityLevel, Goal и т.д.
 * @returns массив SelectOption
 */
export function generateSelectOptions<T extends Record<string, SelectOption>>(
  sourceObject: T,
): SelectOption[] {
  return Object.values(sourceObject).map((item) => ({
    value: item.value,
    label: item.label,
    ...(item.description && { description: item.description }),
  }));
}

/**
 * Универсальная функция для форматирования SelectOption в строку
 * @param option - SelectOption объект
 * @returns отформатированная строка
 */
export function stringifySelectOption(option: SelectOption): string {
  return option.description ? `${option.label} (${option.description})` : option.label;
}

/**
 * Универсальная функция для сравнения SelectOption объектов по value
 * @param a - первый SelectOption объект
 * @param b - второй SelectOption объект
 * @returns true если объекты равны по value
 */
export function identityMatcherSelectOption(a: SelectOption, b: SelectOption): boolean {
  return a.value === b.value;
}
