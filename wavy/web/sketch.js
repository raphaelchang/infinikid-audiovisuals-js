/* By Steve's Makerspace
   Video: https://youtu.be/_9yK32iUHm0
   See note about color table at end.
   click on canvas = new; s for jpg
   Mess with variables below.  */

const fr = 30;
let minYchange = 1; //these two ranges determine line overlap and width
let maxYchange = 50;
let layers = 3;
let pulseAmpl = 8;
let easing = 0.4;
let tightness = 0.0;
let tightnessDecay = 0.625;
let rotStripe = 0; //rotation of each stripe; try 10 or 90;
// try lines = true with high alph or lines = false with low alph (100)
let lines = true;
let alph = 192; //out of 255
let colRand = false; //true = random color; false = color from palette table
let filling = true;
let colorLines = false; //false for black lines
let sw = 0; //line width
let strokeWidth = 8;
let strokeDecay = 0.75;
let extraBlack = 0; //1 for some black line and white fills; 0 for neither; -2 for fewer colors;
let extraBlackAlph = 255; //out of 255 - used if extraBlack=1 & lines, filling, colorLines all true, low alph, high sw
let r, g, b;
let table;

let palette = -1;
let rotLayer; //layer rotation
let change1 = [];
let change2 = [];
let change3 = [];
let change4 = [];
let change5 = [];
let change6 = [];
let change1shift = [];
let change2shift = [];
let change3shift = [];
let change4shift = [];
let change5shift = [];
let change6shift = [];
let change1set = [];
let change2set = [];
let change3set = [];
let change4set = [];
let change5set = [];
let change6set = [];
let color = [];
let glitching1 = false;
let glitching2 = false;

let panX = 0;
let panY = 0;
let panXVec = 0;
let panYVec = 0;
let panRate = 2;
let panOrthogonal = false;
let randPan = true;

let port = 8081;
let socket;
let canv;

let recording = false;
let recorder;
let chunks = [];

p5.disableFriendlyErrors = true;

let goodPal = [0,2,7,8,14,16,17,19,22,34,36,37,43,46,50,60,67,70,73,75,76,77,81,86,96,97,100,104,106,112,120,123,124,127,142,144,145,147,149,153,161,163,170,172,173,179,180,89,188,194,205,209,211,217,220,228,237,244,245,249,252,253,255,259,261,262,270,274,276,281,284,285,286,295,296,302,307,308,309,314,317,318,331,340,341,344,345,347,350,352,353,361,367,372,374,377,382,383,385,388,391,395,400,403,404,407,412,421,422,423,442,455,474,476,482,488,492,493,494,495,506,510,511,514,516,517,519,522,524,534,536,537,539,547,549,556,557,558,560,561,562,570,574,576,577,589,601,617,628,630,633,637,643,644,654,659,666,667,668,669,673,674];

let lastTable = [];

let oscHandler;
let playing = false;
let currentFrame = 0;
let capturer;

function preload() {
    table = loadTable("colors.csv", "csv", "header");
}

function setup() {
    canv = createCanvas(1920,1080);
    frameRate(fr);
    record();
    oscHandler = new OSCHandler();
    registerOscCallbacks();
    oscHandler.setPlaybackFrameRate(fr);
    capturer = new CCapture({format: 'png', framerate: fr});
    socket = new osc.WebSocketPort({
        url: 'ws://localhost:' + port
    });
    socket.on('message', oscHandler.handleOsc.bind(oscHandler));
    socket.open();
    reset();
}

