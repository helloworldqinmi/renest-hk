export type LivingBrief = {
  household: string; children: string; pets: string; budget: number;
  work: string; guests: string; storage: string; accessibility: string;
  style: string; moveDate: string; priority: string;
};
export const defaultBrief: LivingBrief = { household: '2', children: '0', pets: 'None', budget: 6000, work: 'Sometimes', guests: '2', storage: 'Medium', accessibility: 'Standard', style: 'Warm natural', moveDate: '', priority: 'Reuse first' };
export function parseBrief(value: unknown): LivingBrief {
  const v = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const result = { ...defaultBrief };
  for (const key of Object.keys(defaultBrief) as (keyof LivingBrief)[]) {
    if (key === 'budget') result.budget = typeof v.budget === 'number' && Number.isFinite(v.budget) ? Math.max(0, Math.min(1000000, v.budget)) : defaultBrief.budget;
    else if (typeof v[key] === 'string') result[key] = (v[key] as string).slice(0, 100);
  }
  return result;
}
