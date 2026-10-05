export function uniqueEmail(prefix = 'qa'): string {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1_000_000)}@example-test.com`;
}

export function randomExternalId(prefix = 'CRM'): string {
  return `${prefix}-${Date.now()}`;
}


export function futureIsoDate(daysFromNow: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysFromNow);
  return d.toISOString();
}
