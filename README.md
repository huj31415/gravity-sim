# 2D n-body particle simulation

A Javascript-based N-body simulation for calculating gravitational and electrostatic interactions between an arbitrary number of particles

## Features
- Adjustable simulation parameters
  - G, K, timestep, mass, velocity, etc.
- Body tracking to visualize relative velocity
- Body collisions
  - Perfectly elastic, inelastic, perfectly inelastic
- Conservation laws
  - Momentum, energy, charge
- Various draw options
  - Trace paths
  - Color based on speed
  - Gravitational field visualization (VERY SLOW)
    - Can show the Lagrange points
  - Center of mass
  - Velocity, acceleration vectors
  - etc.
- Presets (with some randomization)
  - Planets
  - Planets with moons
  - Galaxy collision
  - Solar system generator
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
  - Setting G to 1 helps with large numbers of bodies

## Planned
- EM forces
- Resonant orbit generator
- Particle trajectory prediction
- Move calculations to gpu (especially field calcs)
- Implement optimized algorithms
- 3D version
