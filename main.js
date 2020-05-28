var canvas = document.getElementById("toy-canvas");

// Create the app and start the update loop
var app = new pc.Application(canvas, {
    mouse: new pc.Mouse(document.body),
    touch: new pc.TouchDevice(document.body)
});

let blobUrl = undefined

// Preloading the cubemap asset
var makeRequest = function (url = '') {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', url, true)

    xhr.responseType = 'arraybuffer'

    // Process the response when the request is ready.
    xhr.onload = function () {
        if (this.status === 200) {
            const buffer = new Uint8Array(this.response)
            const blob = new Blob([buffer.buffer])
            blobUrl = URL.createObjectURL(blob)
        }
    }

    xhr.send()
}

makeRequest('./helipad.dds')
// Set the canvas to fill the window and automatically change resolution to be the same as the canvas size
app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
app.setCanvasResolution(pc.RESOLUTION_AUTO);

window.addEventListener("resize", function () {
    app.resizeCanvas(canvas.width, canvas.height);
});

var miniStats = new pc.MiniStats(app);

// A list of assets that need to be loaded
var assetManifest = [
    {
        type: "container",
        url: "./directional-light-and-camera.gltf"
    },
    {
        type: "script",
        url: "./camera.js"
    }
];

// Load all assets and then run the example
var assetsToLoad = assetManifest.length;
assetManifest.forEach(function (entry) {
    app.assets.loadFromUrl(entry.url, entry.type, function (err, asset) {
        if (!err && asset) {
            assetsToLoad--;
            entry.asset = asset;
            if (assetsToLoad === 0) {
                run();
            }
        }
    });
});

function run() {
    // Create a model entity and assign the statue model
    var model = new pc.Entity();
    model.addComponent("model", {
        type: "asset",
        asset: assetManifest[0].asset.resource.model
    });
    app.root.addChild(model);

    // Create a camera with an orbit camera script
    var camera = new pc.Entity();
    camera.addComponent("camera", {
        clearColor: new pc.Color(1, 1, 1)
    });
    camera.addComponent("script");
    camera.script.create("orbitCamera", {
        attributes: {
            inertiaFactor: 0.2 // Override default of 0 (no inertia)
        }
    });
    camera.script.create("orbitCameraInputMouse");
    camera.script.create("orbitCameraInputTouch");
    app.root.addChild(camera);

    // Create a directional light
     // create the light
     var light = new pc.Entity();
     light.addComponent("light", {
         type: "directional",
         color: new pc.Color(1, 1, 1),
         castShadows: true,
         intensity: 2,
         shadowBias: 0.2,
         shadowDistance: 5,
         normalOffsetBias: 0.05,
         shadowResolution: 2048
     });
     light.setLocalEulerAngles(45, 30, 0);
    app.root.addChild(light);
    light.setLocalEulerAngles(45, 30, 0);

    var cubemapAsset = new pc.Asset(
        'helipad',
        'cubemap',
        {
            url: blobUrl,
        },
        {
            rgbm: true,
        }
    )
    cubemapAsset.ready(function () {
        app.scene.gammaCorrection = pc.GAMMA_SRGB
        app.scene.toneMapping = pc.TONEMAP_ACES
        app.scene.skyboxMip = 1 // Set the skybox to the 128x128 cubemap mipmap level
        app.scene.setSkybox(cubemapAsset.resources)
    })
    app.assets.add(cubemapAsset)
    app.assets.load(cubemapAsset)

    app.start();
}