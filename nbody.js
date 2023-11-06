// todo: optimize gravity by lumping things a certain distance away together as one gravitating body
// distance from body and lumping radius is proportional

frameByFrame = 0; // Chromebook Simulator (or for debug purposes)

// initialize user interface
const ui = {
  panel: document.getElementById("settings"),
  collapse: document.getElementById("toggleSettings"),
  timestep: document.getElementById("timestep"),
  tOut: document.getElementById("tOut"),
  numBodies: document.getElementById("num"),
  trace: document.getElementById("trace"),
  fade: document.getElementById("fade"),
  drawVector: document.getElementById("vectors"),
  drawGravity: document.getElementById("drawG"),
  drawGravityStrength: document.getElementById("drawGStrength"),
  drawGThreshold: document.getElementById("drawGThreshold"),
  continuous: document.getElementById("continuous"),
  G: document.getElementById("g"),
  GOut: document.getElementById("gOut"),
  collide: document.getElementById("collide"),
  maxMass: document.getElementById("maxSize"),
  minMass: document.getElementById("minSize"),
  initVel: document.getElementById("initVel"),
  randBtn: document.getElementById("rand"),
  loadBtn: document.getElementById("loadPreset"),
  presets: document.getElementById("presets"),
  add: document.getElementById("add"),
  clear: document.getElementById("clear"),
  toggle: document.getElementById("toggle"),
  clrOffscreen: document.getElementById("clrOffscreen"),
  collisionCount: document.getElementById("collisionCount"),
  bodyCount: document.getElementById("bodyCount"),
  fps: document.getElementById("fps"),
  offset: document.getElementById("offset"),
  viewport: document.getElementById("viewport"),
  zoom: document.getElementById("zoom"),
  mass: document.getElementById("mass"),
  radius: document.getElementById("radius"),
  xp: document.getElementById("xPos"),
  yp: document.getElementById("yPos"),
  vx: document.getElementById("Vx"),
  vy: document.getElementById("Vy"),
  heatmap: document.getElementById("heatmap"),
};

// utilities
const getRadius = (mass) => Math.cbrt((mass * (3 / 4)) / Math.PI);

const randColor = () =>
  "#" + Math.floor(Math.random() * (16777215 - 5592405) + 5592405).toString(16);

// initialize main canvas
const canvas = document.getElementById("canvas", { alpha: false });
const ctx = canvas.getContext("2d");
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;
ui.viewport.innerText = canvas.width + " x " + canvas.height;
let center = { x: canvas.width / 2, y: canvas.height / 2 };

window.onresize = () => {
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;
  ui.viewport.innerText = canvas.width + " x " + canvas.height;
  center = { x: canvas.width / 2, y: canvas.height / 2 };
  viewport.x = canvas.width / totalzoom;
  viewport.y = canvas.height / totalzoom;
};

// initialize graphs
const fpsGraph = document.getElementById("fpsGraph");
const fpsCtx = fpsGraph.getContext("2d");
const bodyGraph = document.getElementById("bodyGraph");
const bodyCtx = bodyGraph.getContext("2d");
fpsCtx.fillStyle = "rgba(0, 0, 0, 1)";
fpsCtx.fillRect(0, 0, canvas.width, canvas.height);
bodyCtx.fillStyle = "rgba(0, 0, 0, 1)";
bodyCtx.fillRect(0, 0, canvas.width, canvas.height);
let xCoord = 0;

// simulation variables
let bodies = [];
let G = 0.15;
const Gconst = 6.6743 * Math.pow(10, -11);
let numBodies,
  trace,
  fade,
  drawVector,
  drawGravity,
  drawGravityStrength,
  drawGThreshold,
  collide,
  maxMass,
  minMass,
  initVel,
  timestep,
  oldTimestep,
  continuous;

// tracking variables
let collisionCount = (frameCount = bodyCount = activeBodies = 0);
let lastTime = performance.now();
let clearTrails = (paused = false);

// interactive variables
let panOffset = { x: 0, y: 0 };
let panSpeed = 8;
let currentOffset = { x: 0, y: 0 };
let collideOffset = { x: 0, y: 0 };
let trackBody;
let trackNum = 0;
let newBody = false;
let zoomfactor = 1;
let totalzoom = 1;
let viewport = { x: canvas.width, y: canvas.height };

// heatmap
let maxBody;
let minPotential = 0;
let heatmapRes = 4;

initParams();
draw();

