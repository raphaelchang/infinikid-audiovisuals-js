let objSize = 15;
let alpha = 225;
let sizeJitter = 8;
let buffer = 20;
let glowAmount = 80;
let shiftAmount = 200;
let extraWhite = 15;
let lightPulse = 120;
let sizePulse = 2;
let lightPulseDecay = 0.82;
let sizePulseDecay = 0.8;
let lineAlpha = 1;
let bgStarDensity = 5;
let historyLength = 1;
let bpm = 128;
let ridgeLayers = 3;
let ridgeHeightRatio = 5;
let ridgeTopColor = "#0E2C39";//"#223443";//"#BCCEDD";
let ridgeBottomColor = "#111111";//"#7E9CB9";
let ridgeStep = 8;
let ridgeAmplitude = 150;
let ridgeZoom = 0.005;
let scrollSpeed = 0.02;
let F = 8 * 60 / bpm;
let Z = 0.4;
let R = 0.5;
let fr = 60;
let useShader = true;

let maxStarHeight;
let pulseAddWhite = 0;
let pulseScaleSize = 1;
let pulseAddSize = 1;
let palette;
let colors = [];
let choice = 0;
let objects = [];

let port = 8081;
let socket;
let canv;
let bgGraphics;
let bgGradient;
let gl;
let glblurH;
let glblurV;
let sh;
let blurH;
let blurV;
let posTex;
let colTex;
let sizeTex;

let oscHandler;
let playing = false;
let currentF5ame = 0;
let capturer;

p5.disableFriendlyErrors = true;

class SecondOrderSystem {
    constructor(f, z, r, x0) {
        this.k1 = z / (PI * f);
        this.k2 = 1 / (2 * PI * f * (2 * PI * f));
        this.k3 = (r * z) / (2 * PI * f);
        this.xp = x0.slice(0);
        this.y = x0.slice(0);
        this.yd = new Array(x0.length).fill(0);

        this.lastTime = millis();
    }

    update(x) {
        let t = millis();
        let T = (t - this.lastTime) / 1000;
        if (T == 0) T = 0.001;
        for (let i = 0; i < this.y.length; i++) {
            let xd = (x[i] - this.xp[i]) / T;

            this.y[i] = this.y[i] + T * this.yd[i];
            let k2Stable = max(this.k2, 1.1 * ((T * T) / 4 + (T * this.k1) / 2));
            this.yd[i] =
                this.yd[i] +
                (T * (x[i] + this.k3 * xd - this.y[i] - this.k1 * this.yd[i])) /
                k2Stable;
        }
        this.xp = x.slice(0);
        this.lastTime = t;

        return this.y;
    }

    getState() {
        return this.y;
    }

    setParams(f, z, r) {
        this.k1 = z / (PI * f);
        this.k2 = 1 / (2 * PI * f * (2 * PI * f));
        this.k3 = (r * z) / (2 * PI * f);
    }
}

class Node {
    constructor(f, z, r, x0, target, size, color, historyLength) {
        this.sys = new SecondOrderSystem(f, z, r, x0);
        this.color = color;
        this.size = size;
        this.target = target.slice(0);
        this.history = [];
        this.historyLength = historyLength;
    }

    update(x) {
        let y = this.sys.update(this.target);
        this.history.push(y.slice(0));
        while (this.history.length > this.historyLength) {
            this.history.shift();
        }
        return y;
    }

    getState() {
        return this.sys.getState();
    }

    setParams(f, z, r) {
        this.sys.setParams(f, z, r);
    }
}

function createGradient(w, h, colorTop, colorBottom) {
    let pg = createGraphics(w, h, WEBGL);
    updateGradient(pg, colorTop, colorBottom);
    return pg;
}

function updateGradient(pg, colorTop, colorBottom) {
    pg.push();
    pg.translate(-pg.width/2, -pg.height/2);
    pg.noStroke();
    pg.beginShape();
    pg.fill(colorTop);
    pg.vertex(0, 0);
    pg.vertex(pg.width, 0);
    pg.fill(colorBottom);
    pg.vertex(pg.width, pg.height);
    pg.vertex(0, pg.height);
    pg.endShape();
    pg.pop();
}

