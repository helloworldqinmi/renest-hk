import type {LivingBrief} from './living-brief';
import {withLivingProfile} from './living-brief';
import {newLivingProfile} from './living-profile';
import {existingItems, studioInventory, type Placement} from './studio-data';
import {isStaged, placementIssue} from './studio-placement';
import {placementCost, profileNotices, furnitureAllowance} from './profile-planning';

export type QuickPriority = 'reuse' | 'work' | 'host';
export type QuickChoices = {household: string; priority: QuickPriority; budget: number; drilling: string};

export function quickChoices(brief: LivingBrief): QuickChoices {
  const a = brief.profile?.answers;
  return {
    household: a?.household ?? brief.household,
    priority: a?.priority === 'work' || brief.priority === 'Work space' ? 'work' : a?.priority === 'host' || brief.priority === 'Social space' ? 'host' : 'reuse',
    budget: brief.budget,
    drilling: a?.drilling ?? 'unknown',
  };
}

// Quick answers never claim that the full questionnaire was confirmed.
// Existing detailed needs and must-keep decisions survive a quick refinement.
export function buildQuickBrief(brief: LivingBrief, selected: string[], choices: QuickChoices): LivingBrief {
  const profile = brief.profile ?? {...newLivingProfile(), baseSelected: [...selected]};
  const priorityChanged = !brief.profile || choices.priority !== quickChoices(brief).priority;
  const people = choices.household === '4+' ? 4 : Number(choices.household) || 2;
  const answers = {
    ...profile.answers,
    household: choices.household, priority: choices.priority,
    budgetRange: 'custom', budgetMin: '0', budgetMax: String(choices.budget),
    includesFees: profile.answers.includesFees ?? 'no',
    purchaseTiming: profile.answers.purchaseTiming ?? 'now',
    secondhand: profile.answers.secondhand ?? 'allow', drilling: choices.drilling,
  };
  if (priorityChanged) Object.assign(answers, choices.priority === 'work'
    ? {workFrequency: 'daily', workers: '2', deskRoom: 'unknown', hosting: 'rare'}
    : choices.priority === 'host'
      ? {workFrequency: 'sometimes', workers: '1', deskRoom: 'unknown', hosting: 'often', hostingSeats: '4'}
      : {workFrequency: 'sometimes', workers: '1', deskRoom: 'unknown', hosting: 'rare'});
  if (!profile.answers.diners || choices.household !== quickChoices(brief).household)
    Object.assign(answers, {diners: people > 2 ? '3-4' : String(people)});
  return withLivingProfile(brief, {...profile, answers, tags: {...profile.tags, secondary: (profile.tags.secondary ?? []).filter(p => p !== choices.priority)}});
}

export function inspectPlan(brief: LivingBrief, placements: Placement[], selected: string[]) {
  const inside = placements.filter(p => !isStaged(p));
  const ids = new Set(inside.map(p => p.id));
  const reused = inside.filter(p => p.origin === 'existing');
  const left = existingItems.filter(p => !ids.has(p.id));
  const desks = inside.filter(p => /desk/i.test(studioInventory.find(i => i.id === p.id)?.type ?? ''));
  const beds = (ids.has('F09') ? 2 : 0) + (ids.has('F13') ? 1 : 0);
  const issues = profileNotices(brief, inside);
  const cost = placementCost(placements);
  const allowance = furnitureAllowance(brief);
  const collisions = inside.filter(p => placementIssue(p, inside));
  return {inside, reused, left, desks, beds, issues, cost, allowance, collisions,
    staged: placements.filter(isStaged),
    selectedReuse: selected.length ? Math.round(reused.length / selected.length * 100) : 0,
    allReuse: Math.round(reused.length / existingItems.length * 100),
    overBudget: allowance !== null && cost > allowance,
  };
}

export function planDifference(before: Placement[], after: Placement[]) {
  return {
    added: after.filter(p => !before.some(v => v.id === p.id)),
    removed: before.filter(p => !after.some(v => v.id === p.id)),
    moved: after.filter(p => before.some(v => v.id === p.id && (v.x !== p.x || v.z !== p.z || v.rotation !== p.rotation))),
    cost: placementCost(after) - placementCost(before),
  };
}
