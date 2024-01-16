# 2D n-body gravity simulation

A Javascript-based N-body simulation for calculating Newtonian gravitational interactions between an arbitrary number of bodies

## Features
- Adjustable simulations parameters
  - G, timestep, mass, velocity, etc.
- Body tracking to visualize relative velocity
- Body collisions
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
- Resonant orbit generator
- Particle trajectory prediction
- Move calculations to gpu (especially field calcs)
- Implement optimized algorithms
- 3D version