function preload() {
    table = loadTable("colors.csv", "csv", "header");
    sh = loadShader('shader.vert', 'shader.frag');
    blurH = loadShader('shader.vert', 'blur.frag');
    blurV = loadShader('shader.vert', 'blur.frag');
}

function setup() {
    frameRate(fr);
    canv = createCanvas(windowWidth, windowHeight);
    pixelDensity(1);
    bgGraphics = createGraphics(width, height);
    bgGradient = createGradient(300, 300, color(0, 0, 0), color(20, 50, 80));
    bgGraphics.background(255);
    if (useShader) {
        gl = createGraphics(width, height, WEBGL);
        gl.shader(sh);
        glblurH = createGraphics(width, height, WEBGL);
        glblurH.shader(blurH);
        glblurV = createGraphics(width, height, WEBGL);
        glblurV.shader(blurV);
        //posTex = createImage(1, 1);
        colTex = createImage(1, 1);
        sizeTex = createImage(1, 1);
    }

    maxStarHeight = height * ((ridgeHeightRatio - 1) / ridgeHeightRatio) + height / ridgeHeightRatio / ridgeLayers;

    noStroke();

    // slider = createSlider(1, 500, 4, 1);
    // slider.position(10, 10);
    // slider.style("width", "1000px");
    // slider.input(function() { updateCount(slider.value()); });

    // refreshTargets();
    refreshPalette();
    updateCount(1);

    oscHandler = new OSCHandler();
    registerOscCallbacks();
    oscHandler.setPlaybackFrameRate(fr);
    capturer = new CCapture({format: 'png', framerate: fr});
    socket = new osc.WebSocketPort({
        url: 'ws://localhost:' + port
    });
    socket.on('message', oscHandler.handleOsc.bind(oscHandler));
    socket.open();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    bgGraphics = createGraphics(width, height);
    bgGraphics.background(255);
    maxStarHeight = height * ((ridgeHeightRatio - 1) / ridgeHeightRatio) + height / ridgeHeightRatio / ridgeLayers;
}

function updateCount(count) {
    if (count == 0) count = 1;
    objects = objects.filter((item, index) => {
        return index >= 0 && index < count;
    });
    for (let i = 0; i < count; i++) {
        if (i >= objects.length || typeof objects[i] === "undefined") {
            let target = [
                random(buffer, width - buffer),
                random(buffer, maxStarHeight - buffer),
            ];
            objects[i] = new Node(
                F,
                Z,
                R,
                i == 0 ? target : objects[i - 1].getState(),
                target,
                objSize + (i > 0 ? random(-sizeJitter, sizeJitter) : sizeJitter),
                floor(random(5)),
                historyLength
            );
        }
    }
}

function updateSystemParams(f, z, r) {
    for (let i = 0; i < objects.length; i++) {
        objects[i].setParams(f, z, r);
    }
}

function refreshTargets(rand = true) {
    for (let i = 0; i < objects.length; i++) {
        if (rand) {
            objects[i].target = [
                random(buffer, width - buffer),
                random(buffer, maxStarHeight - buffer),
            ];
        } else {
            objects[i].target = [
                constrain(
                    objects[i].target[0] +
                    random(
                        max(-shiftAmount, -objects[i].target[0]),
                        min(shiftAmount, width - objects[i].target[0])
                    ),
                    0,
                    width
                ),
                constrain(
                    objects[i].target[1] +
                    random(
                        max(-shiftAmount, -objects[i].target[1]),
                        min(shiftAmount, maxStarHeight - objects[i].target[1])
                    ),
                    0,
                    maxStarHeight
                ),
            ];
        }
    }
}

