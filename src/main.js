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
  AnimatedSprite
} = PIXI;
const loader = Loader.shared;

const imgInit = [{
    name: 'map',
    fileName: 'map5.jpg',
    x: 0,
    y: 0,
  },
  {
    name: 'runway',
    fileName: 'road.png',
    x: 175,
    y: 1825,
  },
  {
    name: 'plane',
    fileName: 'plane03.png',
    x: 175,
    y: 1825,
  },
  {
    name: 'gallery',
    fileName: 'gallery.png',
    x: 500,
    y: 1500,
  },
  {
    name: 'factoryCar',
    fileName: 'factory-car.png',
  },
  {
    name: 'garbage-truck',
    fileName: 'garbage-truck.png',
    x: 850,
    y: 1300,
  },
  {
    name: 'anchor',
    fileName: 'anchor.png',
  },
  {
    name: 'globe',
    fileName: 'globe.svg',
  },
  {
    name: 'globe-spritesheet',
    fileName: 'globe.spritesheet.json',
  },
];

// if browser don't suppert WebGL then use canvas
let type = 'WebGL';

if (!utils.isWebGLSupported()) {
  type = 'canvas';
}

utils.sayHello(type);

// timeLine
var appTicker = new Ticker();
var appTL = new TimeLine();
var mainTL = new TimeLine({
  order: 'parallel',
});
var viewContainer = document.querySelector('#viewContainer');

// create application root
let app = new Application({
  view: document.querySelector('#view'),
  width: viewContainer.scrollWidth,
  height: viewContainer.scrollHeight,
  transparent: true,
  autoDensity: true,
});

app.renderer.view.style.position = 'absolute';
app.renderer.view.style.display = 'block';

var updateBounds = backgroundDrag({
    top: 0,
    left: 0,
    right: app.renderer.view.width,
    bottom: app.renderer.view.height,
  },
  app.stage
);

window.addEventListener('resize', (e) => {
  app.renderer.resize(viewContainer.scrollWidth, viewContainer.scrollHeight);

  centerStage();
  updateBounds({
    top: 0,
    left: 0,
    right: app.renderer.view.width,
    bottom: app.renderer.view.height,
  });
});

loader.onProgress.add(() => console.log('img loaded'));
loadImages(imgInit);
loader.load(setup);

function setup() {
  main();

  centerPivot(app.stage);
  centerStage();
  app.stage.scale.set(0.6);

  appTL
    .to(0.65, app.stage, {
      scale: {
        x: 1,
        y: 1
      },
    })
    .add(mainTL);

  appTicker
    .add(() => {
      appTL.play();
    })
    .start();
}

function main() {
  // setMap();
  // plane();
  globe();
}

function setMap() {
  var map = createSpriteFromName('map');
  app.stage.addChild(map);
}

function plane() {
  var plane = createSpriteFromName('plane');

  plane.x = imgInit[2].x + 700;
  plane.y = imgInit[2].y + 700;
  app.stage.addChild(plane);

  mainTL.to(
    1,
    plane, {
      x: imgInit[2].x + 300,
      y: imgInit[2].y - 100,
      rotate: {
        angle: 40,
      },
    }, {
      timingFunction: 'easeInOut',
    }
  );
}

function globe() {
  var globe = createAnimationSprite('globe-spritesheet');
  app.stage.addChild(globe);
}

// feature
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

    var isWidthInner =
      dragBounds.right <= bounds.right && dragBounds.left >= bounds.left;

    var innerLeftOrRight =
      dragBounds.right + movementX <= bounds.right ||
      dragBounds.left + movementX >= bounds.left;

    var isHeightInner =
      dragBounds.bottom <= bounds.bottom && dragBounds.top >= bounds.top;

    var innerTopOrBottom =
      dragBounds.bottom + movementY <= bounds.bottom ||
      dragBounds.top + movementY >= bounds.top;

    if (isWidthInner) {
      movementX = 0;
    } else if (innerLeftOrRight) {
      var rightOffset = bounds.right - dragBounds.right;
      var leftOffset = bounds.left - dragBounds.left;
      movementX =
        Math.abs(rightOffset) > Math.abs(leftOffset) ? leftOffset : rightOffset;
    }

    if (isHeightInner) {
      movementY = 0;
    } else if (innerTopOrBottom) {
      var bottomOffset = bounds.bottom - dragBounds.bottom;
      var topOffset = bounds.top - dragBounds.top;
      movementY =
        Math.abs(bottomOffset) > Math.abs(topOffset) ? topOffset : bottomOffset;
    }

    draggable.x += movementX;
    draggable.y += movementY;
  };

  return function(newBounds) {
    bounds = newBounds;
  };
}

function resizeStage(scale) {
  const ticker = new Ticker();
  const tl = new TimeLine();
  tl.to(0.5, app.stage, {
    scale: {
      x: scale,
      y: scale,
    },
  }).when('end', function() {
    ticker.stop();
  });

  ticker
    .add(() => {
      tl.play();
    })
    .start();
}

// utils
function loadImages(data) {
  data.forEach((img) => {
    const path = img.url || 'images/' + img.fileName;

    loader.add(img.name, path, {
      crossOrigin: true,
    });
  });
}

function createSpriteFromName(sourceName, spriteName) {
  let sprite = new Sprite(loader.resources[sourceName].texture);
  sprite.name = sourceName || spriteName;
  return sprite;
}

function createAnimationSprite(sheetName) {
  var sheet = loader.resources[sheetName];
  var frames = Object.keys(sheet.data.frames);
  var meta = sheet.data.meta;

  var textures = [];
  var scale = meta.scale || 1;
  var x = meta.x || 0;
  var y = meta.y || 0;

  for (let i = 0; i < frames.length; i++) {
    var framekey = frames[i];
    var texture = Texture.from(framekey);
    var frame = sheet.data.frames[framekey];
    var time = frame.duration;

    textures.push({
      texture: texture,
      time: time
    });
  }

  var animSprite = new AnimatedSprite(textures);
  animSprite.name = sheetName;
  animSprite.scale.set(scale);
  animSprite.x = x;
  animSprite.y = y;
  animSprite.play();

  return animSprite;
}

function centerStage() {
  app.stage.x = app.renderer.view.width / 2;
  app.stage.y = app.renderer.view.height / 2;
}

function centerPivot(container) {
  container.pivot.set(container.width / 2, container.height / 2);
}