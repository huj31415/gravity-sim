# 2D n-body particle simulation

A Javascript-based N-body simulation for calculating interactions between an arbitrary number of bodies

Based on AP Physics 1 content (Physics 2 content coming Soon(tm))

## Features
- Adjustable simulation parameters
  - G, timestep, mass, velocity, etc.
- Body tracking to visualize relative velocity
- Body collisions
  - Perfectly elastic, inelastic, perfectly inelastic
- Various draw options
  - Trace paths
  - Color based on speed
  - Gravitational field visualization (VERY SLOW)
  - Center of mass
  - Velocity, acceleration vectors
  - etc.
- Presets (with some randomization)
  - Planets
  - Planets with moons
  - Galaxy collision
  - Random solar system generator
- Interactive

## Controls
- U/V: toggle sidebar
- Arrows/WASD/Mouse: pan view
- Space: cycle tracked body
- Esc: cancel tracking
- Home/0: center viewport
- Scroll/Z/X: zoom in/out
- Others listed in control panel

## Issues
- Single core CPU-bound, very inefficient

## Planned
- Electrostatics and EM forces
- Resonant orbit generator
- Particle trajectory prediction
- Move calculations to gpu (especially field calcs)
- Implement optimized algorithms
- 3D version
