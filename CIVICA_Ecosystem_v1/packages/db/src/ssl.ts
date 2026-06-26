export function resolvePgSsl(url: string) {
  return url.includes('sslmode=require') ? { rejectUnauthorized: false } : false;
}
