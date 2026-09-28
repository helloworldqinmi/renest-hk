import {parseLivingProfile,type LivingProfile} from './living-profile';
export type LivingBrief = {
  household: string; children: string; pets: string; budget: number;
  work: string; guests: string; storage: string; accessibility: string;
  style: string; moveDate: string; priority: string;
  profile?:LivingProfile;
};
export const defaultBrief: LivingBrief = { household: '2', children: '0', pets: 'None', budget: 6000, work: 'Sometimes', guests: '2', storage: 'Medium', accessibility: 'Standard', style: 'Warm natural', moveDate: '', priority: 'Reuse first' };
export function parseBrief(value: unknown): LivingBrief {
  const v = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const result = { ...defaultBrief };
  for (const key of Object.keys(defaultBrief) as (keyof LivingBrief)[]) {
    if (key === 'budget') result.budget = typeof v.budget === 'number' && Number.isFinite(v.budget) ? Math.max(0, Math.min(1000000, v.budget)) : defaultBrief.budget;
    else if (key!=='profile'&&typeof v[key] === 'string') result[key] = (v[key] as string).slice(0, 100);
  }
  result.profile=parseLivingProfile(v.profile);
  return result;
}

export function withLivingProfile(brief:LivingBrief,profile:LivingProfile):LivingBrief{
 const a=profile.answers,result={...brief,profile};
 if(a.household&&a.household!=='unknown')result.household=a.household;
 if(a.children&&a.children!=='unknown')result.children=a.children;
 const limits:Record<string,number>={zero:0,small:3000,medium:6000,large:10000};
 if(a.budgetRange in limits)result.budget=limits[a.budgetRange];
 else if(a.budgetRange==='custom'&&a.budgetMax!==undefined)result.budget=Math.max(0,Math.min(1000000,Number(a.budgetMax)||0));
 if(a.workFrequency==='never')result.work='Never';else if(a.workers==='2'||a.workers==='3+')result.work='Two people';else if(a.workFrequency==='daily')result.work='Daily';else if(a.workFrequency==='sometimes')result.work='Sometimes';
 if(a.diners&&a.diners!=='unknown')result.guests=a.diners==='3-4'?'4':a.diners==='5+'?'6+':a.diners;
 const pets=profile.tags.pets??[];if(pets.length)result.pets=pets.includes('none')?'None':pets.map(v=>v[0].toUpperCase()+v.slice(1)).join(', ');
 const access=profile.tags.access??[];if(access.length)result.accessibility=access.includes('none')?'Standard':access.includes('wheelchair')?'Wide paths':'Step-free';
 const priorities:Record<string,string>={reuse:'Reuse first',host:'Social space',work:'Work space',budget:'Low budget',storage:'Storage',open:'Open space',balanced:'Balanced'};
 if(a.priority)result.priority=priorities[a.priority]??brief.priority;
 if(a.style&&a.style!=='unknown')result.style=({warm:'Warm natural',minimal:'Minimal',colourful:'Colourful'} as Record<string,string>)[a.style];
 return result;
}
