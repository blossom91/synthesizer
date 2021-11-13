// 影响不同乐器音色的因素，除了谐波外，其实更重要的是 ADSR

// ADSR 讲的是乐器发声的 4 个阶段，以钢琴为例
// Attack      按键触发声音阶段，会达到音量最大值
// Decay       音量从最大值开始往下降低
// Sustain     没有松开按键，音量维持
// Release     松开按键，音量下降到 0

// 假设一个音符声音时长为 0.25s（我们的四分音符）
// 采样精度是 8bit（0-255）

// 假设
// A 阶段是 0.1，那么前 10% 的样本要乘以系数 f1，f1 从 0 到 1 均匀增长
// D 阶段是 0.2，那么接下来的 20% 样本要乘以系数 f2，f2 从 1 到 0.7 均匀降低（这里的 0.7 是我们假设规定的）
// S 阶段是 0.5，那么接下来的 50% 样本要乘以系数 f3=0.7（Decay 阶段结束的值）
// R 阶段是 0.2，那么接下来的 20% 样本要乘以系数 f4，f4 从 f3 到 0 均匀降低

// 详见下图
// 注意下图里的 piano sound 的波形是比一个完整的音符长的，一个完整的音符是 A 开始 R 结束
// https://www.audiolabs-erlangen.de/resources/MIR/FMP/data/C1/FMP_C1_F22a-23.png

// 不同的乐器有不同的 ADSR 也就产生了不同的音色

// 这种程序叫做 “synthesizer” 合成器
const fs = require('fs');
const createPcmData = require('./sound.js').createPcmData;

const numTransLittle = function (num, len = 1) {
    // 小端序 低字节放到低位 高字节放到高位
    let array = [];
    for (let i = 0; i < len; i += 1) {
        let n = (num >> (8 * i)) & 0xff;
        array.push(n);
    }
    return Buffer.from(array);
};

// https://zh.wikipedia.org/wiki/WAV  维基百科格式说明  采用小端序
const createHeadFile = function (audioData, samplingRate) {
    const audioLength = Number(audioData.length);

    // 数据类型
    const audioType = 1;
    // 声道
    const numChannels = 1;
    // 采样位数
    const bitsPerSample = 8;

    // 第一段
    let h1 = ['R', 'I', 'F', 'F'];
    let heads = Buffer.from([]);
    for (let e of h1) {
        const b = Buffer.from(e, 'utf-8');
        heads = Buffer.concat([heads, b], heads.length + b.length);
    }

    // 数据长度+固定值36
    let h2 = numTransLittle(audioLength + 36, 4);
    heads = Buffer.concat([heads, h2], heads.length + h2.length);

    let h3 = ['W', 'A', 'V', 'E'];
    for (let e of h3) {
        const b = Buffer.from(e, 'utf-8');
        heads = Buffer.concat([heads, b], heads.length + b.length);
    }

    // 第二段
    let f1 = ['f', 'm', 't', ' '];
    for (let e of f1) {
        const b = Buffer.from(e, 'utf-8');
        heads = Buffer.concat([heads, b], heads.length + b.length);
    }

    // 第二段数据长度 固定值16
    let f2 = numTransLittle(16, 4);
    heads = Buffer.concat([heads, f2], heads.length + f2.length);

    // 数据类型 固定值 1
    let f3 = numTransLittle(audioType, 2);
    heads = Buffer.concat([heads, f3], heads.length + f3.length);

    // 声道数
    let f4 = numTransLittle(numChannels, 2);
    heads = Buffer.concat([heads, f4], heads.length + f4.length);

    // 采样率
    let f5 = numTransLittle(samplingRate, 4);
    heads = Buffer.concat([heads, f5], heads.length + f5.length);

    // 比特率
    let f6 = numTransLittle(Number((samplingRate * bitsPerSample * numChannels) / 8), 4);
    heads = Buffer.concat([heads, f6], heads.length + f6.length);

    // 数据块的对齐单位，声道数 * 采样位数 / 8
    let f7 = numTransLittle(Number((numChannels * bitsPerSample) / 8), 2);
    heads = Buffer.concat([heads, f7], heads.length + f7.length);

    // 表示每个采样样本的位数【采样位数】
    let f8 = numTransLittle(bitsPerSample, 2);
    heads = Buffer.concat([heads, f8], heads.length + f8.length);

    // 第三段
    let m1 = ['d', 'a', 't', 'a'];
    for (let e of m1) {
        const b = Buffer.from(e, 'utf-8');
        heads = Buffer.concat([heads, b], heads.length + b.length);
    }

    // 音频音频长度
    let m2 = numTransLittle(Number((audioLength * numChannels * bitsPerSample) / 8), 4);
    heads = Buffer.concat([heads, m2], heads.length + m2.length);

    // 最终的音频数据
    let m3 = Buffer.from(audioData);
    heads = Buffer.concat([heads, m3], heads.length + m3.length);
    return heads;
};

const hightPcm = function (samplingRate, ms) {
    let str = `e4 e4 f4 g4 | g4 f4 e4 d4 | c4 c4 d4 e4 | e4*1.5 d4*0.5 d4*2
    e4 e4 f4 g4 | g4 f4 e4 d4 | c4 c4 d4 e4 | d4*1.5 c4*0.5 c4*2
    d4 d4 e4 c4 | d4 e4*0.5 f4*0.5 e4 c4 | d4 e4*0.5 f4*0.5 e4 d4 | c4 d4 g3 e4
    e4 e4 f4 g4 | g4 f4 e4 d4 | c4 c4 d4 e4 | d4*1.5 c4*0.5 c4*2
    d4 d4 e4 c4 | d4 e4*0.5 f4*0.5 e4 c4 | d4 e4*0.5 f4*0.5 e4 d4 | c4 d4 g3 e4
    e4 e4 f4 g4 | g4 f4 e4 d4 | c4 c4 d4 e4 | d4*1.5 c4*0.5 c4*2`;

    const data = createPcmData(str, samplingRate, ms);
    return data;
};

const lowPcm = function (samplingRate, ms) {
    let str = `g3 a3 | b3 g3 | e3 f3 | g3 f3
    g3 a3  | b3 g3 | e3 d3 | g3 e3
    f3 g3 | f3 g3 | f3 g3 | e3 b2*0.5 g3*0.5
    g3 a3 | b3 g3 | e3 f3 | g3 e3
    f3 g3 | f3 g3 | f3 g3 | e3 b2*0.5 g3*0.5
    g3 a3 | b3 g3 | e3 f3 | g3 e3
    `;
    const data = createPcmData(str, samplingRate, ms);
    return data;
};

const channel = function (list, list2) {
    let array = [];
    list.forEach((e, i) => {
        array.push(list2[i]);
        array.push(e);
    });
    return array;
};

const mixer = function (list, list2) {
    let array = [];
    list.forEach((e, i) => {
        let n = Number((e + list2[i]) / 2);
        array.push(n);
    });

    return array;
};

const __main = function () {
    const samplingRate = 44100;
    const hightData = hightPcm(samplingRate, 250);
    const lowData = lowPcm(samplingRate, 500);

    const data = mixer(hightData, lowData);
    // const data = channel(hightData, lowData);
    const wav = createHeadFile(data, samplingRate);
    fs.writeFile('wave.wav', wav, 'binary', function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log('The file was saved!');
        }
    });
};

__main();
