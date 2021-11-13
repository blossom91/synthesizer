class Chart {
    constructor() {
        this.canvas = _e('#id-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.w = this.canvas.width;
        this.h = this.canvas.height;
        this.x0 = 20;
        this.y0 = 180;
        this.w0 = 360;
        this.h0 = 150;
        this.circles = [];
        this.drag = false;
        this.draggingElement = null;
        this.setup();
    }

    draw() {
        let ctx = this.ctx;
        let x0 = this.x0;
        let y0 = this.y0;
        let w = this.w0;
        let h = this.h0;
        // 清理画布
        ctx.clearRect(0, 0, this.w, this.h);

        let start = [x0, y0];
        // 画坐标系
        this.drawLine(start, [x0, y0 - h], 'black', 2);
        this.drawLine(start, [x0 + w, y0], 'black', 2);

        // adsr坐标计算
        let pointA1 = [x0 + adsrDict.a, y0 - h, 'a'];
        let pointD1 = [x0 + adsrDict.a + adsrDict.d, y0 - adsrDict.sa, 'd'];
        let pointS1 = [x0 + adsrDict.a + adsrDict.d + adsrDict.s, y0 - adsrDict.sa, 's'];
        let pointR1 = [x0 + w, y0, 'r'];

        this.drawLine(start, pointA1, '#ff6666');
        this.drawLine(pointA1, pointD1, '#cc9933');
        this.drawLine(pointD1, pointS1, '#66cc99');
        this.drawLine(pointS1, pointR1, '#663399');

        // 画出圆点标识
        this.circles = [pointA1, pointD1, pointS1, pointR1];
        for (let c of this.circles) {
            this.drawCircle(c);
        }

        // 改坐标展示
        let textArea = _e('#id-adsr-text');
        textArea.innerHTML = `
        a: ${adsrDict.a}<br>
        d: ${adsrDict.d}<br>
        s: ${adsrDict.s}<br>
        r: ${w - adsrDict.a - adsrDict.d - adsrDict.s}<br>
        s amplitude: ${adsrDict.sa}`;
    }

    setup() {
        let self = this;
        self.canvas.addEventListener('mousedown', function (event) {
            self.drag = true;
            let x = event.offsetX;
            let y = event.offsetY;
            let r = 5;
            log(x, y);
            for (let c of self.circles) {
                // 是否碰撞命中
                if (x > c[0] - r && x < c[0] + r && y > c[1] - r && y < c[1] + r) {
                    log('hit', c);
                    self.draggingElement = c[2];
                    break;
                }
            }
        });

        self.canvas.addEventListener('mouseup', function (event) {
            self.drag = false;
            self.draggingElement = null;
        });

        self.canvas.addEventListener('mousemove', function (event) {
            let x = event.offsetX;
            let y = event.offsetY;
            let x0 = self.x0;
            let y0 = self.y0;
            let w = self.w0;
            if (self.drag) {
                let e = self.draggingElement;
                if (e === 'a') {
                    adsrDict.a = x - x0;
                    if (adsrDict.a < 0) {
                        adsrDict.a = 0;
                    }
                    let a_max = w - adsrDict.d - adsrDict.r;
                    if (adsrDict.a > a_max) {
                        adsrDict.a = a_max;
                    }
                } else if (e === 'd') {
                    adsrDict.d = x - x0 - adsrDict.a;
                    if (adsrDict.d < 0) {
                        adsrDict.d = 0;
                    }
                    let d_max = w - adsrDict.a - adsrDict.r;
                    if (adsrDict.d > d_max) {
                        adsrDict.d = d_max;
                    }
                } else if (e === 's') {
                    adsrDict.r = w - (x - x0);
                    adsrDict.sa = y0 - y;
                    let r_max = w - adsrDict.a - adsrDict.d;
                    if (adsrDict.r < 0) {
                        adsrDict.r = 0;
                    }
                    if (adsrDict.r > r_max) {
                        adsrDict.r = r_max;
                    }
                    if (adsrDict.sa > 150) {
                        adsrDict.sa = 150;
                    }
                    if (adsrDict.sa < 0) {
                        adsrDict.sa = 0;
                    }
                }
                adsrDict.s = self.w0 - adsrDict.a - adsrDict.d - adsrDict.r;
                self.draw();
            }
        });
    }

    drawLine(p1, p2, color = 'red', lineWidth = 3) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(...p1);
        this.ctx.lineTo(...p2);
        this.ctx.stroke();
    }

    drawCircle(p1, color = 'red', r = 5, lineWidth = 2) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        this.ctx.arc(p1[0], p1[1], r, 0, 2 * Math.PI);
        this.ctx.stroke();
    }
}
