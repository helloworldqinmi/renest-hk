"""Paragraph-first narration: one voice, one native rate, no time stretching."""
from pathlib import Path
import sys,asyncio,json,subprocess,re,wave
import numpy as np
B=Path(__file__).resolve().parent
sys.path.insert(0,str(B.parent/'tools/tts'))
import edge_tts
FF=str(B.parent/'tools/python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe')
SR=48000
PARAS=[(0.35, 'Moving home should be easier, more sustainable, and more affordable. With ReNest, start with what you already own and plan the next chapter before you pack.'), (12.3, "In Hong Kong's Northern Metropolis, around half a million additional homes are planned. Behind that scale are individual moves: deciding what fits, what needs replacing, and how to make a smaller space work harder."), (27.3, 'First, scan your old home with a LiDAR-equipped iPhone. Use an existing scanning app to capture the room and furniture as a three-dimensional model. Watch points become a mesh, surfaces appear, and individual pieces are identified.'), (45.2, 'Second, choose the furniture you want to keep, and confirm its dimensions.'), (51.3, "Next, upload the new home's floor plan, or choose a built-in Northern Metropolis example. Preview the space before arranging anything."), (59.5, 'Watch the floor plan become a three-dimensional space, with walls, doors and windows. Check the room before placing any furniture.'), (69.3, 'Now, plan for the people who will live here. This couple has a three-thousand-dollar budget. They want to keep their sofa, work from home, host friends, and welcome a parent who uses a wheelchair. Add these needs in the questionnaire, with options for pets or instruments too.'), (89.2, 'AI arranges their existing furniture first. The sofa goes against the wall, opening up the centre of the room.'), (96.8, 'Their existing desk anchors a dedicated work corner.'), (101.8, "A clear route supports their parent's visit. Review wheelchair clearances and turning space before approving the plan."), (109.2, 'What is still missing? A supportive chair and a table that folds away.'), (114.2, 'Next, compare second-hand and new furniture that fits the remaining space and budget. Example sources include Xianyu and Taobao.'), (124.3, 'For second-hand furniture, AI would compare seller distance and delivery fees, alongside size and condition. Check the total delivered cost.'), (134.2, 'Preview the selected table inside the room.'), (138.2, 'Open and fold the table. See how the space changes.'), (142.2, 'Then explore the product details.'), (145.2, 'After their selection, AI updates the whole layout and checks the routes again.'), (152.3, 'Compare arrangements, then choose the one that fits their life.'), (156.2, 'You can also adjust the plan yourself: select, drag, reposition, and confirm.'), (166.2, 'Export a moving report for the next steps.'), (171.2, 'For furniture they leave behind, prepare editable resale drafts for another household.'), (177.2, 'Partner models connect reuse with space-saving furniture. Planned referrals and commissions support the service.'), (184.2, 'The sofa stays. The workspace is ready. The table opens for guests, and the purchase plan is within budget.'), (192.2, 'Sixteen of eighteen pieces stay in use.'), (196.2, 'A neighbourhood pilot would test completed plans, seller visits and purchases.'), (201.2, "Your room files stay on your device. You'd choose whether to share them with AI, and check the furniture details before buying."), (218.0, 'ReNest. An easier move. Less waste. More value.')]
async def generate():
 for i,(start,txt) in enumerate(PARAS):
  p=B/'audio'/f'paragraph-{i:02}.mp3';meta=p.with_suffix('.json')
  if meta.exists():
   cached=json.loads(meta.read_text(encoding='utf-8'))
   if cached.get('text')==txt and cached.get('voice')=='en-US-AvaNeural' and cached.get('rate')=='+5%':continue
  words=[]
  speech=txt.replace('ReNest','Ree-nest').replace('LiDAR','lie-dar')
  with p.open('wb') as f:
   async for c in edge_tts.Communicate(speech,'en-US-AvaNeural',rate='+5%',boundary='WordBoundary').stream():
    if c['type']=='audio':f.write(c['data'])
    elif c['type']=='WordBoundary':words.append({k:c[k] for k in ['text','offset','duration']})
  end=(words[-1]['offset']+words[-1]['duration'])/1e7
  meta.write_text(json.dumps({'start':start,'text':txt,'duration':end,'words':words,'voice':'en-US-AvaNeural','rate':'+5%'},indent=2))
  print(i,round(end,2),round(start+end,2),flush=True)
def build():
 voice=np.zeros((SR*223,2),np.float32);caps=[];timings=[]
 for i,(start,txt) in enumerate(PARAS):
  p=B/'audio'/f'paragraph-{i:02}.mp3';m=json.loads(p.with_suffix('.json').read_text());end=start+m['duration']
  following=PARAS[i+1][0] if i+1<len(PARAS) else 223
  if end>following-.12:raise ValueError(f'Paragraph {i} needs space: ends {end:.2f}, next {following}')
  out=p.with_suffix('.wav');subprocess.run([FF,'-y','-loglevel','error','-i',str(p),'-ar',str(SR),'-ac','2',str(out)],check=True)
  with wave.open(str(out),'rb') as w:a=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').reshape(-1,2).astype(np.float32)/32768
  st=round(start*SR);n=min(len(a),round((following-start-.03)*SR));voice[st:st+n]+=a[:n]
  ws=m['words'];group=[]
  for j,w in enumerate(ws):
   group.append(w)
   if len(' '.join(x['text'] for x in group))>=62 or j==len(ws)-1:
    words=' '.join(x['text'] for x in group).replace('Ree-nest','ReNest').replace('lie-dar','LiDAR')
    caps.append({'start':start+group[0]['offset']/1e7,'end':start+(group[-1]['offset']+group[-1]['duration'])/1e7+.06,'text':words});group=[]
  timings.append({'id':i,'start':start,'end':end,'text':txt,'words':ws})
 with wave.open(str(B/'audio/narration.wav'),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((np.clip(voice,-1,1)*32767).astype('<i2').tobytes())
 (B/'captions.json').write_text(json.dumps(caps,indent=2));(B/'paragraphs.json').write_text(json.dumps(timings,indent=2))
 def stamp(t):
  n=round(t*1000);return f'{n//3600000:02}:{n//60000%60:02}:{n//1000%60:02},{n%1000:03}'
 (B/'final/renest-v1.11.1-en.srt').write_text('\n\n'.join(f'{i+1}\n{stamp(c["start"])} --> {stamp(c["end"])}\n{c["text"]}' for i,c in enumerate(caps)))
 print('PARAGRAPH VOICE BUILT',sum(len(x[1].split()) for x in PARAS),'words',flush=True)
if __name__=='__main__':
 asyncio.run(generate())
 if '--generate-only' not in sys.argv:build()