function refreshPalette() {
    palette = [
        617,
        632,
        392,
        292,
        225,
        633,
        276,
        260,
        236,
        278,
        5,
        354,
        253,
        126,
        296,
    ];
    palette = floor(random(676)); //398, 617, 632, 392, 292, 225, 633, 276, 260, 236, 278, 5, 354, 253, 126, 296
    //palette = [632, 296];
    //palette = [276];
    //palette = palette[choice++ % palette.length];
    //console.log(palette);

    for (let i = 0; i < objects.length; i++) {
        objects[i].color = floor(random(5));
    }
}

function draw() {
    if (playing) {
        if (currentFrame == 0) {
            capturer.start();
        }
        oscHandler.playbackIncrement();
    }

    background(0);
    image(bgGradient, 0, 0, width, maxStarHeight);

    bgGraphics.background(0, 0, 0, 20);
    bgGraphics.noStroke();

    for (let i = 0; i < bgStarDensity; i++) {
        var galaxy = {
            locationX : random(width),
            locationY : random(maxStarHeight),
            size : random(1,5)
        }
        bgGraphics.ellipse(galaxy.locationX, galaxy.locationY, galaxy.size, galaxy.size);
    }
    blendMode(ADD);
    image(bgGraphics, 0, 0);
    blendMode(BLEND);

    drawingContext.save();
    let locs = [];
    let lastX, lastY;
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = color(255, 255, 255);
    for (let i = 0; i < objects.length; i++) {
        if (typeof objects[i] === "undefined") continue;
        objects[i].historyLength = historyLength;
        let loc = objects[i].update();
        locs[i] = loc;

        if (i > 0 && lineAlpha > 0) {
            stroke(255, 255, 255, lineAlpha * 255);
            strokeWeight(0.5);
            line(lastX, lastY, loc[0], loc[1]);
            noStroke();
        }
        lastX = loc[0];
        lastY = loc[1];
    }

    //drawingContext.filter = 'blur(5px); -webkit-filter: blur(5px)';
    drawingContext.shadowBlur = 0;
    for (let i = 0; i < objects.length; i++) {
        if (typeof objects[i] === "undefined") continue;
        let col = objects[i].color;
        r = Number(table.get(palette, col * 3)) + extraWhite + pulseAddWhite;
        g = Number(table.get(palette, col * 3 + 1)) + extraWhite + pulseAddWhite;
        b = Number(table.get(palette, col * 3 + 2)) + extraWhite + pulseAddWhite;
        let history = objects[i].history;
        for (let j = 0; j < history.length - 1; j++) {
            fill(r, g, b, alpha / 2 * (j / history.length));
            ellipse(history[j][0], history[j][1], objects[i].size, objects[i].size);
        }
    }
    if (useShader) {
        //posTex.resize(objects.length, 1);
        colTex.resize(objects.length, 1);
        sizeTex.resize(objects.length, 1);

        //posTex.loadPixels();
        //for (let x = 0; x < posTex.width; x++) {
        //    posTex.pixels[x * 4 + 0] = 255 * locs[x][0] / width;
        //    posTex.pixels[x * 4 + 1] = 255 * (1. - locs[x][1] / height);
        //    posTex.pixels[x * 4 + 2] = 255;
        //    posTex.pixels[x * 4 + 3] = 255;
        //}
        //posTex.updatePixels();

        colTex.loadPixels();
        for (let x = 0; x < colTex.width; x++) {
            let col = objects[x].color;
            r = Number(table.get(palette, col * 3)) + extraWhite + pulseAddWhite;
            g = Number(table.get(palette, col * 3 + 1)) + extraWhite + pulseAddWhite;
            b = Number(table.get(palette, col * 3 + 2)) + extraWhite + pulseAddWhite;
            r = constrain(r, 0, 255);
            g = constrain(g, 0, 255);
            b = constrain(b, 0, 255);
            colTex.pixels[x * 4 + 0] = r;
            colTex.pixels[x * 4 + 1] = g;
            colTex.pixels[x * 4 + 2] = b;
            colTex.pixels[x * 4 + 3] = alpha;
        }
        colTex.updatePixels();

        sizeTex.loadPixels();
        for (let x = 0; x < sizeTex.width; x++) {
            let size = objects[x].size * pulseScaleSize + pulseAddSize;
            sizeTex.pixels[x * 4 + 0] = Math.trunc(size / 10) * 25;
            sizeTex.pixels[x * 4 + 1] = (size % 10) / 10 * 255;
            sizeTex.pixels[x * 4 + 2] = 25;
            sizeTex.pixels[x * 4 + 3] = 255;
        }
        sizeTex.updatePixels();

        let positionData = [];
        for (let i = 0; i < objects.length; i++) {
            //positionData.push(map(locs[i][0], 0, width, 0.0, 1.0), map(locs[i][1], 0, height, 1.0, 0.0));
            positionData.push(locs[i][0], locs[i][1]);
        }

        sh.setUniform("resolution", [width, height]);
        sh.setUniform('count', objects.length);
        //sh.setUniform('positions', posTex);
        sh.setUniform('positions', positionData);
        sh.setUniform('colors', colTex);
        sh.setUniform('sizes', sizeTex);
        gl.rect(0, 0, width, height);

        blurH.setUniform('tex0', gl);
        blurH.setUniform('direction', [2., 0.]);
        blurH.setUniform('texelSize', [1.0 / width, 1.0 / height]);
        blurH.setUniform('colorScale', 1.1);
        glblurH.rect(0, 0, width, height);

        blurV.setUniform('tex0', glblurH);
        blurV.setUniform('direction', [0., 2.]);
        blurV.setUniform('texelSize', [1.0 / width, 1.0 / height]);
        blurV.setUniform('colorScale', 1.1);
        glblurV.rect(0, 0, width, height);

        blendMode(LIGHTEST);
        image(gl, 0, 0, width, height);
        blendMode(ADD);
        image(glblurV, 0, 0, width, height);
        blendMode(BLEND);
    } else {
        drawingContext.shadowBlur = glowAmount;
        for (let i = 0; i < objects.length; i++) {
            if (typeof objects[i] === "undefined") continue;
            let col = objects[i].color;
            r = Number(table.get(palette, col * 3)) + extraWhite + pulseAddWhite;
            g = Number(table.get(palette, col * 3 + 1)) + extraWhite + pulseAddWhite;
            b = Number(table.get(palette, col * 3 + 2)) + extraWhite + pulseAddWhite;
            drawingContext.shadowColor = color(r, g, b);
            fill(r, g, b, alpha);
            let size = objects[i].size * pulseScaleSize + pulseAddSize;
            ellipse(locs[i][0], locs[i][1], size, size);

            continue;

            r += lightPulse;
            g += lightPulse;
            b += lightPulse;
            drawingContext.shadowColor = color(r, g, b);
            fill(r, g, b, alpha);
            ellipse(locs[i][0], locs[i][1], size / 2, size / 2);
        }
    }
    pulseAddWhite *= lightPulseDecay;
    pulseAddSize *= sizePulseDecay;
    pulseScaleSize = 1 + (pulseScaleSize - 1) * sizePulseDecay;

    drawingContext.restore();

    fill('#010101');
    beginShape();
    for (let x = 0; x <= width; x += ridgeStep) {
        let y = maxStarHeight;
        const noisedY = noise(x, y);
        vertex(x, y - noisedY * 5);
    }
    vertex(width, height);
    vertex(0, height);
    endShape(CLOSE);
    for (let i = 0; i < ridgeLayers; i++) {
        let layerPos = (i + 1) / ridgeLayers * height / ridgeHeightRatio;

        let col = lerpColor(color(ridgeTopColor), color(ridgeBottomColor), i / (ridgeLayers - 1));
        fill(col);

        beginShape();
        for (let x = 0; x <= width + ridgeStep; x += ridgeStep) {
            let y = height * ((ridgeHeightRatio - 1) / ridgeHeightRatio) + layerPos;
            let xd = x + millis() * (i + 1) * scrollSpeed;// - width / 2;
            const noisedY = noise(xd * ridgeZoom, y);
            vertex(x, y - noisedY * ridgeAmplitude);
        }
        vertex(width, height);
        vertex(0, height);
        endShape(CLOSE);
    }

    if (playing) {
        capturer.capture(document.getElementById('defaultCanvas0'));
        currentFrame++;
    }
}