// form event listeners
{
  ui.collapse.onclick = () => {
    ui.collapse.innerText = ui.collapse.innerText === ">" ? "<" : ">";
    if (ui.panel.classList.contains("hidden")) {
      ui.panel.classList.remove("hidden");
    } else {
      ui.panel.classList.add("hidden");
    }
  };
  // begin the simulation
  ui.randBtn.onclick = () => {
    // form.collide.checked = true;
    initParams();
    initRandBodies(numBodies, minMass, maxMass, initVel);
    activeBodies = bodies.length;
    ui.bodyCount.innerText = activeBodies;
  };

  ui.loadBtn.onclick = () => {
    initParams();
    switch (ui.presets.value) {
      case "0": // 500 body chaos
        ui.G.value = ui.GOut.innerText = 1;
        ui.drawVector.checked = drawVector = false;
        ui.drawGravity.checked = drawGravity = false;
        ui.timestep.value = ui.tOut.innerText = 0.5;
        ui.numBodies.value = numBodies = 500;
        ui.maxMass.value = maxMass = 100;
        ui.minMass.value = minMass = 50;
        ui.drawGravityStrength.checked = drawGravityStrength = false;
        initRandBodies(numBodies, minMass, maxMass, initVel);
        break;
      case "1": // sun and 3 planets
        ui.collide.checked = false;
        ui.G.value = ui.GOut.innerText = 0.15;
        G = 0.15;
        initOrbitBodies1();
        break;
      case "2": // two equal bodies
        ui.collide.checked = false;
        ui.G.value = ui.GOut.innerText = 0.15;
        G = 0.15;
        initOrbitBodies2();
        break;
      case "3": // sun planets and moon
        ui.collide.checked = false;
        ui.G.value = ui.GOut.innerText = 0.25;
        G = 0.25;
        initOrbitBodies3();
        break;
      case "4": // galaxies
        ui.trace.checked = false;
        ui.drawGravity.checked = false;
        ui.drawGravityStrength.checked = false;
        ui.drawVector.checked = false;
        ui.timestep.value = ui.tOut.innerText = 0.5;
        let g1num = randInt(250, 1000);
        let g2num = randInt(250, 1000);
        generateGalaxy(
          {
            x: randInt(center.x - viewport.x / 2, center.x + viewport.x / 2),
            y: randInt(center.y - viewport.y / 2, center.y + viewport.y / 2),
          },
          { x: randInt(-1, 1), y: randInt(-1, 1) },
          g1num,
          g1num / 2,
          0
        );
        generateGalaxy(
          {
            x: randInt(center.x - viewport.x / 2, center.x + viewport.x / 2),
            y: randInt(center.y - viewport.y / 2, center.y + viewport.y / 2),
          },
          { x: randInt(-1, 1), y: randInt(-1, 1) },
          g2num,
          g2num / 2,
          randInt(0, 2)
        );
        break;
    }
    activeBodies = bodies.length;
    ui.bodyCount.innerText = activeBodies;
  };

  // add a body
  ui.add.onclick = () => {
    activeBodies += 1;
    ui.bodyCount.innerText = activeBodies;
    initParams();
    initRandBodies(1, minMass, maxMass, initVel);
  };

  // clear bodies
  ui.clear.onclick = () => {
    bodies = [];
    ctx.fillStyle = "rgba(0, 0, 0, 1)";
    ctx.fillRect(center.x - viewport.x / 2, center.y - viewport.y / 2, viewport.x, viewport.y);
    activeBodies = bodies.length;
    ui.bodyCount.innerText = activeBodies;
  };

  ui.clrOffscreen.onclick = () => {
    bodies.forEach((body) => {
      if (!isInView(body)) {
        remove(bodies, body.id);
      }
    });
    activeBodies = bodies.length;
    ui.bodyCount.innerText = activeBodies;
  };

  // pause/play sim
  ui.toggle.onclick = () => {
    paused = !paused;
    if (timestep) {
      oldTimestep = timestep;
      timestep = 0;
      ui.timestep.value = 0;
    } else {
      timestep = oldTimestep;
      ui.timestep.value = timestep;
    }
  };

  // input listeners
  {
    ui.trace.addEventListener("input", () => {
      ui.heatmap.checked = false;
    });
    ui.timestep.addEventListener("input", (event) => {
      ui.tOut.innerText = event.target.value;
      timestep = event.target.value;
    });

    ui.G.addEventListener("input", (event) => {
      ui.GOut.innerText = event.target.value;
      G = event.target.value;
    });

    ui.initVel.addEventListener("input", (event) => {
      initVel = event.target.value;
    });

    ui.collide.addEventListener("input", () => {
      ui.clrOffscreen.click();
    });

    ui.heatmap.addEventListener("input", () => {
      ui.trace.checked = trace = false;
      ui.drawGravityStrength.checked = drawGravityStrength = false;
      ui.drawVector.checked = drawVector = false;
      ui.drawGravity.checked = drawGravity = false;
    });
  }
}

