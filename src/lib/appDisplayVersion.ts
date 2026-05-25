export function appDisplayVersion(): string {
  const v = import.meta.env.VITE_APP_VERSION ?? '0.0.0';
  return `L ${v}`;
}
