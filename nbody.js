// todo: optimize gravity by lumping things a certain distance away together as one gravitating body
// distance from body and lumping radius is proportional

// for some reason loading the 500 body preset, deleting bodies, then loading galaxies *significantly* improves performance

frameDelayMs = 0; // Chromebook Simulator (or for debug purposes) 0 for default fps

// initialize user interface elements
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
  drawCoM: document.getElementById("drawCoM"),
  trackCoM: document.getElementById("trackCoM"),
  colorByVel: document.getElementById("colorByVel"),
  globalCollide: document.getElementById("globalCollide"),
  drawOffscreen: document.getElementById("drawOffscreen"),
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
let G = 1;
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
  drawCoM,
  CoM,
  trackCoM,
  globalCollide,
  drawOffscreen;
let continuous = true;

// SIGNIFICANT PERF IMPROVEMENTS!?!?!?! HOW!?!?
ui.G.value = ui.GOut.innerText = 1;
ui.drawVector.checked = drawVector = false;
ui.drawGravity.checked = drawGravity = false;
ui.timestep.value = ui.tOut.innerText = 0.25;
ui.drawGravityStrength.checked = drawGravityStrength = false;

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
let minL = 0.1;
let colorByVel;

initParams();
draw();

// form event listeners
{
  // button listeners
  {
    ui.panel.onclick = (event) => {
      switch (event.target) {
        case ui.randBtn: // generate random
          initParams();
          initRandBodies(numBodies, minMass, maxMass, initVel);
          activeBodies = bodies.length;
          ui.bodyCount.innerText = activeBodies;
          break;
        case ui.loadBtn: // load preset
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
            case "2": // two body system
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
              const g1num = randInt(500, 1000);
              const g2num = randInt(500, 1000);
              generateGalaxy(
                {
                  x: randInt(center.x - viewport.x / 2, center.x + viewport.x / 2),
                  y: randInt(center.y - viewport.y / 2, center.y + viewport.y / 2),
                },
                { x: randInt(-1, 1), y: randInt(-1, 1) },
                g1num,
                1,
                2,
                g1num / 2,
                0,
                false
              );
              generateGalaxy(
                {
                  x: randInt(center.x - viewport.x / 2, center.x + viewport.x / 2),
                  y: randInt(center.y - viewport.y / 2, center.y + viewport.y / 2),
                },
                { x: randInt(-1, 1), y: randInt(-1, 1) },
                g2num,
                1,
                2,
                g2num / 2,
                randInt(0, 2),
                false
              );
              break;
            case "5": // solar system formation
              ui.trace.checked = false;
              ui.drawGravity.checked = false;
              ui.drawGravityStrength.checked = false;
              ui.drawVector.checked = false;
              ui.timestep.value = ui.tOut.innerText = 0.5;
              generateGalaxy(
                {
                  x: center.x,
                  y: center.y,
                },
                { x: 0, y: 0 },
                1500,
                5,
                10,
                1000,
                0,
                true
              );
              break;
            case "6":
              ui.trace.checked = false;
              ui.drawGravity.checked = false;
              ui.drawGravityStrength.checked = false;
              ui.drawVector.checked = false;
              ui.timestep.value = ui.tOut.innerText = 0.5;
              generateSolarSystem({ x: center.x, y: center.y }, { x: 0, y: 0 });
              break;
          }
          activeBodies = bodies.length;
          ui.bodyCount.innerText = activeBodies;
          break;
        case ui.add:
          activeBodies += 1;
          ui.bodyCount.innerText = activeBodies;
          initParams();
          initRandBodies(1, minMass, maxMass, initVel);
          break;
        case ui.clear:
          bodies = [];
          ctx.fillStyle = "rgba(0, 0, 0, 1)";
          ctx.fillRect(center.x - viewport.x / 2, center.y - viewport.y / 2, viewport.x, viewport.y);
          activeBodies = bodies.length;
          ui.bodyCount.innerText = activeBodies;
          break;
        case ui.clrOffscreen:
          let offset = {
            x: collide ? -collideOffset.x + currentOffset.x : 0,
            y: collide ? -collideOffset.y + currentOffset.y : 0,
          };
          bodies.forEach((body) => {
            if (!isInView(body, offset)) {
              remove(bodies, body.id);
            }
          });
          activeBodies = bodies.length;
          ui.bodyCount.innerText = activeBodies;
          break;
        case ui.toggle:
          paused = !paused;
          if (timestep) {
            oldTimestep = timestep;
            timestep = 0;
            ui.timestep.value = 0;
          } else {
            timestep = oldTimestep;
            ui.timestep.value = timestep;
          }
          break;
      }
    }
    ui.collapse.onclick = () => {
      ui.collapse.innerText = ui.collapse.innerText === ">" ? "<" : ">";
      if (ui.panel.classList.contains("hidden")) {
        ui.panel.classList.remove("hidden");
      } else {
        ui.panel.classList.add("hidden");
      }
    };
  }

  // input listeners
  {
    ui.trace.addEventListener("input", () => {
      if (ui.trace.checked) {
        ui.heatmap.checked = drawField = false;
      }
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

    ui.trackCoM.addEventListener("input", () => {
      ui.drawCoM.checked = true;
      trackCoM = ui.trackCoM.checked;
    });
  }
}

// interaction event listeners
{
  // mouse events
  {
    canvas.onmousedown = (event) => {
      if (event.ctrlKey || event.altKey) {
        bodies.push(
          new Body(
            ui.xp.value
              ? parseInt(ui.xp.value)
              : (event.clientX / canvas.width) * viewport.x + center.x - viewport.x / 2,
            ui.yp.value
              ? parseInt(ui.yp.value)
              : (event.clientY / canvas.height) * viewport.y + center.y - viewport.y / 2,
            parseInt(ui.vx.value),
            parseInt(ui.vy.value),
            parseInt(ui.radius.value ? ui.radius.value : getRadius(ui.mass.value)),
            parseInt(ui.mass.value),
            randColor()
          )
        );

        activeBodies += 1;
        ui.bodyCount.innerText = activeBodies;
      } else {
        canvas.addEventListener("mousemove", handleMouseMove);
      }
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
  }

  // key events
  {
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
            ui.colorByVel.click();
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
          case "Digit1":
            ui.drawVector.click();
            break;
          case "Digit2":
            ui.drawGravity.click();
            break;
          case "Digit3":
            ui.drawCoM.click();
            break;
          case "Digit4":
            ui.trackCoM.click();
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
}

// body presets
{
  /**
   * Randomly generate bodies based on params
   * @param {Number} num number of random bodies to generate
   * @param {Number} minSize minimum mass
   * @param {Number} maxSize maximum mass
   * @param {Number} v maximum initial velocity
   * @param {Boolean} randColors whether or not to randomly color the bodies
   */
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

  /**
   * Generates a galaxy
   * @param {Object} centerPos the position of the center
   * @param {Object} vel initial velocity of the galaxy
   * @param {Number} num the number of stars
   * @param {Number} minMass minimum mass of stars
   * @param {Number} maxMass maximum mass of stars
   * @param {Number} radius radius of the galaxy
   * @param {Number} rotDir rotation direction 0 or 1
   * @param {Boolean} bodyCollide whether or not the stars can collide
   */
  function generateGalaxy(
    centerPos = { x: center.x, y: center.y },
    vel = { x: 0, y: 0 },
    num = 500,
    minMass = 1,
    maxMass = 2,
    radius = 500,
    rotDir = 0,
    bodyCollide = false
  ) {
    // center
    let centerMass = num * 100;
    let centerRadius = 10; //getRadius(num * 100);
    bodies.push(new Body(centerPos.x, centerPos.y, vel.x, vel.y, 10, centerMass));
    for (let i = 0; i < num; i++) {
      let mass = randInt(minMass, maxMass);
      let r = getRadius(mass);
      let angle = randInt(0, 360);
      let distance = Math.pow(2, -2 * Math.random()).map(0.25, 1, 0, 1) * radius + centerRadius; //randInt(centerRadius * 2, radius)
      let ac = (G * centerMass) / (distance * distance);
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
          bodyCollide
        )
      );
    }
  }

  /**
   * Generates a solar system
   * @param {Object} centerPos the position of the center
   * @param {Object} vel initial velocity of the system
   * @param {Number} num the number of planets
   * @param {Number} minMass minimum mass of planets
   * @param {Number} maxMass maximum mass of planets
   * @param {Number} radius radius of the system
   * @param {Number} rotDir rotation direction 0 or 1
   * @param {Boolean} bodyCollide whether or not the planets can collide
   */
  function generateSolarSystem(
    centerPos = { x: center.x, y: center.y },
    vel = { x: 0, y: 0 },
    num = 8,
    minMass = 10000,
    maxMass = 100000,
    radius = 10000,
    rotDir = 0,
    bodyCollide = true
  ) {
    // center
    let centerMass = maxMass * 100;
    let centerRadius = getRadius(maxMass * 10000);
    bodies.push(new Body(centerPos.x, centerPos.y, vel.x, vel.y, 0, centerMass));
    for (let i = 0; i < num; i++) {
      let mass = randInt(minMass, maxMass);
      let r = getRadius(mass);
      let angle = randInt(0, 360);
      let distance = randInt(centerRadius * 2, radius);
      let ac = (G * centerMass) / (distance * distance);
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
          bodyCollide
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

/**
 * Removes bodies during collision
 * @param {Array} arr input array
 * @param {Number} id id of the value to remove
 * @returns the input array without the removed body
 */
function remove(arr, id) {
  const index = arr.findIndex((body) => body.id === id);
  if (index !== -1) {
    arr.splice(index, 1);
  } else {
    console.error("Could not remove ", id);
  }
  return arr;
}

/**
 * Generates random integers
 * @param {Number} min minimum inclusive
 * @param {Number} max maximum exclusive
 */
function randInt(min, max) {
  min = Math.ceil(min);
  max = ~~(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

/**
 * Check if the body is in view
 * @param {Body} body the body to check
 * @param {Object} offset viewport offset
 */
const isInView = (body, offset = { x: 0, y: 0 }) =>
  body.xPos <= offset.x + center.x + viewport.x / 2 + body.radius &&
  body.xPos >= offset.x + center.x - viewport.x / 2 - body.radius &&
  body.yPos <= offset.x + center.y + viewport.y / 2 + body.radius &&
  body.yPos >= offset.x + center.y - viewport.y / 2 - body.radius;

/**
 * Map values from one range to another
 * @param {Number} in_min minimum input value
 * @param {Number} in_max maximum input value
 * @param {Number} out_min minimum output value
 * @param {Number} out_max maximum output value
 * @param {Boolean} clampMax whether to clamp the maximum value if the input exceeds max
 * @param {Boolean} clampMin whether to clamp the minimum value if the input exceeds min
 */
Number.prototype.map = function (
  in_min,
  in_max,
  out_min,
  out_max,
  clampMax = false,
  clampMin = false
) {
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
    // this.pos = { x: xPos, y: yPos };
    this.xPos = xPos;
    this.yPos = yPos;
    // this.vel = { x: xVel, y: yVel };
    this.xVel = xVel;
    this.yVel = yVel;
    // this.prevPos = { x: xPos, y: yPos };
    this.xPrev = xPos;
    this.yPrev = yPos;
    // this.force = { x: 0, y: 0 };
    this.xForce = 0;
    this.yForce = 0;
    // this.accel = { x: 0, y: 0 };
    this.xAccel = 0;
    this.yAccel = 0;
    this.radius = r ? r : getRadius(mass);
    this.mass = mass ? mass : (4 / 3) * Math.PI * Math.pow(r, 3);
    this.color = color;
    this.id = bodyCount++;
    this.collide = collide;
  }
  getMomentum() {
    return { x: this.xVel * this.mass, y: this.yVel * this.mass };
  }
  draw() {
    let speed = colorByVel ? Math.hypot(this.xVel, this.yVel) : 0;
    let hue = colorByVel ? Math.max(240 - 10 * speed, 0) : 0;
    let drawColor = colorByVel ? "hsl(" + hue + ", 100%, 50%)" : this.color;

    // Draw the body
    {
      if (!isInView(this) && drawOffscreen) {
        // offscreen indicators
        // use slope to draw lines pointing toward center
        let bodyPos = { x: this.xPos - center.x, y: this.yPos - center.y };
        let slope = (this.yPos - center.y) / (this.xPos - center.x);
        let angle = Math.abs(Math.atan2(bodyPos.y, bodyPos.x));
        let x =
          (Math.sign(bodyPos.x) * (center.x - (this.radius / 2 + 5) * Math.abs(Math.cos(angle)))) /
          totalzoom;
        let y =
          (Math.sign(bodyPos.y) * (center.y - (this.radius / 2 + 5) * Math.sin(angle))) / totalzoom;
        ctx.beginPath();
        ctx.strokeStyle = drawColor;
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
            ctx.strokeStyle = drawColor;
            ctx.moveTo(this.xPos, this.yPos);
            ctx.lineTo(this.xPrev, this.yPrev);
            ctx.closePath();
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.arc(this.xPrev, this.yPrev, this.radius, 0, Math.PI * 2, true);
          ctx.closePath();
          ctx.fillStyle = drawColor;
          ctx.fill();
        }

        // draw the body
        ctx.beginPath();
        ctx.arc(this.xPos, this.yPos, this.radius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fillStyle = drawColor;
        ctx.fill();

        // center
        if (this.radius > 3) {
          ctx.beginPath();
          ctx.arc(
            this.xPos,
            this.yPos,
            this.radius < 1.5 ? this.radius : 1.5,
            0,
            Math.PI * 2,
            true
          );
          ctx.closePath();
          ctx.fillStyle = "black";
          ctx.fill();
        }

        // black outline for field visualization
        if (drawField) {
          ctx.strokeStyle = "black";
          ctx.beginPath();
          ctx.arc(this.xPos, this.yPos, this.radius, 0, Math.PI * 2, true);
          ctx.closePath();
          ctx.stroke();
        }

        // motion vector
        if (drawVector) {
          let mult = 10 * timestep;
          ctx.beginPath();
          ctx.strokeStyle = "blue";
          ctx.lineWidth = 1 / totalzoom;
          ctx.moveTo(this.xPos, this.yPos);
          ctx.lineTo(this.xPos + mult * this.xVel, this.yPos + mult * this.yVel);
          ctx.closePath();
          ctx.stroke();
        }
        // acceleration vector
        if (drawGravity) {
          let mult = 50 * timestep;
          ctx.beginPath();
          ctx.lineWidth = 1 / totalzoom;
          ctx.strokeStyle = "red";
          ctx.moveTo(this.xPos, this.yPos);
          ctx.lineTo(this.xPos + mult * this.accel.x, this.yPos + mult * this.accel.y);
          ctx.closePath();
          ctx.stroke();
        }
      }
    }

    // Update the position of the body
    {
      // // this.accel = gravity(this, bodies.indexOf(this));
      // this.accel.x = this.xForce / this.mass;
      // this.accel.y = this.yForce / this.mass;
      this.xAccel = this.xForce / this.mass;
      this.yAccel = this.yForce / this.mass;

      // this.prevPos.x = this.xPos;
      // this.prevPos.y = this.yPos;
      this.xPrev = this.xPos;
      this.yPrev = this.yPos;
      // edge collision - set accel to 0 when colliding to prevent changes in velocity
      if (collide) {
        if (
          this.xPos >= -collideOffset.x + currentOffset.x + canvas.width - this.radius ||
          this.xPos <= -collideOffset.x + currentOffset.x + this.radius
        ) {
          this.xVel = -this.xVel;
          this.xAccel = 0;
        }
        if (
          this.yPos >= -collideOffset.y + currentOffset.y + canvas.height - this.radius ||
          this.yPos <= -collideOffset.y + currentOffset.y + this.radius
        ) {
          this.yVel = -this.yVel;
          this.xAccel = 0;
        }
      }
      // implement acceleration
      // this.xVel += this.accel.x * timestep;
      // this.yVel += this.accel.y * timestep;
      this.xVel += this.xAccel * timestep;
      this.yVel += this.yAccel * timestep;
      // integrate velocity every frame
      this.xPos += this.xVel * timestep;
      this.yPos += this.yVel * timestep;
      // reset forces
      this.xForce = this.yForce = 0;
    }
  }
}

// Calculate gravitational forces between each body (more efficient - does each calc once) then draw
function runSim() {
  // iterate through all combinations of bodies and add force to body total
  bodies.forEach((body, index) => {
    const body1 = body;
    if (bodies.length > 1 && timestep) {
      for (let i = index + 1; i < bodies.length; i++) {
        // calc gravity between body and bodies[i], then add forces

        const body2 = bodies[i];
        // get distance
        // const distance = {
        //   x: body2.xPos - body1.xPos,
        //   y: body2.yPos - body1.yPos,
        // };
        const xDist = body2.xPos - body1.xPos;
        const yDist = body2.yPos - body1.yPos;
        // let force = { x: 0, y: 0 };
        // let xForce = 0, yForce = 0;
        const sqr = Math.max(xDist * xDist + yDist * yDist, 1);

        const distThreshSqr = (body2.radius + body1.radius) * (body2.radius + body1.radius);

        if (
          sqr <= distThreshSqr &&
          bodies.includes(body1) &&
          bodies.includes(body2) &&
          body1.id != body2.id
        ) {
          // don't skip a body after removing it
          if (globalCollide && body2.collide && body1.collide && collision(body1, body2) < i) i--;
        } else {
          // get total gravity
          const gForce = G * (body2.mass * body1.mass) / sqr; // Most Time Consuming

          // get the components of the force
          const dist = Math.sqrt(sqr);
          const xForce = (gForce * xDist) / dist;
          const yForce = (gForce * yDist) / dist;

          // apply the forces
          body1.xForce += xForce;
          body1.yForce += yForce;
          body2.xForce -= xForce;
          body2.yForce -= yForce;

          // draw gravity strength lines
          if (drawGravityStrength) {
            const strength = Math.abs(1 - 10 / (gForce + 10));
            const drawThreshold = drawGThreshold ? (trace ? 1e-4 : 1e-2) : 0;
            // determine whether to draw
            if (strength >= drawThreshold) {
              ctx.beginPath();
              ctx.strokeStyle =
                "rgba(" + (255 - 255 * strength) + ", " + 255 * strength + ",0 ," + strength + ")";
              ctx.lineWidth = 1 / totalzoom;
              ctx.moveTo(body2.xPos, body2.yPos);
              ctx.lineTo(body1.xPos, body1.yPos);
              ctx.closePath();
              ctx.stroke();
            }
          }
        }
      }
    }
    body1.draw();
  });
}

/**
 * Calculate collisions and merge smaller body into larger
 * @param {Body} body1 the first body
 * @param {Body} body2 the second body
 */
function collision(body1, body2) {
  collisionCount += 1;
  ui.collisionCount.innerText = collisionCount;
  activeBodies = bodies.length - 1;
  ui.bodyCount.innerText = activeBodies;

  // merge masses and calculate corresponding radius and velocity based on momentum
  let mass = body1.mass + body2.mass;
  let larger = body1.mass > body2.mass ? body1 : body2;
  let smaller = larger === body1 ? body2 : body1;
  let smallerIndex = bodies.indexOf(smaller);

  let momentum = {
    x: body1.getMomentum().x + body2.getMomentum().x,
    y: body1.getMomentum().y + body2.getMomentum().y,
  };

  // change larger body properties
  larger.xPos = (body1.xPos * body1.mass + body2.xPos * body2.mass) / mass;
  larger.yPos = (body1.yPos * body1.mass + body2.yPos * body2.mass) / mass;
  if (Math.abs(larger.radius - getRadius(larger.mass)) < 0.1) larger.radius = getRadius(mass);
  larger.mass = mass;
  // larger.vel = { x: momentum.x / mass, y: momentum.y / mass };
  larger.xVel = momentum.x / mass;
  larger.yVel = momentum.y / mass
  // maintain tracking
  if (trackBody === smaller) trackBody = larger;
  // remove the smaller object
  remove(bodies, smaller.id);
  return smallerIndex;
}

// calculate gravitational field
function calcField() {
  let res = heatmapRes / totalzoom;

  ctx.fillStyle = "hsl(240, 100%, " + minL * 100 + "%)";
  ctx.fillRect(center.x - viewport.x / 2, center.y - viewport.y / 2, viewport.x, viewport.y);

  let maxPotential = (0.25 * maxBody.mass) / maxBody.radius ** 2;

  for (let y = center.y - viewport.y / 2; y <= center.y + viewport.y / 2; y += res) {
    for (let x = center.x - viewport.x / 2; x <= center.x + viewport.x / 2; x += res) {
      let xyPotential = { x: 0, y: 0 };
      bodies.forEach((body) => {
        let distance = Math.hypot(body.xPos - x - res / 2, body.yPos - y - res / 2);
        if (distance >= body.radius - res) {
          let gForce = (G * body.mass) / (distance * distance);
          xyPotential.x += (gForce * (body.xPos - x)) / distance;
          xyPotential.y += (gForce * (body.yPos - y)) / distance;
        }
      });
      let potential = Math.hypot(xyPotential.x, xyPotential.y);
      if (potential >= 0.05) {
        ctx.fillStyle =
          "hsl(" +
          (240 - potential.map(minPotential, maxPotential, 0, 240)) +
          ", 100%, " +
          potential.map(minPotential, maxPotential, minL * 100, 50) +
          "%)";
        ctx.fillRect(x, y, res, res);
      }
    }
  }
}

// calculate center of mass of the system
function calcCoM() {
  // calc x and y CoM using (m1x1+m2x2...) / (m1+m2...)
  let CoM = { x: 0, y: 0 };
  let mass = 0;
  bodies.forEach((body) => {
    CoM.x += body.xPrev * body.mass; // use prevpos to align with draw
    CoM.y += body.yPrev * body.mass;
    mass += body.mass;
  });
  CoM.x /= mass;
  CoM.y /= mass;
  return CoM;
}

/**
 * Pan by adjusting positions of all bodies
 * @param {Object} offset
 * @param {Boolean} clrTrails
 */
function pan(offset = { x: 0, y: 0 }, clrTrails = true) {
  // remove faint trails
  if (clrTrails) {
    continuous = false;
    clearTrails = true;
  }
  currentOffset.x += offset.x;
  currentOffset.y += offset.y;
  bodies.forEach((body) => {
    body.xPos += offset.x;
    body.yPos += offset.y;
  });
  ui.offset.innerText = Math.round(currentOffset.x) + " Y=" + Math.round(currentOffset.y);
}

/**
 * Track body by panning and zeroing velocity
 * @param {Body} body the body to track
 */
function track(body) {
  if (newBody) {
    pan({ x: -currentOffset.x, y: -currentOffset.y });
    pan({
      x: center.x - body.xPos - currentOffset.x,
      y: center.y - body.yPos - currentOffset.y,
    });
  }
  pan({ x: -body.xVel * timestep, y: -body.yVel * timestep }, false);
  newBody = false;
}

// draw and animate
function draw() {
  // update with user input
  colorByVel = ui.colorByVel.checked;
  trace = ui.trace.checked;
  fade = ui.fade.checked;
  drawGravity = ui.drawGravity.checked;
  drawGravityStrength = ui.drawGravityStrength.checked;
  drawGThreshold = ui.drawGThreshold.checked;
  drawVector = ui.drawVector.checked;
  collide = ui.collide.checked;
  drawField = ui.heatmap.checked;
  drawCoM = ui.drawCoM.checked;
  trackCoM = ui.trackCoM.checked;
  globalCollide = ui.globalCollide.checked;
  drawOffscreen = ui.drawOffscreen.checked;

  continuous = true;

  debug = false;
  if (debug) {
    trace = false;
    drawGravity = false;
    drawGravityStrength = false;
    drawVector = false;
  }

  updateGraphs(100);

  frameDelayMs ? setTimeout(draw, frameDelayMs) : requestAnimationFrame(draw);

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
  runSim();

  if (bodies.length && drawCoM) {
    CoM = calcCoM();
    ctx.beginPath();
    ctx.arc(CoM.x, CoM.y, 2 / totalzoom, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = "white";
    ctx.fill();
    if (trackCoM) {
      pan({ x: center.x - CoM.x, y: center.y - CoM.y }, false);
    }
  }
  if (clearTrails) {
    ctx.fillStyle = "rgba(0, 0, 0, 1)";
    ctx.fillRect(center.x - viewport.x / 2, center.y - viewport.y / 2, viewport.x, viewport.y);
    clearTrails = false;
  }
}

/**
 * Display framerate and number of bodies
 * @param {Number} interval interval to measure and display values
 */
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
