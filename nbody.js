// todo: implement electrostatic and magnetic (?) fields, rotating reference frame tracking
let frameDelayMs = 0; // Chromebook Simulator (or for debug purposes): 0 for default requestAnimationFrame fps

// object containing the user interface elements for easy access
const ui = {
  panel: document.getElementById("settings"),
  collapse: document.getElementById("toggleSettings"),
  timestep: document.getElementById("timestep"),
  tOut: document.getElementById("tOut"),
  numBodies: document.getElementById("num"),
  integrator: document.getElementById("integrator"),
  // draw settings
  trace: document.getElementById("trace"),
  continuous: document.getElementById("continuous"),
  fade: document.getElementById("fade"),
  fadeStrength: document.getElementById("fadeStrength"),
  fadeOutput: document.getElementById("fadeOutput"),
  drawVector: document.getElementById("vectors"),
  drawGravity: document.getElementById("drawG"),
  drawGravityStrength: document.getElementById("drawGStrength"),
  drawGThreshold: document.getElementById("drawGThreshold"),
  heatmap: document.getElementById("heatmap"),
  drawCoM: document.getElementById("drawCoM"),
  trackCoM: document.getElementById("trackCoM"),
  colorByVel: document.getElementById("colorByVel"),
  drawOffscreen: document.getElementById("drawOffscreen"),
  drawMouseVector: document.getElementById("drawMouseVector"),
  // gravity settings
  G: document.getElementById("g"),
  uniformg: document.getElementById("uniformg"),
  gravity: document.getElementById("gravity"),
  collide: document.getElementById("collide"),
  maxMass: document.getElementById("maxSize"),
  minMass: document.getElementById("minSize"),
  initVel: document.getElementById("initVel"),
  // buttons
  randBtn: document.getElementById("rand"),
  loadBtn: document.getElementById("loadPreset"),
  presets: document.getElementById("presets"),
  add: document.getElementById("add"),
  clear: document.getElementById("clear"),
  toggle: document.getElementById("toggle"),
  clrOffscreen: document.getElementById("clrOffscreen"),
  // stats
  offset: document.getElementById("offset"),
  viewport: document.getElementById("viewport"),
  zoom: document.getElementById("zoom"),
  collisionCount: document.getElementById("collisionCount"),
  bodyCount: document.getElementById("bodyCount"),
  fps: document.getElementById("fps"),
  // body add settings
  mass: document.getElementById("mass"),
  radius: document.getElementById("radius"),
  xp: document.getElementById("xPos"),
  yp: document.getElementById("yPos"),
  vx: document.getElementById("Vx"),
  vy: document.getElementById("Vy"),
  // collision settings
  globalCollide: document.getElementById("globalCollide"),
  inelastic: document.getElementById("collideType"),
  CoR: document.getElementById("CoR"),
  CoROut: document.getElementById("CoROut"),
  // electrostatic settings
  maxCharge: document.getElementById("maxCharge"),
  minCharge: document.getElementById("minCharge"),
  charge: document.getElementById("charge"),
  electrostatic: document.getElementById("electrostatic"),
  colorByCharge: document.getElementById("colorByCharge"),
  K: document.getElementById("K"),
  drawKStrength: document.getElementById("drawKStrength"),
  drawKThreshold: document.getElementById("drawKThreshold"),
  immovable: document.getElementById("immovable"),
  decoupleFPS: document.getElementById("decoupleFPS"),
  // softbody settings
  softbody: document.getElementById("softbody"),
  springConst: document.getElementById("springConst"),
  dampening: document.getElementById("dampening"),
  dampOut: document.getElementById("dampOut"),
  springEquilPos: document.getElementById("softbodyEquilPos"),
  drawSStrength: document.getElementById("drawSStrength"),
  // rotate settings
  rotate: document.getElementById("rotate"),
  rOut: document.getElementById("rOut"),
  rotateRate: document.getElementById("rotateRate"),
  // resonant orbit settings
  res: document.getElementById("res"),
  resOffset: document.getElementById("resOffset"),
  resMass: document.getElementById("resMass"),
  resSMA: document.getElementById("resSMA"),
  generateRes: document.getElementById("generateRes"),
};

// utilities
// calculate radius based on a spherical mass
const getRadius = (mass) => Math.abs(Math.cbrt((mass * (3 / 4)) / Math.PI));
// generate a random hex color
const randColor = () => "#" + (~~(Math.random() * (16777215 - 5592405) + 5592405)).toString(16);