function pulse() {
    pulseAddWhite = lightPulse;
    pulseScaleSize = sizePulse;
}

function keyTyped() {
    if (key === "s") {
        refreshPalette();
    }
    if (key === "d") {
        refreshTargets(false);
    }
    if (key === "f") {
        refreshTargets(true);
    }
    if (key === "g") {
        pulse();
    }
    if (key === "p") {
        if (playing) {
            capturer.stop();
            playing = false;
            capturer.save();
            pixelDensity(displayDensity());
        } else {
            pixelDensity(1.0);
            oscHandler.playbackReset();
            currentFrame = 0;
            playing = true;
        }
    }
}

function registerOscCallbacks() {
    oscHandler.onNoteOn(0, function() { refreshTargets(true); });
    oscHandler.onNoteOn(1, function() { refreshTargets(false); });
    oscHandler.onNoteOn(2, pulse);
    oscHandler.onNoteOn(3, refreshPalette);
    oscHandler.onNoteOn(4, function() { updateCount(objects.length + 1); });
    oscHandler.onNoteOn(126, oscHandler.startRecording.bind(oscHandler));
    oscHandler.onNoteOn(127, oscHandler.stopRecording.bind(oscHandler));

    oscHandler.onChange("ParticleCount", updateCount);
    oscHandler.onChange("OscFreqRatio", function(ratio) { F = ratio * 60 / bpm; updateSystemParams(F, Z, R); });
    oscHandler.onChange("LineAlpha", function(alpha) { lineAlpha = alpha; });
    oscHandler.onChange("HistoryLength", function(length) { historyLength = length; });
}

