import numpy as np, wave, subprocess
from math import pi
SR=44100; DUR=19.0; N=int(SR*DUR)
rng=np.random.default_rng(5)
def tone(f,d,dec=5):
    x=np.arange(int(SR*d))/SR; return np.sin(2*pi*f*x)*np.exp(-x*dec)
def put(buf,at,y,g=1.0):
    i=int(at*SR)
    if i<N: buf[i:i+len(y)]+=y[:N-i]*g
mus=np.zeros(N); beat=60/84
bass=[110,110,87.3,98]; arp=[220,261.6,329.6,261.6,220,261.6,311.1,261.6]
for b in range(int(DUR/beat)):
    put(mus,b*beat,tone(bass[(b//2)%4],beat*0.95,3),0.6)
    put(mus,b*beat+beat/2,tone(arp[b%8]*2,beat*0.4,9),0.25)
fx=np.zeros(N)
def whoosh(d,f0,f1):
    x=np.arange(int(SR*d))/SR; n=rng.normal(0,1,len(x))
    ph=np.cumsum(np.linspace(f0,f1,len(x)))/SR*2*pi
    return (n*0.3+np.sin(ph)*0.4)*np.sin(pi*x/d)**1.5
def thud(f=80,d=0.35):
    x=np.arange(int(SR*d))/SR; return np.sin(2*pi*(f+60*np.exp(-x*25))*x)*np.exp(-x*12)+rng.normal(0,.2,len(x))*np.exp(-x*40)
def splash():
    x=np.arange(int(SR*0.9))/SR; return rng.normal(0,1,len(x))*np.exp(-x*5)*0.7+np.sin(2*pi*200*x)*np.exp(-x*12)*0.3
put(fx,0.1,whoosh(0.4,500,1200),0.7)
put(fx,2.6,whoosh(0.7,400,900),0.6)
put(fx,6.15,thud(),1.0)
put(fx,7.3,whoosh(0.5,900,500),0.5)
put(fx,11.15,thud(60,0.6),1.4)
put(fx,12.05,whoosh(1.4,300,1400),0.8)
put(fx,13.45,splash(),1.2)
put(fx,14.0,whoosh(0.4,800,400),0.6)
x=np.arange(int(SR*1.2))/SR; trom=np.sin(2*pi*np.cumsum(np.interp(x,[0,.3,.6,1.2],[330,300,260,150]))/SR)*np.exp(-x*2.2)
put(fx,17.4,trom,0.6)
def wr(n,a):
    a=a/(np.abs(a).max()+1e-9); w=wave.open(n,'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((a*32767).astype(np.int16).tobytes()); w.close()
wr('/tmp/_mus2.wav',mus); wr('/tmp/_fx2.wav',fx)
subprocess.run(['ffmpeg','-y','-loglevel','error','-i','voz/voz.mp3','-i','/tmp/_mus2.wav','-i','/tmp/_fx2.wav','-filter_complex',
 '[0:a]aresample=44100,apad=whole_dur=19,asplit=2[v1][v2];[1:a]volume=-26dB[m0];[m0][v1]sidechaincompress=threshold=0.03:ratio=8:attack=5:release=250[m];[2:a]volume=-14dB[x];[v2][m][x]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,atrim=0:19',
 '-ar','44100','-b:a','192k','remotion/public/mezcla.mp3'],check=True)
print('ok')
