export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export type SelectOptionsRecord<T = Record<string, unknown>> = Record<string, SelectOption & T>;
