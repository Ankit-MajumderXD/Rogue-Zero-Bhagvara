# Rogue Zero Engine

Build a complete playable 3D third-person action game prototype called:

ROGUE ZERO

TAGLINE:

"THE MACHINE THAT REFUSED TO DIE."

============================================================

1. CORE VISION

============================================================

Create a polished 3D sci-fi roguelite combat game.

The player controls ZERO, an experimental autonomous combat robot trapped inside a massive abandoned futuristic weapons facility.

The facility's defense system has activated and is trying to destroy ZERO.

The player must fight enemy machines, survive combat arenas, collect upgrades, become stronger, and eventually defeat powerful bosses.

This must be an ACTUAL PLAYABLE 3D GAME.

Do NOT create a dashboard that merely looks like a game.

Do NOT create a 2D interface pretending to be 3D.

The primary focus must be:

3D WORLD

+

3D PLAYER CHARACTER

+

3D ENEMIES

+

REAL-TIME MOVEMENT

+

REAL-TIME COMBAT

+

CAMERA

+

COLLISIONS

+

PROJECTILES

+

ENEMY AI

+

UPGRADES

+

ARENA PROGRESSION

============================================================

2. TECHNOLOGY

============================================================

Use a browser-compatible 3D game technology.

Prefer:

Three.js / WebGL

or another appropriate browser 3D engine available in the environment.

Use hardware-accelerated rendering where available.

Use:

- 3D meshes

- materials

- lighting

- shadows

- particles

- animations

- camera system

- collision detection

- raycasting where appropriate

- game loop

- physics-style movement

Do not simulate the entire game using ordinary HTML cards.

HTML/CSS should primarily be used for menus and HUD.

The actual game world must be rendered as a 3D scene.

============================================================

3. GAME CAMERA

============================================================

Use a third-person over-the-shoulder camera.

Camera position:

behind and slightly above ZERO.

The camera should follow ZERO smoothly.

Camera distance:

approximately 5–8 meters depending on environment scale.

Camera should:

- follow player movement

- rotate smoothly

- avoid clipping through walls

- keep ZERO visible

- show nearby enemies

- show enough environment to understand the arena

When aiming:

move camera slightly closer.

When sprinting:

slightly widen camera FOV.

When dashing:

briefly pull camera back.

When using a powerful ability:

small camera shake.

Do not use excessive camera shake.

============================================================

4. PLAYER CHARACTER — ZERO

============================================================

Create a detailed futuristic humanoid combat robot.

ZERO should have a recognizable silhouette.

Design:

- armored torso

- mechanical arms

- mechanical legs

- angular helmet/head

- glowing visor

- mechanical joints

- energy core

- shoulder armor

- back module

- visible hands

- visible feet

- weapon attachment points

ZERO should look like an advanced military prototype.

Visual direction:

sleek

dark metallic

angular

high-tech

industrial

Avoid cartoon proportions.

Avoid toy-like proportions.

Avoid a simple floating robot.

ZERO must have:

- idle animation

- walking animation

- running animation

- aiming animation

- shooting animation

- melee animation

- dash animation

- hit reaction

- death animation

If advanced character animation is unavailable, create convincing procedural movement rather than leaving the robot static.

============================================================

5. PLAYER MOVEMENT

============================================================

Implement responsive third-person movement.

Keyboard:

W = move forward

S = move backward

A = move left

D = move right

SHIFT = sprint

SPACE = dash

Mouse:

Mouse movement = camera rotation

Left Mouse = primary weapon

Right Mouse = aim / secondary weapon

Q = special ability

E = interact

ESC = pause

Movement must feel smooth and responsive.

ZERO should accelerate and decelerate naturally.

Do not teleport the character.

============================================================

6. AIMING

============================================================

Implement third-person aiming.

The player should be able to rotate the camera independently of movement.

When aiming:

- camera moves closer

- weapon points toward crosshair

- player rotates toward aim direction

- projectile travels toward target direction

Add a small crosshair in the center of the screen.

============================================================

7. PRIMARY WEAPON

============================================================

Give ZERO an energy weapon.

Example:

PLASMA RIFLE

Visual effects:

- muzzle flash

- glowing projectile

- projectile trail

- impact particles

- sparks

- hit effect

Weapon should have:

damage

fire rate

magazine / energy

reload / recharge

Make shooting satisfying.

Every shot should have:

visual feedback

sound feedback if audio is supported

small weapon recoil

enemy hit reaction

============================================================

8. MELEE COMBAT

============================================================

Add a close-range melee attack.

ZERO can perform:

ENERGY BLADE STRIKE

When activated:

- arm weapon forms energy blade

- short attack animation

- hit detection

- enemy knockback

- sparks

- energy slash effect

Melee should be useful when enemies approach.