// interaction event listeners
{
  canvas.onmousedown = (event) => {
    event.ctrlKey || event.altKey
      ? bodies.push(
          new Body(
            ui.xp.value ? parseInt(ui.xp.value) : (event.clientX / canvas.width) * viewport.x + center.x - viewport.x / 2,
            ui.yp.value ? parseInt(ui.yp.value) : (event.clientY / canvas.height) * viewport.y + center.y - viewport.y / 2,
            parseInt(ui.vx.value),
            parseInt(ui.vy.value),
            parseInt(ui.radius.value ? ui.radius.value : getRadius(ui.mass.value)),
            parseInt(ui.mass.value),
            randColor()
          )
        )
      : canvas.addEventListener("mousemove", handleMouseMove);
  };
  canvas.onmouseup = () => {
    canvas.removeEventListener("mousemove", handleMouseMove);
    panOffset = { x: 0, y: 0 };
  };
  function handleMouseMove(event) {
    event.preventDefault();
    event.stopPropagation();

    panOffset.x = event.movementX / totalzoom;
    panOffset.y = event.movementY / totalzoom;

    setTimeout(mouseStopped, 50);
  }
  function mouseStopped() {
    panOffset.x = panOffset.y = 0;
  }

  canvas.onwheel = (event) => {
    if (!event.ctrlKey) {
      zoomfactor = Math.sign(event.deltaY) < 0 ? 1.05 : 1 / 1.05;
      ctx.transform(
        zoomfactor,
        0,
        0,
        zoomfactor,
        (-(zoomfactor - 1) * canvas.width) / 2,
        (-(zoomfactor - 1) * canvas.height) / 2
      );
      totalzoom *= zoomfactor;
      viewport.x /= zoomfactor;
      viewport.y /= zoomfactor;
      ui.viewport.innerText = Math.round(viewport.x) + " x " + Math.round(viewport.y);
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.fillRect(center.x - viewport.x / 2, center.y - viewport.y / 2, viewport.x, viewport.y);
      ui.zoom.innerText = Math.round(totalzoom * 10000) / 100;
    }
  };

  window.onkeydown = (event) => {
    const activeElement = document.activeElement;
    const register = activeElement.tagName !== "INPUT";
    console.log(event.code);
    if (register) {
      switch (event.code) {
        case "ArrowLeft":
        case "KeyA":
          event.preventDefault();
          panOffset.x = panSpeed / totalzoom;
          break;
        case "ArrowRight":
        case "KeyD":
          event.preventDefault();
          panOffset.x = -panSpeed / totalzoom;
          break;
        case "ArrowUp":
        case "KeyW":
          event.preventDefault();
          panOffset.y = panSpeed / totalzoom;
          break;
        case "ArrowDown":
        case "KeyS":
          event.preventDefault();
          panOffset.y = -panSpeed / totalzoom;
          break;
        case "Space":
          event.preventDefault();
          event.stopPropagation();
          if (trackNum < bodies.length) {
            trackBody = bodies[trackNum++];
            newBody = true;
          } else {
            trackBody = null;
            trackNum = 0;
            newBody = false;
          }
          break;
        case "Escape":
          event.preventDefault();
          trackBody = null;
          trackNum = 0;
          newBody = false;
          break;
        case "KeyP":
          ui.toggle.click();
          break;
        case "KeyR":
          if (!event.ctrlKey) ui.randBtn.click();
          break;
        case "Backspace":
          ui.clear.click();
          break;
        case "Delete":
          ui.clrOffscreen.click();
          break;
        case "Enter":
          ui.add.click();
          break;
        case "KeyE":
          ui.collide.click();
          break;
        case "KeyT":
          ui.trace.click();
          break;
        case "KeyC":
          ui.continuous.click();
          break;
        case "KeyF":
          ui.fade.click();
          break;
        case "KeyG":
          ui.drawGravityStrength.click();
          break;
        case "KeyU":
        case "KeyV":
          ui.collapse.innerText = ui.collapse.innerText === ">" ? "<" : ">";
          if (ui.panel.classList.contains("hidden")) {
            ui.panel.classList.remove("hidden");
          } else {
            ui.panel.classList.add("hidden");
          }
          break;
        case "Home":
        case "Digit0":
          pan(
            collide
              ? { x: -currentOffset.x + collideOffset.x, y: -currentOffset.y + collideOffset.y }
              : { x: -currentOffset.x, y: -currentOffset.y }
          );
          zoomfactor = 1 / totalzoom;
          ctx.transform(
            zoomfactor,
            0,
            0,
            zoomfactor,
            (-(zoomfactor - 1) * canvas.width) / 2,
            (-(zoomfactor - 1) * canvas.height) / 2
          );
          totalzoom = 1;
          viewport.x = canvas.width;
          viewport.y = canvas.height;
          ctx.fillStyle = "rgba(0, 0, 0, 1)";
          ctx.fillRect(
            center.x - viewport.x / 2,
            center.y - viewport.y / 2,
            viewport.x,
            viewport.y
          );
          ui.zoom.innerText = Math.round(totalzoom * 10000) / 100;
          break;
        case "KeyZ":
          zoomfactor = 1.05;
          ctx.transform(
            zoomfactor,
            0,
            0,
            zoomfactor,
            (-(zoomfactor - 1) * canvas.width) / 2,
            (-(zoomfactor - 1) * canvas.height) / 2
          );
          totalzoom *= zoomfactor;
          viewport.x /= zoomfactor;
          viewport.y /= zoomfactor;
          ui.viewport.innerText = Math.round(viewport.x) + " x " + Math.round(viewport.y);
          ctx.fillStyle = "rgba(0, 0, 0, 1)";
          ctx.fillRect(
            center.x - viewport.x / 2,
            center.y - viewport.y / 2,
            viewport.x,
            viewport.y
          );
          ui.zoom.innerText = Math.round(totalzoom * 10000) / 100;
          break;
        case "KeyX":
          zoomfactor = 1 / 1.05;
          ctx.transform(
            zoomfactor,
            0,
            0,
            zoomfactor,
            (-(zoomfactor - 1) * canvas.width) / 2,
            (-(zoomfactor - 1) * canvas.height) / 2
          );
          totalzoom *= zoomfactor;
          viewport.x /= zoomfactor;
          viewport.y /= zoomfactor;
          ui.viewport.innerText = Math.round(viewport.x) + " x " + Math.round(viewport.y);
          ctx.fillStyle = "rgba(0, 0, 0, 1)";
          ctx.fillRect(
            center.x - viewport.x / 2,
            center.y - viewport.y / 2,
            viewport.x,
            viewport.y
          );
          ui.zoom.innerText = Math.round(totalzoom * 10000) / 100;
          break;
      }
    }
  };
  window.onkeyup = (event) => {
    if (
      event.code === "ArrowLeft" ||
      event.code === "ArrowRight" ||
      event.code === "KeyA" ||
      event.code === "KeyD"
    ) {
      panOffset.x = 0;
    } else if (
      event.code === "ArrowUp" ||
      event.code === "ArrowDown" ||
      event.code === "KeyW" ||
      event.code === "KeyS"
    ) {
      panOffset.y = 0;
    }
  };
}

