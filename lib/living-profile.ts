export type ProfileSection='household'|'budget'|'daily'|'access'|'priorities'|'hobbies'|'pets'|'restrictions'|'style';
export type ProfileStep=ProfileSection|'review';
export type LocalCopy=[string,string,string];
export type ProfileOption={id:string;label:LocalCopy;detail?:LocalCopy;swatch?:string};
const o=(id:string,en:string,cn:string,hk=cn):ProfileOption=>({id,label:[en,cn,hk]});
export const profileSections:ProfileSection[]=['household','budget','daily','access','priorities','hobbies','pets','restrictions','style'];
export const coreSections=profileSections.slice(0,5);
export const profileOptions:Record<string,ProfileOption[]>={
 household:[o('1','Just me','一个人','一個人'),o('2','Two people','两个人','兩個人'),o('3','Three people','三个人','三個人'),o('4+','Four or more','四人及以上'),o('unknown','Not sure yet','暂时没想好','暫時未想好')],
 doubleBeds:[o('0','None','不需要'),o('1','One','1 张','1 張'),o('2','Two','2 张','2 張'),o('unknown','Not sure','待确认','待確認')],
 singleBeds:[o('0','None','不需要'),o('1','One','1 张','1 張'),o('2','Two','2 张','2 張'),o('3','Three','3 张','3 張'),o('unknown','Not sure','待确认','待確認')],
 children:[o('0','No children','没有儿童','沒有兒童'),o('1','One child','1 位儿童','1 位兒童'),o('2+','Two or more','2 位及以上'),o('unknown','Not sure','待确认','待確認')],
 overnight:[o('no','No overnight guests','不需要留宿客人'),o('sometimes','Occasional guests','偶尔留宿','偶爾留宿'),o('often','Often host overnight','经常留宿','經常留宿'),o('unknown','Keep it flexible','先保留可能')],
 budgetRange:[o('zero','Reuse only · HK$0','先复用 · HK$0','先重用 · HK$0'),o('small','Up to HK$3,000','HK$3,000 以内','HK$3,000 以內'),o('medium','HK$3,000–6,000','HK$3,000–6,000'),o('large','HK$6,000–10,000','HK$6,000–10,000'),o('custom','Set my own range','自定义范围','自訂範圍'),o('unknown','Help me compare first','先看方案再决定','先看方案再決定')],
 includesFees:[o('yes','Includes delivery & assembly','包含运输和安装','包含運輸和安裝'),o('no','Furniture only','只算家具','只計傢俬'),o('unknown','Not decided','暂不确定','暫不確定')],
 purchaseTiming:[o('now','Ready to buy','可以现在添置','可以現在添置'),o('staged','Buy in stages','可以分批买','可以分批買'),o('later','Buy nothing for now','暂时不购买','暫時不購買')],
 secondhand:[o('prefer','Prefer second-hand','优先考虑二手','優先考慮二手'),o('allow','New or second-hand','新品、二手都可以'),o('no','New pieces only','只考虑新品','只考慮新品'),o('unknown','Decide later','之后再决定','之後再決定')],
 workFrequency:[o('never','Not at home','不在家工作学习','不在家工作學習'),o('sometimes','A few times a week','偶尔需要','偶爾需要'),o('daily','Every day','每天都需要'),o('unknown','Not sure yet','暂不确定','暫不確定')],
 workers:[o('1','One person','1 人'),o('2','Two at once','2 人同时','2 人同時'),o('3+','Three or more','3 人及以上'),o('unknown','Not sure','待确认','待確認')],
 deskRoom:[o('living','Living room','客厅','客廳'),o('bedroom','Bedroom','卧室','睡房'),o('study','Dedicated study','独立书房','獨立書房'),o('flexible','Flexible / fold-away','灵活安排','靈活安排'),o('unknown','Suggest a place','帮我找位置','幫我找位置')],
 diners:[o('1','One','1 人'),o('2','Two','2 人'),o('3-4','Three to four','3–4 人'),o('5+','Five or more','5 人及以上'),o('unknown','Not sure','待确认','待確認')],
 hosting:[o('rare','Rarely host','不常招待客人'),o('sometimes','Occasional meals','偶尔一起吃饭','偶爾一起吃飯'),o('often','Love hosting','喜欢招待朋友','喜歡招待朋友'),o('unknown','Keep it flexible','先保留可能')],
 hostingSeats:[o('2','Two seats','2 人'),o('4','Four seats','4 人'),o('6+','Six or more','6 人及以上'),o('unknown','Not sure yet','待确认','待確認')],
 access:[o('none','No special needs','暂无特别需求','暫無特別需求'),o('older','Older family members','有长者','有長者'),o('wheelchair','Wheelchair access','需要轮椅通行','需要輪椅通行'),o('stroller','Pushchair / stroller','需要婴儿车通行','需要嬰兒車通行'),o('unknown','Need to confirm','还需要确认','還需要確認')],
 accessNeeds:[o('clear-paths','Clear walking paths','通道保持畅通','通道保持暢通'),o('bed-access','More room beside beds','床边留活动空间','床邊留活動空間'),o('no-trip','Fewer floor obstacles','减少地面障碍','減少地面障礙'),o('reachable','Easy-to-reach storage','物品容易拿取'),o('night-light','Night lighting','夜间照明','夜間照明')],
 priority:[o('reuse','Keep familiar pieces','多保留旧家具','多保留舊傢俬'),o('storage','More storage','收纳更充足','收納更充足'),o('open','Open activity space','开阔活动区','開闊活動區'),o('work','Work & study','工作学习区','工作學習區'),o('host','Room for guests','方便招待客人'),o('budget','Spend less','低预算','低預算'),o('balanced','Help me balance it','帮我平衡安排','幫我平衡安排')],
 hobbies:[o('reading','Reading','阅读与书架','閱讀與書架'),o('coffee','Coffee corner','咖啡角'),o('music','Music','乐器与练习','樂器與練習'),o('cinema','Projector / films','投影与观影','投影與觀影'),o('exercise','Exercise','运动健身','運動健身'),o('craft','Making things','手作'),o('plants','Plants','绿植','綠植')],
 storageKinds:[o('clothes','Clothing','衣物'),o('books','Books','书籍','書籍'),o('kitchenware','Kitchenware','厨具','廚具'),o('sports','Sports equipment','运动器材','運動器材'),o('luggage','Suitcases','行李箱'),o('toys','Toys','玩具'),o('collections','Collections','收藏品')],
 shareHobbySpace:[o('yes','Activities can share space','可以共用空间','可以共用空間'),o('no','Separate spaces preferred','希望各有固定位置'),o('unknown','Help me decide','帮我安排','幫我安排')],
 pets:[o('none','No pets','没有宠物','沒有寵物'),o('cat','Cat','猫','貓'),o('dog','Dog','狗'),o('bird','Bird','鸟','鳥'),o('other','Other pets','其他宠物','其他寵物')],
 petCount:[o('1','One','1 只','1 隻'),o('2','Two','2 只','2 隻'),o('3+','Three or more','3 只及以上','3 隻及以上')],
 petNeeds:[o('cat-tree','Cat tree','猫爬架','貓爬架'),o('scratch','Scratching board','猫抓板','貓抓板'),o('litter','Litter area','猫砂区','貓砂區'),o('pet-bed','Pet bed / nest','宠物窝','寵物窩'),o('hygiene','Cleaning / toilet area','卫生清洁区','衞生清潔區'),o('water','Water & feeding','饮水喂食区','飲水餵食區'),o('play','Play space','玩耍活动区','玩耍活動區'),o('cage','Cage / perch','笼架与栖木','籠架與棲木'),o('supplies','Supplies storage','用品收纳','用品收納'),o('sun','Sunny spot','采光好的角落','採光好的角落')],
 tenure:[o('own','Owned home','自住'),o('rent','Rented home','租住'),o('unknown','Not decided yet','还没确定','還未確定')],
 drilling:[o('yes','Allowed','可以'),o('no','Not allowed','不可以'),o('unknown','Needs permission','需确认许可','需確認許可')],
 fixedCabinet:[o('yes','Allowed','可以'),o('no','Not allowed','不可以'),o('unknown','Needs permission','需确认许可','需確認許可')],
 wallChanges:[o('yes','Allowed','可以'),o('no','Not allowed','不可以'),o('unknown','Needs permission','需确认许可','需確認許可')],
 style:[o('warm','Warm & natural','温暖自然','溫暖自然'),o('minimal','Quiet & minimal','干净简约','乾淨簡約'),o('colourful','Playful colour','丰富色彩','豐富色彩'),o('unknown','Help me discover it','还没想好，帮我搭配','還未想好，幫我配搭')],
 colours:[{...o('light','Light neutrals','浅色系','淺色系'),swatch:'#ece4d5'},{...o('wood','Natural wood','原木色'),swatch:'#bc9870'},{...o('green','Soft green','柔和绿色','柔和綠色'),swatch:'#819476'},{...o('dark','Deep tones','深色系'),swatch:'#46564d'},{...o('accent','Colour accents','彩色点缀','彩色點綴'),swatch:'#b37660'}],
 materials:[o('wood','Wood','木材'),o('fabric','Fabric','布艺','布藝'),o('metal','Metal','金属','金屬'),o('easy-clean','Easy to clean','易打理材质','易打理材質'),o('mixed','Mix materials','混搭')],
};
export type LivingProfile={version:1;step:ProfileStep;completed:ProfileSection[];answers:Record<string,string>;tags:Record<string,string[]>;hobbyAreas:Record<string,number>;furniture:Record<string,'must'|'flexible'|'sell'>;baseSelected:string[];extra:string};
export const newLivingProfile=():LivingProfile=>({version:1,step:'household',completed:[],answers:{},tags:{},hobbyAreas:{},furniture:{},baseSelected:[],extra:''});
const record=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
export function parseLivingProfile(value:unknown):LivingProfile|undefined{
 const v=record(value);if(v.version!==1)return undefined;const p=newLivingProfile();
 if([...profileSections,'review'].includes(v.step as string))p.step=v.step as ProfileStep;
 if(Array.isArray(v.completed))p.completed=[...new Set(v.completed.filter((s):s is ProfileSection=>profileSections.includes(s)))];
 if(Array.isArray(v.baseSelected))p.baseSelected=[...new Set(v.baseSelected.filter((id):id is string=>typeof id==='string'&&/^F(0[1-9]|1[0-8])$/.test(id)))];
 for(const [key,val] of Object.entries(record(v.answers))){if(typeof val!=='string')continue;if(profileOptions[key]?.some(o=>o.id===val))p.answers[key]=val;else if(['budgetMin','budgetMax','serviceReserve'].includes(key)&&val.trim()!==''&&Number.isFinite(Number(val)))p.answers[key]=String(Math.max(0,Math.min(1000000,Number(val))));}
 for(const key of ['access','accessNeeds','secondary','hobbies','storageKinds','pets','petNeeds','colours','materials']){const val=record(v.tags)[key];if(!Array.isArray(val))continue;const opts=profileOptions[key==='secondary'?'priority':key];p.tags[key]=[...new Set(val.filter((x):x is string=>typeof x==='string'&&(opts.some(o=>o.id===x)||(key==='petNeeds'&&x.startsWith('custom:')&&x.length<=67))))].slice(0,key==='secondary'?2:15);}
 for(const key of ['access','pets']){if(p.tags[key]?.includes('none'))p.tags[key]=['none'];else if(p.tags[key]?.includes('unknown'))p.tags[key]=['unknown'];}
 p.tags.secondary=(p.tags.secondary??[]).filter(id=>id!==p.answers.priority&&id!=='balanced');
 for(const [key,val] of Object.entries(record(v.hobbyAreas)))if(p.tags.hobbies?.includes(key)&&typeof val==='number'&&Number.isFinite(val))p.hobbyAreas[key]=Math.max(0,Math.min(45,val));
 for(const [id,val] of Object.entries(record(v.furniture)))if(/^F(0[1-9]|1[0-8])$/.test(id)&&['must','flexible','sell'].includes(val as string))p.furniture[id]=val as 'must'|'flexible'|'sell';
 p.tags.petNeeds=(p.tags.petNeeds??[]).filter(id=>petSuggestions(p).includes(id)||(id.startsWith('custom:')&&p.tags.pets?.some(v=>v!=='none')));
 if(p.tags.access?.some(v=>['none','unknown'].includes(v)))p.tags.accessNeeds=[];
 p.extra=typeof v.extra==='string'?v.extra.slice(0,500):'';
 const missing=coreSections.find(s=>!p.completed.includes(s)||!sectionReady(p,s));
 if(missing&&(p.step==='review'||profileSections.indexOf(p.step)>profileSections.indexOf(missing)))p.step=missing;
 return p;
}
export function sectionReady(p:LivingProfile,section:ProfileSection):boolean{
 const a=p.answers;
 if(section==='household')return ['household','doubleBeds','singleBeds','overnight','children'].every(k=>!!a[k]);
 if(section==='budget'){
  const limit=a.budgetRange==='custom'?Number(a.budgetMax):({zero:0,small:3000,medium:6000,large:10000} as Record<string,number>)[a.budgetRange];
  return ['budgetRange','includesFees','purchaseTiming','secondhand'].every(k=>!!a[k])&&(a.budgetRange!=='custom'||(a.budgetMin!==undefined&&a.budgetMax!==undefined&&Number(a.budgetMin)<=Number(a.budgetMax)))&&!(a.includesFees==='yes'&&Number(a.serviceReserve)>limit);
 }
 if(section==='daily')return ['workFrequency','diners','hosting'].every(k=>!!a[k])&&(['never','unknown'].includes(a.workFrequency)||!!a.workers&&!!a.deskRoom)&&(!['sometimes','often'].includes(a.hosting)||!!a.hostingSeats);
 if(section==='access')return !!p.tags.access?.length;
 if(section==='priorities')return !!a.priority;
 return true;
}
export const coreProfileComplete=(p:LivingProfile)=>coreSections.every(s=>p.completed.includes(s)&&sectionReady(p,s));
export function petSuggestions(p:LivingProfile):string[]{const pets=p.tags.pets??[];return [...new Set([...(pets.includes('cat')?['cat-tree','scratch','litter','sun']:[]),...(pets.includes('dog')?['pet-bed','play','hygiene']:[]),...(pets.includes('bird')?['cage','hygiene','sun']:[]),...(pets.includes('other')?['pet-bed','hygiene']:[]),...(pets.length&&!pets.includes('none')?['water','supplies']:[])])];}
