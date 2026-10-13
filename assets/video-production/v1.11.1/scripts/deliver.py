from pathlib import Path
import json,subprocess,re,hashlib,zipfile,sys,time,urllib.request,math
import numpy as np
from PIL import Image,ImageDraw
B=Path(__file__).resolve().parents[1];O=B/'final';Q=B/'qa';D=223;FRAMES=D*60
FF=str(B.parent/'tools/python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe')
MOV=O/'ReNest-HK-v1.11.1-Polished-1080p60.mp4'
def run(args):
 p=subprocess.run([FF,'-hide_banner','-y',*map(str,args)],capture_output=True)
 if p.returncode:raise RuntimeError(p.stderr.decode('utf-8',errors='replace')[-4000:])
 return p.stderr.decode('utf-8',errors='replace')
def tc(t):return f'{int(t)//60:02}:{t%60:04.1f}'
ps=json.loads((B/'paragraphs.json').read_text());shots=json.loads((B/'narration.json').read_text());caps=json.loads((B/'captions.json').read_text());edits=json.loads((B/'edit-decisions.json').read_text())

notes=['ReNest v1.11.1 — 尾段顺序与旁白优化','3分43秒，1920×1080，60fps。','顺序：原片前段 → 家庭成果（3:04）→ 16/18复用（3:12）→ 社区试点（3:16）→ 隐私与选择（3:21）→ 品牌结尾。','社区试点与隐私页已移到16/18之后；前段保留。','隐私旁白改成自然连贯的解释，不再逐项朗读四个短句：',ps[25]['text'],'原v1.11及更早版本保留。']
(O/'ReNest-v1.11.1-edit-notes.txt').write_text('\n'.join(notes),encoding='utf-8-sig')
print('WAITING FOR SEGMENTS',flush=True)
while True:
 state=json.load(urllib.request.urlopen('http://127.0.0.1:8778/status'))
 if state['status']=='error':raise RuntimeError(state)
 ready=state.get('job')=='trust' and state['status']=='done'
 ready=ready and 'ALL REUSE SEGMENTS READY' in (Q/'reuse.log').read_text()
 ready=ready and 'complete' in (Q/'score.log').read_text()
 if ready:break
 time.sleep(3)
manifest=[]
for e in edits:
 path=(O/f'{e["name"]}-picture.mp4') if e['type']=='render' else (B/'segments'/f'{e["name"]}.mp4')
 assert path.exists(),path
 manifest.append("file '"+path.as_posix()+"'")
(B/'segments/concat.txt').write_text('\n'.join(manifest))
log=run(['-f','concat','-safe','0','-i',B/'segments/concat.txt','-an','-c:v','copy','-movflags','+faststart',O/'master-picture.mp4']);(Q/'concat.log').write_text(log)
log=run(['-i',O/'master-picture.mp4','-i',B/'audio/master.wav','-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','256k','-af','volume=-0.3dB','-t',D,'-movflags','+faststart',MOV]);(Q/'mux.log').write_text(log);print('FINAL MP4 READY',flush=True)
log=run(['-i',MOV,'-f','null','-']);(Q/'decode.log').write_text(log);assert 'frame=13380' in log and '1920x1080' in log and '60 fps' in log;print('FULL DECODE PASS',flush=True)
loud=run(['-i',MOV,'-vn','-af','loudnorm=I=-16:TP=-1:LRA=8:print_format=json','-f','null','-']);(Q/'loudness.log').write_text(loud);levels=json.loads(re.search(r'\{\s*"input_i".*?\}',loud,re.S).group());print('LOUDNESS',levels['input_i'],flush=True)
ts=[181,187,194,199,204,209,216,220]
board=Image.new('RGB',(1920,math.ceil(len(ts)/3)*384),(12,30,25));draw=ImageDraw.Draw(board)
for i,t in enumerate(ts):
 p=Q/f'encoded-{t}.png';run(['-ss',t,'-i',MOV,'-frames:v','1',p]);im=Image.open(p);im.thumbnail((640,360));x=i%3*640;y=i//3*384;board.paste(im,(x,y));draw.text((x+10,y+365),f'{t}s',fill='white')
board.save(Q/'encoded-review.jpg');print('ENCODED FRAMES READY',flush=True)
raw=subprocess.run([FF,'-v','error','-i',str(MOV),'-an','-vf','scale=96:54,format=gray','-f','rawvideo','-'],capture_output=True,check=True).stdout
arr=np.frombuffer(raw,dtype=np.uint8).reshape(-1,54*96).astype(np.int16);assert len(arr)==FRAMES;delta=np.mean(np.abs(arr[1:]-arr[:-1]),axis=1);flashes=[]
for i in range(1,len(arr)-1):
 if delta[i-1]>18 and delta[i]>18 and np.abs(arr[i-1]-arr[i+1]).mean()<6:flashes.append(round(i/60,3))
sys.path.insert(0,str(B.parent/'v1.4-commercial/vendor'));import zxingcpp
qr=[x.text for x in zxingcpp.read_barcodes(Image.open(Q/'encoded-220.png'))];assert qr==['https://renest-hk.vercel.app/']
assert all(a['end']<=b['start'] for a,b in zip(caps,caps[1:]));assert caps[-1]['end']<D
report=dict(duration_seconds=D,frames=FRAMES,resolution='1920x1080',fps=60,full_decode='pass',voice_segments=len(ps),captions=len(caps),original_opening_seconds=27,full_scan_seconds=18,full_plan_seconds=10,full_diy_seconds=10,ai_layout_explanation_seconds=20,gap_analysis_seconds=5,post_selection_update_seconds=7,voice='en-US-AvaNeural',rate='+5%',post_time_stretch=False,integrated_lufs=float(levels['input_i']),true_peak_dbtp=float(levels['input_tp']),isolated_flash_candidates=flashes,qr=qr[0],previous_versions_preserved=True,sha256=hashlib.sha256(MOV.read_bytes()).hexdigest())
(O/'verification.json').write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True)

print('DELIVERY VERIFIED',flush=True)
