class Synthesizer {
    constructor() {
        this.context = new AudioContext();
        this.analyser = this.context.createAnalyser();
        this.audios = [];
    }

    setWave(osc) {
        let context = this.context;
        let wave_type = 'sine';
        let ws = _es('.wave-type');
        for (let i = 0; i < ws.length; i++) {
            if (ws[i].checked) {
                wave_type = ws[i].value;
                break;
            }
        }
        console.log('wave_type', wave_type);
        if (wave_type == 'custom') {
            let h = _e('#id-harmonic');
            let hs = h.value.split(',');
            hs.unshift(0);
            let imag = new Float32Array(hs);
            let real = new Float32Array(imag.length);
            let wave = context.createPeriodicWave(real, imag);
            osc.setPeriodicWave(wave);
        } else {
            osc.type = wave_type;
        }
    }

    keyPressed(index, f) {
        let context = this.context;
        let osc = context.createOscillator();
        let envelope = context.createGain();
        this.audios[index] = {
            osc: osc,
            envelope: envelope,
        };

        osc.frequency.setValueAtTime(f, context.currentTime);

        this.setWave(osc);

        osc.connect(envelope);
        // envelope.connect(context.destination);
        // 经过analyser通道 方便数据可视化
        envelope.connect(this.analyser);
        this.analyser.connect(context.destination);

        let a = adsrDict.a / 100;
        let d = adsrDict.d / 100;
        let s = adsrDict.sa / 150;
        const t0 = context.currentTime;

        osc.start(t0);

        envelope.gain.setValueAtTime(0, t0);
        // attack 阶段 linearRampToValueAtTime 线性变化
        const t1 = t0 + a;
        envelope.gain.linearRampToValueAtTime(1, t1);
        // decay 阶段
        const t2 = t1 + d;
        envelope.gain.linearRampToValueAtTime(s, t2);
        // envelope.gain.setTargetAtTime(s / 100, t1, t2)
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/linearRampToValueAtTime
    keyReleased(index) {
        let r = adsrDict.r / 100;
        let context = this.context;
        if (!this.audios[index]) {
            return;
        }
        let envelope = this.audios[index].envelope;
        let osc = this.audios[index].osc;
        // 进入 release 阶段
        const t = context.currentTime;
        envelope.gain.cancelScheduledValues(t);
        envelope.gain.setValueAtTime(envelope.gain.value, t);
        const t3 = t + r;
        envelope.gain.linearRampToValueAtTime(0, t3);
        osc.stop(t3);
    }

    // mdn demo 代码  https://developer.mozilla.org/zh-CN/docs/Web/API/BaseAudioContext/createAnalyser
    draw() {
        let analyser = this.analyser;
        let canvas = document.getElementById('id-canvas2');
        let canvasCtx = canvas.getContext('2d');
        analyser.fftSize = 2048;
        let bufferLength = analyser.frequencyBinCount;
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        let dataArray = new Float32Array(bufferLength);
        analyser.getFloatTimeDomainData(dataArray);
        var step = Math.ceil(dataArray.length / canvas.width);
        var amp = canvas.height / 2;
        for (var i = 0; i < canvas.width; i++) {
            var min = 1.0;
            var max = -1.0;
            for (var j = 0; j < step; j++) {
                var datum = dataArray[i * step + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            canvasCtx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
        }
        // let dataArray = new Uint8Array(bufferLength);
        // analyser.getByteTimeDomainData(dataArray);
        //   canvasCtx.fillStyle = 'rgb(200, 200, 200)';
        //   canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        //
        //   canvasCtx.lineWidth = 2;
        //   canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
        //
        //   canvasCtx.beginPath();
        //
        //   let sliceWidth = canvas.width * 1.0 / bufferLength;
        //   let x = 0;
        //
        //   for (let i = 0; i < bufferLength; i++) {
        //
        //     let v = dataArray[i] / 128.0;
        //     let y = v * canvas.height / 2;
        //
        //     if (i === 0) {
        //       canvasCtx.moveTo(x, y);
        //     } else {
        //       canvasCtx.lineTo(x, y);
        //     }
        //
        //     x += sliceWidth;
        //   }
        //
        //   canvasCtx.lineTo(canvas.width, canvas.height / 2);
        //   canvasCtx.stroke();

        requestAnimationFrame(() => {
            this.draw();
        });
    }
}
