// One narrative purpose per chapter: needs, actions, then outcomes.
const beforeFlow=storyFrame;
function trustFlow(u){
 bg(true);status('RESPONSIBLE PLANNING',true);
 text('Private plans. Informed choices.',65,218,77,CREAM,'Editorial');
 const cards=[['YOUR ROOM DATA',['Room files stay local','Consent for future AI processing']],['YOUR DECISIONS',['Check dimensions and condition','Sponsored recommendations labelled']]];
 cards.forEach(([title,items],i)=>{const x=65+i*920;rect(x,350,870,410,'#274b40',20);text(title,x+36,420,23,MINT,'Mono');items.forEach((v,j)=>{checkMark(x+40,509+j*116);lines(v,x+91,520+j*116,34,CREAM,720)})});
}
function outcomeFlow(u){
 if(u>=8){impact(u-8);return}
 cover(lived[u<4?0:2],1.04);shade('left',.96);status('THEIR PLAN, READY.',true);
 text('A home that fits their life.',68,202,81,CREAM,'Editorial');
 ['Their sofa stays','A dedicated workspace','A table that opens for friends','Access needs included'].forEach((v,i)=>{const p=settle((u-i*.45)/.5);ctx.save();ctx.globalAlpha=p;checkMark(79,334+i*115,p);text(v,129,349+i*115,36,CREAM);ctx.restore()});
 rect(1260,302,599,518,'#eaf0e1f5',22);text('ILLUSTRATIVE PURCHASE PLAN',1294,356,20,MUTED,'Mono');
 [['1 pre-owned chair','HK$120'],['1 new folding dining set','HK$890'],['Estimated delivery','HK$180']].forEach(([a,b],i)=>{text(a,1295,426+i*63,27,INK);text(b,1809,426+i*63,27,INK,'Geist','right')});
 line(1295,590,1819,590,MUTED,1);text('HK$1,190',1292,675,69,INK);text('of HK$3,000 budget',1297,731,28,INK);text('HK$1,810 remaining',1297,782,25,MUTED);
}
storyFrame=function(s,t){if(s.kind==='trust-combined'){trustFlow(t-s.start);return true}if(s.kind==='outcome'){outcomeFlow(t-s.start);return true}return beforeFlow(s,t)};
window.filmReady=true;await window.renderAt(0);