const degToRad = (deg) => (deg * Math.PI) / 180;
const radToDeg = (rad) => (rad / Math.PI) * 180;

// initialize main canvas
const canvas = document.getElementById("canvas", { alpha: false });
const ctx = canvas.getContext("2d");
let center = { x: canvas.width / 2, y: canvas.height / 2 };
let viewport = { x: canvas.width, y: canvas.height };

// make the canvas size responsive
window.onresize = window.onload = () => {
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;
  ui.viewport.innerText = canvas.width + " x " + canvas.height;
  center.x = canvas.width / 2;
  center.y = canvas.height / 2;
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
let numBodies,
  maxMass,
  minMass,
  initVel,
  timestep,
  oldTimestep = 0,
  CoM,
  maxCharge,
  minCharge,
  uniformg;
let continuous = true;
let CoR = 1;
let springConst = 100;
let dampening = 0.99;
let springEquilPos = 25;
let springEquilSqr = springEquilPos * springEquilPos;

// integrators enum
const Integrators = Object.freeze({
  VERLET: 0,
  EULER: 1,
});
let integrator = Integrators.VERLET;

// tracking variables
let collisionCount = (frameCount = bodyCount = activeBodies = 0);
let lastTime = performance.now();
let clearTrails = false,
  paused = false;

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
let mouseX, mouseY;
let currentAngleOffset = 0;
let rotationRate = parseFloat(ui.rotateRate.value);
let rotateTarget,
  rotateTrackNum = 0;

// heatmap
let maxBody;
const minPotential = 0;
const heatmapRes = 4;
let minL = 0.1;

let player = null;
let gameMode = false;

// initialize settings
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
  colorByCharge = ui.colorByCharge.checked,
  drawKStrength = ui.drawKStrength.checked,
  drawKThreshold = ui.drawKThreshold.checked,
  softbody = ui.softbody.checked,
  drawSStrength = ui.drawSStrength.checked;

// initialize the ui inputs and then start the draw loop
initParams();
draw();

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
function remove(body, i = 0) {
  const index = body ? bodies.indexOf(body) : i; //bodies.findIndex((body) => body.id === id);
  if (index != -1) {
    bodies.splice(index, 1);
  }
}

/**
 * Draw a circle onto the canvas
 * @param {Number} x x coordinate of circle
 * @param {Number} y y coordinate of circle
 * @param {Number} r radius of circle
 * @param {String} drawColor the color of the circle
 */
function circle(x = 0, y = 0, r = 5, drawColor = "gray") {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fillStyle = drawColor;
  ctx.fill();
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
 * Map values from one range to another (lerp)
 * @param {Number} in_min minimum input value
 * @param {Number} in_max maximum input value
 * @param {Number} out_min minimum output value
 * @param {Number} out_max maximum output value
 * @param {Boolean} clampMax whether to clamp the maximum value if the input exceeds max
 * @param {Boolean} clampMin whether to clamp the minimum value if the input exceeds min
 */
Number.prototype.lerp = function (
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

/** Class containing all the physical properties of a body */
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
    lockAxis = "none",
    control = false,
  ) {
    this.xPos = this.xPrev = xPos;
    this.yPos = this.yPrev = yPos;

    this.xVel = immovable ? 0 : xVel;
    this.yVel = immovable ? 0 : yVel;

    this.xAccel = 0;
    this.yAccel = 0;

    this.xAccelP = 0;
    this.yAccelP = 0;

    this.radius = r ? r : getRadius(mass);
    this.mass = mass ? mass : (4 / 3) * Math.PI * (r * r * r);

    this.charge = charge;

    this.color = color == "default" ? "gray" : color;
    this.id = bodyCount++;
    this.collide = collide;

    this.immovable = immovable;
    this.lockAxis = lockAxis;
    this.control = control;

    if (control) {
      trackBody = player = this;
      gameMode = true;
    }
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
      drawColor =
        "rgb(" +
        (128 + this.charge * 10) +
        ", " +
        (128 - Math.abs(this.charge * 10)) +
        ", " +
        (128 - this.charge * 10) +
        ")";
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
        // ctx.closePath();
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
            ctx.stroke();
          }
          circle(this.xPrev, this.yPrev, this.radius, drawColor);
        }

        // draw the body
        circle(this.xPos, this.yPos, this.radius, drawColor);

        // center
        if (this.radius > 3) {
          circle(this.xPos, this.yPos, this.radius < 1.5 ? this.radius : 1.5, "black");
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
          ctx.stroke();
        }
      }
    }

    // Update the position of the body
    if (!this.immovable) {
      this.xPrev = this.xPos;
      this.yPrev = this.yPos;
      switch (integrator) {
        case Integrators.VERLET:
          // Velocity-verlet integration
          const dt2 = timestep * timestep;
          
          // Calculate velocity
          this.xVel += 0.5 * (this.xAccel + this.xAccelP) * timestep;
          this.yVel += 0.5 * (this.yAccel + this.yAccelP) * timestep;
    
          // Calculate position      
          this.xPos += this.xVel * timestep + 0.5 * this.xAccel * dt2;
          this.yPos += this.yVel * timestep + 0.5 * this.yAccel * dt2;

          // Store previous accelerations for next timestep
          this.xAccelP = this.xAccel;
          this.yAccelP = this.yAccel;
          break;
        case Integrators.EULER:
          // Euler integration
          // implement acceleration
          this.xVel += this.xAccel * timestep;
          this.yVel += this.yAccel * timestep;

          // change pos based on velocity
          this.xPos += this.xVel * timestep;
          this.yPos += this.yVel * timestep;
          break;
      }

      // reset acceleration
      this.xAccel = 0;
      this.yAccel = uniformg;

      // edge collision
      if (collide) {
        const xOffset = -collideOffset.x + currentOffset.x;
        const yOffset = -collideOffset.y + currentOffset.y;
        if (
          this.xPos >= xOffset + canvas.width - this.radius ||
          this.xPos <= xOffset + this.radius
        ) {
          // increment collision
          collisionCount += 1;
          ui.collisionCount.innerText = collisionCount;

          // reverse velocity and implement CoR
          this.xVel = CoR * -this.xVel;
          this.yVel *= CoR;

          // set position within box, visual glitch but accurate
          if (this.xPos >= xOffset + canvas.width - this.radius) {
            this.xPos = 2 * (xOffset + canvas.width - this.radius) - this.xPos;
          } else {
            this.xPos = 2 * (xOffset + this.radius) - this.xPos;
          }
        }
        if (
          this.yPos >= yOffset + canvas.height - this.radius ||
          this.yPos <= yOffset + this.radius
        ) {
          // increment collision
          collisionCount += 1;
          ui.collisionCount.innerText = collisionCount;

          // reverse velocity and implement CoR
          this.xVel *= CoR;
          this.yVel = CoR * -this.yVel;

          // set position within box, visual glitch but accurate
          if (this.yPos >= yOffset + canvas.height - this.radius)
            this.yPos = 2 * (yOffset + canvas.height - this.radius) - this.yPos;
          else this.yPos = 2 * (yOffset + this.radius) - this.yPos;
        }
      }
    }
  }
}

