import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color().setHSL( 0.6, 0.7, 0.5);
scene.fog = new THREE.Fog( scene.background, 1, 5000 );
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.physicallyCorrectLights = true;
document.body.appendChild( renderer.domElement );

const geometry = new THREE.BoxGeometry( 2, 2, 2 );

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
        time: {value: 0.0 }
    }
]);
const cubeShader = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    lights: true,
    transparent: true,
    side: THREE.DoubleSide
});

const cube = new THREE.Mesh( geometry, cubeShader );
cube.scale.set(1.5, 1.5, 1.5);

const light1 = new THREE.PointLight('white', 1.0);
const light2 = new THREE.PointLight('white', 1.0);
const lightGeometry = new THREE.SphereGeometry( 0.2, 64, 64 );
const lightMaterial = new THREE.MeshBasicMaterial( { color: 0xFFFFFF } );
const light1Helper = new THREE.Mesh( lightGeometry, lightMaterial );
const light2Helper = new THREE.Mesh( lightGeometry, lightMaterial );

light1.add(light1Helper);
light2.add(light2Helper);

scene.add(cube, light1, light2);

camera.position.z = 5;


var isDragging = false;
var previousMousePosition = {
    x: 0,
    y: 0
};
$(renderer.domElement).on('mousedown', function(e) {
    isDragging = true;
})
.on('mousemove', function(e) {
    //console.log(e);
    var deltaMove = {
        x: e.offsetX-previousMousePosition.x,
        y: e.offsetY-previousMousePosition.y
    };

    if (isDragging) {

        var deltaRotationQuaternion = new THREE.Quaternion()
            .setFromEuler(new THREE.Euler(
                deltaMove.y * (Math.PI / 180),
                deltaMove.x * (Math.PI / 180),
                0,
                'XYZ'
            ));

        cube.quaternion.multiplyQuaternions(deltaRotationQuaternion, cube.quaternion);
    }

    previousMousePosition = {
        x: e.offsetX,
        y: e.offsetY
    };
});

$(document).on('mouseup', function(e) {
    isDragging = false;
});

const clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
    if (!isDragging) {
        cube.rotation.x += 0.005;
        cube.rotation.y += 0.001;
        cube.rotation.y += 0.0004;
    }
    let time = clock.getElapsedTime() / 2;
    light1.position.set(10. * Math.sin(time), -2 * Math.cos(time), 10. * Math.cos(time));
    //light2.position.set(10. * Math.sin(time + Math.PI), -2 * Math.cos(time + Math.PI), 10. * Math.cos(time + Math.PI));
    //light2.position.set(5. * Math.sin(time + Math.PI), 5, 10.);
    light2.position.set(2., 3, 10.);
    cubeShader.uniforms.time.value = time;
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
