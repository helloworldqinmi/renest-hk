// Run with node scripts/check-studio.cjs. Exercise save compatibility and
// geometry invariants without starting Next.js or a browser.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),cache=new Map();
function load(file){file=path.resolve(file);if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file,'utf8'));if(cache.has(file))return cache.get(file);const exports={};cache.set(file,exports);const code=ts.transpile(fs.readFileSync(file,'utf8'),{module:ts.ModuleKind.CommonJS,esModuleInterop:true,target:ts.ScriptTarget.ES2020});new Function('require','exports',code)(id=>{let p=id.startsWith('@/')?path.join(root,id.slice(2)):path.resolve(path.dirname(file),id);if(!path.extname(p))p+='.ts';return load(p);},exports);return exports;}
const data=load(path.join(root,'lib/studio-data.ts')),geometry=load(path.join(root,'lib/studio-placement.ts')),brief=load(path.join(root,'lib/living-brief.ts'));
const input=load(path.join(root,'lib/home-input.ts'));
assert.deepEqual(input.parseHomeInput({method:'unknown'}),{method:'library'});
assert.deepEqual(input.parseHomeInput({method:'floorplan-upload',fileName:'my-plan.png'}),{method:'floorplan-upload',fileName:'my-plan.png'});
assert.ok(fs.readFileSync(path.join(root,'public/plans/northern-demo-a.png')).equals(fs.readFileSync(path.join(root,'v2-home-models/references/new-home-plan.png'))),'Library item 01 must remain the original demo floor plan');
const plans=load(path.join(root,'lib/floor-plan-blueprints.ts'));
assert.equal(plans.floorPlanExamples.filter(p=>p.enabled).length,1);
const modelSource=fs.readFileSync(path.join(root,'v2-home-models/src/generate.mjs'),'utf8').split('}else{plankFloor(a,0,1.4')[1].split('return a;')[0];
const walls=[...modelSource.matchAll(/segment\(a,([\d.]+),([\d.]+),([\d.]+),([\d.]+)/g)].map(m=>m.slice(1).map(Number));
assert.deepEqual(plans.demoBlueprint.walls.map(w=>[...w.a,...w.b]),walls,'Blueprint walls must match the existing 3D home');
assert.equal(plans.constructionFrame(0).tilt,0);
assert.equal(plans.constructionFrame(0).rise(0,17),0);
assert.equal(plans.constructionFrame(1).rise(16,17),1);
assert.equal(plans.constructionFrame(1).settle,1);
assert.ok(plans.constructionFrame(.5).rise(0,17)>plans.constructionFrame(.5).rise(16,17));
assert.equal(data.parseStudioPlan('{broken'),null);
const profile=load(path.join(root,'lib/living-profile.ts')),planner=load(path.join(root,'lib/profile-planning.ts'));
const living={...profile.newLivingProfile(),step:'review',completed:[...profile.coreSections],baseSelected:[...data.allExistingIds],answers:{household:'2',doubleBeds:'1',singleBeds:'0',children:'0',overnight:'no',budgetRange:'medium',includesFees:'no',purchaseTiming:'now',secondhand:'prefer',workFrequency:'daily',workers:'2',deskRoom:'study',diners:'2',hosting:'rare',priority:'work'},tags:{access:['none']}};
assert.equal(profile.coreProfileComplete(profile.newLivingProfile()),false);
assert.equal(profile.coreProfileComplete(living),true);
const tailored=brief.withLivingProfile(brief.defaultBrief,living);
const plan=planner.planForProfile(tailored,data.allExistingIds);
assert.equal(plan.recommended,'c');assert.equal(plan.plans.find(p=>p.id==='c').cost,400);
assert.ok(plan.plans.find(p=>p.id==='c').placements.some(p=>p.id==='N06'));
const keepBed=planner.planForProfile(brief.withLivingProfile(tailored,{...living,furniture:{F13:'must'}}),data.allExistingIds);
assert.notEqual(keepBed.recommended,'c');assert.ok(keepBed.plans.find(p=>p.id===keepBed.recommended).placements.some(p=>p.id==='F13'));
const later=planner.planForProfile(brief.withLivingProfile(tailored,{...living,answers:{...living.answers,purchaseTiming:'later'}}),data.allExistingIds);
assert.ok(later.plans.every(p=>p.cost===0&&!p.placements.some(v=>v.origin==='new')));
const newOnly=planner.planForProfile(brief.withLivingProfile(tailored,{...living,answers:{...living.answers,secondhand:'no',drilling:'no'}}),data.allExistingIds);
assert.ok(newOnly.plans.every(p=>!p.placements.some(v=>['N03','N05','N06'].includes(v.id))));
assert.ok(newOnly.plans.find(p=>p.id==='c').issues.includes('workstations'));
const fees=brief.withLivingProfile(tailored,{...living,answers:{...living.answers,includesFees:'yes',serviceReserve:'5700'}});
assert.equal(planner.furnitureAllowance(fees),300);assert.ok(planner.planForProfile(fees,data.allExistingIds).plans.every(p=>p.cost<=300));
assert.equal(profile.sectionReady({...living,answers:{...living.answers,includesFees:'yes',serviceReserve:'7000'}},'budget'),false);
const restoredProfile=profile.parseLivingProfile({...living,tags:{pets:['none','cat'],petNeeds:['cat-tree'],access:['none','wheelchair'],accessNeeds:['clear-paths'],secondary:['work','reuse','storage']},hobbyAreas:{coffee:Infinity},furniture:{F01:'must',BAD:'must'}});
assert.deepEqual(restoredProfile.tags.pets,['none']);assert.deepEqual(restoredProfile.tags.petNeeds,[]);assert.deepEqual(restoredProfile.tags.accessNeeds,[]);assert.equal(restoredProfile.furniture.BAD,undefined);
assert.ok(!restoredProfile.tags.secondary.includes('work'));assert.equal(restoredProfile.hobbyAreas.coffee,undefined);
const profileSave=data.parseStudioPlan(JSON.stringify({version:2,phase:'results',selected:data.allExistingIds,habits:['reuse'],note:'',layout:'c',brief:tailored}));
assert.equal(profileSave.brief.profile.step,'review');assert.equal(profileSave.brief.profile.answers.secondhand,'prefer');assert.equal(profile.coreProfileComplete(profileSave.brief.profile),true);
const secondhand=load(path.join(root,'lib/secondhand-layout.ts'));
const usedDesk=secondhand.trySecondhand('N06','c',{},data.allExistingIds);
assert.ok(usedDesk);assert.ok(usedDesk.placements.some(p=>p.id==='N06'));assert.ok(!usedDesk.placements.some(p=>p.id==='N03'));
const usedPair=secondhand.trySecondhand('N05','c',{c:usedDesk.placements},data.allExistingIds);
assert.ok(usedPair);assert.ok(usedPair.placements.some(p=>p.id==='N05'));
for(const p of usedPair.placements)assert.equal(geometry.placementIssue(p,usedPair.placements),null,`Second-hand layout collision: ${p.id}`);
assert.equal(data.recommendLayout([], '需要在家辦公'),'c');
assert.equal(data.recommendLayout([], '朋友聚餐'),'b');
const old={version:2,phase:'results',selected:['F01','not-real'],habits:['reuse'],note:'old save',layout:'a'};
assert.deepEqual(data.parseStudioPlan(JSON.stringify(old)).selected,['F01']);
assert.equal(data.parseStudioPlan(JSON.stringify(old)).brief.budget,6000);
assert.equal(data.parseStudioPlan(JSON.stringify({...old,name:'  我的新家  '})).name,'我的新家');
assert.equal(data.parseStudioPlan(JSON.stringify({...old,name:'   '})).name,undefined);
assert.equal(data.parseStudioPlan(JSON.stringify({...old,homeSource:'scan'})).homeInput.method,'scan-demo');
assert.equal(brief.parseBrief({budget:-200}).budget,0);
assert.equal(brief.parseBrief({budget:Infinity}).budget,6000);
const edited={...old,brief:{...brief.defaultBrief,budget:1500},edits:{a:[{id:'F01',x:2,z:2,rotation:90,origin:'new'}]}};
const restored=data.parseStudioPlan(JSON.stringify(edited));
assert.equal(restored.edits.a[0].origin,'existing');assert.equal(restored.edits.a[0].x,2);assert.equal(restored.brief.budget,1500);
assert.deepEqual(data.parseEdits({a:[]}),{a:[]});
assert.deepEqual(data.parseEdits({a:[{id:'F01',x:Infinity,z:2,rotation:0}]}),{a:[]});
assert.equal(geometry.placementIssue({id:'F01',x:-2,z:2,rotation:0,origin:'existing'},[]),'bounds');
assert.equal(geometry.placementIssue({id:'F02',x:1,z:1.4,rotation:0,origin:'existing'},[]),'wall');
assert.equal(geometry.placementIssue({id:'F02',x:2,z:2.5,rotation:0,origin:'existing'},[{id:'F01',x:2,z:2.5,rotation:0,origin:'existing'}]),'furniture');
assert.equal(geometry.placementIssue({id:'F02',x:2,z:2.5,rotation:0,origin:'existing'},[]),null);
assert.deepEqual(data.studioLayouts.map(l=>l.placements.filter(p=>p.origin==='existing').length),[18,16,15]);
// Every curated footprint must be usable before manual edits begin.
for(const layout of data.studioLayouts)for(const p of layout.placements)assert.equal(geometry.placementIssue(p,layout.placements),null,`${layout.id}/${p.id} overlaps ${geometry.placementIssue(p,layout.placements)}`);
global.localStorage={values:new Map(),getItem(k){return this.values.get(k)??null;},setItem(k,v){this.values.set(k,v);}};
localStorage.setItem(data.STUDIO_SAVE_KEY,JSON.stringify(old));assert.equal(data.readPlanHistory().length,1);
for(let i=0;i<25;i++)data.savePlanHistory({...restored,savedAt:new Date(2026,0,i+1).toISOString()});
assert.equal(data.readPlanHistory().length,20);assert.equal(data.readPlanHistory()[0].brief.budget,1500);
console.log('Studio checks passed: legacy/corrupt saves, edited placement restoration, budget parsing, collision checks, distinct curated layouts, history retention.');

// First-person camera positions must remain usable after changing a layout.
const interior=load(path.join(root,'lib/interior-tour.ts'));
for(const layout of data.studioLayouts){
 const shots=interior.buildInteriorTour(layout.placements);
 assert.equal(shots.length,4,`${layout.id}: all four rooms need a clear camera position`);
 for(const shot of shots)for(let step=0;step<=20;step++){
  const t=step/20,x=shot.from[0]+(shot.to[0]-shot.from[0])*t,z=shot.from[2]+(shot.to[2]-shot.from[2])*t;
  assert.ok(interior.cameraPositionClear(x,z,layout.placements),`${layout.id}/${shot.id}: camera intersects furniture`);
  assert.equal(shot.from[1],interior.TOUR_CAMERA_HEIGHT,'Tour must use a consistent interior photography height');
  assert.equal(shot.target[1],shot.from[1],'Architecture verticals need a level camera');
  assert.ok(shot.fov >= 60 && shot.fov <= 70,'Keep a bounded wide interior lens');
  if(shot.id==='dining'){
   const tv=layout.placements.find(p=>p.id==='F03');
   const dx=tv.x-x,dz=tv.z-z,tx=shot.target[0]-x,tz=shot.target[2]-z;
   const facing=(dx*tx+dz*tz)/(Math.hypot(dx,dz)*Math.hypot(tx,tz));
   assert.ok(facing<.5,`${layout.id}: the dining camera must keep the television away from the forward view throughout its drift`);
  }
 }
}
const initialTour=interior.buildInteriorTour(data.studioLayouts[0].placements);
const cameraSpot=initialTour[0].from;
const editedTourPlan=data.studioLayouts[0].placements.map(p=>p.id==='F01'?{...p,x:cameraSpot[0],z:cameraSpot[2]}:p);
const adjustedTour=interior.buildInteriorTour(editedTourPlan);
assert.notDeepEqual(adjustedTour[0].from,cameraSpot,'A DIY move must relocate an obstructed camera');
assert.ok(interior.cameraPositionClear(adjustedTour[0].from[0],adjustedTour[0].from[2],editedTourPlan));
assert.deepEqual(interior.tourFrame(100,4),{index:3,progress:1},'Ending must keep the final room camera valid');
assert.deepEqual(interior.tourFrame(-1,4),{index:0,progress:0});
console.log('Interior tour checks passed: clear camera paths, edited layouts, eye height and ending bounds.');

const renderedInterior=load(path.join(root,'lib/interior-render.ts'));
const originalKey=renderedInterior.interiorPlanKey(data.studioLayouts[0].placements);
assert.equal(originalKey,renderedInterior.interiorPlanKey([...data.studioLayouts[0].placements].reverse()),'Offline frames must not depend on furniture order');
assert.notEqual(originalKey,renderedInterior.interiorPlanKey(data.studioLayouts[0].placements.map((p,i)=>i===0?{...p,x:p.x+.01}:p)),'Edited furniture must never show a stale offline render');

// A room's image movement must not reset or reverse halfway through playback.
const filmMotion=load(path.join(root,'lib/interior-film-motion.ts'));
for(const room of ['living','dining','bedroom','study']){
 const start=filmMotion.interiorFilmMotion(0,room),end=filmMotion.interiorFilmMotion(1,room);
 const direction=Math.sign(end.scale-start.scale);
 let previous=start;
 for(let step=1;step<=600;step++){
  const current=filmMotion.interiorFilmMotion(step/600,room);
  assert.equal(current.origin,start.origin,'A single shot must keep its crop center');
  assert.ok(current.scale>=1 && current.scale<=1.035,'Keep the full room readable throughout the move');
  assert.ok((current.scale-previous.scale)*direction>=0,'Camera movement must not reverse');
  assert.ok(Math.abs(current.scale-previous.scale)<.001,'No mid-shot scale jump');
  previous=current;
 }
 assert.equal(filmMotion.interiorFilmMotion(.7,room,true).scale,1,'Reduced motion keeps the full frame');
}
console.log('Film motion checks passed: continuous movement, stable framing, reduced motion.');

// Quick planning must keep detailed constraints and survive saved-plan parsing.
const insights=load(path.join(root,'lib/plan-insights.ts'));
const quick=insights.buildQuickBrief(brief.defaultBrief,data.allExistingIds,{household:'2',priority:'work',budget:1000,drilling:'no'});
const quickPlan=planner.planForProfile(quick,data.allExistingIds);
assert.equal(quickPlan.recommended,'c');
assert.equal(quick.profile.completed.length,0,'Quick defaults are not confirmed questionnaire answers');
const quickSave=data.parseStudioPlan(JSON.stringify({version:2,phase:'results',selected:data.allExistingIds,habits:['reuse'],note:'',layout:'c',brief:quick}));
assert.equal(quickSave.brief.profile.answers.workers,'2');
assert.equal(quickSave.brief.profile.answers.deskRoom,'unknown');
assert.equal(planner.planForProfile(quickSave.brief,data.allExistingIds).recommended,'c');
const constrained={...tailored,profile:{...tailored.profile,furniture:{F13:'must'},answers:{...tailored.profile.answers,secondhand:'no',includesFees:'yes',serviceReserve:'400'}}};
const constrainedQuick=insights.buildQuickBrief(constrained,data.allExistingIds,{household:'3',priority:'work',budget:1000,drilling:'no'});
assert.equal(constrainedQuick.profile.furniture.F13,'must');
assert.equal(constrainedQuick.profile.answers.secondhand,'no');
assert.equal(planner.furnitureAllowance(constrainedQuick),600);
assert.equal(constrainedQuick.profile.answers.diners,'3-4');
assert.notEqual(planner.planForProfile(constrainedQuick,data.allExistingIds).recommended,'c');
const zeroQuick=insights.buildQuickBrief(quick,data.allExistingIds,{household:'2',priority:'work',budget:0,drilling:'no'});
assert.ok(planner.planForProfile(zeroQuick,data.allExistingIds).plans.every(p=>p.cost===0));
const original=data.studioLayouts[0].placements;
const outside=original.map(p=>p.id==='F01'?{...p,x:2,z:8}:p);
const facts=insights.inspectPlan(quick,outside,data.allExistingIds);
assert.equal(facts.reused.length,17);
assert.equal(facts.staged.length,1);
assert.ok(facts.left.some(p=>p.id==='F01'));
assert.equal(insights.inspectPlan(quick,original.filter(p=>p.id==='F01'),['F01']).selectedReuse,100);
assert.equal(insights.inspectPlan(quick,original.filter(p=>p.id==='F01'),['F01']).allReuse,6);
const removal=insights.planDifference(original,original.filter(p=>p.origin!=='new'));
assert.equal(removal.cost,-549);
assert.equal(removal.removed.length,1);
assert.equal(insights.planDifference(original,outside).moved.length,1);
console.log('Decision checks passed: quick brief persistence, preserved constraints, budget changes, staged furniture, distinct reuse denominators and purchase deltas.');