/**
 * Calculate forces between each body, then draw them.
 * This is where the physics is
 */
function runSim() {
  // iterate through all combinations of bodies and add force to body total
  bodies.forEach((body, index) => {
    const body1 = body;

    // conditions
    const grav = gravity && G, soft = softbody && springConst, elec = electrostatic && K;
    const forces = grav || soft || elec;

    // for max field strength calibration
    if (drawField && body1.mass > maxBody.mass) maxBody = body1;

    // do calculations if needed
    if (
      bodies.length > 1 &&
      ((!paused && (forces || globalCollide)) ||
        paused && forces && (drawGravityStrength || drawKStrength || drawSStrength))
    ) {
      for (let i = index + 1; i < bodies.length; i++) {
        const body2 = bodies[i];

        // initial distance
        const xDist = body2.xPos - body1.xPos;
        const yDist = body2.yPos - body1.yPos;

        // minimum distance for collision
        const minDist = body1.radius + body2.radius;
        const distThreshSqr = minDist * minDist + 1;
        // squared straight line distance
        const sqr = Math.max(xDist * xDist + yDist * yDist, distThreshSqr);

        // check if bodies are colliding
        if (
          sqr == distThreshSqr &&
          bodies.includes(body1) &&
          bodies.includes(body2) &&
          body1.id != body2.id
        ) {
          // collide the bodies
          if (globalCollide && (body1.collide || body2.collide) && !paused) collision(body1, body2); // && globalCollide
        }
        else if (grav || elec || (soft && sqr <= springEquilSqr * 1.44)) {
          // calculate acceleration based on forces
          const dist = Math.sqrt(sqr);
          let xAccel = 0,
            yAccel = 0,
            forceX = 0,
            forceY = 0,
            kForce = 0,
            sForce = 0;

          // calculate gravity if needed
          if (G != 0 && gravity && !(body1.immovable && body2.immovable)) {
            // precalculate g / r^2 for efficiency
            const g = G / sqr;

            // get the x and y components of the force using similar triangles
            xAccel = (g * xDist) / dist;
            yAccel = (g * yDist) / dist;

            // draw gravity strength lines if needed
            if (drawGravityStrength) {
              const strength = Math.abs(1 - 10 / (g * body1.mass * body2.mass + 10));
              const drawThreshold = drawGThreshold ? (trace ? 1e-4 : 1e-2) : 0;
              // determine whether to draw for better performance
              if (strength >= drawThreshold) {
                ctx.beginPath();
                ctx.strokeStyle =
                  "rgba(" +
                  (255 - 255 * strength) +
                  ", " +
                  255 * strength +
                  ",0 ," +
                  strength +
                  ")";
                ctx.lineWidth = 1 / totalzoom;
                ctx.moveTo(body2.xPos, body2.yPos);
                ctx.lineTo(body1.xPos, body1.yPos);
                ctx.stroke();
              }
            }
          }

          // calculate other forces if needed
          if (((K && electrostatic) || softbody) && !(body1.immovable && body2.immovable)) {
            // coulomb force
            if (electrostatic) {
              // repel (negative) if like charges, attract (positive) if opposite charges
              kForce += electrostatic ? (K * -body1.charge * body2.charge) / sqr : 0;

              // draw electrostatic force lines
              if (drawKStrength && kForce) {
                const strength = Math.sign(kForce) * (1 - 10 / (Math.abs(kForce) + 10));
                const drawThreshold = drawKThreshold ? (trace ? 1e-4 : 1e-2) : 0;
                // determine whether to draw for better performance
                if (Math.abs(strength) >= drawThreshold) {
                  ctx.beginPath();
                  ctx.strokeStyle =
                    "rgba(" +
                    (strength > 0 ? 0 : 255) +
                    ", " +
                    (strength > 0 ? 255 : 0) +
                    ",0 ," +
                    Math.abs(strength) +
                    ")";
                  ctx.lineWidth = 1 / totalzoom;
                  ctx.moveTo(body2.xPos, body2.yPos);
                  ctx.lineTo(body1.xPos, body1.yPos);
                  ctx.stroke();
                }
              }
            }
            // softbody physics (spring force based on Hooke's law)
            if (softbody && dist < springEquilPos * 1.2) {
              // get displacement relative to equilibrium
              let springDist = dist - springEquilPos;
              // calculate force
              sForce += springDist * springConst;
              // dampening
              body1.xVel *= dampening; //(body1.xVel - vCoMX) * 0.99 + vCoMX;
              body1.yVel *= dampening; //(body1.yVel - vCoMY) * 0.99 + vCoMY;
              body2.xVel *= dampening; //(body2.xVel - vCoMX) * 0.99 + vCoMX;
              body2.yVel *= dampening; //(body2.yVel - vCoMY) * 0.99 + vCoMY;

              // draw spring force lines
              if (drawSStrength) {
                const strength = Math.sign(sForce) * (1 - 10 / (Math.abs(sForce) + 10));
                const scaledStrength = 127.5 * strength;
                // draw
                ctx.beginPath();
                ctx.strokeStyle =
                  // "rgba(" + (strength > 0 ? 0 : 255) + ", " + (strength > 0 ? 255 : 0) + ",0 ," + Math.abs(strength) + ")";
                  "rgba(" +
                  (127.5 - scaledStrength) +
                  ", " +
                  (127.5 + scaledStrength) +
                  ",0 ," +
                  (127.5 + Math.abs(scaledStrength)) +
                  ")";
                ctx.lineWidth = 1 / totalzoom;
                ctx.moveTo(body2.xPos, body2.yPos);
                ctx.lineTo(body1.xPos, body1.yPos);
                // ctx.closePath();
                ctx.stroke();
              }
            }

            // total coulomb and spring force
            const force = kForce + sForce;
            // add force to force components
            forceX += (force * xDist) / dist;
            forceY += (force * yDist) / dist;
          }

          // apply the forces if the body is movable
          if (!body1.immovable) {
            body1.xAccel += xAccel * body2.mass + forceX / body1.mass;
            body1.yAccel += yAccel * body2.mass + forceY / body1.mass;
          }
          if (!body2.immovable) {
            body2.xAccel -= xAccel * body1.mass + forceX / body2.mass;
            body2.yAccel -= yAccel * body1.mass + forceY / body2.mass;
          }
        }
      }
    }
    // draw the updated body
    body1.draw();
  });
}