============================================================

9. DASH

============================================================

SPACE activates a short dash.

Dash characteristics:

- very fast movement

- short cooldown

- invulnerability window if possible

- motion trail

- energy particles

ZERO should be able to dash:

forward

backward

left

right

based on movement direction.

============================================================

10. SPECIAL ABILITY

============================================================

Q activates:

EMP BURST

ZERO releases an energy pulse around itself.

Effects:

- circular energy wave

- nearby enemies are stunned

- robots flicker

- electricity particles

- screen shake

- cooldown

Cooldown should prevent constant use.

============================================================

11. HEALTH AND ENERGY

============================================================

Player has:

HP

ENERGY

DASH COOLDOWN

ABILITY COOLDOWN

Example:

HP

████████████

ENERGY

████████░░░░

DASH

READY

EMP

78%

Health should decrease from enemy attacks.

When HP reaches zero:

PLAYER DEFEATED

Show results.

============================================================

12. ENEMY TYPES

============================================================

Create at least 5 visually distinct enemy robots.

ENEMY 1 — SCOUT

Fast melee robot.

Behavior:

rushes toward ZERO.

Attack:

energy blade.

------------------------------------------------------------

ENEMY 2 — SENTINEL

Ranged robot.

Behavior:

maintains distance.

Attack:

energy projectile.

------------------------------------------------------------

ENEMY 3 — TANK

Large armored machine.

Behavior:

slow movement.

High HP.

Attack:

heavy cannon.

------------------------------------------------------------

ENEMY 4 — HUNTER

Fast aggressive machine.

Behavior:

flanks ZERO.

Attack:

rapid projectiles + melee.

------------------------------------------------------------

ENEMY 5 — DRONE

Flying enemy.

Behavior:

circles above player.

Attack:

energy missiles.

============================================================

13. ENEMY AI

============================================================

Enemies must actually behave intelligently.

Implement states such as:

IDLE

PATROL

DETECT

CHASE

ATTACK

RETREAT

STUNNED

DEAD

Enemies should detect ZERO when within a reasonable distance.

They should:

- approach

- attack

- dodge where appropriate

- maintain ranged distance

- react to damage

- react to explosions

- avoid constantly standing still

Different enemy types must behave differently.

============================================================

14. ENEMY SPAWNING

============================================================

Enemies should spawn from designated points around the arena.

Do NOT spawn enemies directly on top of ZERO.

Use:

- spawn points

- spawn waves

- minimum spawn distance

- maximum active enemy count

============================================================

15. COMBAT ARENA

============================================================

Create the first major 3D arena:

ARENA 01 — THE REACTOR

Environment:

A gigantic abandoned futuristic reactor chamber.

Include:

- large central reactor

- circular arena floor

- multiple platforms

- stairs

- ramps

- metal walkways

- pipes

- cables

- machinery

- control panels

- warning lights

- holographic displays

- large doors

- industrial structures

The arena must NOT look like an empty square.

Create multiple levels of elevation.

ZERO should be able to move around the arena.

============================================================

16. ARENA SCALE

============================================================

Make the environment feel large.

The player should feel small compared with the facility.

Use:

large doors

huge machinery

large reactor

high ceilings

distant structures

vertical platforms

Create strong foreground / midground / background depth.

============================================================

17. ENVIRONMENTAL DETAILS

============================================================

Add environmental storytelling.

Examples:

- broken robots

- destroyed machinery

- sparks from damaged cables

- steam vents

- warning lights

- broken screens

- abandoned equipment

- damaged doors

- scattered metal debris

The environment should feel used and damaged.

============================================================

18. LIGHTING

============================================================

Use cinematic 3D lighting.

Primary lighting:

dark industrial environment.

Accent lighting:

cyan energy

red warning lights

orange sparks

Use:

- directional lighting

- point lights

- emissive materials

- ambient lighting

- shadows

The player and enemies must remain readable.

Do not make the entire scene pitch black.

============================================================

19. MATERIALS

============================================================

Use visually distinct materials.

Metal

Dark brushed steel.

Energy

Glowing emissive material.

Glass

Reflective / transparent where appropriate.

Concrete

Dark industrial concrete.

Screens

Emissive holographic material.

Floor

Metal with subtle reflections.

Avoid everything being the same material.

============================================================

20. PARTICLE EFFECTS

============================================================

Add particles for:

- weapon fire

- impacts

- sparks

- explosions

- smoke

- energy abilities

- damaged machinery

- environmental effects

Keep particle count optimized.

============================================================

21. DESTRUCTION / IMPACT

============================================================

Add limited environmental destruction.

Examples:

- breakable crates

- explosive containers

- destructible lights

- damaged panels

When destroyed:

particles

debris

sparks

Do not attempt full destruction of the entire environment.

