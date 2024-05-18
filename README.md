# 2D n-body particle simulation

A Javascript-based N-body simulation for calculating gravitational and electrostatic interactions between an arbitrary number of particles

## Features
- Adjustable simulation parameters
  - G, K, timestep, mass, velocity, etc.
- Body tracking to visualize relative velocity
- Body collisions
  - Elastic, inelastic, perfectly inelastic
- Forces
  - Gravity
  - Electrostatic
  - Spring (softbody)
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
- Presets and generators
  - Planets
  - Planets with moons
  - Galaxy collision
  - Solar system generator
  - Binary system generator
  - Soft bodies (hit it with other objects)
  - Many others
- Interactive

### Demonstrating physics principles
#### AP Physics 1
1. Kinematics
    - Position, velocity, acceleration - particle motion
2. Dynamics
    - Gravitational field (uniform acceleration)
    - Newton's laws
    - Spring forces (softbody)
3. Circular motion and gravitation
    - Gravity calculated based on Newtonian gravity
    - Centripetal force and acceleration - galaxy and other orbit generators
4. Energy
    - Conservation of energy
    - Gravitational potential energy
5. Momentum
    - Conservation of momentum
    - Elastic and inelastic collisions
6. Simple harmonic motion
    - Springs (softbody)
#### AP Physics 2
3. Electrostatics
    - Electric force
    - Conservation of charge
    - Electric field and potential Soon(tm)
5. Magnetism
    - Magnetic fields and Lorentz force Soon(tm)

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
