const {
    Application,
    Container,
    Loader,
    utils,
    Sprite,
    Texture,
    stage,
    Ticker,
    Text,
    TextStyle,
    Graphics,
} = PIXI;
const loader = Loader.shared;

const imgInit = [{
        name: "map",
        fileName: "map5.jpg",
        x: 0,
        y: 0,
    },
    {
        name: "runway",
        fileName: "road.png",
        x: 175,
        y: 1825,
    },
    {
        name: "plane",
        fileName: "plane03.png",
        x: 175,
        y: 1825,
    },
    {
        name: "gallery",
        fileName: "gallery.png",
        x: 500,
        y: 1500,
    },
    {
        name: "factoryCar",
        fileName: "factory-car.png",
    },
    {
        name: "garbage-truck",
        fileName: "garbage-truck.png",
        x: 850,
        y: 1300,
    },
    {
        name: "anchor",
        fileName: "anchor.png",
    },
];

// if browser don't suppert WebGL then use canvas
let type = "WebGL";

if (!utils.isWebGLSupported()) {
    type = "canvas";
}

utils.sayHello(type);

// timeLine
var appTicker = new Ticker();
var appTL = new TimeLine({
    order: 'parallel'
});


// create application root
let app = new Application({
    width: window.innerWidth,
    height: window.innerHeight,
    transparent: true,
    autoDensity: true,
});

app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
document.body.appendChild(app.view);

window.addEventListener("resize", () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    resizeStage();
});

loader.onProgress.add(() => console.log("ok!"));
loadImages(imgInit);
loader.load(setup);

function setup() {
    resizeStage(0.2);

    backgroundDrag({
        top: 0,
        left: 0,
        right: app.renderer.view.width,
        bottom: app.renderer.view.height
    }, app.stage);

    main()

    app.stage.x = app.renderer.view.width / 2 - app.stage.width / 2
    app.stage.y = app.renderer.view.height / 2 - app.stage.height / 2

    // appTL.to(0.8, app.stage, {
    //     scale: {
    //         x: 0.3,
    //         y: 0.3
    //     }
    // })

    appTicker
        .add(() => {
            appTL.play();
        })
        .start()
}

function main() {
    setMap();
}

function setMap() {
    var map = createSpriteFromName('map')
    app.stage.addChild(map);
}

function animate(time, doing) {
    return (then) => {
        const milliTime = time * 60;
        let count = 0;
        const ticker = new Ticker();

        ticker.add(() => {
            if (count >= milliTime) {
                ticker.stop();
                then && then();
            }
            doing();
            count += 1;
        });
        ticker.start();
    };
}

function loadImages(data) {
    data.forEach((item) => {
        const path = item.url || "images/" + item.fileName;

        loader.add(item.name, path, {
            crossOrigin: true,
        });
    });
}

function createSpriteFromName(name) {
    let sprite = new Sprite(getTexture(name));
    sprite.name = name;
    return sprite;
}

function getTexture(name) {
    return loader.resources[name].texture;
}

function resizeStage(scale) {
    app.stage.scale.x = app.stage.scale.y = scale;
}

function centerPivot(container) {
    container.pivot.set(container.width / 2, container.height / 2);
}

function backgroundDrag(bounds, draggable) {
    draggable.interactive = true;

    let isPress = false;
    const lastPoint = {
        x: null,
        y: null,
        time: null,
    };

    draggable.pointerdown = (e) => {
        isPress = true;
    };

    draggable.pointerup = (e) => {
        isPress = false;
    };

    draggable.pointermove = (e) => {
        var dragBounds = draggable.getBounds();
        let {
            movementX,
            movementY
        } = e.data.originalEvent;

        if (!isPress) return;
        if (movementX === undefined || movementY === undefined) {
            const now = Date.now();
            const lasTime = lastPoint.time;
            const lastX = lastPoint.x;
            const lastY = lastPoint.y;

            lastPoint.x = e.data.originalEvent.touches[0].clientX;
            lastPoint.y = e.data.originalEvent.touches[0].clientY;
            lastPoint.time = now;

            if (now - lasTime < 100 && lasTime !== null) {
                movementX = e.data.originalEvent.touches[0].clientX - lastX;
                movementY = e.data.originalEvent.touches[0].clientY - lastY;
            } else {
                return;
            }
        }

        var isXInner =
            dragBounds.right <= bounds.right && dragBounds.left >= bounds.left;
        var oneXSideInner =
            dragBounds.right + movementX <= bounds.right ||
            dragBounds.left + movementX >= bounds.left;

        var isYInner =
            dragBounds.bottom <= bounds.bottom && dragBounds.top >= bounds.top;
        var oneYSideInner =
            dragBounds.bottom + movementY <= bounds.bottom ||
            dragBounds.top + movementY >= bounds.top;

        if (isXInner) {
            movementX = 0;
        } else if (oneXSideInner) {
            var rightOffset = bounds.right - dragBounds.right;
            var leftOffset = bounds.left - dragBounds.left;
            movementX =
                Math.abs(rightOffset) > Math.abs(leftOffset) ? leftOffset : rightOffset;
        }

        if (isYInner) {
            movementY = 0;
        } else if (oneYSideInner) {
            var bottomOffset = bounds.bottom - dragBounds.bottom;
            var topOffset = bounds.top - dragBounds.top;
            movementY =
                Math.abs(bottomOffset) > Math.abs(topOffset) ? topOffset : bottomOffset;
        }

        draggable.x += movementX;
        draggable.y += movementY;
    };
}