function reset() {
    //palette = floor(random(676));
    //let badPal = [38, 95, 121, 213, 214, 311, 435, 451, 480, 533, 538, 541, 565, 567, 586, 598, 641, 649, 664];
    //while (badPal.includes(palette)) {
    //    palette = floor(random(676));
    //}
    palette = goodPal[floor(random(goodPal.length))];
    while (table.getRow(palette).arr.toString() === lastTable.toString()) {
        palette = goodPal[floor(random(goodPal.length))];
    }
    console.log(table.getRow(palette).arr);
    console.log(palette);
    lastTable = table.getRow(palette).arr;
    rotLayer = random(359); //layer rotation
    let size = Math.max(width, height); //Math.sqrt(width * width, height * height);
    let end = size / 2 + 500; //where lines stop
    panX = panY = 0;
    sw = 0;
    tightness = 0;
    if (randPan) {
        panRot = random(359);
        panXVec = Math.cos(panRot * Math.PI / 180) * panRate;
        panYVec = Math.sin(panRot * Math.PI / 180) * panRate;
    } else {
        let rotAdd = panOrthogonal ? 90 : 0;
        panXVec = Math.cos((rotLayer + rotAdd) * Math.PI / 180) * panRate;
        panYVec = Math.sin((rotLayer + rotAdd) * Math.PI / 180) * panRate;
    }
    for (let i = 0; i < layers; i++) {
        let y1;
        if (i == 0) {
            y1 = -size / 2 - 300;
        } else {
            y1 = -size / 2 + (size / layers) * i;
        }
        change1[i] = [];
        change2[i] = [];
        change3[i] = [];
        change4[i] = [];
        change5[i] = [];
        change6[i] = [];
        change1shift[i] = [];
        change2shift[i] = [];
        change3shift[i] = [];
        change4shift[i] = [];
        change5shift[i] = [];
        change6shift[i] = [];
        change1set[i] = [];
        change2set[i] = [];
        change3set[i] = [];
        change4set[i] = [];
        change5set[i] = [];
        change6set[i] = [];
        color[i] = [];
        //starting height for each layer
        let y2 = y1,
            y3 = y1,
            y4 = y1,
            y5 = y1,
            y6 = y1;
        //keep going until all the lines are at the bottom
        let j = 0;
        while (
            (y1 < end) &
            (y2 < end) &
            (y3 < end) &
            (y4 < end) &
            (y5 < end) &
            (y6 < end) &
            (-maxYchange < minYchange)
        ) {
            change1[i][j] = random(minYchange, maxYchange);
            change2[i][j] = random(minYchange, maxYchange);
            change3[i][j] = random(minYchange, maxYchange);
            change4[i][j] = random(minYchange, maxYchange);
            change5[i][j] = random(minYchange, maxYchange);
            change6[i][j] = random(minYchange, maxYchange);
            change1shift[i][j] = 0.0;
            change2shift[i][j] = 0.0;
            change3shift[i][j] = 0.0;
            change4shift[i][j] = 0.0;
            change5shift[i][j] = 0.0;
            change6shift[i][j] = 0.0;
            change1set[i][j] = 0.0;
            change2set[i][j] = 0.0;
            change3set[i][j] = 0.0;
            change4set[i][j] = 0.0;
            change5set[i][j] = 0.0;
            change6set[i][j] = 0.0;
            y1 += change1[i][j];
            y2 += change2[i][j];
            y3 += change3[i][j];
            y4 += change4[i][j];
            y5 += change5[i][j];
            y6 += change6[i][j];

            if (colRand == false) {
                color[i][j] = floor(random(5 + extraBlack));
            }

            j++;
        }
    }
    canv.mousePressed(squirm);
}