/**
 * Calculate perfectly inelastic collisions, merge smaller body into larger
 * @param {Body} body1 the first body
 * @param {Body} body2 the second body
 */
function merge(body1, body2) {
  activeBodies = bodies.length - 1;
  ui.bodyCount.innerText = activeBodies;

  // merge masses and calculate corresponding radius and velocity based on momentum
  // color of new body is inherited from the larger

  // get total mass
  const mass = body1.mass + body2.mass;

  // determine larger and smaller body
  const larger =
    body1.immovable || body2.immovable
      ? body1.immovable
        ? body1
        : body2
      : body1.mass > body2.mass
        ? body1
        : body2;
  const smaller = larger === body1 ? body2 : body1;

  // if one is immovable, merge into that one
  if (!larger.immovable) {
    // get velocity based on momentum
    larger.xVel = (body1.getMomentum().x + body2.getMomentum().x) / mass;
    larger.yVel = (body1.getMomentum().y + body2.getMomentum().y) / mass;

    // move the body to center of mass
    larger.xPos = (body1.xPos * body1.mass + body2.xPos * body2.mass) / mass;
    larger.yPos = (body1.yPos * body1.mass + body2.yPos * body2.mass) / mass;
  }

  // if the density has been manually set, don't change the size
  if (Math.abs(larger.radius - getRadius(larger.mass)) < 0.1) larger.radius = getRadius(mass);
  // Conserve mass and charge
  larger.mass = mass;
  larger.charge += smaller.charge;

  // Maintain tracking
  if (trackBody === smaller) trackBody = larger;
  // Remove the smaller object
  remove(smaller);
}

