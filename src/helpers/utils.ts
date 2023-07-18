export function isString(data: unknown): data is string {
  return typeof data === 'string';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isRecord(data: unknown): data is Record<string, any> {
  return data instanceof Object;
}
