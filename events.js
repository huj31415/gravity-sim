// events

/**
 * Finds the body nearest to and overlapping the given coordinate
 * @param {Number} x the x coordinate
 * @param {Number} y the y coordinate
 * @returns the index of the body if found, otherwise -1
 */
function findNearest(x, y) {
  let nearest = -1;
  let nearestDistSqr = Infinity;
  bodies.forEach((body, index) => {
    let xDist = body.xPos - x,
      yDist = body.yPos - y;
    let distanceSqr = xDist * xDist + yDist * yDist;
    if (distanceSqr < nearestDistSqr && distanceSqr < body.radius * body.radius + 100 / totalzoom) {
      nearestDistSqr = distanceSqr;
      nearest = index;
    }
  });
  return nearest;
}

/**
 * Zooms the canvas using transformations, then adjusts viewport values
 * @param {Number} zoomfactor the factor to zoom by
 */
function zoom(zoomfactor = 0) {
  if (zoomfactor == 0) {
    // reset zoom
    zoomfactor = 1 / totalzoom;
    totalzoom = 1;
    viewport.x = canvas.width;
    viewport.y = canvas.height;
  } else {
    // adjust zoom
    totalzoom *= zoomfactor;
    viewport.x /= zoomfactor;
    viewport.y /= zoomfactor;
  }
  // transformation
  ctx.transform(
    zoomfactor,
    0,
    0,
    zoomfactor,
    (-(zoomfactor - 1) * canvas.width) / 2,
    (-(zoomfactor - 1) * canvas.height) / 2
  );
  ui.viewport.innerText = ~~viewport.x + " x " + ~~viewport.y;
  ctx.fillStyle = "rgba(0, 0, 0, 1)";
  ctx.fillRect(center.x - viewport.x / 2, center.y - viewport.y / 2, viewport.x, viewport.y);
  ui.zoom.innerText = ~~(totalzoom * 10000) / 100;
}

/** update varables based on ui input values */
function updateSettings() {
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
  softbody = ui.softbody.checked;
  drawKStrength = ui.drawKStrength.checked;
  drawKThreshold = ui.drawKThreshold.checked;
  drawSStrength = ui.drawSStrength.checked;
}

// form event listeners
{
  // button listeners
  {
    // detect and update based on settings changes
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
          load();
          break;
        case ui.add:
          activeBodies += 1;
          ui.bodyCount.innerText = activeBodies;
          bodies.push(
            new Body(
              ui.xp.value
                ? center.x - viewport.x / 2 + parseInt(ui.xp.value)
                : center.x,
              ui.yp.value
                ? center.y - viewport.y / 2 + parseInt(ui.yp.value)
                : center.y,
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
          if (!paused) {
            oldTimestep = timestep;
            timestep = 0;
            ui.timestep.value = 0;
          } else {
            timestep = oldTimestep;
            ui.timestep.value = timestep;
          }
          paused = !paused;
          break;
        case ui.generateRes:
          let mass = parseFloat(ui.resMass.value);
          let res = ui.res.value.split(",").map((n) => parseInt(n));
          let offsets = ui.resOffset.value.split(",").map((n) => parseInt(n));

          generateResonance(mass, res, offsets);
          break;
      }
      // update settings
      updateSettings();
    };

    // toggle visibility of the settings panel
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
    ui.rotate.oninput = (event) => {
      let rad = degToRad(event.target.value);
      rotate(rad - currentAngleOffset, trace);
      ui.collide.checked = collide = false;
    };

    ui.rotateRate.oninput = (event) => {
      if (event.target.value) rotationRate = degToRad(parseFloat(event.target.value));
    };

    ui.trace.oninput = () => {
      if (ui.trace.checked) {
        ui.heatmap.checked = drawField = false;
      }
    };
    ui.timestep.oninput = (event) => {
      ui.tOut.innerText = event.target.value;
      timestep = parseFloat(event.target.value);
    };
    ui.CoR.oninput = (event) => {
      ui.CoROut.innerText = parseFloat(event.target.value);
      if (event.target.value) CoR = parseFloat(event.target.value);
    };
    ui.fadeStrength.oninput = (event) => {
      ui.fadeOutput.innerText = parseFloat(event.target.value);
      fadeStrength = parseFloat(event.target.value);
    };
    ui.G.oninput = (event) => {
      if (event.target.value) G = parseFloat(event.target.value);
    };

    ui.uniformg.oninput = (event) => {
      if (event.target.value) uniformg = parseFloat(event.target.value);
      // if (uniformg) {
      //   collide = true;
      //   ui.collide.checked = true;
      // }
    };

    ui.K.oninput = (event) => {
      if (event.target.value) K = parseFloat(event.target.value);
    };

    ui.springConst.oninput = (event) => {
      if (event.target.value) springConst = parseInt(event.target.value);
    };
    ui.dampening.oninput = (event) => {
      ui.dampOut.innerText = event.target.value;
      dampening = 1 - event.target.value;
    };

    ui.springEquilPos.oninput = (event) => {
      if (event.target.value) springEquilPos = parseInt(event.target.value);
      springEquilSqr = springEquilPos * springEquilPos;
    };

    ui.initVel.oninput = (event) => {
      if (event.target.value) initVel = parseFloat(event.target.value);
    };

    ui.heatmap.oninput = () => {
      ui.trace.checked = trace = false;
      ui.drawGravityStrength.checked = drawGravityStrength = false;
      ui.drawVector.checked = drawVector = false;
      ui.drawGravity.checked = drawGravity = false;
    };

    ui.trackCoM.oninput = () => {
      ui.drawCoM.checked = true;
      trackCoM = ui.trackCoM.checked;
    };

    ui.integrator.oninput = (event) => {
      integrator = parseInt(event.target.value);
    };
  }
}