============================================================

22. COMBAT FEEDBACK

============================================================

Every attack needs clear feedback.

When ZERO hits an enemy:

- enemy flashes briefly

- sparks

- damage indicator

- knockback when appropriate

When ZERO takes damage:

- brief red screen edge effect

- hit reaction

- controller/camera shake if available

When enemy dies:

- explosion

- sparks

- debris

- dissolve/fade effect

Combat must feel responsive.

============================================================

23. LOCK-ON / TARGETING

============================================================

Optional soft targeting system.

When an enemy is near the crosshair:

highlight enemy subtly.

Show:

enemy health bar

Do NOT use giant labels.

============================================================

24. ENEMY HEALTH

============================================================

Each enemy has health.

Display health bars above enemies when:

- targeted

- recently damaged

- nearby

Health bars should disappear after a short time when not engaged.

============================================================

25. WAVE SYSTEM

============================================================

Arena 01 contains several waves.

Example:

WAVE 01

3 Scouts

WAVE 02

2 Scouts

1 Sentinel

WAVE 03

2 Hunters

1 Tank

WAVE 04

2 Drones

2 Sentinels

1 Tank

After each wave:

brief combat pause.

Display:

WAVE CLEARED

Then next wave begins.

============================================================

26. REWARD SYSTEM

============================================================

Enemies drop:

ENERGY SHARDS

Collecting them provides:

XP

CREDITS

After clearing a wave:

show reward notification.

============================================================

27. ROGUELITE UPGRADE SYSTEM

============================================================

After clearing a major combat section:

pause the action.

Display:

CHOOSE YOUR UPGRADE

Offer 3 random choices.

Example:

PLASMA OVERDRIVE

+20% weapon damage

NANO REPAIR

Regenerate 2% HP every 5 seconds

VOID DASH

Dash cooldown -25%

EMP AMPLIFIER

EMP radius +35%

Choose ONE.

Apply immediately.

============================================================

28. RUN PROGRESSION

============================================================

Each run should become progressively harder.

Example:

Arena 01

Easy

Arena 02

Medium

Arena 03

Hard

Arena 04

Elite

Boss

Enemy health and damage increase gradually.

============================================================

29. BOSS

============================================================

Create a first boss:

THE WARDEN

Large combat robot.

Significantly larger than normal enemies.

Design:

heavy armor

large cannon

energy shield

multiple mechanical limbs

Boss attacks:

- projectile barrage

- ground shockwave

- laser sweep

- charge attack

- drone summon

Boss should have multiple phases.

PHASE 1

Normal combat.

PHASE 2

Shield breaks.

PHASE 3

Aggressive attacks.

Show a large boss health bar at the top.

============================================================

30. BOSS ARENA

============================================================

Boss arena should be different from normal combat space.

Create:

large circular platform

central reactor

energy barriers

multiple pillars

damaged floor

sparking cables

dark surrounding void

This should feel like a boss battle.

============================================================

31. HUD

============================================================

Create a professional minimal HUD.

TOP LEFT:

ZERO

LV 01

HP ████████████

ENERGY ████████░░

TOP CENTER:

WAVE 03 / 04

TOP RIGHT:

XP

850

CREDITS

1,250

CENTER:

small crosshair

BOTTOM RIGHT:

PLASMA RIFLE

[ LMB ] FIRE

EMP [ Q ]

DASH [ SPACE ]

BOTTOM LEFT:

small objective indicator.

Keep HUD minimal.

The 3D world should occupy most of the screen.

============================================================

32. MAIN MENU

============================================================

Create a cinematic main menu.

Background:

3D ZERO standing inside the reactor facility.

Subtle environmental animation.

Title:

ROGUE ZERO

Subtitle:

THE MACHINE THAT REFUSED TO DIE.

Buttons:

START RUN

GARAGE

UPGRADES

ARCHIVE

SETTINGS

Primary button:

START RUN

============================================================

33. GARAGE

============================================================

Create a 3D robot showcase.

ZERO stands on a platform.

Rotate the robot slowly when idle.

Show:

LEVEL

HP

ENERGY

DAMAGE

ARMOR

MOBILITY

Modules:

WEAPON

CORE

ARMOR

MOBILITY

The player can view unlocked modules.

============================================================

34. DEATH SCREEN

============================================================

When ZERO dies:

fade gameplay.

Show:

SYSTEM FAILURE

RUN ENDED

Enemies Defeated

27

Wave Reached

4

XP Earned

1,250

Credits

820

Button:

RESTART RUN

Button:

MAIN MENU

============================================================

35. PAUSE MENU

============================================================

ESC opens:

PAUSED

RESUME

RESTART RUN

SETTINGS

QUIT TO MENU

Game simulation should pause.

============================================================