class OSCHandler {
    constructor() {
        this.onCallbacks = {};
        this.offCallbacks = {};
        this.changeCallbacks = {};
        this.recording = false;
        this.messages = [];
        this.startTimestamp = 0;
        this.currentPlaybackFrameNumber = 0;
        this.frameRate = 30;
    }

    handleOsc(msg) {
        if (this.recording) {
            this.messages.push([msg, Date.now() - this.startTimestamp]);
        }
        let match = msg.address.match(/[a-zA-Z]+\/note_([0-9]+)/);
        if (match !== null) {
            if (msg.args[0] > 0) {
                if (match[1] in this.onCallbacks) {
                    this.onCallbacks[match[1]]();
                }
            } else if (msg.args[0] == 0) {
                if (match[1] in this.offCallbacks) {
                    this.offCallbacks[match[1]]();
                }
            }
        }
        match = msg.address.match(/[a-zA-Z]+\/([a-zA-Z]+)$/);
        if (match !== null) {
            if (match[1] in this.changeCallbacks) {
                this.changeCallbacks[match[1]](msg.args[0]);
            }
        }
    }

    onNoteOn(note, callback) {
        this.onCallbacks[note] = callback;
    }

    onNoteOff(note, callback) {
        this.offCallbacks[note] = callback;
    }

    onChange(address, callback) {
        this.changeCallbacks[address] = callback;
    }

    startRecording() {
        this.startTimestamp = Date.now();
        this.messages = [];
        this.recording = true;
    }

    stopRecording() {
        this.recording = false;
    }

    setPlaybackFrameRate(framerate) {
        this.frameRate = framerate;
    }

    playbackReset() {
        this.currentPlaybackFrameNumber = 0;
    }

    playbackIncrement() {
        if (this.recording) return;
        let currentTimeMillis = this.currentPlaybackFrameNumber * 1000.0 / this.frameRate;
        let lastTimeMillis = (this.currentPlaybackFrameNumber - 1) * 1000.0 / this.frameRate;
        for (const msg of this.messages) {
            if (msg[1] > lastTimeMillis && msg[1] <= currentTimeMillis) {
                this.handleOsc(msg[0]);
            }
        }
        this.currentPlaybackFrameNumber++;
    }
}