/**
 * Calculate inelastic (CoR != 1) and elastic (CoR = 1) collisions
 * @param {Body} body1 the first body
 * @param {Body} body2 the second body
 */
function collision(body1, body2) {
  // increment collision counter
  collisionCount += 1;
  ui.collisionCount.innerText = collisionCount;

  if (inelastic && !(body1.control || body2.control)) merge(body1, body2); // combine the bodies into one

  else { // calculate non-perfectly inelastic collisions
    // determine larger and smaller bodies
    const larger =
      body1.immovable || body2.immovable
        ? body1.immovable
          ? body1
          : body2
        : body1.mass > body2.mass
          ? body1
          : body2;
    const smaller = larger === body1 ? body2 : body1;

    // initial separation
    const xPosDist = body2.xPos - body1.xPos;
    const yPosDist = body2.yPos - body1.yPos;

    // absolute value of separation
    const xPosDistAbs = larger.xPos - smaller.xPos;
    const yPosDistAbs = larger.yPos - smaller.yPos;
    // straight line distance
    const d = Math.max(Math.sqrt(xPosDist * xPosDist + yPosDist * yPosDist), 0.0001);

    const totalMass = body1.mass + body2.mass;
    const massDiff = body1.mass - body2.mass;

    // set the bodies to not touch
    if (!larger.immovable && larger.mass - smaller.mass * 2 <= 0) {
      // calculate midpoint as the center of mass
      const midpointX = (larger.xPos * smaller.mass + smaller.xPos * larger.mass) / totalMass;
      const midpointY = (larger.yPos * smaller.mass + smaller.yPos * larger.mass) / totalMass;

      // move both bodies to avoid intersecting each other
      larger.xPos = midpointX + (larger.radius * xPosDistAbs) / d;
      larger.yPos = midpointY + (larger.radius * yPosDistAbs) / d;
      smaller.xPos = midpointX - (smaller.radius * 1.1 * xPosDistAbs) / d;
      smaller.yPos = midpointY - (smaller.radius * 1.1 * yPosDistAbs) / d;
    } else {
      // just move the smaller body
      smaller.xPos = larger.xPos - ((larger.radius + smaller.radius) * xPosDistAbs) / d;
      smaller.yPos = larger.yPos - ((larger.radius + smaller.radius) * yPosDistAbs) / d;
    }

    // Initial velocity of the center of mass = total momentum / total mass
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
    // bounce only one if either is immovable
    if (body1.immovable) {
      v1finalXrel = 0;
      v2finalXrel = -v2relX;
    } else if (body2.immovable) {
      v1finalXrel = -v1relX;
      v2finalXrel = 0;
    } else {
      // bounce both using conservation of momentum and mass
      v1finalXrel = (massDiff * v1relX + 2 * body2.mass * v2relX) / totalMass;
      v2finalXrel = (2 * body1.mass * v1relX - massDiff * v2relX) / totalMass;
    }

    // precompute these values for efficiency
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);

    // switch back to original frame and get final velocities, then implement new velocity with CoR if not immovable
    if (!body1.immovable) {
      // calculate final velocities by rotating the frame to original coordinates
      const v1xFinal = cosPhi * v1finalXrel - sinPhi * v1relY;
      const v1yFinal = sinPhi * v1finalXrel + cosPhi * v1relY;

      // implement CoR using velocity relative to CoM
      body1.xVel = vCoMX + CoR * (v1xFinal - vCoMX);
      if (body1.lockAxis != "y") body1.yVel = vCoMY + CoR * (v1yFinal - vCoMY);
    }
    if (!body2.immovable) {
      // calculate final velocities by rotating the frame to original coordinates
      const v2xFinal = cosPhi * v2finalXrel - sinPhi * v2relY;
      const v2yFinal = sinPhi * v2finalXrel + cosPhi * v2relY;

      // implement CoR using velocity relative to CoM
      body2.xVel = vCoMX + CoR * (v2xFinal - vCoMX);
      if (body2.lockAxis != "y") body2.yVel = vCoMY + CoR * (v2yFinal - vCoMY);
    }
  }
}