function draw() {
    if (playing) {
        if (currentFrame == 0) {
            capturer.start();
        }
        oscHandler.playbackIncrement();
    }
    background(255);
    translate(-width / 2 + panXVec * 100 - panX, -height / 2  + panYVec * 100 - panY);
    scale(2);
    let rotAdd = panOrthogonal ? 90 : 0;
    panX += panXVec;
    panY += panYVec;
    if (panX > width / 2 || panY > height / 2) {
        panX = panY = 0;
    }
    sw *= strokeDecay;
    updateShifts();
    if (lines == true) {
        stroke(255, 255, 255, extraBlackAlph);
        strokeWeight(sw);
    } else {
        noStroke();
    }
    angleMode(DEGREES);
    curveTightness(tightness);
    tightness *= -tightnessDecay;
    let size = max(width, height);
    let end = size / 2 + 500; //where lines stop
    for (let i = 0; i < layers; i++) {
        let y1;
        if (i == 0) {
            y1 = -size / 2 - 300;
        } else {
            y1 = -size / 2 + (size / layers) * i;
        }
        //starting height for each layer
        let y2 = y1,
            y3 = y1,
            y4 = y1,
            y5 = y1,
            y6 = y1;
        let rotThisStripe = 0;
        //keep going until all the lines are at the bottom
        let j = 0;
        while (
            (y1 < end) &
            (y2 < end) &
            (y3 < end) &
            (y4 < end) &
            (y5 < end) &
            (y6 < end) &
            (-maxYchange < minYchange)
        ) {
            y1 += change1[i][j] + change1shift[i][j];
            y2 += change2[i][j] + change2shift[i][j];
            y3 += change3[i][j] + change3shift[i][j];
            y4 += change4[i][j] + change4shift[i][j];
            y5 += change5[i][j] + change5shift[i][j];
            y6 += change6[i][j] + change6shift[i][j];
            if (colRand == true) {
                r = random(256);
                g = random(256);
                b = random(256);
            } else {
                let col = color[i][j]
                r = table.get(palette, col * 3);
                g = table.get(palette, col * 3 + 1);
                b = table.get(palette, col * 3 + 2);
            }
            if (filling == true) {
                fill(r, g, b, alph);
            } else {
                noFill();
            }
            if (colorLines == true) {
                stroke(r, g, b, alph);
            }
            if (!glitching1 || random() > 0.5) {
                push();
                translate(size / 2, size / 2);
                rotThisStripe += rotStripe; //rotating after each stripe
                rotate(rotThisStripe + rotLayer);
                let xStart = -size / 2;
                beginShape();
                curveVertex(xStart - 300, size / 2 + 500);
                curveVertex(xStart - 300, y1);
                curveVertex(xStart + (size / 5) * 1, y2);
                curveVertex(xStart + (size / 5) * 2, y3);
                curveVertex(xStart + (size / 5) * 3, y4);
                curveVertex(xStart + (size / 5) * 4, y5);
                curveVertex(size / 2 + 300, y6);
                curveVertex(size / 2 + 300, size / 2 + 500);
                endShape(CLOSE);
                pop();
            }
            j++;
        }
    }
    if (glitching2)
    {
        createFibers();
    }

    if (playing) {
        capturer.capture(document.getElementById('defaultCanvas0'));
        currentFrame++;
    }
}

function record() {
    chunks.length = 0;

    let stream = document.querySelector('canvas').captureStream(fr);

    recorder = new MediaRecorder(stream);

    recorder.ondataavailable = e => {
        if (e.data.size) {
            chunks.push(e.data);
        }
    };

    recorder.onstop = exportVideo;
}

function exportVideo(e) {
    var blob = new Blob(chunks, { 'type' : 'video/webm;codecs=vp8' });

    // Draw video to screen
    var videoElement = document.createElement('video');
    videoElement.setAttribute("id", Date.now());
    videoElement.controls = true;
    document.body.appendChild(videoElement);
    videoElement.src = window.URL.createObjectURL(blob);

    // Download the video
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    document.body.appendChild(a);
    a.style = 'display: none';
    a.href = url;
    a.download = 'newVid.webm';
    a.click();
    window.URL.revokeObjectURL(url);
}

function createFibers(){
    colorMode(HSB);
    let numFibers = 3000;
    for (let i=0; i<numFibers; i++){
        let x1 = random() * width;
        let y1 = random() * height;
        let theta = random() * 2 * Math.PI;
        let segmentLength = random() * 5 + 2;
        let x2 = cos(theta) * segmentLength + x1;
        let y2 = sin(theta) * segmentLength + y1;
        stroke(
            15,
            10-random() * 5,
            100-random() * 8,
            random() * 10 + 75
        )
        line(x1, y1, x2, y2);
    }
    colorMode(RGB);
}

function updateShifts() {
    for (let i = 0; i < layers; i++) {
        for (j = 0; j < change1shift[i].length; j++) {
            let dy = change1set[i][j] - change1shift[i][j];
            change1shift[i][j] += dy * easing;
        }
        for (j = 0; j < change2shift[i].length; j++) {
            let dy = change2set[i][j] - change2shift[i][j];
            change2shift[i][j] += dy * easing;
        }
        for (j = 0; j < change3shift[i].length; j++) {
            let dy = change3set[i][j] - change3shift[i][j];
            change3shift[i][j] += dy * easing;
        }
        for (j = 0; j < change4shift[i].length; j++) {
            let dy = change4set[i][j] - change4shift[i][j];
            change4shift[i][j] += dy * easing;
        }
        for (j = 0; j < change5shift[i].length; j++) {
            let dy = change5set[i][j] - change5shift[i][j];
            change5shift[i][j] += dy * easing;
        }
        for (j = 0; j < change6shift[i].length; j++) {
            let dy = change6set[i][j] - change6shift[i][j];
            change6shift[i][j] += dy * easing;
        }
    }
}

