// TODO: zoom, collision particle fx based on relative velocity???
// lines between each object showing strength of gravity
// show value of range inputs
// keypress trigger buttons

window.onload = () => {
  frameByFrame = 0; // Chromebook Simulator (or for debug purposes)

  // initialize user interface
  const form = {
    timestep: document.getElementById("timestep"),
    tOut: document.getElementById("tOut"),
    numBodies: document.getElementById("num"),
    trace: document.getElementById("trace"),
    fade: document.getElementById("fade"),
    drawVector: document.getElementById("vectors"),
    drawGravity: document.getElementById("drawG"),
    drawGravityStrength: document.getElementById("drawGStrength"),
    continuous: document.getElementById("continuous"),
    G: document.getElementById("g"),
    GOut: document.getElementById("gOut"),
    collide: document.getElementById("collide"),
    maxSize: document.getElementById("maxSize"),
    minSize: document.getElementById("minSize"),
    initVel: document.getElementById("initVel"),
    initVelOut: document.getElementById("initVelOut"),
    randBtn: document.getElementById("rand"),
    loadBtn: document.getElementById("loadPreset"),
    presets: document.getElementById("presets"),
    add: document.getElementById("add"),
    apply: document.getElementById("apply"),
    clear: document.getElementById("clear"),
    toggle: document.getElementById("toggle"),
    clrOffscreen: document.getElementById("clrOffscreen"),
    collisionCount: document.getElementById("collisionCount"),
    bodyCount: document.getElementById("bodyCount"),
    fps: document.getElementById("fps"),
    offset: document.getElementById("offset"),
    viewport: document.getElementById("viewport"),
  };

  // initialize main canvas
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  let canvasZoom = 1;
  // canvas.style.zoom = canvasZoom * 100 + "%";
  canvas.height = window.innerHeight - 25;
  canvas.width = window.innerWidth - 350;
  form.viewport.innerText = canvas.width + " x " + canvas.height;
  let center = { x: canvas.width / 2, y: canvas.height / 2 };
  ctx.fillStyle = "rgba(0, 0, 0, 1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // ctx.globalAlpha = 0.5;
  window.onresize = () => {
    canvas.height = window.innerHeight - 25;
    canvas.width = window.innerWidth - 350;
    form.viewport.innerText = canvas.width + " x " + canvas.height;
    center = { x: canvas.width / 2, y: canvas.height / 2 };
    ctx.fillStyle = "rgba(0, 0, 0, 1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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
    collide,
    maxSize,
    minSize,
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
  let currentOffset = { x: 0, y: 0 };
  let prevOffset = { x: 0, y: 0 };
  let panSpeed = 8;
  let trackBody;
  let trackNum = 0;
  let newBody = false;

  draw();

  // form event listeners
  {
    // begin the simulation
    form.randBtn.onclick = () => {
      // form.collide.checked = true;
      initParams();
      initRandBodies(numBodies, minSize, maxSize, initVel);
      activeBodies = bodies.length;
      form.bodyCount.innerText = activeBodies;
    };

    form.loadBtn.onclick = () => {
      initParams();
      switch (form.presets.value) {
        case "0": // 500 body chaos
          form.G.value = form.GOut.innerText = 1;
          form.drawVector.checked = drawVector = false;
          form.drawGravity.checked = drawGravity = false;
          form.timestep.value = form.tOut.innerText = 0.5;
          form.numBodies.value = numBodies = 500;
          form.maxSize.value = maxSize = 3;
          form.minSize.value = minSize = 2;
          form.drawGravityStrength.checked = drawGravityStrength = false;
          initRandBodies(numBodies, minSize, maxSize, initVel);
          break;
        case "1": // sun and 3 planets
          form.collide.checked = false;
          form.G.value = form.GOut.innerText = 0.15;
          G = 0.15;
          initOrbitBodies1();
          break;
        case "2": // two equal bodies
          form.collide.checked = false;
          form.G.value = form.GOut.innerText = 0.15;
          G = 0.15;
          initOrbitBodies2();
          break;
        case "3": // sun planets and moon
          form.collide.checked = false;
          form.G.value = form.GOut.innerText = 0.25;
          G = 0.25;
          initOrbitBodies3();
          break;
        case "4": // solar system
          form.collide.checked = false;
          G = Gconst;
          initSolarSystem();
      }
      activeBodies = bodies.length;
      form.bodyCount.innerText = activeBodies;
    };

    // add a body
    form.add.onclick = () => {
      activeBodies += 1;
      form.bodyCount.innerText = activeBodies;
      initParams();
      initRandBodies(1, minSize, maxSize, initVel);
    };

    // clear bodies
    form.clear.onclick = () => {
      bodies = [];
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      activeBodies = bodies.length;
      form.bodyCount.innerText = activeBodies;
    };

    form.clrOffscreen.onclick = () => {
      bodies.forEach((body) => {
        if (
          body.pos.x > canvas.width ||
          body.pos.x < 0 ||
          body.pos.y > canvas.height ||
          body.pos.y < 0
        ) {
          remove(bodies, body.id);
        }
      });
      activeBodies = bodies.length;
      form.bodyCount.innerText = activeBodies;
    };

    // pause/play sim
    form.toggle.onclick = () => {
      paused = !paused;
      if (timestep) {
        oldTimestep = timestep;
        timestep = 0;
        form.timestep.value = 0;
      } else {
        timestep = oldTimestep;
        form.timestep.value = timestep;
      }
    };

    function initParams() {
      if (!paused) timestep = form.timestep.value;
      initVel = form.initVel.value;
      G = form.G.value;
      numBodies = form.numBodies.value;
      maxSize = form.maxSize.value;
      minSize = form.minSize.value;
    }

    form.timestep.addEventListener("input", (event) => {
      form.tOut.innerText = event.target.value;
      timestep = event.target.value;
    });

    form.G.addEventListener("input", (event) => {
      form.GOut.innerText = event.target.value;
      G = event.target.value;
    });

    form.initVel.addEventListener("input", (event) => {
      form.initVelOut.innerText = event.target.value;
      initVel = event.target.value;
    });
  }

  // interaction event listeners
  {
    window.onkeydown = (event) => {
      const activeElement = document.activeElement;
      const register =
        activeElement.tagName !== "INPUT" &&
        activeElement.tagName !== "SELECT" &&
        activeElement.tagName !== "BUTTON";
      console.log(event.code);
      if (register) {
        switch (event.code) {
          case "ArrowLeft":
          case "KeyA":
            panOffset.x = panSpeed;
            break;
          case "ArrowRight":
          case "KeyD":
            panOffset.x = -panSpeed;
            break;
          case "ArrowUp":
          case "KeyW":
            panOffset.y = panSpeed;
            break;
          case "ArrowDown":
          case "KeyS":
            panOffset.y = -panSpeed;
            break;
          case "Space":
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
            trackBody = null;
            trackNum = 0;
            newBody = false;
            break;
          case "ShiftLeft":
            canvasZoom += 0.005;
            // badzoom();
            // ctx.fillStyle = "rgba(0, 0, 0, 1)";
            // ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;
          case "ControlLeft":
            canvasZoom -= 0.005;
            // badzoom();
            // ctx.fillStyle = "rgba(0, 0, 0, 1)";
            // ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;
          default:
            panOffset.x = panOffset.y = 0;
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
        let r = randInt(minSize, maxSize);
        bodies.push(
          new Body(
            randInt(0 + 2 * r, canvas.width - 2 * r),
            randInt(0 + 2 * r, canvas.height - 2 * r),
            (Math.random() - 0.5) * 2 * v,
            (Math.random() - 0.5) * 2 * v,
            r,
            0,
            randColors
              ? "#" + Math.floor(Math.random() * (16777215 - 5592405) + 5592405).toString(16)
              : "black"
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

    function initSolarSystem() {
      const mScale = 1e-26;
      const dScale = Math.pow(mScale, 1 / 6);
      // sun
      bodies.push(
        new Body(center.x, center.y, 0, 0, 695508 * dScale, 1.9891e30 * mScale, "yellow")
      );
      // mercury
      bodies.push(
        new Body(center.x - 50e6 * dScale, center.y, 0, 47.4, (4879 / 2) * dScale, 0.33e24 * mScale)
      );
      // venus
      bodies.push(
        new Body(
          center.x + 108e6 * dScale,
          center.y,
          0,
          -35,
          (12104 / 2) * dScale,
          4.87e24 * mScale
        )
      );
      // earth
      bodies.push(
        new Body(
          center.x - 150e6 * dScale,
          center.y,
          0,
          29.8,
          (12756 / 2) * dScale,
          5.97e24 * mScale
        )
      );
    }
  }

  // simulation
  function getRadius(mass) {
    return Math.cbrt((mass * (3 / 4)) / Math.PI);
  }

  // to remove bodies during collision
  // function remove(arr, value) {
  //   var i = 0;
  //   while (i < arr.length) {
  //     if (arr[i] === value) {
  //       arr.splice(i, 1);
  //     } else {
  //       ++i;
  //     }
  //   }
  //   return arr;
  // }
  function remove(arr, id) {
    const index = arr.findIndex((body) => body.id === id);
    if (index !== -1) {
      arr.splice(index, 1);
    } else {
      console.error("did not remove", id);
    }
    return arr;
  }

  // to generate random integers
  function randInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
  }

  class Body {
    constructor(xPos = 0, yPos = 0, xVel = 0, yVel = 0, r = 5, mass = 0, color = "gray") {
      this.pos = { x: xPos, y: yPos };
      this.vel = { x: xVel, y: yVel };
      this.prevPos = { x: xPos, y: yPos };
      this.radius = r ? r : getRadius(mass);
      this.mass = mass ? mass : (4 / 3) * Math.PI * Math.pow(r, 3);
      this.color = color;
      this.id = bodyCount++;
    }
    getMomentum() {
      return { x: this.vel.x * this.mass, y: this.vel.y * this.mass };
    }
    draw(drawVector = true) {
      // draw the circle
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fillStyle = this.color;
      ctx.fill();

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

      // center
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius < 1.5 ? this.radius : 1.5, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fillStyle = this.radius < 3 ? "white" : "black";
      ctx.fill();

      // motion vector
      ctx.lineWidth = 1;
      if (drawVector) {
        let mult = 10 * timestep;
        ctx.beginPath();
        ctx.strokeStyle = "blue";
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.lineTo(this.pos.x + mult * this.vel.x, this.pos.y + mult * this.vel.y);
        ctx.closePath();
        ctx.stroke();
      }

      // offscreen indicators
      // use slope to draw lines pointing toward center
      if (
        this.pos.x < 0 ||
        this.pos.x > canvas.width ||
        this.pos.y < 0 ||
        this.pos.y > canvas.height
      ) {
        let bodyPos = { x: this.pos.x - center.x, y: this.pos.y - center.y };
        let slope = (this.pos.y - center.y) / (this.pos.x - center.x);
        let angle = Math.abs(Math.atan2(bodyPos.y, bodyPos.x));
        let x = (center.x - (this.radius + 5) * Math.abs(Math.cos(angle))) * Math.sign(bodyPos.x);
        let y = (center.y - (this.radius + 5) * Math.sin(angle)) * Math.sign(bodyPos.y);
        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.moveTo(center.x + bodyPos.x, center.y + bodyPos.y);
        Math.abs(Math.abs(bodyPos.x) / canvas.width) > Math.abs(Math.abs(bodyPos.y) / canvas.height)
          ? ctx.lineTo(center.x + x, center.y + slope * x)
          : ctx.lineTo(center.x + y / slope, center.y + y);
        // : ctx.lineTo(center.x, center.y);
        ctx.closePath();
        ctx.stroke();
      }
    }
    update(accel = { x: 0, y: 0 }, drawGravity = true) {
      this.prevPos.x = this.pos.x;
      this.prevPos.y = this.pos.y;
      // edge collision - set accel to 0 when colliding to prevent changes in velocity
      if (collide) {
        if (
          this.pos.x + this.vel.x >= currentOffset.x + canvas.width - this.radius ||
          this.pos.x + this.vel.x <= currentOffset.x + this.radius
        ) {
          this.vel.x = -this.vel.x;
          accel.x = 0;
        }
        if (
          this.pos.y + this.vel.y >= currentOffset.y + canvas.height - this.radius ||
          this.pos.y + this.vel.y <= currentOffset.y + this.radius
        ) {
          this.vel.y = -this.vel.y;
          accel.y = 0;
        }
      }
      if (drawGravity) {
        let mult = 80 * timestep;
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "red";
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.lineTo(this.pos.x + mult * accel.x, this.pos.y + mult * accel.y);
        ctx.closePath();
        ctx.stroke();
      }
      // implement acceleration
      this.vel.x += accel.x * timestep;
      this.vel.y += accel.y * timestep;
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

  function gravity(currentBody, index) {
    let dist = { net: 0, x: 0, y: 0 };
    let force = { x: 0, y: 0 };
    let accel = { x: 0, y: 0 };
    let angle;
    let gForce;

    bodies.forEach((body, j) => {
      // sum forces in X and Y for each using Fg = G(m1*m2)/r^2
      // then get accel by dividing by mass
      if (index != j) {
        // get distance
        dist.x = body.pos.x - currentBody.pos.x;
        dist.y = body.pos.y - currentBody.pos.y;
        dist.net = Math.hypot(dist.x, dist.y);

        if (
          dist.net <= body.radius + currentBody.radius &&
          bodies.includes(currentBody) &&
          bodies.includes(body)
        ) {
          collision(currentBody, body);
        }
        // get total gravity
        gForce = (G * (body.mass * currentBody.mass)) / Math.pow(dist.net, 2);
        // get the angle between the two bodies
        angle = Math.atan2(dist.x, dist.y);
        force.x += gForce * Math.sin(angle);
        force.y += gForce * Math.cos(angle);
        if (drawGravityStrength && timestep) {
          let strength = 1 - 10 / (gForce + 10);
          ctx.beginPath();
          ctx.strokeStyle =
            "rgba(" + (255 - 255 * strength) + "," + 255 * strength + ",0 ," + strength + ")";
          console.log(gForce);
          ctx.moveTo(body.pos.x, body.pos.y);
          ctx.lineTo(currentBody.pos.x, currentBody.pos.y);
          ctx.closePath();
          ctx.stroke();
        }
      }
    });
    accel.x = force.x / currentBody.mass;
    accel.y = force.y / currentBody.mass;
    return accel;
  }

  function collision(body1, body2) {
    collisionCount += 1;
    form.collisionCount.innerText = collisionCount;
    activeBodies = bodies.length - 1;
    form.bodyCount.innerText = activeBodies;

    // merge masses and calculate corresponding radius and velocity based on momentum
    let mass = body1.mass + body2.mass;
    let larger = body1.mass > body2.mass ? body1 : body2;
    let momentum = {
      x: body1.getMomentum().x + body2.getMomentum().x,
      y: body1.getMomentum().y + body2.getMomentum().y,
    };
    let velocity = { x: momentum.x / mass, y: momentum.y / mass };
    let pos = {
      x: larger.pos.x, //(body1.pos.x * body1.mass + body2.pos.x * body2.mass) / mass,
      y: larger.pos.y, //(body1.pos.y * body1.mass + body2.pos.y * body2.mass) / mass,
    };
    // let radius = Math.sqrt(mass / Math.PI);
    let radius = getRadius(mass);

    // create new body
    let body = new Body(pos.x, pos.y, velocity.x, velocity.y, radius, 0, larger.color);

    if (trackBody === body1 || trackBody === body2) trackBody = body;

    // remove the collided objects
    remove(bodies, body1.id);
    remove(bodies, body2.id);
    bodies.push(body);
  }

  // canvas rendering
  function updateGraphs(interval) {
    // get fps
    frameCount++;

    const currentTime = performance.now();
    const elapsedTime = currentTime - lastTime;

    if (elapsedTime >= interval) {
      // Update 10 times per second
      const fps = frameCount / (elapsedTime / 1000);
      form.fps.innerText = Math.round(fps * 100) / 100;

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

  function draw() {
    continuous = form.continuous.checked;
    trace = form.trace.checked;
    fade = trace ? form.fade.checked : false;
    drawGravity = form.drawGravity.checked;
    drawGravityStrength = form.drawGravityStrength.checked;
    drawVector = form.drawVector.checked;
    collide = form.collide.checked;

    updateGraphs(100);

    frameByFrame ? setTimeout(draw, frameByFrame) : requestAnimationFrame(draw);

    if (trackBody) track(trackBody);
    if (panOffset.x != 0 || panOffset.y != 0) {
      pan(panOffset, false);
      trace = false;
    }
    if (fade && trace && timestep) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (!trace) {
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    // draw collision box
    if (collide) {
      if (trackBody) {
        ctx.fillStyle = "rgba(0, 0, 0, 1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.strokeStyle = "white";
      ctx.strokeRect(currentOffset.x, currentOffset.y, canvas.width, canvas.height);
    }
    prevOffset.x = currentOffset.x;
    prevOffset.y = currentOffset.y;
    bodies.forEach((body, i) => {
      body.update(gravity(body, i), drawGravity);
      body.draw(drawVector);
    });
    if (clearTrails) {
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      clearTrails = false;
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
    form.offset.innerText = Math.round(currentOffset.x) + " Y=" + Math.round(currentOffset.y);
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

  // zoom by scaling distance, velocity, gravity, etc.
  // not yet implemented properly
  function badzoom(clearTrails = false) {
    // remove faint trails
    if (clearTrails) {
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    canvas.style.zoom = canvasZoom * 100 + "%";
    canvas.height = (1 / canvasZoom) * (window.innerHeight - 25);
    canvas.width = (1 / canvasZoom) * (window.innerWidth - 350);
    center.x = canvas.width / 2;
    center.y = canvas.height / 2;
  }
  // proper implementation hopefully
  function zoom(clearTrails = false) {
    // remove faint trails
    if (clearTrails) {
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }
};
