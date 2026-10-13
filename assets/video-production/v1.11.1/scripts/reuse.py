from pathlib import Path
import json,subprocess
B=Path(__file__).resolve().parents[1]
FF=str(B.parent/'tools/python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe')
OLD=B.parent/'v1.11-flow'
edits=json.loads((B/'edit-decisions.json').read_text())
oldcaps=json.loads((OLD/'captions.json').read_text());newcaps=json.loads((B/'captions.json').read_text())
for e in edits:
 if e['type']!='reuse':continue
 a=e['old_start'];b=e['old_end'];shift=e['start']-a
 oc=[(round(c['start']+shift,4),round(min(c['end'],b)+shift,4),c['text']) for c in oldcaps if a<=c['start']<b]
 nc=[(round(c['start'],4),round(min(c['end'],e['end']),4),c['text']) for c in newcaps if e['start']<=c['start']<e['end']]
 assert oc==nc,(e['name'],oc,nc)
 out=B/'segments'/f'{e["name"]}.mp4'
 with (B/'qa'/f'reuse-{e["name"]}.log').open('wb') as log:
  subprocess.run([FF,'-y','-hide_banner','-ss',str(a),'-i',str(OLD/'final/master-picture.mp4'),'-t',str(b-a),'-an','-r','60','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-movflags','+faststart',str(out)],stderr=log,check=True)
 print('REUSED AND CAPTION MATCHED',e['name'],flush=True)
print('ALL REUSE SEGMENTS READY',flush=True)