// body presets
{
  // Randomly generate bodies based on params
  function initRandBodies(num, minSize = 3, maxSize = 5, v = 0, randColors = true) {
    for (let i = 0; i < num; i++) {
      let r = getRadius(randInt(minSize, maxSize));
      bodies.push(
        new Body(
          collide
            ? randInt(
                -collideOffset.x + currentOffset.x + 2 * r,
                -collideOffset.x + currentOffset.x + canvas.width - 2 * r
              )
            : randInt(center.x - viewport.x / 2 + 2 * r, center.x + viewport.x / 2 - 2 * r),
          collide
            ? randInt(
                -collideOffset.y + currentOffset.y + 2 * r,
                -collideOffset.y + currentOffset.y + canvas.height - 2 * r
              )
            : randInt(center.y - viewport.y / 2 + 2 * r, center.y + viewport.y / 2 - 2 * r),
          (Math.random() - 0.5) * 2 * v,
          (Math.random() - 0.5) * 2 * v,
          r,
          0,
          randColors ? randColor() : "white"
        )
      );
    }
  }

  function generateGalaxy(
    centerPos = { x: center.x, y: center.y },
    vel = { x: 0, y: 0 },
    num = 500,
    radius = 500,
    rotDir = 0
  ) {
    // center
    let centerRadius = getRadius(num * 100);
    bodies.push(new Body(centerPos.x, centerPos.y, vel.x, vel.y, 0, num * 100));
    for (let i = 0; i < num; i++) {
      let mass = randInt(1, 2);
      let r = getRadius(mass);
      let angle = randInt(0, 360);
      let distance = Math.pow(2, -2 * Math.random()).map(0.25, 1, 0, 1) * radius + centerRadius; //randInt(centerRadius * 2, radius)
      let ac = (G * num * 100) / (distance * distance);
      let speed = Math.sqrt(ac * distance);
      bodies.push(
        new Body(
          centerPos.x + distance * Math.cos(angle),
          centerPos.y + distance * Math.sin(angle),
          vel.x + speed * Math.sin(-angle) * (rotDir ? 1 : -1),
          vel.y + speed * Math.cos(-angle) * (rotDir ? 1 : -1),
          r,
          0,
          "white",
          false
        )
      );
    }
  }

  // Sun and 3 planets
  function initOrbitBodies1() {
    bodies.push(new Body(center.x, center.y, 0, 0, 50, 0, "yellow"));
    bodies.push(new Body(center.x, center.y + 200, 20, 0, 5, 0, "blue"));
    bodies.push(new Body(center.x + 300, center.y, 0, -10, 5, 0, "blue"));
    bodies.push(new Body(center.x - 500, center.y, 0, 8, 5, 0, "blue"));
  }

  // Binary system
  function initOrbitBodies2() {
    bodies.push(new Body(center.x, center.y + 100, 4, 0, 20, 0, "blue"));
    bodies.push(new Body(center.x, center.y - 100, -4, 0, 20, 0, "blue"));
  }

  // Sun, planets, moons
  function initOrbitBodies3() {
    bodies.push(new Body(center.x, center.y, 0, 0, 30, 0, "yellow"));
    bodies.push(new Body(center.x, center.y - 150, 14, 0, 5, 0, "blue"));
    bodies.push(new Body(center.x, center.y - 170, 11, 0, 1, 0, "white"));
    bodies.push(new Body(center.x, center.y + 400, -8.7, 0, 5, 0, "blue"));
    bodies.push(new Body(center.x, center.y + 430, -6.7, 0, 1, 0, "white"));
  }
}

