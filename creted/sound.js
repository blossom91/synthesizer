const mapPitch = {
    c4: 261.63,
    d4: 293.66,
    e4: 329.63,
    f4: 349.23,
    g4: 392,
    a4: 440,
    b4: 493.88,

    b3: 246.94,
    a3: 220,
    g3: 196,
    f3: 174.61,
    e3: 164.81,
    d3: 146.83,
    c3: 130.81,
    b2: 123.47,
    a2: 110,
};

const getAudioData = function (music, ms) {
    var list = music.split('\n');
    var freqs = [];
    for (let e of list) {
        var array = e.trim().replace(/\|/g, '').split(' ');
        for (let n of array) {
            n = n.trim();
            if (n != '') {
                if (n.indexOf('*') != -1) {
                    var s = n.split('*');
                    freqs.push([mapPitch[s[0]], Number(ms * s[1])]);
                } else {
                    freqs.push([mapPitch[n], Number(ms)]);
                }
            }
        }
    }
    return freqs;
};

// adsr 调节音色
const adsrTans = function (data, a, d, s, r) {
    var len = data.length;
    var al = Number(len * a);
    var dl = al + Number(len * d);
    var sl = dl + Number(len * s);
    var rl = sl + Number(len * r);
    var f3 = 0.8;

    for (var i = 0; i < al; i += 1) {
        var f1 = i / (al - 1);
        data[i] = data[i] * f1;
    }

    for (var i = al; i < dl; i += 1) {
        var f2 = 1 - ((i - al) / (dl - al - 1)) * (1 - f3);
        data[i] = data[i] * f2;
    }

    for (var i = dl; i < sl; i += 1) {
        data[i] = data[i] * f3;
    }

    for (var i = sl; i < rl; i += 1) {
        var f4 = (1 - (i - sl) / (rl - sl - 1)) * f3;
        data[i] = data[i] * f4;
    }

    data.forEach((e, i) => {
        data[i] = Number(data[i]);
    });
    return data;
};

const frequency = function (f, samplingRate = 2000, ms = 500) {
    var n = Number(samplingRate / f);
    var numberOfSamples = Number(samplingRate * (ms / 1000));
    var samples = [];
    for (var i = 0; i < numberOfSamples; i += 1) {
        var index = i % n;

        var x = 2 * Math.PI * (index / (n - 1));
        // -1 1 不符合1字节表示  做一个 0 - 255 的映射换算
        x = (Math.sin(x) + 1) / 2;
        var sampleValue = Number(x * 255);

        samples.push(sampleValue);
    }

    return samples;
};

// 加入谐波合成
const frequencyMerge = function (f, samplingRate = 2000, ms = 500) {
    var bases = frequency(f, samplingRate, ms);

    var list1 = frequency(f * 8, samplingRate, ms);

    var list2 = frequency(f * 4, samplingRate, ms);

    var list3 = frequency(f * 7, samplingRate, ms);
    var newSamples = [];
    for (let i = 0; i < bases.length; i++) {
        const e = bases[i];
        var newSample = e * 0.6 + list1[i] * 0.25 + list2[i] * 0.1 + list3[i] * 0.05;
        newSamples.push(Number(newSample));
    }

    return newSamples;
};

module.exports.createPcmData = function (music, samplingRate, ms = 250) {
    const freqs = getAudioData(music, ms);
    var samples = [];
    for (let e of freqs) {
        var newSamples = frequencyMerge(e[0], samplingRate, e[1]);
        var list = adsrTans(newSamples, 0.02, 0.26, 0.39, 0.33);
        samples.push(...list);
    }
    return samples;
};