/**
 * calculate field strength at a given point
 * @param {Number} x X-coordinate for field calculation
 * @param {Number} y Y-coordinate for field calculation
 * @param {Number} res resolution of the grid for full field calculation
 * @param {Boolean} hypot whether to retern the net strength or the X and Y components
 * @returns Net field strength if hypot is true, otherwise an object with the X and Y components
 */
function calcFieldAtPoint(x, y, res = 0, hypot = false) {
  let xPot = 0,
    yPot = 0;

  // accumulate total potential using vector sum
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
 * Converts a color from HSL to RGB for the heatmap
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

  // used to adjust coloring based on the max potential value
  const maxPotential = (G * maxBody.mass) / (maxBody.radius * maxBody.radius);

  // calculate for every res*res block of pixels
  for (let y = center.y - viewport.y / 2, py = 0; y < center.y + viewport.y / 2; y += res, py++) {
    for (let x = center.x - viewport.x / 2, px = 0; x < center.x + viewport.x / 2; x += res, px++) {
      const potential = calcFieldAtPoint(x, y, res, true); //Math.hypot(vector.x, vector.y);
      let rgbColor = [0, 0, 0.2];
      if (potential >= 0.05) {
        // Map the potential to HSL color space
        const hue = 240 - potential.lerp(minPotential, maxPotential, 0, 240);
        const lightness = potential.lerp(minPotential, maxPotential, 0.01, 0.5);

        // Convert HSL to RGB
        rgbColor = hsl2rgb(hue, 1, lightness);

        // set the pixels to that color
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
  // update the field visualization
  ctx.putImageData(imgData, 0, 0);
}

/** display gravitational field vector at the mouse position */
function drawPointField() {
  const x = (mouseX / canvas.width) * viewport.x + center.x - viewport.x / 2;
  const y = (mouseY / canvas.height) * viewport.y + center.y - viewport.y / 2;

  const vector = calcFieldAtPoint(x, y);

  // draw the vector line
  ctx.beginPath();
  ctx.strokeStyle = "white";
  ctx.lineWidth = 1 / totalzoom;
  ctx.moveTo(x, y);
  ctx.lineTo(x + vector.x * 2, y + vector.y * 2);
  ctx.stroke();
}

/** calculate center of mass of the system */
function calcCoM() {
  // calc x and y CoM using (m1x1+m2x2...) / (m1+m2...)
  let CoM = { x: 0, y: 0 };
  let mass = 0;
  bodies.forEach((body) => {
    CoM.x += body.xPrev * body.mass;
    CoM.y += body.yPrev * body.mass;
    mass += body.mass;
  });
  CoM.x /= mass;
  CoM.y /= mass;
  return CoM;
}

/**
 * Pan by adjusting positions of all bodies based on an offset value
 * @param {Object} offset
 * @param {Boolean} clrTrails
 */
function pan(offset = { x: 0, y: 0 }, clrTrails = true) {
  // remove faint trails
  if (clrTrails) {
    continuous = false;
    clearTrails = true;
  }
  // offset each body
  currentOffset.x += offset.x;
  currentOffset.y += offset.y;
  bodies.forEach((body) => {
    body.xPos += offset.x;
    body.yPos += offset.y;
  });

  ui.offset.innerText = Math.floor(currentOffset.x) + " Y=" + Math.floor(currentOffset.y);
}

function pan2(offset = { x: 0, y: 0 }, clrTrails = true) {
  ctx.translate(offset.x, offset.y);
  currentOffset.x += offset.x;
  currentOffset.y += offset.y;
  // center.x -= offset.x;
  // center.y -= offset.y;
}

/**
 * Track body by panning and zeroing velocity
 * @param {Body} body the body to track
 */
function track(body) {
  // if (newBody) {
  //   // place the tracked body in the center
  //   pan({
  //     x: center.x - body.xPrev,
  //     y: center.y - body.yPrev,
  //   });
  // }
  // // follow the body
  // pan({ x: -body.xVel * timestep, y: -body.yVel * timestep }, false);
  // newBody = false;

  pan({
    x: center.x - body.xPos,
    y: center.y - body.yPos,
  },newBody);
  newBody = false;
}

function rotate(offset = Math.PI, clrTrails = false) {
  currentAngleOffset += offset;
  ui.rOut.innerText = ui.rotate.value = ~~(radToDeg(currentAngleOffset) * 100) / 100;
  if (clrTrails) {
    continuous = false;
    clearTrails = true;
  }
  if (Math.abs(offset % Math.PI) < 1e-6) {
    // flip bodies over center
    if (Math.abs(((offset / Math.PI) % 2) - 1) < 1e-6) {
      bodies.forEach((body) => {
        body.xPos = 2 * center.x - body.xPos;
        body.yPos = 2 * center.y - body.yPos;
      });
    }
    // otherwise don't do anything
  } else {
    // faster rotation using only translation for angles != pi
    // see Stand-up Maths video for a proof and explanation
    // https://www.youtube.com/watch?v=1LCEiVDHJmc

    // find skew values
    const xSkew = -Math.tan(offset / 2);
    const ySkew = Math.sin(offset);

    // skew each body with velocity
    bodies.forEach((body) => {
      // adjust positions
      body.xPos += xSkew * (body.yPos - center.y);
      body.yPos += ySkew * (body.xPos - center.x);
      body.xPos += xSkew * (body.yPos - center.y);

      // adjust velocities
      body.xVel += xSkew * body.yVel;
      body.yVel += ySkew * body.xVel;
      body.xVel += xSkew * body.yVel;
    });
  }
}

// still doesn't work
function rotateTrack(target = null) {
  if (!target || !trackBody || target == trackBody) rotationRate = 0;
  else {
    // todo: get velocity perpendicular to radius
    // rotationRate = -Math.hypot(target.xVel - trackBody.xVel, target.yVel - trackBody.yVel) * timestep / Math.hypot(target.xPos - center.x, target.yPos - center.x);
    // rotationRate = -Math.atan2(target.yPos - center.y, target.xPos - center.x) - Math.atan2(target.yPos + target.yVel * timestep - center.y, target.xPos + target.xVel * timestep - center.x);
    rotationRate =
      -Math.atan2(target.yPrev - center.y, target.xPrev - center.x) -
      Math.atan2(target.yPos - center.y, target.xPos - center.x);
    rotationRate =
      -Math.sqrt(
        (G * trackBody.mass) / Math.hypot(target.xPos - center.x, target.yPos - center.x)
      ) / Math.hypot(target.xPos - center.x, target.yPos - center.x);
  }
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

  // update the FPS and bodycount graphs
  updateGraphs(100);

  if (!maxBody && bodies[0]) maxBody = bodies[0];
  else if (!bodies[0]) maxBody = null;

  if (!paused) rotate(rotationRate);
  if (gameMode) rotationRate *= 0.9;
  if (rotateTarget) rotateTrack(rotateTarget);

  // check draw settings and draw stuff
  {
    if (trackBody) track(trackBody);
    // pan if needed
    if (panOffset.x != 0 || panOffset.y != 0) {
      pan(panOffset, false);
      trace = false;
    }
    // fade the trails if needed, or draw the field, or remove the trails
    if (fade && trace && timestep) {
      // fade by covering canvas with a slightly opaque black
      ctx.fillStyle = "rgba(0, 0, 0, " + fadeStrength + ")";
      ctx.fillRect(center.x - viewport.x / 2, center.y - viewport.y / 2, viewport.x, viewport.y);
    } else if (!trace && drawField && G && bodies[0]) {
      // draw the field
      drawFullField();
    } else if (!trace) {
      // remove trails by drawing black over the canvas
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.fillRect(center.x - viewport.x / 2, center.y - viewport.y / 2, viewport.x, viewport.y);
    }
    // draw collision box
    if (collide) {
      // set the collision box at the current viewport location
      if (!collideOffset.x && !collideOffset.y) {
        collideOffset.x = currentOffset.x;
        collideOffset.y = currentOffset.y;
      }
      if (trackBody) {
        // can't have trails while colliding
        ctx.fillStyle = "rgba(0, 0, 0, 1)";
        ctx.fillRect(center.x - viewport.x / 2, center.y - viewport.y / 2, viewport.x, viewport.y);
      }
      // draw the box
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
  // loop through bodies, calculate physics, draw and update
  runSim();
  if (continueTrace) trace = true;
  if (drawMouseVector) drawPointField();

  // draw CoM
  if (bodies.length && drawCoM) {
    CoM = calcCoM();
    circle(CoM.x, CoM.y, 2 / totalzoom, "white");
    if (trackCoM) {
      pan({ x: center.x - CoM.x, y: center.y - CoM.y }, false);
    }
  }
  // clear the trails if needed
  if (clearTrails) {
    ctx.fillStyle = "rgba(0, 0, 0, 1)";
    ctx.fillRect(center.x - viewport.x / 2, center.y - viewport.y / 2, viewport.x, viewport.y);
    clearTrails = false;
  }

  // call the loop again and draw the next frame
  frameDelayMs ? setTimeout(draw, frameDelayMs) : requestAnimationFrame(draw);
}

/**
 * Update graphs to display framerate and number of bodies
 * @param {Number} interval interval to measure and display values
 */
function updateGraphs(interval) {
  // get fps
  frameCount++;
  const currentTime = performance.now();
  const elapsedTime = currentTime - lastTime;

  // only update in specific intervals
  if (elapsedTime >= interval) {
    // Update 10 times per second
    const fps = frameCount / (elapsedTime / 1000);
    ui.fps.innerText = ~~(fps * 100) / 100;

    // draw fps graph
    xCoord += 2;
    fpsCtx.beginPath();
    fpsCtx.strokeStyle = fps >= 15 ? (fps >= 30 ? "lightgreen" : "orange") : "red"; //"white";
    fpsCtx.lineWidth = 1;
    fpsCtx.moveTo(xCoord % fpsGraph.width, fpsGraph.height);
    fpsCtx.lineTo(xCoord % fpsGraph.width, fpsGraph.height - fps);
    // fpsCtx.closePath();
    fpsCtx.stroke();
    fpsCtx.fillStyle = "rgba(0, 0, 0, 0.02)";
    fpsCtx.fillRect(0, 0, (xCoord % fpsGraph.width) - 2, fpsGraph.height);
    fpsCtx.fillRect((xCoord % fpsGraph.width) + 2, 0, fpsGraph.width, fpsGraph.height);

    frameCount = 0;
    lastTime = currentTime;

    // draw bodycount graph
    bodyCtx.beginPath();
    bodyCtx.strokeStyle =
      activeBodies >= 500 ? "red" : activeBodies >= 200 ? "orange" : "lightgreen";
    bodyCtx.lineWidth = 1;
    bodyCtx.moveTo(xCoord % bodyGraph.width, bodyGraph.height);
    bodyCtx.lineTo(xCoord % bodyGraph.width, bodyGraph.height - activeBodies / 8);
    // bodyCtx.closePath();
    bodyCtx.stroke();
    bodyCtx.fillStyle = "rgba(0, 0, 0, 0.02)";
    bodyCtx.fillRect(0, 0, (xCoord % bodyGraph.width) - 2, bodyGraph.height);
    bodyCtx.fillRect((xCoord % bodyGraph.width) + 2, 0, bodyGraph.width, bodyGraph.height);
  }
}
