/**
 * This file contains the code for the first visualization.
 * It is responsible for loading the volume data and rendering it.
 * The volume is rendered as a bounding box.
 * The user can rotate the volume with the mouse.
 *
 * @Author: Kevin Chelappurath
 * @Author: Maximilian Jellen
 */
let renderer, camera, scene, orbitCamera;
let canvasWidth, canvasHeight = 0;
let container = null;
let volume = null;
let fileInput = null;
let algorithmInput = null;
let shader = null;
let renderTarget = null;

/**
 * Load all data and initialize UI here.
 */
function init() {
    // volume viewer
    container = document.getElementById("viewContainer");
    canvasWidth = window.innerWidth * 0.7;
    canvasHeight = window.innerHeight * 0.7;

    // WebGL renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(canvasWidth, canvasHeight);
    container.appendChild(renderer.domElement);

    histogram();

    // read and parse volume file
    fileInput = document.getElementById("upload");
    fileInput.addEventListener('change', readFile);

    algorithmInput = document.getElementById("select");
    algorithmInput.addEventListener('change', resetVis);

    algorithmInput.disabled = true;
    document.getElementById("tfContainer").hidden = true;

    // dummy shader gets a color as input
    // shader = new Shader("color_vert", "color_frag");
    shader = new Shader("color_vert", "color_frag");

    renderTarget = new THREE.WebGLRenderTarget(canvasWidth, canvasHeight);
}

/**
 * Handles the file reader. No need to change anything here.
 */
function readFile() {
    let reader = new FileReader();
    reader.onloadend = function () {
        console.log("data loaded: ");

        let data = new Uint16Array(reader.result);
        volume = new Volume(data);

        resetVis();
        update();
    };

    reader.readAsArrayBuffer(fileInput.files[0]);
}

/**
 * Construct the THREE.js scene and update histogram when a new volume is loaded by the user.
 *
 */
async function resetVis() {
    algorithmInput.disabled = false;
    document.getElementById("tfContainer").hidden = false;
    // create new empty scenes and perspective camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(40, canvasWidth / canvasHeight, 0.1, 1000);

    // Box
    const boxGeometry = new THREE.BoxGeometry(volume.width, volume.height, volume.depth);

    const volumeTexture = new THREE.Data3DTexture(volume.voxels, volume.width, volume.height, volume.depth);
    volumeTexture.format = THREE.RedFormat;
    volumeTexture.type = THREE.FloatType;
    volumeTexture.minFilter = THREE.LinearFilter;
    volumeTexture.magFilter = THREE.LinearFilter;
    volumeTexture.needsUpdate = true;
    let mip = algorithmInput.value;

    shader.setUniform('volumeTexture', volumeTexture);
    shader.setUniform('volumeSize', new THREE.Vector3(volume.width, volume.height, volume.depth));
    shader.setUniform('mip', mip === "mip");

    const boxMaterial = shader.material;
    const mesh = new THREE.Mesh(boxGeometry, boxMaterial);

    await shader.load();

    scene.add(mesh); // Add the cube to the cubeScene

    // our camera orbits around an object centered at (0,0,0)
    orbitCamera = new OrbitCamera(camera, new THREE.Vector3(0, 0, 0), 2 * volume.max, renderer.domElement);

    // init paint loop
    requestAnimationFrame(paint);
}

/**
 * paint loop
 */
function paint() {
    shader.setShaderColors(getPinPoints());

    if (volume) {
        renderer.render(scene, camera); // Render the scene to the default render target
    }
}