// interaction event listeners
{
  // mouse events
  {
    canvas.onmousedown = (event) => {
      if (event.ctrlKey) {
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
      } else if (event.altKey) {
        event.preventDefault();
        remove(
          null,
          findNearest(
            (event.clientX / canvas.width) * viewport.x + center.x - viewport.x / 2,
            (event.clientY / canvas.height) * viewport.y + center.y - viewport.y / 2
          )
        );
        ui.bodyCount.innerText = activeBodies = bodies.length;
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
      event.preventDefault();
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
        // && !event.ctrlKey
        switch (event.code) {
          case "AltLeft":
            event.preventDefault();
            break;
          case "ArrowLeft":
          case "KeyA":
            event.preventDefault();
            if (!gameMode)
              panOffset.x = panSpeed / totalzoom;
            else rotationRate -= 0.01;
            break;
          case "ArrowRight":
          case "KeyD":
            event.preventDefault();
            if (!gameMode)
              panOffset.x = -panSpeed / totalzoom;
            else rotationRate += 0.01;
            break;
          case "ArrowUp":
          case "KeyW":
            event.preventDefault();
            if (!gameMode)
              panOffset.y = panSpeed / totalzoom;
            else player.yVel -= 1;
            break;
          case "ArrowDown":
          case "KeyS":
            event.preventDefault();
            if (!gameMode)
              if (event.ctrlKey) {
                // save the canvas image
                const dl = document.createElement('a');
                // Add the name of the file to the link
                dl.download = "nbody-" + Date.now() + ".png";
                // Attach the data to the link
                dl.href = canvas.toDataURL();
                dl.click();
              } else {
                panOffset.y = -panSpeed / totalzoom;
              }
            break;
          case "Space":
            event.preventDefault();
            event.stopPropagation();
            if (trackBody && (event.ctrlKey || event.altKey)) {
              if (rotateTrackNum < bodies.length) {
                rotateTarget = bodies[rotateTrackNum++];
                if (rotateTarget === trackBody) rotateTarget = bodies[rotateTrackNum++];
                // rotationRate =
                //   -Math.atan2(
                //     rotateTarget.yPos - trackBody.yPos,
                //     rotateTarget.xPos - trackBody.xPos
                //   ) -
                //   Math.atan2(
                //     rotateTarget.yPos + rotateTarget.yVel * timestep - trackBody.yPos,
                //     rotateTarget.xPos + rotateTarget.xVel * timestep - trackBody.xPos
                //   );

              } else {
                rotateTarget = null;
                rotateTrackNum = 0;
                rotationRate = 0;
              }
            } else {
              if (trackCoM) {
                trackCoM = false;
                ui.trackCoM.checked = false;
              }
              if (trackNum < bodies.length && !gameMode) {
                trackBody = bodies[trackNum++];
                newBody = true;
              } else {
                trackBody = null;
                trackNum = 0;
                newBody = false;
              }
            }
            break;
          case "Escape":
            event.preventDefault();
            if (rotationRate || rotateTarget) {
              rotateTarget = null;
              rotateTrackNum = 0;
              rotationRate = 0;
              currentAngleOffset = 0;
            } else {
              trackBody = null;
              trackNum = 0;
              newBody = false;
            }
            break;
          case "KeyP":
            ui.toggle.click();
            break;
          case "KeyR":
            if (!event.ctrlKey) ui.randBtn.click();
            break;
          case "KeyL":
            ui.loadBtn.click();
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
            if (event.altKey || event.ctrlKey) {
              event.preventDefault();
              ui.drawGravityStrength.click();
            }
            else ui.gravity.click();
            break;
          case "KeyK":
            if (event.altKey || event.ctrlKey) {
              event.preventDefault();
              ui.drawKStrength.click();
            }
            else ui.electrostatic.click();
            break;
          case "KeyB":
            if (event.altKey || event.ctrlKey) {
              event.preventDefault();
              ui.drawSStrength.click();
            }
            else ui.softbody.click();
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
          case "Backspace":
            ui.clear.click();
            trackBody = null;
            trackNum = 0;
            newBody = false;
            rotateTarget = null;
            rotateTrackNum = 0;
            rotationRate = 0;
            currentAngleOffset = 0;
            ui.rOut.innerText = ui.rotate.value = 0;
            rotate(-currentAngleOffset);
            pan(
              collide
                ? { x: -currentOffset.x + collideOffset.x, y: -currentOffset.y + collideOffset.y }
                : { x: -currentOffset.x, y: -currentOffset.y }
            );
            break;
          case "Home":
          case "Digit0":
            trackBody = null;
            trackNum = 0;
            newBody = false;
            pan(
              collide
                ? { x: -currentOffset.x + collideOffset.x, y: -currentOffset.y + collideOffset.y }
                : { x: -currentOffset.x, y: -currentOffset.y }
            );
            zoom(0);
            rotate(-currentAngleOffset);
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
            // timestep = ~~((timestep + 0.05) * 100) / 100;
            timestep = (parseFloat(timestep) + 0.05).toFixed(2);
            ui.timestep.value = ui.tOut.innerText = timestep;
            break;
          case "Comma":
            // timestep = timestep <= 0.05 ? 0 : ~~((timestep - 0.05) * 100) / 100;
            timestep = (parseFloat(timestep) - 0.05).toFixed(2);
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
