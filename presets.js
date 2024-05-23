// body presets
/**
 * Generates random integers
 * @param {Number} min minimum inclusive
 * @param {Number} max maximum exclusive
 * @returns the generated random number
 */
function randInt(min, max) {
  min = Math.ceil(min);
  max = ~~max;
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}
/** load a preset */
function load() {
  initParams();
  switch (ui.presets.value) {
    case "0": // 500 body chaos
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
      ui.G.value = G = 0.15;
      ui.gravity.checked = true;
      sun3PlanetsSystem();
      break;
    case "2": // two body system
      ui.collide.checked = false;
      ui.gravity.checked = true;
      binarySystem();
      break;
    case "3": // two body system (circular)
      ui.collide.checked = false;
      ui.gravity.checked = true;
      binarySystem(true);
      break;
    case "4": // sun planets and moon
      ui.collide.checked = false;
      ui.G.value = G = 0.25;
      ui.gravity.checked = true;
      sunPlanetsMoonsSystem();
      break;
    case "5": // galaxies
      ui.G.value = 1;
      ui.drawVector.checked = drawVector = false;
      ui.drawGravity.checked = drawGravity = false;
      ui.timestep.value = ui.tOut.innerText = timestep = 0.1;
      ui.drawGravityStrength.checked = drawGravityStrength = false;
      ui.gravity.checked = true;
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
      ui.G.value = 1;
      ui.drawVector.checked = drawVector = false;
      ui.drawGravity.checked = drawGravity = false;
      ui.timestep.value = ui.tOut.innerText = timestep = 0.25;
      ui.drawGravityStrength.checked = drawGravityStrength = false;
      ui.gravity.checked = true;
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
      ui.G.value = 1;
      ui.drawVector.checked = drawVector = false;
      ui.drawGravity.checked = drawGravity = false;
      ui.timestep.value = ui.tOut.innerText = timestep = 0.25;
      ui.drawGravityStrength.checked = drawGravityStrength = false;
      ui.gravity.checked = true;
      generateSolarSystem({ x: center.x, y: center.y }, { x: 0, y: 0 });
      break;
    case "8":
      initNewtonsCradle();
      break;
    case "9":
      initPiCollisions();
      break;
    case "10":
      initSquareGrid();
      break;
    case "11":
      initHexGrid();
      break;
    case "12":
      //
      break;
  }
  activeBodies = bodies.length;
  ui.bodyCount.innerText = activeBodies;
}

/**
 * Randomly generate bodies based on params
 * @param {Number} num number of random bodies to generate
 * @param {Number} minMass minimum mass
 * @param {Number} maxMass maximum mass
 * @param {Number} v maximum initial velocity
 * @param {Boolean} randColors whether or not to randomly color the bodies
 * @param {Boolean} zeroVel whether or not to set the velocity of the center of mass to 0
 */
function initRandBodies(
  num,
  minMass = 3,
  maxMass = 5,
  minCharge = 0,
  maxCharge = 0,
  v = 0,
  randColors = true,
  zeroVel = false
) {
  let xMomentum = 0;
  let yMomentum = 0;
  for (let i = 0; i < num - zeroVel; i++) {
    const mass = randInt(minMass, maxMass);
    const charge = randInt(minCharge, maxCharge);
    let r = getRadius(mass);
    const x = collide
      ? randInt(
        -collideOffset.x + currentOffset.x + 2 * r,
        -collideOffset.x + currentOffset.x + canvas.width - 2 * r
      )
      : randInt(center.x - viewport.x / 2 + 2 * r, center.x + viewport.x / 2 - 2 * r);
    const y = collide
      ? randInt(
        -collideOffset.y + currentOffset.y + 2 * r,
        -collideOffset.y + currentOffset.y + canvas.height - 2 * r
      )
      : randInt(center.y - viewport.y / 2 + 2 * r, center.y + viewport.y / 2 - 2 * r);
    const vx = (Math.random() - 0.5) * 2 * v;
    const vy = (Math.random() - 0.5) * 2 * v;
    xMomentum += vx * mass;
    yMomentum += vy * mass;
    bodies.push(new Body(x, y, vx, vy, r, 0, randColors ? randColor() : "white", true, charge));
  }
  // set the last body to cancel out momentum of the system to 0
  if (zeroVel) {
    const mass = randInt(minMass, maxMass);
    let r = getRadius(mass);
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
        -xMomentum / mass,
        -yMomentum / mass,
        r,
        0,
        randColors ? randColor() : "white"
      )
    );
    xMomentum += -xMomentum / mass;
    yMomentum += -yMomentum / mass;
  }
}

