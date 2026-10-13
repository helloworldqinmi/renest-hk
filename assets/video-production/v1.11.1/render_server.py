"""Local-only frame export. Browser clock never determines the encoded frame count."""
import http.server, json, subprocess, threading
from pathlib import Path
BASE=Path(__file__).resolve().parent;ROOT=BASE.parents[3]
FF=str(BASE.parent/'tools/python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe')
state={'status':'idle'};proc=None;log=None
class Handler(http.server.SimpleHTTPRequestHandler):
 protocol_version='HTTP/1.1'
 def reply(self,code,data):
  self.send_response(code);self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
 def log_message(self,*args):pass
 def do_GET(self):
  if self.path=='/status':
   self.reply(200,json.dumps(state).encode())
  else:super().do_GET()
 def do_POST(self):
  global proc,log
  data=self.rfile.read(int(self.headers.get('Content-Length',0)))
  try:
   if self.path=='/begin':
    if proc and proc.poll() is None:raise RuntimeError('Another export is active')
    cfg=json.loads(data);job=cfg['job'];assert job.replace('-','').replace('_','').isalnum()
    out=BASE/'final'/f'{job}-picture.mp4';log=open(BASE/'qa'/f'{job}-encode.log','wb')
    proc=subprocess.Popen([FF,'-y','-hide_banner','-f','image2pipe','-vcodec','mjpeg','-framerate',str(cfg['fps']),'-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-movflags','+faststart',str(out)],stdin=subprocess.PIPE,stderr=log)
    state.update(status='running',job=job,frames=0,output=str(out))
   elif self.path=='/frame':
    if not proc or proc.poll() is not None:raise RuntimeError('No active encoder')
    index=int(self.headers.get('X-Frame-Index',state['frames']))
    if index>state['frames']:raise RuntimeError('Out-of-order frame')
    if index==state['frames']:proc.stdin.write(data);state['frames']+=1
   elif self.path=='/finish':
    proc.stdin.close();code=proc.wait();log.close();state['status']='done' if code==0 else 'error';state['exit_code']=code
    (BASE/'qa'/f'{state["job"]}-export.json').write_text(json.dumps(state,indent=2))
   else:raise RuntimeError('Unknown endpoint')
   self.reply(200,b'ok')
  except Exception as e:
   state.update(status='error',error=str(e));self.reply(500,str(e).encode())
print('Frame server: http://127.0.0.1:8778',flush=True)
http.server.ThreadingHTTPServer(('127.0.0.1',8778),Handler).serve_forever()
