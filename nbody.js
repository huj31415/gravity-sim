// todo: implement electrostatic force and field
let frameDelayMs = 0; // Chromebook Simulator (or for debug purposes): 0 for default requestAnimationFrame fps

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
  fadeStrength: document.getElementById("fadeStrength"),
  fadeOutput: document.getElementById("fadeOutput"),
  drawMouseVector: document.getElementById("drawMouseVector"),
  inelastic: document.getElementById("collideType"),
  CoR: document.getElementById("CoR"),
  CoROut: document.getElementById("CoROut"),
  maxCharge: document.getElementById("maxCharge"),
  minCharge: document.getElementById("minCharge"),
  charge: document.getElementById("charge"),
  electrostatic: document.getElementById("electrostatic"),
  colorByCharge: document.getElementById("colorByCharge"),
  K: document.getElementById("K"),
  KOut: document.getElementById("KOut"),
  uniformg: document.getElementById("uniformg"),
  uniformgOut: document.getElementById("uniformgOut"),
  gravity: document.getElementById("gravity"),
  immovable: document.getElementById("immovable"),
  decoupleFPS: document.getElementById("decoupleFPS"),
};

// utilities
const getRadius = (mass) => Math.abs(Math.cbrt((mass * (3 / 4)) / Math.PI));

const randColor = () => "#" + (~~(Math.random() * (16777215 - 5592405) + 5592405)).toString(16);

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
let G = ui.G.value;
let K = ui.K.value;
const Gconst = 6.6743 * Math.pow(10, -11);
let numBodies, maxMass, minMass, initVel, timestep, oldTimestep, CoM, maxCharge, minCharge, uniformg;
let continuous = true;
let CoR = 1;

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
let mouseX, mouseY;

// heatmap
let maxBody;
const minPotential = 0;
const heatmapRes = 4;
let minL = 0.1;

let colorBySpeed = ui.colorByVel.checked,
  trace = ui.trace.checked,
  fade = ui.fade.checked,
  gravity = ui.gravity.checked,
  drawGravity = ui.drawGravity.checked,
  drawGravityStrength = ui.drawGravityStrength.checked,
  drawGThreshold = ui.drawGThreshold.checked,
  drawVector = ui.drawVector.checked,
  collide = ui.collide.checked,
  drawField = ui.heatmap.checked,
  drawCoM = ui.drawCoM.checked,
  trackCoM = ui.trackCoM.checked,
  globalCollide = ui.globalCollide.checked,
  drawOffscreen = ui.drawOffscreen.checked,
  fadeStrength = ui.fadeStrength.value,
  drawMouseVector = ui.drawMouseVector.checked,
  inelastic = ui.inelastic.checked,
  electrostatic = ui.electrostatic.checked,
  colorByCharge = ui.colorByCharge.checked;

initParams();
draw();