function squirm() {
    for (let i = 0; i < layers; i++) {
        let y = pulseAmpl;
        for (j = 0; j < change1set[i].length; j++) {
            change1set[i][j] = random(-pulseAmpl, pulseAmpl);
            change1set[i][j] = max(-change1[i][j], change1set[i][j]);
        }
        for (j = 0; j < change2set[i].length; j++) {
            change2set[i][j] = random(-pulseAmpl, pulseAmpl);
            change2set[i][j] = max(-change2[i][j], change2set[i][j]);
        }
        for (j = 0; j < change3set[i].length; j++) {
            change3set[i][j] = random(-pulseAmpl, pulseAmpl);
            change3set[i][j] = max(-change3[i][j], change3set[i][j]);
        }
        for (j = 0; j < change4set[i].length; j++) {
            change4set[i][j] = random(-pulseAmpl, pulseAmpl);
            change4set[i][j] = max(-change4[i][j], change4set[i][j]);
        }
        for (j = 0; j < change5set[i].length; j++) {
            change5set[i][j] = random(-pulseAmpl, pulseAmpl);
            change5set[i][j] = max(-change5[i][j], change5set[i][j]);
        }
        for (j = 0; j < change6set[i].length; j++) {
            change6set[i][j] = random(-pulseAmpl, pulseAmpl);
            change6set[i][j] = max(-change6[i][j], change6set[i][j]);
        }
    }
}

function shift() {
    for (let i = 0; i < layers; i++) {
        for (let j = 0; j < color[i].length; j++) {
            // color[i][j] = floor(random(5 + extraBlack));
        }
    }
    for (let i = 0; i < layers; i++) {
        let y = 0.5;
        for (j = 0; j < change1set[i].length; j++) {
            change1shift[i][j] += y;
        }
        y = random(1, 3);;
        for (j = 0; j < change2set[i].length; j++) {
            change2shift[i][j] += y;
        }
        y = random(1, 3);;
        for (j = 0; j < change3set[i].length; j++) {
            change3shift[i][j] += y;
        }
        y = random(1, 3);;
        for (j = 0; j < change4set[i].length; j++) {
            change4shift[i][j] += y;
        }
        y = random(1, 3);;
        for (j = 0; j < change5set[i].length; j++) {
            change5shift[i][j] += y;
        }
        y = random(1, 3);;
        for (j = 0; j < change6set[i].length; j++) {
            change6shift[i][j] += y;
        }
    }
}

function strokePulse() {
    sw = strokeWidth;
}

function keyTyped() {
    if (key === "s") {
        reset();
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
    oscHandler.onNoteOn(0, function() { easing = 0.4; });
    oscHandler.onNoteOn(1, strokePulse);
    oscHandler.onNoteOn(2, reset);
    oscHandler.onNoteOn(3, function() { glitching1 = true; });
    oscHandler.onNoteOn(4, function() { glitching2 = true; });
    oscHandler.onNoteOn(5, function() { easing = 0.02; squirm(); });
    oscHandler.onNoteOn(6, function() { tightness = 5.0; });
    oscHandler.onNoteOn(10, oscHandler.startRecording.bind(oscHandler));
    oscHandler.onNoteOn(11, oscHandler.stopRecording.bind(oscHandler));
    oscHandler.onNoteOff(3, function() { glitching1 = false; });
    oscHandler.onNoteOff(4, function() { glitching2 = false; });
}

class OSCHandler {
    constructor() {
        this.onCallbacks = {};
        this.offCallbacks = {};
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
    }

    onNoteOn(note, callback) {
        this.onCallbacks[note] = callback;
    }

    onNoteOff(note, callback) {
        this.offCallbacks[note] = callback;
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

/* You are welcome to use the color table, but should probably credit me and the info below.
 Table obtained by scanning the nice-color-palette.png image located here: https://github.com/federico-pepe/nice-color-palettes
 ... which was created by that author from the top color palettes on ColourLovers.com. I did not use any of the code from the nice-color-palettes app.  */

