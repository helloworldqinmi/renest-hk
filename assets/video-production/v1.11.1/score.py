"""Original 120 BPM score with scene-specific orchestration and synchronized gestures."""
from pathlib import Path
import numpy as np,math,wave,subprocess,json
B=Path(__file__).resolve().parent;SR=48000;N=SR*223
FF=str(B.parent/'tools/python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe')
rng=np.random.default_rng(16120);music=np.zeros((N,2),np.float32);sfx=np.zeros_like(music)
def add(buf,a,t,g=.1,pan=0):
 i=round(t*SR);n=min(len(a),N-i)
 if n>0:buf[i:i+n]+=a[:n,None]*g*np.array([math.sqrt((1-pan)/2),math.sqrt((1+pan)/2)])
def note(m,d=.5,kind='pluck'):
 t=np.arange(round(d*SR))/SR;f=440*2**((m-69)/12)
 if kind=='bass':a=np.sin(2*np.pi*f*t)+.22*np.sin(2*np.pi*f*2*t);e=np.minimum(t/.008,1)*np.exp(-t*5)
 elif kind=='pad':a=np.sin(2*np.pi*f*t)+.2*np.sin(2*np.pi*f*1.003*t);e=np.minimum(t/.3,1)*np.minimum((d-t)/.4,1)
 else:a=np.sin(2*np.pi*f*t+1.1*np.sin(2*np.pi*f*2*t)*np.exp(-t*14));e=np.minimum(t/.004,1)*np.exp(-t*6)
 return (a*e).astype(np.float32)
def noise(d):return rng.normal(0,1,round(d*SR)).astype(np.float32)
chords=[[50,57,60,64,69],[46,53,57,60,65],[53,60,64,67,72],[48,55,58,62,67]]
def section(t):
 if t<12:return .6,'intro'
 if t<27:return .55,'story'
 if t<45:return .75,'scan'
 if t<59:return .6,'ui'
 if t<69:return .85,'build'
 if t<89:return .6,'ui'
 if t<109:return .85,'tech'
 if t<114:return .55,'ui'
 if t<152:return .8,'product'
 if t<177:return .6,'ui'
 if t<201:return .65,'impact'
 if t<211:return .4,'trust'
 if t<216:return .85,'intro'
 if t<219:return .55,'ui'
 return .35,'end'

for bar in range(112):
 at=bar*2;p,k=section(at);c=chords[(bar//4)%4]
 for i,m in enumerate(c[1:]):add(music,note(m,2.5,'pad'),at,.016,(-.6+i*.4))
 if k=='end':continue
 for q in [0,.75,1.25,1.75]:
  if k in ['story','trust'] and q not in [0,1.25]:continue
  add(music,note(c[0]-12,.42,'bass'),at+q,.19*p)
 if k not in ['trust','story']:
  for q in ([0,1] if k in ['scan','ui'] else [0,.5,1,1.5]):
   t=np.arange(round(.28*SR))/SR;a=np.sin(2*np.pi*(45*t+1.9*(1-np.exp(-t*45))))*np.exp(-t*18);add(music,a,at+q,.25*p)
 for q in ([.5,1.5] if k not in ['story','trust','scan'] else [1.5]):
  t=np.arange(round(.12*SR))/SR;n=noise(.12);a=(n-np.convolve(n,np.ones(9)/9,'same'))*np.exp(-t*38);add(music,a,at+q,.033*p,.12)
 for q in np.arange(.25,2,.25 if k in ['product','intro'] else .5):
  t=np.arange(round(.07*SR))/SR;n=noise(.07);add(music,np.diff(n,prepend=0)*np.exp(-t*65),at+q,.009*p,math.sin(q*12)*.6)
 if k not in ['trust','story']:
  for j,q in enumerate([.25,.875,1.25,1.625]):
   if k in ['ui','scan'] and j%2:continue
   add(music,note(c[1+j%3]+12,.7),at+q,.045*p,(-.6+j*.4))
 if k=='product':
  for j in range(8):add(music,note(c[1+j%4]+12,.25),at+j*.25,.027,math.sin(j)*.7)
# Break the uniform beat before the brand and the product hero; let their gestures land.
for a,z in [(26.8,27),(68.8,69),(88.8,89),(133.8,134),(183.8,184),(210.8,211)]:music[round(a*SR):round(z*SR)]*=.12
for at in [.35,7.7,27,59,69,89,134,184,218]:
 for dt,m in [(0,69),(.25,72),(.5,76)]:add(music,note(m,1.8),at+dt,.17 if at==218 else .12)
dry=music.copy()
for delay,g in [(.25,.14),(.5,.07),(.75,.035)]:
 n=round(delay*SR);music[n:]+=dry[:-n,::-1]*g
music=np.tanh(music*1.12)*.8;music*=np.clip((223-np.arange(N)/SR)/1.7,0,1)[:,None]
events=[]
for at in [12, 21, 27, 45, 51, 59, 69, 89, 109, 114, 124, 134, 138, 142, 145, 152, 156, 166, 171, 177, 184, 192, 196, 201, 211, 219, 212.8, 214.7, 216]:
 t=np.arange(round(.38*SR))/SR;n=noise(.38);a=np.convolve(n,np.ones(36)/36,'same')*np.sin(np.pi*t/.38)**2;add(sfx,a,max(0,at-.2),.14);events.append([at,'spatial transition'])
for at in [28,34.2,39.6,43.5,61,63,66,72,76,80,84,91,98,103,127,131,147,158,162]:
 t=np.arange(round(.12*SR))/SR;add(sfx,np.sin(2*np.pi*370*t)*np.exp(-t*48),at,.075);events.append([at,'recognition or action'])
for at in [138.5,140.5]:
 t=np.arange(round(.25*SR))/SR;a=(np.sin(2*np.pi*170*t)+.09*noise(.25))*np.exp(-t*25);add(sfx,a,at,.12);events.append([at,'hinge and wood'])
def write(p,a):
 with wave.open(str(p),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((np.clip(a,-1,1)*32767).astype('<i2').tobytes())
def read(p):
 with wave.open(str(p),'rb') as w:return np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').reshape(-1,2).astype(np.float32)/32768
write(B/'audio/music.wav',music);write(B/'audio/sound-design.wav',sfx)
voice=read(B/'audio/narration.wav');env=np.ones(22300,np.float32)
for s in json.loads((B/'paragraphs.json').read_text()):env[max(0,int((s['start']-.15)*100)):min(22300,int((s['end']+.2)*100))]=.48
env=np.convolve(np.pad(env,(12,12),mode='edge'),np.ones(25)/25,'valid');env=np.interp(np.arange(N),np.arange(len(env))*480,env)
mix=voice*.95+music*env[:,None]+sfx*.6;write(B/'audio/premaster.wav',mix)
subprocess.run([FF,'-y','-loglevel','error','-i',str(B/'audio/premaster.wav'),'-af','loudnorm=I=-16:TP=-1:LRA=8','-ar',str(SR),str(B/'audio/master.wav')],check=True)
(B/'audio/sound-events.json').write_text(json.dumps(events,indent=2));print('Original score and master complete')