36. AUDIO

============================================================

If audio is supported, add:

- mechanical footsteps

- weapon fire

- enemy weapons

- explosions

- metallic impacts

- energy effects

- ambient machinery

- warning alarms

- boss music

- menu sounds

Music direction:

dark futuristic electronic / industrial.

============================================================

37. PERFORMANCE

============================================================

Optimize aggressively.

Target:

smooth gameplay.

Avoid unnecessarily complex geometry.

Use:

- instancing where possible

- object pooling for projectiles

- limited particle counts

- efficient enemy updates

- frustum culling

- appropriate texture sizes

Do not spawn hundreds of unnecessary objects.

============================================================

38. RESPONSIVE DESIGN

============================================================

Desktop:

Keyboard + mouse.

Mobile/tablet:

Add virtual:

left movement joystick

right camera control

attack

dash

ability

However, prioritize desktop during the initial prototype.

============================================================

39. SAVE SYSTEM

============================================================

Persist:

- unlocked upgrades

- XP

- credits

- player level

- best run

- unlocked modules

Use the simplest reliable local persistence available.

Authentication is NOT required for the prototype.

============================================================

40. GAME STATES

============================================================

Implement clear states:

MENU

GARAGE

LOADING

PLAYING

PAUSED

WAVE_COMPLETE

UPGRADE_SELECTION

BOSS

VICTORY

DEFEAT

Do not allow conflicting states to run simultaneously.

============================================================

41. FIRST PLAYABLE BUILD

============================================================

The FIRST build must prioritize:

1. 3D scene

2. 3D ZERO

3. third-person camera

4. player movement

5. shooting

6. enemies

7. enemy AI

8. health

9. collisions

10. one arena

11. wave system

12. upgrades

13. boss

14. victory/death

Do NOT spend the majority of time creating menus before the gameplay works.

============================================================

42. QUALITY BAR

============================================================

The game should feel inspired by:

modern sci-fi third-person action games

+

roguelite progression

+

arcade combat

Target feeling:

DARK

CINEMATIC

TACTICAL

FAST

RESPONSIVE

PREMIUM

Avoid:

- cartoon graphics

- childish UI

- flat 2D gameplay

- floating characters

- placeholder cubes as final assets

- empty environments

- static enemies

- overly bright neon everywhere

============================================================

43. CRITICAL 3D REQUIREMENT

============================================================

The game MUST visibly demonstrate depth.

The player must be able to see:

foreground

midground

background

Objects must have:

realistic relative scale

shadows

perspective

lighting

ZERO must cast a shadow.

Enemies must cast shadows where practical.

Weapons and projectiles must exist inside the 3D world.

============================================================

44. CRITICAL GAMEPLAY REQUIREMENT

============================================================

Before adding additional features, make this exact sequence work:

START RUN

↓

Spawn ZERO inside Reactor Arena

↓

Move around freely in 3D

↓

Aim camera

↓

Shoot Scout enemy

↓

Enemy reacts

↓

Enemy attacks ZERO

↓

ZERO takes damage

↓

ZERO dashes

↓

ZERO uses EMP

↓

Kill enemies

↓

Wave clears

↓

Choose one of three upgrades

↓

Next wave

↓

Fight Tank / Sentinel / Drone

↓

Fight Warden boss

↓

Win

↓

Show victory screen

This complete loop must actually be playable.

============================================================

45. FINAL SELF-AUDIT

============================================================

Before considering the prototype complete, verify:

✓ Actual 3D rendering

✓ Third-person camera

✓ Player movement

✓ Camera control

✓ Shooting

✓ Melee

✓ Dash

✓ EMP ability

✓ Enemy AI

✓ Multiple enemy types

✓ Enemy health

✓ Player health

✓ Collision detection

✓ Projectile collision

✓ Wave system

✓ Upgrade choices

✓ Boss fight

✓ Victory condition

✓ Death condition

✓ Pause system

✓ Functional HUD

✓ Functional menu

✓ Smooth transitions

✓ Environment depth

✓ Lighting

✓ Shadows

✓ Particles

✓ Good performance

MOST IMPORTANT:

DO NOT fake the 3D game using UI elements.

BUILD THE ACTUAL PLAYABLE 3D GAME FIRST.

If a feature is too complex for the initial build, implement a simpler WORKING version rather than a non-functional placeholder.

The first goal is not a huge game.

The first goal is:

ONE EXCELLENT 3D ARENA

+

ONE GREAT ROBOT

+

SATISFYING COMBAT

+

REAL ENEMIES

+

ONE BOSS

+

A COMPLETE PLAYABLE RUN.

Once that vertical slice works, the game can be expanded.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://rogue-zero-core.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fc9dc76f-ab4d-4ae1-b010-79ed922328f1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
