# Mezcla: voz George + música synth (-26 dB) + efectos. Salida remotion/public/mezcla.mp3
import numpy as np, wave, subprocess
SR=44100; DUR=10.0
rng=np.random.default_rng(3)
N=int(SR*DUR); t=np.arange(N)/SR
def tone(f,d,env=None):
    x=np.arange(int(SR*d))/SR; y=np.sin(2*np.pi*f*x)
    return y*(np.exp(-x*6) if env is None else env)
mus=np.zeros(N)
# música alegre/traviesa 120 bpm: bajo + pluck
bpm=120; beat=60/bpm
bass=[110,110,147,98]; mel=[440,523,587,523,440,392,440,330]
for b in range(int(DUR/beat)):
    i=int(b*beat*SR)
    f=bass[(b//2)%4]; y=tone(f,beat*0.9)*0.5
    mus[i:i+len(y)]+=y[:N-i]
    if b%2==1:
        y=tone(mel[b%8],beat*0.5)*0.35; mus[i:i+len(y)]+=y[:N-i]
    if b%1==0:
        h=rng.normal(0,1,int(SR*0.04))*np.exp(-np.arange(int(SR*0.04))/SR*90)*0.15
        j=i+int(beat/2*SR); mus[j:j+len(h)]+=h[:N-j]
fx=np.zeros(N)
def add(at,y,g=1.0):
    i=int(at*SR); fx[i:i+len(y)]+=y[:N-i]*g
def whoosh(d,f0,f1):
    x=np.arange(int(SR*d))/SR; n=rng.normal(0,1,len(x))
    from math import pi
    ph=np.cumsum(np.linspace(f0,f1,len(x)))/SR*2*pi
    return (n*0.25+np.sin(ph)*0.5)*np.sin(np.pi*x/d)**1.5
add(0.15,whoosh(1.8,300,1400),0.9)           # avión
def gulp(): 
    x=np.arange(int(SR*0.35))/SR; f=np.linspace(300,70,len(x)); return np.sin(np.cumsum(f)/SR*2*np.pi)*np.exp(-x*7)
add(1.95,gulp(),1.2)
add(2.7,whoosh(0.35,900,300),0.7)            # tarjeta
for c in [3.9,4.4,4.9,5.35,5.8,6.2,6.6,7.0]:
    add(c-0.25,whoosh(0.5,500,900),0.45)
    x=np.arange(int(SR*0.12))/SR; add(c+0.35,np.sin(2*np.pi*(180+rng.integers(0,80))*x)*np.exp(-x*30)+rng.normal(0,.3,len(x))*np.exp(-x*40),0.9)  # crunch
for k,f in enumerate([660,880,1320]): add(8.15+k*0.08,tone(f,0.5),0.5)  # ding final
def wr(n,a):
    a=a/ (np.abs(a).max()+1e-9); w=wave.open(n,'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((a*32767).astype(np.int16).tobytes()); w.close()
wr('/tmp/_mus.wav',mus); wr('/tmp/_fx.wav',fx)
subprocess.run(['ffmpeg','-y','-loglevel','error','-i','voz/voz.mp3','-i','/tmp/_mus.wav','-i','/tmp/_fx.wav','-filter_complex',
 '[0:a]aresample=44100,apad=whole_dur=10,asplit=2[v1][v2];[1:a]volume=-26dB[m0];[m0][v1]sidechaincompress=threshold=0.03:ratio=8:attack=5:release=250[m];[2:a]volume=-14dB[x];[v2][m][x]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,atrim=0:10',
 '-ar','44100','-b:a','192k','remotion/public/mezcla.mp3'],check=True)
print('ok')