// events
{
  // form event listeners
  {
    // button listeners
    {
      ui.panel.onclick = (event) => {
        // buttons
        switch (event.target) {
          case ui.randBtn: // generate random
            initParams();
            initRandBodies(numBodies, minMass, maxMass, minCharge, maxCharge, initVel, true);
            activeBodies = bodies.length;
            ui.bodyCount.innerText = activeBodies;
            break;
          case ui.loadBtn: // load preset
            initParams();
            switch (ui.presets.value) {
              case "0": // 500 body chaos
                // ui.G.value = ui.GOut.innerText = 1;
                ui.drawVector.checked = drawVector = false;
                ui.drawGravity.checked = drawGravity = false;
                ui.timestep.value = ui.tOut.innerText = 0.5;
                ui.numBodies.value = numBodies = 500;
                ui.maxMass.value = maxMass = 100;
                ui.minMass.value = minMass = 50;
                ui.drawGravityStrength.checked = drawGravityStrength = false;
                initRandBodies(numBodies, minMass, maxMass, minCharge, maxCharge, initVel);
                break;
              case "1": // sun and 3 planets
                ui.collide.checked = false;
                ui.G.value = ui.GOut.innerText = G = 0.15;
                sun3PlanetsSystem();
                break;
              case "2": // two body system
                ui.collide.checked = false;
                // ui.G.value = ui.GOut.innerText = G = 0.15;
                binarySystem();
                break;
              case "3": // two body system (circular)
                ui.collide.checked = false;
                // ui.G.value = ui.GOut.innerText = G = 0.15;
                binarySystem(true);
                break;
              case "4": // sun planets and moon
                ui.collide.checked = false;
                ui.G.value = ui.GOut.innerText = G = 0.25;
                sunPlanetsMoonsSystem();
                break;
              case "5": // galaxies
                ui.G.value = ui.GOut.innerText = 1;
                ui.drawVector.checked = drawVector = false;
                ui.drawGravity.checked = drawGravity = false;
                ui.timestep.value = ui.tOut.innerText = timestep = 0.1;
                ui.drawGravityStrength.checked = drawGravityStrength = false;
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
              case "6": // solar system formation
                ui.G.value = ui.GOut.innerText = 1;
                ui.drawVector.checked = drawVector = false;
                ui.drawGravity.checked = drawGravity = false;
                ui.timestep.value = ui.tOut.innerText = timestep = 0.25;
                ui.drawGravityStrength.checked = drawGravityStrength = false;
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
              case "7":
                ui.G.value = ui.GOut.innerText = 1;
                ui.drawVector.checked = drawVector = false;
                ui.drawGravity.checked = drawGravity = false;
                ui.timestep.value = ui.tOut.innerText = timestep = 0.25;
                ui.drawGravityStrength.checked = drawGravityStrength = false;
                generateSolarSystem({ x: center.x, y: center.y }, { x: 0, y: 0 });
                break;
              case "8":
                initNewtonsCradle();
                break;
              case "9":
                initPiCollisions();
                break;
              case "10":
                initGrid();
                break;
            }
            activeBodies = bodies.length;
            ui.bodyCount.innerText = activeBodies;
            break;
          case ui.add:
            activeBodies += 1;
            ui.bodyCount.innerText = activeBodies;
            initParams();
            initRandBodies(1, minMass, maxMass, minCharge, maxCharge, initVel);
            break;
          case ui.clear:
            bodies = [];
            ctx.fillStyle = "rgba(0, 0, 0, 1)";
            ctx.fillRect(
              center.x - viewport.x / 2,
              center.y - viewport.y / 2,
              viewport.x,
              viewport.y
            );
            activeBodies = bodies.length;
            ui.bodyCount.innerText = activeBodies;
            collisionCount = ui.collisionCount.innerText = 0;
            break;
          case ui.clrOffscreen:
            let offset = {
              x: collide ? -collideOffset.x + currentOffset.x : 0,
              y: collide ? -collideOffset.y + currentOffset.y : 0,
            };
            bodies.forEach((body) => {
              if (!isInView(body, offset)) {
                remove(body);
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
        // update settings
        colorBySpeed = ui.colorByVel.checked;
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
        drawMouseVector = ui.drawMouseVector.checked;
        inelastic = ui.inelastic.checked;
        gravity = ui.gravity.checked;
        electrostatic = ui.electrostatic.checked;
        colorByCharge = ui.colorByCharge.checked;
        frameDelayMs = ui.decoupleFPS.checked ? 0.1 : 0;
      };
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
        ui.tOut.innerText = parseFloat(event.target.value);
        timestep = parseFloat(event.target.value);
      });
      ui.CoR.addEventListener("input", (event) => {
        ui.CoROut.innerText = parseFloat(event.target.value);
        CoR = parseFloat(event.target.value);
      });
      ui.fadeStrength.addEventListener("input", (event) => {
        ui.fadeOutput.innerText = parseFloat(event.target.value);
        fadeStrength = parseFloat(event.target.value);
      });

      ui.G.addEventListener("input", (event) => {
        ui.GOut.innerText = parseFloat(event.target.value);
        G = parseFloat(event.target.value);
      });

      ui.uniformg.addEventListener("input", (event) => {
        ui.uniformgOut.innerText = parseFloat(event.target.value);
        uniformg = parseFloat(event.target.value);
        if (uniformg) {
          collide = true;
          ui.collide.checked = true;
        }
      });

      ui.K.addEventListener("input", (event) => {
        ui.KOut.innerText = parseFloat(event.target.value);
        K = parseFloat(event.target.value);
      });

      ui.initVel.addEventListener("input", (event) => {
        initVel = parseFloat(event.target.value);
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
              randColor(),
              true,
              parseInt(ui.charge.value),
              ui.immovable.checked
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

      canvas.onmousemove = (event) => {
        mouseX = event.clientX;
        mouseY = event.clientY;
      };

      canvas.onwheel = (event) => {
        if (!event.ctrlKey) {
          zoom(Math.sign(event.deltaY) < 0 ? 1.05 : 1 / 1.05);
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
              if (trackCoM) {
                trackCoM = false;
                ui.trackCoM.checked = false;
              }
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
              // ui.colorByVel.click();
              ui.inelastic.click();
              break;
            case "KeyF":
              ui.fade.click();
              break;
            case "KeyG":
              // ui.drawGravityStrength.click();
              ui.gravity.click();
              break;
            case "KeyK":
              ui.electrostatic.click();
              break;
            case "KeyY":
              ui.colorByVel.click();
              break;
            case "KeyH":
              ui.colorByCharge.click();
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
              zoom(0);
              break;
            case "KeyZ":
              zoom(1.05);
              break;
            case "KeyX":
              zoom(1 / 1.05);
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
            case "Period":
              timestep = ~~((timestep + 0.05) * 100) / 100;
              ui.timestep.value = ui.tOut.innerText = timestep;
              break;
            case "Comma":
              timestep = timestep <= 0.05 ? 0 : ~~((timestep - 0.05) * 100) / 100;
              ui.timestep.value = ui.tOut.innerText = timestep;
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
}


// body presets
{
  /**
   * Randomly generate bodies based on params
   * @param {Number} num number of random bodies to generate
   * @param {Number} minMass minimum mass
   * @param {Number} maxMass maximum mass
   * @param {Number} v maximum initial velocity
   * @param {Boolean} randColors whether or not to randomly color the bodies
   * @param {Boolean} zeroVel whether or not to set the velocity of the center of mass to 0
   */
  function initRandBodies(num, minMass = 3, maxMass = 5, minCharge = 0, maxCharge = 0, v = 0, randColors = true, zeroVel = false) {
    let xMomentum = 0;
    let yMomentum = 0;
    for (let i = 0; i < num - zeroVel; i++) {
      const mass = randInt(minMass, maxMass);
      const charge = randInt(minCharge, maxCharge);
      let r = getRadius(mass);
      const x = collide
        ? randInt(-collideOffset.x + currentOffset.x + 2 * r, -collideOffset.x + currentOffset.x + canvas.width - 2 * r)
        : randInt(center.x - viewport.x / 2 + 2 * r, center.x + viewport.x / 2 - 2 * r);
      const y = collide
        ? randInt(-collideOffset.y + currentOffset.y + 2 * r, -collideOffset.y + currentOffset.y + canvas.height - 2 * r)
        : randInt(center.y - viewport.y / 2 + 2 * r, center.y + viewport.y / 2 - 2 * r);
      const vx = (Math.random() - 0.5) * 2 * v;
      const vy = (Math.random() - 0.5) * 2 * v;
      xMomentum += vx * mass;
      yMomentum += vy * mass;
      bodies.push(
        new Body(x, y, vx, vy, r, 0, randColors ? randColor() : "white", true, charge)
      );
    }
    // set the last body to cancel out momentum of the system to 0
    if (zeroVel) {
      const mass = randInt(minMass, maxMass);
      let r = getRadius(mass);
      bodies.push(
        new Body(
          collide
            ? randInt(-collideOffset.x + currentOffset.x + 2 * r, -collideOffset.x + currentOffset.x + canvas.width - 2 * r)
            : randInt(center.x - viewport.x / 2 + 2 * r, center.x + viewport.x / 2 - 2 * r),
          collide
            ? randInt(-collideOffset.y + currentOffset.y + 2 * r, -collideOffset.y + currentOffset.y + canvas.height - 2 * r)
            : randInt(center.y - viewport.y / 2 + 2 * r, center.y + viewport.y / 2 - 2 * r),
          -xMomentum / mass, -yMomentum / mass, r, 0, randColors ? randColor() : "white"
        )
      );
      xMomentum += -xMomentum / mass;
      yMomentum += -yMomentum / mass;
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

  // set up the newton's cradle demonstration of momentum
  function initNewtonsCradle(num = 8, initV = 5, mass = 100000) {
    ui.inelastic.checked = inelastic = false;
    ui.G.value = G = 0;
    ui.collide.checked = collide = true;
    for (let i = 0; i < num - 1; i++) bodies.push(new Body(center.x - i, center.y, 0, 0, 0, mass));
    bodies.push(new Body(getRadius(mass), center.y, initV, 0, 0, mass));
  }

  // set up three objects to generate 31415 collisions
  function initPiCollisions(initV = 1) {
    frameDelayMs = 0.1;
    ui.decoupleFPS.checked = true;
    ui.inelastic.checked = inelastic = false;
    ui.gravity.checked = gravity = false;
    // ui.collide.checked = collide = true;
    let mass = 10;
    let ratio = 100000000;
    timestep = ui.timestep.value = 0.1;
    canvas.dispatchEvent(new Event("KeyZ"));
    bodies.push(new Body(center.x * 3.5, center.y, 0, 0, center.x * 2, 1, "default", true, 0, true));
    bodies.push(new Body(center.x - 150, center.y, 0, 0, 300, mass, "default", true, 0, false, "y"));
    bodies.push(new Body(center.x - 1000, center.y, initV, 0, 500, mass * ratio, "default", true, 0, false, "y"));
  }

  // set up a grid of bodies
  function initGrid(spacing = 25, mass = 1000, r = 12) {
    ui.gravity.checked = gravity = false;
    ui.inelastic.checked = inelastic = false;
    for (let x = spacing / 2; x < window.innerWidth; x += spacing) {
      for (let y = spacing / 2; y < window.innerHeight; y += spacing) {
        bodies.push(new Body(x, y, 0, 0, r, mass, "default"));
      }
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
  function sun3PlanetsSystem() {
    bodies.push(new Body(center.x, center.y, 0, 0, 50, 0, "yellow"));
    bodies.push(new Body(center.x, center.y + 200, 20, 0, 5, 0, "blue"));
    bodies.push(new Body(center.x + 300, center.y, 0, -10, 5, 0, "blue"));
    bodies.push(new Body(center.x - 500, center.y, 0, 8, 5, 0, "blue"));
  }

  // Binary system
  function binarySystem(circular = false) {
    const m1 = randInt(5000, 100000);
    const m2 = randInt(5000, 100000);
    const x1 = randInt(100, 500);
    const x2 = (m1 * x1) / m2;
    const circularVel = m2 / (m1 + m2) * Math.sqrt(G * m2 / x1);
    const v1 = circular ? circularVel : 
      randInt(circularVel / 2, circularVel * 1.1);
      // randInt(Math.cbrt(G * (m2) / (x1 + x2)), Math.sqrt(G * (m2 + m1) / 2 / (x1 + x2)));
    const v2 = (m1 * v1) / m2;

    bodies.push(new Body(center.x + x1, center.y, 0, v1, 0, m1));
    bodies.push(new Body(center.x - x2, center.y, 0, -v2, 0, m2));
    // bodies.push(new Body(center.x, center.y + 140, 3, 0, 20, 0, "blue"));
    // bodies.push(new Body(center.x, center.y - 140, -3, 0, 20, 0, "blue"));
  }

  // Sun, planets, moons
  function sunPlanetsMoonsSystem() {
    bodies.push(new Body(center.x, center.y, 0, 0, 30, 0, "yellow"));
    bodies.push(new Body(center.x, center.y - 150, 14, 0, 5, 0, "blue"));
    bodies.push(new Body(center.x, center.y - 170, 11, 0, 1, 0, "white"));
    bodies.push(new Body(center.x, center.y + 400, -8.7, 0, 5, 0, "blue"));
    bodies.push(new Body(center.x, center.y + 430, -6.7, 0, 1, 0, "white"));
  }
}

/** init form inputs */
function initParams() {
  if (!paused) timestep = parseFloat(ui.timestep.value);
  initVel = parseFloat(ui.initVel.value);
  G = parseFloat(ui.G.value);
  uniformg = parseFloat(ui.uniformg.value);
  if (uniformg) {
    collide = true;
    ui.collide.checked = true;
  }
  numBodies = parseFloat(ui.numBodies.value);
  maxMass = parseFloat(ui.maxMass.value);
  minMass = parseFloat(ui.minMass.value);
  minCharge = parseFloat(ui.minCharge.value);
  maxCharge = parseFloat(ui.maxCharge.value);
}

/**
 * Removes bodies during collision
 * @param {Array} arr input array
 * @param {Number} id id of the value to remove
 * @returns the input array without the removed body
 */
function remove(body) {
  const index = bodies.indexOf(body); //bodies.findIndex((body) => body.id === id);
  if (index != -1) {
    bodies.splice(index, 1);
  } else {
    console.error("Could not find id ", id);
  }
}

/**
 * Generates random integers
 * @param {Number} min minimum inclusive
 * @param {Number} max maximum exclusive
 */
function randInt(min, max) {
  min = Math.ceil(min);
  max = ~~max;
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
  mapped = clampMax ? Math.min(mapped, out_max) : mapped;
  mapped = clampMin ? Math.max(mapped, out_min) : mapped;
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
    collide = true,
    charge = 0,
    immovable = false,
    lockAxis = "none"
  ) {
    this.xPos = this.xPrev = xPos;
    this.yPos = this.yPrev = yPos;

    this.xVel = xVel;
    this.yVel = yVel;

    this.xAccel = 0;
    this.yAccel = 0;

    this.radius = r ? r : getRadius(mass);
    this.mass = mass ? mass : (4 / 3) * Math.PI * (r * r * r);

    this.charge = charge;

    this.color = color == "default" ? "gray" : color;
    this.id = bodyCount++;
    this.collide = collide;

    this.immovable = immovable;
    this.lockAxis = lockAxis;
  }
  /** Returns the x and y momentum */
  getMomentum() {
    return { x: this.xVel * this.mass, y: this.yVel * this.mass };
  }
  /** Draw the body onto the canvas */
  draw() {
    let drawColor = this.color;

    // change the color based on speed
    if (colorByCharge) {
      drawColor = "rgb(" + (128 + this.charge * 10) + ", " + (128 - Math.abs(this.charge * 10)) + ", " + (128 - this.charge * 10) + ")";
    } else if (colorBySpeed) {
      let speed = Math.hypot(
        this.xVel - (trackBody ? trackBody.xVel : 0),
        this.yVel - (trackBody ? trackBody.yVel : 0)
      );
      let hue = Math.max(240 - 10 * speed, 0);
      drawColor = "hsl(" + hue + ", 100%, 50%)";
    }

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
        if (trackBody != this && trace && !(collide && trackBody) && !this.immovable) {
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
          ctx.lineWidth = 1;
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
          let mult = 1; //timestep;
          ctx.beginPath();
          ctx.lineWidth = 1 / totalzoom;
          ctx.strokeStyle = "red";
          ctx.moveTo(this.xPos, this.yPos);
          ctx.lineTo(this.xPos + mult * this.xAccel, this.yPos + mult * this.yAccel);
          ctx.closePath();
          ctx.stroke();
        }
      }
    }

    // Update the position of the body
    if (!this.immovable) {
      this.xPrev = this.xPos;
      this.yPrev = this.yPos;

      // edge collision - set accel to 0 when colliding to prevent changes in velocity
      if (collide) {
        if (
          this.xPos >= -collideOffset.x + currentOffset.x + canvas.width - this.radius ||
          this.xPos <= -collideOffset.x + currentOffset.x + this.radius
        ) {
          collisionCount += 1;
          ui.collisionCount.innerText = collisionCount;
          this.xVel = CoR * -this.xVel;
          this.yVel *= CoR;
          // this.xAccel = 0;
          if (this.xPos >= -collideOffset.x + currentOffset.x + canvas.width - this.radius)
            this.xPos = -collideOffset.x + currentOffset.x + canvas.width - this.radius;
          else this.xPos = -collideOffset.x + currentOffset.x + this.radius;
        }
        if (
          this.yPos >= -collideOffset.y + currentOffset.y + canvas.height - this.radius ||
          this.yPos <= -collideOffset.y + currentOffset.y + this.radius
        ) {
          collisionCount += 1;
          ui.collisionCount.innerText = collisionCount;
          this.xVel *= CoR;
          this.yVel = CoR * -this.yVel;
          // this.xAccel = 0;
          if (this.yPos >= -collideOffset.y + currentOffset.y + canvas.height - this.radius)
            this.yPos = -collideOffset.y + currentOffset.y + canvas.height - this.radius;
          else this.yPos = -collideOffset.y + currentOffset.y + this.radius;
        }
      }
      // implement acceleration
      this.xVel += this.xAccel * timestep;
      this.yVel += this.yAccel * timestep;

      // integrate velocity every frame
      this.xPos += this.xVel * timestep;
      this.yPos += this.yVel * timestep;

      // reset acceleration
      this.xAccel = 0;
      this.yAccel = uniformg;
    }
  }
}

/** Calculate forces between each body, then the body */
function runSim() {
  // iterate through all combinations of bodies and add force to body total
  bodies.forEach((body, index) => {
    const body1 = body;
    if (drawField && body1.mass > maxBody.mass) maxBody = body1;
    if (bodies.length > 1 && timestep && (gravity && G || globalCollide)) {
      for (let i = index + 1; i < bodies.length; i++) {
        const body2 = bodies[i];
        // calc gravity between body and bodies[i], then add forces

        const xDist = body2.xPos - body1.xPos;
        const yDist = body2.yPos - body1.yPos;

        const distThreshSqr = (body2.radius + body1.radius) * (body2.radius + body1.radius) + 1;
        const sqr = Math.max(xDist * xDist + yDist * yDist, distThreshSqr);

        if (
          sqr == distThreshSqr &&
          bodies.includes(body1) &&
          bodies.includes(body2) &&
          body1.id != body2.id
        ) {
          // don't skip a body after removing it
          if (globalCollide && body2.collide && body1.collide)
            collision(body1, body2);
        } else {//if (G > 0 && gravity || electrostatic) {
          const dist = Math.sqrt(sqr);
          let xAccel = 0, yAccel = 0, kForceX = 0, kForceY = 0;

          if (G != 0 && gravity && !(body1.immovable && body2.immovable)) {
            // precalculate g / r^2
            const g = G / sqr;

            // get the components of the force
            xAccel = (g * xDist) / dist;
            yAccel = (g * yDist) / dist;
          }
          if (K != 0 && electrostatic) {
            // Coulomb force - repel if like charges, attract if opposite charges
            const kForce = electrostatic ? (K * (-body1.charge) * body2.charge) / sqr : 0;
            kForceX = kForce * xDist / dist;
            kForceY = kForce * yDist / dist;
          }

          // apply the forces
          if (!body1.immovable) {
            body1.xAccel += (xAccel * body2.mass + kForceX / body1.mass);
            body1.yAccel += (yAccel * body2.mass + kForceY / body1.mass);
          }
          if (!body2.immovable) {
            body2.xAccel -= (xAccel * body1.mass + kForceX / body2.mass);
            body2.yAccel -= (yAccel * body1.mass + kForceY / body2.mass);
          }

          // draw gravity strength lines
          if (drawGravityStrength && gravity && G != 0) {
            const strength = Math.abs(1 - 10 / (G / sqr * body1.mass * body2.mass + 10));
            const drawThreshold = drawGThreshold ? (trace ? 1e-4 : 1e-2) : 0;
            // determine whether to draw
            if (strength >= drawThreshold) {
              ctx.beginPath();
              ctx.strokeStyle =
                "rgba(" + (255 - 255 * strength) + ", " + (255 * strength) + ",0 ," + strength + ")";
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
 * Calculate perfectly inelastic collisions, merge smaller body into larger
 * @param {Body} body1 the first body
 * @param {Body} body2 the second body
 */
function merge(body1, body2) {
  // collisionCount += 1;
  // ui.collisionCount.innerText = collisionCount;
  activeBodies = bodies.length - 1;
  ui.bodyCount.innerText = activeBodies;

  // merge masses and calculate corresponding radius and velocity based on momentum
  // color of new body is inherited from the larger
  const mass = body1.mass + body2.mass;
  const larger = (body1.immovable || body2.immovable) ? (body1.immovable ? body1 : body2) : (body1.mass > body2.mass ? body1 : body2);
  const smaller = larger === body1 ? body2 : body1;

  if (!larger.immovable) {
    // get velocity based on momentum
    larger.xVel = (body1.getMomentum().x + body2.getMomentum().x) / mass;
    larger.yVel = (body1.getMomentum().y + body2.getMomentum().y) / mass;

    // move to cg
    larger.xPos = (body1.xPos * body1.mass + body2.xPos * body2.mass) / mass;
    larger.yPos = (body1.yPos * body1.mass + body2.yPos * body2.mass) / mass;
  }

  if (Math.abs(larger.radius - getRadius(larger.mass)) < 0.1) larger.radius = getRadius(mass);
  larger.mass = mass;
  larger.charge += smaller.charge;

  // maintain tracking
  if (trackBody === smaller) trackBody = larger;
  // remove the smaller object
  remove(smaller);
}

/**
 * Calculate inelastic (CoR != 1) and elastic (CoR = 1) collisions
 * @param {Body} body1 the first body
 * @param {Body} body2 the second body
 */
function collision(body1, body2) {
  collisionCount += 1;
  ui.collisionCount.innerText = collisionCount;
  if (inelastic) merge(body1, body2);
  else {
    // larger and smaller bodies
    const larger = (body1.immovable || body2.immovable) ? (body1.immovable ? body1 : body2) : (body1.mass > body2.mass ? body1 : body2);
    const smaller = larger === body1 ? body2 : body1;

    // initial separation
    const xPosDist = body2.xPos - body1.xPos;
    const yPosDist = body2.yPos - body1.yPos;

    const xPosDistAbs = larger.xPos - smaller.xPos;
    const yPosDistAbs = larger.yPos - smaller.yPos;
    const d = Math.max(Math.sqrt(xPosDist * xPosDist + yPosDist * yPosDist), 0.0001);

    const totalMass = body1.mass + body2.mass;
    const massDiff = body1.mass - body2.mass;

    if (!larger.immovable && larger.mass - smaller.mass * 2 <= 0) {
      // set the bodies to just touch to avoid intersecting
      const midpointX = (larger.xPos * smaller.mass + smaller.xPos * larger.mass) / totalMass;
      const midpointY = (larger.yPos * smaller.mass + smaller.yPos * larger.mass) / totalMass;

      // move the bodies to just touch each other
      larger.xPos = midpointX + (larger.radius) * xPosDistAbs / d;
      larger.yPos = midpointY + (larger.radius) * yPosDistAbs / d;
      smaller.xPos = midpointX - (smaller.radius) * 1.1 * xPosDistAbs / d;
      smaller.yPos = midpointY - (smaller.radius) * 1.1 * yPosDistAbs / d;
    } else {
      // just move smaller
      smaller.xPos = larger.xPos - (larger.radius + smaller.radius) * xPosDistAbs / d;
      smaller.yPos = larger.yPos - (larger.radius + smaller.radius) * yPosDistAbs / d;
    }

    // Intiial velocity of the center of mass
    const vCoMX = (body1.getMomentum().x + body2.getMomentum().x) / totalMass;
    const vCoMY = (body1.getMomentum().y + body2.getMomentum().y) / totalMass;

    // angle of the collision normal
    const phi = Math.atan2(yPosDist, xPosDist);

    // net velocity magnitude
    const v1 = Math.sqrt(body1.xVel * body1.xVel + body1.yVel * body1.yVel);
    const v2 = Math.sqrt(body2.xVel * body2.xVel + body2.yVel * body2.yVel);

    // velocity angle relative to phi
    const a1 = Math.atan2(body1.yVel, body1.xVel) - phi;
    const a2 = Math.atan2(body2.yVel, body2.xVel) - phi;

    // velocity relative to the collision line
    const v1relX = v1 * Math.cos(a1);
    const v1relY = v1 * Math.sin(a1);
    const v2relX = v2 * Math.cos(a2);
    const v2relY = v2 * Math.sin(a2);

    // calculate final velocities in rotated frame, changing the component perpendicular to collision
    let v1finalXrel;
    let v2finalXrel;
    if (body1.immovable) {
      v1finalXrel = 0;
      v2finalXrel = -v2relX;
    } else if (body2.immovable) {
      v1finalXrel = -v1relX;
      v2finalXrel = 0;
    } else {
      v1finalXrel = (massDiff * v1relX + 2 * body2.mass * v2relX) / (totalMass);
      v2finalXrel = (2 * body1.mass * v1relX - massDiff * v2relX) / (totalMass);
    }

    // precompute these values
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);

    // switch back to original frame and get final velocities, then implement new velocity with CoR
    if (!body1.immovable) {
      const v1xFinal = cosPhi * v1finalXrel - sinPhi * v1relY;
      const v1yFinal = sinPhi * v1finalXrel + cosPhi * v1relY;
      body1.xVel = vCoMX + CoR * (v1xFinal - vCoMX);
      if (body1.lockAxis != "y") body1.yVel = vCoMY + CoR * (v1yFinal - vCoMY);
    }
    if (!body2.immovable) {
      const v2xFinal = cosPhi * v2finalXrel - sinPhi * v2relY;
      const v2yFinal = sinPhi * v2finalXrel + cosPhi * v2relY;
      body2.xVel = vCoMX + CoR * (v2xFinal - vCoMX);
      if (body2.lockAxis != "y") body2.yVel = vCoMY + CoR * (v2yFinal - vCoMY);
    }
  }
}

/**
 * calculate field strength at point, then draw vector
 * @param {Number} x X-coordinate for field calculation
 * @param {Number} y Y-coordinate for field calculation
 * @param {Number} res resolution of the grid for full field calculation
 * @param {Boolean} hypot whether to retern the net strength or the X and Y components
 * @returns Net field strength if hypot is true, otherwise an object with the X and Y components
 */
function calcFieldAtPoint(x, y, res = 0, hypot = false) {
  let xPot = 0,
    yPot = 0;
  bodies.forEach((body) => {
    let distance = res
      ? Math.hypot(body.xPos - x - res / 2, body.yPos - y - res / 2)
      : Math.hypot(body.xPos - x, body.yPos - y);
    if (distance >= body.radius - (res ? res : 0)) {
      const gForce = (G * body.mass) / (distance * distance);
      xPot += (gForce * (body.xPos - x)) / distance;
      yPot += (gForce * (body.yPos - y)) / distance;
    }
  });
  return hypot
    ? Math.hypot(xPot, yPot)
    : {
      x: xPot,
      y: yPot,
    };
}

/**
 * Converts a color from HSL to RGB
 * @param {Number} h hue as an angle [0, 360]
 * @param {Number} s saturation [0, 1]
 * @param {Number} l lightness [0, 1]
 * @returns An array with the RGB color values [0, 1]
 */
function hsl2rgb(h, s, l) {
  let a = s * Math.min(l, 1 - l);
  let f = (n, k = (n + h / 30) % 12) => l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  return [f(0), f(8), f(4)];
}

/** display gravitational field for the whole canvas */
function drawFullField() {
  const res = heatmapRes / totalzoom;
  const width = canvas.width;
  const imgData = ctx.createImageData(width, canvas.height);
  const data = imgData.data;

  const maxPotential = (G * maxBody.mass) / (maxBody.radius * maxBody.radius);

  for (let y = center.y - viewport.y / 2, py = 0; y < center.y + viewport.y / 2; y += res, py++) {
    for (let x = center.x - viewport.x / 2, px = 0; x < center.x + viewport.x / 2; x += res, px++) {
      // const vector = calcFieldAtPoint(x, y, res);
      const potential = calcFieldAtPoint(x, y, res, true); //Math.hypot(vector.x, vector.y);
      let rgbColor = [0, 0, 0.2];
      if (potential >= 0.05) {
        // Map the potential to HSL color space
        const hue = 240 - potential.map(minPotential, maxPotential, 0, 240);
        const lightness = potential.map(minPotential, maxPotential, 0.01, 0.5);

        // Convert HSL to RGB
        rgbColor = hsl2rgb(hue, 1, lightness);
        for (let i = 0; i < heatmapRes; i++) {
          for (let j = 0; j < heatmapRes; j++) {
            const index = ((py * 4 + i) * width + (px * 4 + j)) * heatmapRes;
            data[index] = rgbColor[0] * 255;
            data[index + 1] = rgbColor[1] * 255;
            data[index + 2] = rgbColor[2] * 255;
            data[index + 3] = 255;
          }
        }
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

/** display gravitational field vector at a point */
function drawPointField() {
  const x = (mouseX / canvas.width) * viewport.x + center.x - viewport.x / 2;
  const y = (mouseY / canvas.height) * viewport.y + center.y - viewport.y / 2;

  const vector = calcFieldAtPoint(x, y);

  ctx.beginPath();
  ctx.strokeStyle = "white";
  ctx.lineWidth = 1 / totalzoom;
  ctx.moveTo(x, y);
  ctx.lineTo(x + vector.x * 2, y + vector.y * 2);
  ctx.closePath();
  ctx.stroke();
}

/** calculate center of mass of the system */
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
  ui.offset.innerText = Math.floor(currentOffset.x) + " Y=" + Math.floor(currentOffset.y);
}

function zoom(zoomfactor = 0) {
  if (zoomfactor == 0) {
    zoomfactor = 1 / totalzoom;
    totalzoom = 1;
    viewport.x = canvas.width;
    viewport.y = canvas.height;
  } else {
    totalzoom *= zoomfactor;
    viewport.x /= zoomfactor;
    viewport.y /= zoomfactor;
  }
  ctx.transform(
    zoomfactor,
    0,
    0,
    zoomfactor,
    (-(zoomfactor - 1) * canvas.width) / 2,
    (-(zoomfactor - 1) * canvas.height) / 2
  );
  ui.viewport.innerText = ~~(viewport.x) + " x " + ~~(viewport.y);
  ctx.fillStyle = "rgba(0, 0, 0, 1)";
  ctx.fillRect(
    center.x - viewport.x / 2,
    center.y - viewport.y / 2,
    viewport.x,
    viewport.y
  );
  ui.zoom.innerText = ~~(totalzoom * 10000) / 100;
}

/**
 * Track body by panning and zeroing velocity
 * @param {Body} body the body to track
 */
function track(body) {
  if (newBody) {
    // pan({ x: -currentOffset.x, y: -currentOffset.y });
    pan({
      x: center.x - body.xPos,// - currentOffset.x,
      y: center.y - body.yPos,// - currentOffset.y,
    });
  }
  pan({ x: -body.xVel * timestep, y: -body.yVel * timestep }, false);
  newBody = false;
}

/** draw and animate */
function draw() {
  continuous = true;
  let continueTrace = trace;

  debug = false;
  if (debug) {
    trace = false;
    drawGravity = false;
    drawGravityStrength = false;
    drawVector = false;
  }

  updateGraphs(100);

  if (!maxBody && bodies[0]) maxBody = bodies[0];
  else if (!bodies[0]) maxBody = null;

  // check draw settings and draw stuff
  {
    if (trackBody) track(trackBody);
    if (panOffset.x != 0 || panOffset.y != 0) {
      pan(panOffset, false);
      trace = false;
    }
    if (fade && trace && timestep) {
      ctx.fillStyle = "rgba(0, 0, 0, " + fadeStrength + ")";
      ctx.fillRect(center.x - viewport.x / 2, center.y - viewport.y / 2, viewport.x, viewport.y);
    } else if (!trace && drawField && G) {
      // ctx.fillStyle = "hsl(240, 100%, " + minL * 100 + "%)";
      // ctx.fillRect(center.x - viewport.x / 2, center.y - viewport.y / 2, viewport.x, viewport.y);
      if (bodies[0]) drawFullField();
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
  if (continueTrace) trace = true;
  if (drawMouseVector) drawPointField();

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

  frameDelayMs ? setTimeout(draw, frameDelayMs) : requestAnimationFrame(draw);
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
    ui.fps.innerText = ~~(fps * 100) / 100;

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
