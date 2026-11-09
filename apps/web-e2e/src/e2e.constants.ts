export const API_URL = 'http://127.0.0.1:3000';
export const MOBILE_VIEWPORT = { width: 375, height: 667 };
export const DESKTOP_VIEWPORT = { width: 1280, height: 720 };
// «Ноги 2» тоже содержит «Ноги», поэтому исключаем её из совпадения
export const LEGS_WORKOUT_LINK = /Ноги(?! 2)/;
