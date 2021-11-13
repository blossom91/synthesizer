const log = console.log.bind(console);

const _e = sel => document.querySelector(sel);

const _es = sel => document.querySelectorAll(sel);

const bind = (selector, eventName, callback) => {
    let element = _e(selector);
    element.addEventListener(eventName, callback);
};

const bindAll = (selector, eventName, callback) => {
    let elements = _es(selector);
    for (let i = 0; i < elements.length; i++) {
        let e = elements[i];
        e.addEventListener(eventName, callback);
    }
};

const sleep = time => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
};

const tansPcm = (music, ms = 250) => {
    var list = music.split('\n');
    var freqs = [];
    for (let e of list) {
        var array = e.trim().replace(/\|/g, '').split(' ');
        for (let n of array) {
            n = n.trim();
            if (n != '') {
                if (n.indexOf('*') != -1) {
                    var s = n.split('*');
                    freqs.push([s[0], Number(ms * s[1])]);
                } else {
                    freqs.push([n, Number(ms)]);
                }
            }
        }
    }
    return freqs;
};

const appendHtml = (element, html) => element.insertAdjacentHTML('beforeend', html);
