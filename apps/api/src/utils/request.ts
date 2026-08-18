/** Extract a single string param — req.params values are always string in Express */
export function param(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

/** Safely extract a query string value as a single string */
export function queryString(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}
