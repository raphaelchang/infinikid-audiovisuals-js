import * as THREE from 'three';

const scene = new THREE.Scene();
//scene.background = new THREE.Color().setHSL( 0.6, 0.1, 0.5);
scene.fog = new THREE.Fog( scene.background, 1, 5000 );
const camera = new THREE.PerspectiveCamera( 100, window.innerWidth / window.innerHeight, 1, 1000 );

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.physicallyCorrectLights = true;
document.body.appendChild( renderer.domElement );

const vertexShader = document.getElementById( 'vertexShader' ).textContent;
const fragmentShader = document.getElementById( 'fragmentShader' ).textContent;
var uniforms = {
        time: { value: 1.0 },
        resolution: { value: new THREE.Vector2() },
        cameraPosView: { value: new THREE.Vector3() }
    };
var uniforms = THREE.UniformsUtils.merge( [
    THREE.UniformsLib[ "lights" ],
    THREE.UniformsLib[ "common" ],
    { 
        time: {value: 0.0 },
        shape: {value: 0}
    }
]);


const createPlane = (size) => {
  let planeGeometry = new THREE.PlaneGeometry(size, size, size);
    const cubeShader = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.clone(uniforms),
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        lights: true,
        side: THREE.DoubleSide
    });
  return new THREE.Mesh(planeGeometry, cubeShader);
};
const cubeSize = 3;
// Face 1
let face1 = createPlane(cubeSize);
face1.position.z = cubeSize / 2;
face1.material.uniforms.shape.value = 0;
// Face 2
let face2 = createPlane(cubeSize);
face2.position.z = -cubeSize / 2;
face2.rotation.x = -Math.PI;
face2.material.uniforms.shape.value = 1;
// Face 3
let face3 = createPlane(cubeSize);
face3.position.x = cubeSize / 2;
face3.rotation.y = Math.PI / 2;
face3.material.uniforms.shape.value = 2;
// Face 4
let face4 = createPlane(cubeSize);
face4.position.x = -cubeSize / 2;
face4.rotation.y = -Math.PI / 2;
face4.material.uniforms.shape.value = 3;
// Face 5
let face5 = createPlane(cubeSize);
face5.position.y = cubeSize / 2;
face5.rotation.x = -Math.PI / 2;
face5.material.uniforms.shape.value = 4;
// Face 6
let face6 = createPlane(cubeSize);
face6.position.y = -cubeSize / 2;
face6.rotation.x = Math.PI / 2;
face6.material.uniforms.shape.value = 5;

const cube = new THREE.Object3D();
const faces = [face1, face2, face3, face4, face5, face6];
cube.add(...faces);

const light = new THREE.PointLight('white', 0.5);
light.position.set(0, 5, 10);

scene.add(cube, light);

camera.position.z = 5;

renderer.setAnimationLoop(() => {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.004;
    for (var face in faces) {
        //face.material.uniforms.time.value += 0.01;
    }
    renderer.render( scene, camera );
});

var oscHandler;
var capturer;
var socket;
var fr = 30;
var port = 9001;
function setupOsc() {
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


function registerOscCallbacks() {
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

setupOsc();
