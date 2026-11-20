export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

export interface ShareLinkParams {
  token: string;
  origin?: string;
  nav?: Navigator;
}
