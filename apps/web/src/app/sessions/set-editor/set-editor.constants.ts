import { tuiValidationErrorsProvider } from '@taiga-ui/core';

export const SET_FORM_ID = 'set-editor-form';

export const SET_ERRORS_PROVIDER = tuiValidationErrorsProvider({
  required: 'Обязательное поле',
  min: ({ min }: { min: number }) => `Не меньше ${min}`,
  max: ({ max }: { max: number }) => `Не больше ${max}`,
  integer: 'Только целое число',
  maxDecimalPlaces: ({ places }: { places: number }) => `Не более ${places} знаков после запятой`,
  maxlength: ({ requiredLength }: { requiredLength: number }) =>
    `Не больше ${requiredLength} символов`,
});
