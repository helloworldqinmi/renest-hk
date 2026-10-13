from pathlib import Path
import json,re
B=Path(__file__).resolve().parent
(B/'film.mjs').write_text('\n'.join((B/f).read_text(encoding='utf-8') for f in ['scene-init.mjs','helpers.mjs','direction.mjs','story.mjs','revision.mjs','flow.mjs']),encoding='utf-8')
def norm(s):return re.sub('[^a-z0-9]','',s.lower().replace('renest','reenest').replace('lidar','liedar'))
caps=[]
for s in json.loads((B/'paragraphs.json').read_text()):
 ws=s['words'];spans=[];cursor=0
 for w in ws:
  n=len(norm(w['text']));spans.append((cursor,cursor+n,w));cursor+=n
 groups=[];g=[]
 for token in s['text'].split():
  g.append(token)
  if len(' '.join(g))>62 or (len(g)>=3 and token.endswith(('.', '?',';'))):groups.append(' '.join(g));g=[]
 if g:groups.append(' '.join(g))
 cursor=0
 for g in groups:
  end=cursor+len(norm(g));first=next((w for a,b,w in spans if b>cursor),ws[-1]);last=next((w for a,b,w in spans if b>=end),ws[-1]);caps.append(dict(start=s['start']+first['offset']/1e7,end=s['start']+(last['offset']+last['duration'])/1e7+.1,text=g));cursor=end
for a,b in zip(caps,caps[1:]):a['end']=min(a['end'],b['start'])
(B/'captions.json').write_text(json.dumps(caps,indent=2))
def tc(t):
 n=round(t*1000);return f'{n//3600000:02}:{n//60000%60:02}:{n//1000%60:02},{n%1000:03}'
(B/'final/renest-v1.11.1-en.srt').write_text('\n\n'.join(f'{i+1}\n{tc(c["start"])} --> {tc(c["end"])}\n{c["text"]}' for i,c in enumerate(caps)),encoding='utf-8')
print('Built',len(json.loads((B/'narration.json').read_text())),'sequences with',len(caps),'semantic captions')
