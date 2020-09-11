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
  TextStyle
} = PIXI;

const imgInit = [{
    name: 'map',
    fileName: 'map5.jpg',
    x: 0,
    y: 0
  },
  {
    name: 'runway',
    fileName: 'road.png',
    x: 175,
    y: 1825
  },
  {
    name: 'plane',
    fileName: 'plane03.png',
    x: 175,
    y: 1825
  },
  {
    name: 'gallery',
    fileName: 'gallery.png',
    x: 500,
    y: 1500
  },
  {
    name: 'factoryCar',
    fileName: 'factory-car.png'
  },
  {
    name: 'garbage-truck',
    fileName: 'garbage-truck.png',
    x: 850,
    y: 1300
  },
  {
    name: 'anchor',
    fileName: 'anchor.png'
  }
];

const loader = Loader.shared;

// if browser don't suppert WebGL then use canvas
let type = 'WebGL';

if (!utils.isWebGLSupported()) {
  type = 'canvas';
}

utils.sayHello(type);

// create application root
let app = new Application({
  transparent: true
});

app.renderer.view.style.position = 'absolute';
app.renderer.view.style.display = 'block';
app.renderer.autoDensity = true;
app.renderer.resize(window.innerWidth, window.innerHeight);
app.stage.interactive = true;

let isPress = false;
const lastPoint = {
  x: null,
  y: null,
  time: Date.now()
}

app.stage.pointerdown = (e) => {
  isPress = true;
};

app.stage.pointerup = (e) => {
  isPress = false;
};

app.stage.pointermove = (e) => {
  if (!isPress) return;

  const {
    width: vWidth,
    height: vHeight
  } = app.renderer.view;
  const {
    x,
    y
  } = app.stage.toGlobal({
    x: 0,
    y: 0
  });
  const {
    width,
    height
  } = app.stage;
  let {
    movementX,
    movementY
  } = e.data.originalEvent;

  if (movementX === undefined || movementY === undefined) {
    const now = Date.now()

    lastPoint.x = e.data.originalEvent.touches[0].clientX
    lastPoint.y = e.data.originalEvent.touches[0].clientY
    lastPoint.time = now

    if (lastPoint.x !== null && (now - lastPoint.time) < 100) {
      movementX = e.data.originalEvent.touches[0].clientX - lastPoint.x
      movementY = e.data.originalEvent.touches[0].clientY - lastPoint.y
    } else {
      return
    }
  }

  if (width > vWidth) {
    if (x + movementX > 0) {
      movementX = Math.abs(x);
    } else if (x + movementX + width < vWidth) {
      movementX = -Math.abs(x + width - vWidth);
    }
  } else {
    movementX = 0;
  }

  if (height > vHeight) {
    if (y + movementY > 0) {
      movementY = Math.abs(y);
    } else if (y + movementY + height < vHeight) {
      movementY = -Math.abs(y + height - vHeight);
    }
  } else {
    movementY = 0;
  }

  app.stage.x += movementX;
  app.stage.y += movementY;
};

window.addEventListener('resize', () => {
  app.renderer.resize(window.innerWidth, window.innerHeight);
  resizeStage();
});

document.body.appendChild(app.view);

loader.onProgress.add(() => console.log('ok!'));
loadImages(imgInit);
loader.load(setup);

function setup() {
  imgInit.forEach((img) => {
    let sprite = new Sprite(loader.resources[img.name].texture);

    sprite.name = img.name;
    sprite.x = img.x;
    sprite.y = img.y;

    app.stage.addChild(sprite);
  });

  centerPivot(app.stage)

  app.stage.scale.x = app.stage.scale.y = 0.1;
  app.stage.x = (app.renderer.width) / 2;
  app.stage.y = (app.renderer.height) / 2;

  animate(0.5, () => {
    app.stage.scale.x = app.stage.scale.y += 0.01;
  })(() => {
    resizeStage();
    car();
  });
}

function car() {
  const carConfig = imgInit.find((el) => el.name === 'garbage-truck');
  const container = new Container();
  const car = app.stage.getChildByName('garbage-truck');
  const anchor = new Sprite(loader.resources['anchor'].texture);
  const textStyle = new TextStyle({
    fill: 'white'
  });
  const text = new Text(5, textStyle);
  const moveStrategy = () => {
    moveStraight(
      container, {
        x: 1700,
        y: 750
      },
      5
    )(() => {
      car.texture = loader.resources['factoryCar'].texture;
      moveStraight(
        container, {
          x: 2325,
          y: 1050
        },
        3
      )(() => {
        car.texture = loader.resources['garbage-truck'].texture;
        moveStraight(
          container, {
            x: 2700,
            y: 775
          },
          3
        )(() => {
          container.visible = false;
          container.position.set(carConfig.x, carConfig.y);
          setTimeout(() => {
            container.visible = true;
            moveStrategy();
          }, 3000);
        });
      });
    });
  };

  car.position.set(0, 0);
  anchor.position.set(50, -95);
  text.position.set(75, -70);
  text.visible = false;
  anchor.visible = false;

  app.stage.addChild(container);
  container.addChild(anchor, car, text);
  container.position.set(carConfig.x, carConfig.y);

  container.interactive = true;
  container.buttonMode = true;
  container.mouseover = () => {
    let count = 0;
    const ticker = new Ticker();

    anchor.visible = true;
    anchor.scale.set(1, 0.5);
    anchor.position.set(50, -95);
    text.visible = true;
    car.tint = 0xdddddd;

    ticker.add(() => {
      if (count === 5) {
        ticker.stop();
      }

      anchor.y += 2;
      anchor.scale.y += 0.1;
      count += 1;
    });
    ticker.start();
  };
  container.mouseout = () => {
    anchor.visible = false;
    text.visible = false;
    car.tint = 0xffffff;
  };
  container.click = () => {
    alert('click');
  };
  moveStrategy();
}

function moveStraight(sprite, position, time) {
  return (then) => {
    const milliTime = time * 60;
    const vx = (position.x - sprite.x) / milliTime;
    const vy = (position.y - sprite.y) / milliTime;
    let count = 0;
    const ticker = new Ticker();

    ticker.add(() => {
      if (count >= milliTime) {
        ticker.stop();
        then && then();
      }
      sprite.x += vx;
      sprite.y += vy;
      count += 1;
    });

    ticker.start();
  };
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
    const path = item.url || 'images/' + item.fileName;

    loader.add(item.name, path, {
      crossOrigin: true
    });
  });
}

function resizeStage() {
  app.stage.scale.x = app.stage.scale.y = 0.35;
  app.stage.x = app.renderer.width / 2;
  app.stage.y = app.renderer.height / 2;
}

function centerPivot(container) {
  container.pivot.set(container.width / 2, container.height / 2)
}