/**
 * Generates a galaxy with num stars in circular orbits around a massive core
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

// set up three objects to generate 31415 collisions - see 3blue1brown's video on it
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
  bodies.push(
    new Body(center.x - 1000, center.y, initV, 0, 500, mass * ratio, "default", true, 0, false, "y")
  );
}

// set up a grid of bodies to smash with objects (square packing)
function initSquareGrid(spacing = 25, mass = 100, r = 4) {
  // r = 12 for non-softbody
  ui.gravity.checked = gravity = false;
  ui.inelastic.checked = inelastic = false;
  ui.softbody.checked = softbody = true;
  ui.CoR.value = ui.CoROut.innerText = CoR = 0;
  ui.springConst.value = springConst = 100;
  ui.springEquilPos.value = springEquilPos = 25;

  for (let x = spacing / 2; x < window.innerWidth; x += spacing) {
    for (let y = spacing / 2; y < window.innerHeight; y += spacing) {
      bodies.push(new Body(x, y, 0, 0, r, mass, "default"));
    }
  }
}

// set up a grid of bodies to smash with objects (hexagonal packing)
function initHexGrid(spacing = 25, mass = 100, r = 4) {
  // r = 12 for non-softbody
  ui.gravity.checked = gravity = false;
  ui.inelastic.checked = inelastic = false;
  ui.CoR.value = ui.CoROut.innerText = CoR = 0;
  ui.softbody.checked = softbody = true;
  ui.springConst.value = springConst = 100;
  ui.springEquilPos.value = springEquilPos = 25;

  let ySpacing = (Math.sqrt(3) * spacing) / 2;
  for (let x = spacing / 2; x < window.innerWidth; x += spacing) {
    for (let y = spacing / 2, odd = true; y < window.innerHeight; y += ySpacing, odd = !odd) {
      bodies.push(new Body(x + odd * (spacing / 2), y, 0, 0, r, mass, "default"));
    }
  }
}

/**
 * Generates a solar system, similar to a galaxy but the particles in orbit can collide
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

// Binary system with calculated stable orbits
function binarySystem(circular = false) {
  const m1 = randInt(5000, 100000);
  const m2 = randInt(5000, 100000);
  const x1 = randInt(100, 500);
  const x2 = (m1 * x1) / m2;
  const circularVel = (m2 / (m1 + m2)) * Math.sqrt((G * m2) / x1);
  const v1 = circular ? circularVel : randInt(circularVel / 2, circularVel * 1.1);
  // randInt(Math.cbrt(G * (m2) / (x1 + x2)), Math.sqrt(G * (m2 + m1) / 2 / (x1 + x2)));
  const v2 = (m1 * v1) / m2;

  bodies.push(new Body(center.x + x1, center.y, 0, v1, 0, m1));
  bodies.push(new Body(center.x - x2, center.y, 0, -v2, 0, m2));

  // original binary preset
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

/**
 * Generates a system of resonant orbits
 * @param {Number} mass Mass of the central body
 * @param {Array<Number>} ratios Ratios of orbital periods (ascending order)
 * @param {Array<Number>} offsets Amount of 90 deg. offsets for each body (clockwise) Must be same length as ratios
 */
function generateResonance(mass = 1e5, ratios = [1, 2], offsets = null) {
  ui.timestep.value = timestep = 0.1;
  ui.trace.checked = trace = true;
  // fill array if not given
  if (!offsets) offsets = new Array(ratios.length).fill(0);

  // sort the array
  ratios.sort(function(a, b){return a - b})//.reverse(); console.log(ratios)

  // add the central body
  bodies.push(new Body(center.x, center.y, 0, 0, 0, mass));

  // calculate base orbit properties
  let orbitMass = mass / 1e5;
  let baseRadius = getRadius(mass) * 5;
  let basePeriod = 2 * Math.PI * Math.sqrt(baseRadius ** 3 / (G * (mass + orbitMass)));

  // adjustment factor for setting minimum SMA size to baseRadius
  let factor;

  // add the bodies
  ratios.forEach((period, index) => {
    let o = (offsets[index] | 0) % 4; // ratios.indexOf(period)
    let radius;
    if (index == 0) {
      // set the innermost body to orbit at baseRadius
      radius = baseRadius;

      // if needed adjust all orbits so that ratios like [57, 63] are a reasonable size
      factor = baseRadius / Math.cbrt((G * mass * (basePeriod * period) ** 2) / (4 * Math.PI ** 2));
    } else {
      // calculate radius based on period
      radius = factor * Math.cbrt((G * mass * (basePeriod * period) ** 2) / (4 * Math.PI ** 2));
    }
    // calculate velocity based on radius
    let velocity = Math.sign(period) * Math.sqrt((G * mass) / radius);

    // adjust for angle offset
    let x = (o == 1 || o == 3) ? 0 : (o == 0 ? radius : -radius);
    let y = (o == 0 || o == 2) ? 0 : (o == 1 ? radius : -radius);
    let vx = (o == 0 || o == 2) ? 0 : (o == 1 ? -velocity : velocity);
    let vy = (o == 1 || o == 3) ? 0 : (o == 0 ? velocity : -velocity);

    // add the body
    bodies.push(new Body(center.x + x, center.y + y, vx, vy, 0, orbitMass));
  });
}