// init form inputs
function initParams() {
  if (!paused) timestep = ui.timestep.value;
  initVel = ui.initVel.value;
  G = ui.G.value;
  numBodies = ui.numBodies.value;
  maxMass = ui.maxMass.value;
  minMass = ui.minMass.value;
}

// to remove bodies during collision
function remove(arr, id) {
  const index = arr.findIndex((body) => body.id === id);
  if (index !== -1) {
    arr.splice(index, 1);
  } else {
    console.error("Could not remove ", id);
  }
  return arr;
}

// to generate random integers
function randInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

const isInView = (body) =>
  body.pos.x <= center.x + viewport.x / 2 + body.radius &&
  body.pos.x >= center.x - viewport.x / 2 - body.radius&&
  body.pos.y <= center.y + viewport.y / 2 + body.radius &&
  body.pos.y >= center.y - viewport.y / 2 - body.radius;

// map values from one range to another
Number.prototype.map = function (in_min, in_max, out_min, out_max, clampMax = false, clampMin = false) {
  let mapped = ((this - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
  mapped = mapped <= out_max || !clampMax ? mapped : out_max;
  mapped = mapped >= out_min || !clampMin ? mapped : out_min;
  return mapped;
};

class Body {
  constructor(
    xPos = 0,
    yPos = 0,
    xVel = 0,
    yVel = 0,
    r = 5,
    mass = 0,
    color = "gray",
    collide = true
  ) {
    this.pos = { x: xPos, y: yPos };
    this.vel = { x: xVel, y: yVel };
    this.prevPos = { x: xPos, y: yPos };
    this.accel = { x: 0, y: 0 };
    this.radius = r ? r : getRadius(mass);
    this.mass = mass ? mass : (4 / 3) * Math.PI * Math.pow(r, 3);
    this.color = color;
    this.id = bodyCount++;
    this.collide = collide;
  }
  getMomentum() {
    return { x: this.vel.x * this.mass, y: this.vel.y * this.mass };
  }
  draw() {
    if (!isInView(this)) {
      // offscreen indicators
      // use slope to draw lines pointing toward center
      let bodyPos = { x: this.pos.x - center.x, y: this.pos.y - center.y };
      let slope = (this.pos.y - center.y) / (this.pos.x - center.x);
      let angle = Math.abs(Math.atan2(bodyPos.y, bodyPos.x));
      let x =
        (Math.sign(bodyPos.x) *
          (center.x - (Math.sqrt(this.radius) + 5) * Math.abs(Math.cos(angle)))) /
        totalzoom;
      let y =
        (Math.sign(bodyPos.y) * (center.y - (Math.sqrt(this.radius) + 5) * Math.sin(angle))) /
        totalzoom;
      ctx.beginPath();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 1 / totalzoom;
      ctx.moveTo(center.x + bodyPos.x, center.y + bodyPos.y);
      Math.abs(bodyPos.x / canvas.width) > Math.abs(bodyPos.y / canvas.height)
        ? ctx.lineTo(center.x + x, center.y + slope * x)
        : ctx.lineTo(center.x + y / slope, center.y + y);
      ctx.closePath();
      ctx.stroke();
    } else {
      if (trackBody != this && trace) {
        // connect to previous
        if (continuous && trace) {
          ctx.beginPath();
          ctx.lineWidth = 2 * this.radius;
          ctx.strokeStyle = this.color;
          ctx.moveTo(this.pos.x, this.pos.y);
          ctx.lineTo(this.prevPos.x, this.prevPos.y);
          ctx.closePath();
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(this.prevPos.x, this.prevPos.y, this.radius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();
      }

      // draw the body
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fillStyle = this.color;
      ctx.fill();

      // center
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius < 1.5 ? this.radius : 1.5, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fillStyle = this.radius < 3 ? "white" : "black";
      ctx.fill();

      if (drawField) {
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.stroke();
      }

      // motion vector
      if (drawVector) {
        let mult = 10 * timestep;
        ctx.beginPath();
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 1 / totalzoom;
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.lineTo(this.pos.x + mult * this.vel.x, this.pos.y + mult * this.vel.y);
        ctx.closePath();
        ctx.stroke();
      }
      // acceleration vector
      if (drawGravity) {
        let mult = 50 * timestep;
        ctx.beginPath();
        ctx.lineWidth = 1 / totalzoom;
        ctx.strokeStyle = "red";
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.lineTo(this.pos.x + mult * this.accel.x, this.pos.y + mult * this.accel.y);
        ctx.closePath();
        ctx.stroke();
      }
    }
    this.update();
  }
  update() {
    this.accel = gravity(this, bodies.indexOf(this));
    this.prevPos.x = this.pos.x;
    this.prevPos.y = this.pos.y;
    // edge collision - set accel to 0 when colliding to prevent changes in velocity
    if (collide) {
      if (
        this.pos.x + this.vel.x * timestep >=
          -collideOffset.x + currentOffset.x + canvas.width - this.radius ||
        this.pos.x + this.vel.x * timestep <= -collideOffset.x + currentOffset.x + this.radius
      ) {
        this.vel.x = -this.vel.x;
        this.accel.x = 0;
      }
      if (
        this.pos.y + this.vel.y * timestep >=
          -collideOffset.y + currentOffset.y + canvas.height - this.radius ||
        this.pos.y + this.vel.y * timestep <= -collideOffset.y + currentOffset.y + this.radius
      ) {
        this.vel.y = -this.vel.y;
        this.accel.y = 0;
      }
    }
    // implement acceleration
    this.vel.x += this.accel.x * timestep;
    this.vel.y += this.accel.y * timestep;
    // integrate velocity every frame
    this.pos.x += this.vel.x * timestep;
    this.pos.y += this.vel.y * timestep;
  }
  toString() {
    return (
      "Body " +
      this.id +
      ": Mass " +
      this.mass +
      "; CurrentPos " +
      this.pos.x +
      ", " +
      this.pos.y +
      "; CurrentVel " +
      this.vel.x +
      ", " +
      this.vel.y
    );
  }
}

// calculate gravitational forces between each body
function gravity(currentBody, index) {
  let dist = { net: 0, x: 0, y: 0 };
  let force = { x: 0, y: 0 };
  let accel = { x: 0, y: 0 };
  let gForce;

  bodies.forEach((body, j) => {
    // sum forces in X and Y for each using Fg = G(m1*m2)/r^2
    // then get accel by dividing by mass
    if (index != j) {
      // get distance
      dist.x = body.pos.x - currentBody.pos.x;
      dist.y = body.pos.y - currentBody.pos.y;
      dist.r = Math.max(Math.hypot(dist.x, dist.y), 1);

      if (
        dist.r <= body.radius + currentBody.radius &&
        bodies.includes(currentBody) &&
        bodies.includes(body) &&
        currentBody.id != body.id
      ) {
        if (body.collide && currentBody.collide) collision(currentBody, body);
      } else {
        // get total gravity
        gForce = (G * (body.mass * currentBody.mass)) / (dist.r * dist.r);

        // get the angle between the two bodies
        force.x += (gForce * dist.x) / dist.r;
        force.y += (gForce * dist.y) / dist.r;
        let strength = Math.abs(1 - 10 / (gForce + 10));
        let drawThreshold = drawGThreshold ? (trace ? 1e-4 : 1e-2) : 0;
        if (drawGravityStrength && strength >= drawThreshold) {
          ctx.beginPath();
          ctx.strokeStyle =
            "rgba(" + (255 - 255 * strength) + "," + 255 * strength + ",0 ," + strength + ")";
          ctx.lineWidth = 1 / totalzoom;
          ctx.moveTo(body.pos.x, body.pos.y);
          ctx.lineTo(currentBody.pos.x, currentBody.pos.y);
          ctx.closePath();
          ctx.stroke();
        }
      }
    }
  });
  accel.x = force.x / currentBody.mass;
  accel.y = force.y / currentBody.mass;
  return accel;
}

// calculate collisions, create new body
function collision(body1, body2) {
  collisionCount += 1;
  ui.collisionCount.innerText = collisionCount;
  activeBodies = bodies.length - 1;
  ui.bodyCount.innerText = activeBodies;

  // merge masses and calculate corresponding radius and velocity based on momentum
  let mass = body1.mass + body2.mass;
  let larger = body1.mass > body2.mass ? body1 : body2;
  let smaller = larger === body1 ? body2 : body1;

  let momentum = {
    x: body1.getMomentum().x + body2.getMomentum().x,
    y: body1.getMomentum().y + body2.getMomentum().y,
  };
  let velocity = { x: momentum.x / mass, y: momentum.y / mass };

  // change larger body properties
  larger.mass = mass;
  larger.radius = getRadius(mass);
  larger.vel.x = velocity.x;
  larger.vel.y = velocity.y;

  // maintain tracking
  if (trackBody === smaller) trackBody = larger;
  // remove the smaller object
  remove(bodies, smaller.id);
}

// display framerate and number of bodies
function updateGraphs(interval) {
  // get fps
  frameCount++;

  const currentTime = performance.now();
  const elapsedTime = currentTime - lastTime;

  if (elapsedTime >= interval) {
    // Update 10 times per second
    const fps = frameCount / (elapsedTime / 1000);
    ui.fps.innerText = Math.round(fps * 100) / 100;

    //let xCoord = (currentTime / 500 * 3) % fpsGraph.width;
    xCoord += 2;
    fpsCtx.beginPath();
    fpsCtx.strokeStyle = fps >= 15 ? (fps >= 30 ? "lightgreen" : "orange") : "red"; //"white";
    fpsCtx.lineWidth = 1;
    fpsCtx.moveTo(xCoord % fpsGraph.width, fpsGraph.height);
    fpsCtx.lineTo(xCoord % fpsGraph.width, fpsGraph.height - fps);
    fpsCtx.closePath();
    fpsCtx.stroke();
    fpsCtx.fillStyle = "rgba(0, 0, 0, 0.02)";
    fpsCtx.fillRect(0, 0, (xCoord % fpsGraph.width) - 2, fpsGraph.height);
    fpsCtx.fillRect((xCoord % fpsGraph.width) + 2, 0, fpsGraph.width, fpsGraph.height);

    frameCount = 0;
    lastTime = currentTime;

    bodyCtx.beginPath();
    bodyCtx.strokeStyle =
      activeBodies >= 500 ? "red" : activeBodies >= 200 ? "orange" : "lightgreen";
    bodyCtx.lineWidth = 1;
    bodyCtx.moveTo(xCoord % bodyGraph.width, bodyGraph.height);
    bodyCtx.lineTo(xCoord % bodyGraph.width, bodyGraph.height - activeBodies / 8);
    bodyCtx.closePath();
    bodyCtx.stroke();
    bodyCtx.fillStyle = "rgba(0, 0, 0, 0.02)";
    bodyCtx.fillRect(0, 0, (xCoord % bodyGraph.width) - 2, bodyGraph.height);
    bodyCtx.fillRect((xCoord % bodyGraph.width) + 2, 0, bodyGraph.width, bodyGraph.height);
  }
}

// draw and animate
function draw() {
  continuous = ui.continuous.checked;
  trace = ui.trace.checked;
  fade = trace ? ui.fade.checked : false;
  drawGravity = ui.drawGravity.checked;
  drawGravityStrength = ui.drawGravityStrength.checked;
  drawGThreshold = ui.drawGThreshold.checked;
  drawVector = ui.drawVector.checked;
  collide = ui.collide.checked;
  drawField = ui.heatmap.checked;

  debug = false;
  if (debug) {
    trace = false;
    drawGravity = false;
    drawGravityStrength = false;
    drawVector = false;
  }

  updateGraphs(100);

  frameByFrame ? setTimeout(draw, frameByFrame) : requestAnimationFrame(draw);

  maxBody = bodies[0];

  // check draw settings and draw stuff
  {
    if (trackBody) track(trackBody);
    if (panOffset.x != 0 || panOffset.y != 0) {
      pan(panOffset, false);
      trace = false;
    }
    if (fade && trace && timestep) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(center.x - viewport.x / 2, center.y - viewport.y / 2, viewport.x, viewport.y);
    } else if (!trace && drawField && maxBody != null && G) {
      calcField();
    } else if (!trace) {
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.fillRect(center.x - viewport.x / 2, center.y - viewport.y / 2, viewport.x, viewport.y);
    }
    // draw collision box
    if (collide) {
      if (!collideOffset.x && !collideOffset.y) {
        collideOffset.x = currentOffset.x;
        collideOffset.y = currentOffset.y;
      }
      if (trackBody) {
        ctx.fillStyle = "rgba(0, 0, 0, 1)";
        ctx.fillRect(center.x - viewport.x / 2, center.y - viewport.y / 2, viewport.x, viewport.y);
      }
      ctx.strokeStyle = "white";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        -collideOffset.x + currentOffset.x,
        -collideOffset.y + currentOffset.y,
        canvas.width,
        canvas.height
      );
    } else {
      collideOffset.x = collideOffset.y = 0;
    }
  }
  // loop through bodies, draw and update
  bodies.forEach((body) => {
    if (drawField && body.mass > maxBody.mass) maxBody = body;
    body.draw();
  });
  if (clearTrails) {
    ctx.fillStyle = "rgba(0, 0, 0, 1)";
    ctx.fillRect(center.x - viewport.x / 2, center.y - viewport.y / 2, viewport.x, viewport.y);
    clearTrails = false;
  }
}

function calcField() {
  let minL = 0.1;
  let res = heatmapRes / totalzoom;

  ctx.fillStyle = "hsl(240, 100%, " + (minL * 100) + "%)";
  ctx.fillRect(center.x - viewport.x / 2, center.y - viewport.y / 2, viewport.x, viewport.y);

  let maxPotential = (0.25 * maxBody.mass) / maxBody.radius ** 2;

  for (let y = center.y - viewport.y / 2; y <= center.y + viewport.y / 2; y += res) {
    for (let x = center.x - viewport.x / 2; x <= center.x + viewport.x / 2; x += res) {
      let xyPotential = { x: 0, y: 0 };
      bodies.forEach((body) => {
        let distance = Math.hypot(body.pos.x - x - res / 2, body.pos.y - y - res / 2);
        if (distance >= body.radius - res) {
          let gForce = (G * body.mass) / (distance * distance);
          xyPotential.x += (gForce * (body.pos.x - x)) / distance;
          xyPotential.y += (gForce * (body.pos.y - y)) / distance;
        }
      });
      let potential = Math.hypot(xyPotential.x, xyPotential.y);
      if (potential >= 0.05) {
        ctx.fillStyle = "hsl("
        + (240 - potential.map(minPotential, maxPotential, 0, 240))
        + ", 100%, "
        + potential.map(minPotential, maxPotential, minL * 100, 50) + "%)";
        ctx.fillRect(x, y, res, res);
      }
    }
  }
}

// pan by adjusting positions of all bodies
function pan(offset = { x: 0, y: 0 }, clrTrails = true) {
  // remove faint trails
  if (clrTrails) {
    continuous = false;
    clearTrails = true;
  }
  currentOffset.x += offset.x;
  currentOffset.y += offset.y;
  bodies.forEach((body) => {
    body.pos.x += offset.x;
    body.pos.y += offset.y;
  });
  ui.offset.innerText = Math.round(currentOffset.x) + " Y=" + Math.round(currentOffset.y);
}

// track body by panning and zeroing velocity
function track(body) {
  if (newBody) {
    pan({ x: -currentOffset.x, y: -currentOffset.y });
    pan({
      x: center.x - body.pos.x - currentOffset.x,
      y: center.y - body.pos.y - currentOffset.y,
    });
  }
  pan({ x: -body.vel.x * timestep, y: -body.vel.y * timestep }, false);
  newBody = false;
}
