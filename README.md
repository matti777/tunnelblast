# tunnel.blast - PoC Javascript game

This is a PoC project for trying out the limits of making a mobile game with Javascript/WebGL/similar web based technologies. The goal was to push the envelope on how much of the game code / logic could be put into the cross-platform Javascript layer.

## Table of Contents

TODO 

## Concept and Overall Architecture

TODO

**[⬆ back to top](#table-of-contents)**

### Screenshots

![Main menu](https://bytebucket.org/mdahlbom/tunnel-blast/raw/eac2ba2b825d5e46b2dac7c02de0f1b58027a3ae/assets/screenshots/screenshot1.png)

![Gameplay](https://bytebucket.org/mdahlbom/tunnel-blast/raw/eac2ba2b825d5e46b2dac7c02de0f1b58027a3ae/assets/screenshots/screenshot2.png)

**[⬆ back to top](#table-of-contents)**

### User Interface

User interface is implemented purely in HTML / CSS3.

TODO 

**[⬆ back to top](#table-of-contents)**

### 3D graphics

The 3D visuals are implemented with the de-facto Javascript 3D rendering library [ThreeJS](https://threejs.org/).

TODO 

**[⬆ back to top](#table-of-contents)**

### Collision physics 

For handling the collision / physics part I chose the rather new [CannonJS](http://www.cannonjs.org/) library. While it is rather minimal with the minified source taking up only around 130kB, unfortunately so is its documentation.

TODO 

**[⬆ back to top](#table-of-contents)**

### Networking

The networking layer is built on top of [SocketIO](http://socket.io/), which is closest to realtime networking you can get in cross-platform Javascript.

TODO 

**[⬆ back to top](#table-of-contents)**

### Game server

The game server is build on top of [NodeJS](https://nodejs.org/en/) for its IO scalability characteristics and [SocketIO](http://socket.io/) support.

**[⬆ back to top](#table-of-contents)**

### Audio

Audio is played through [WebAudio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API). It offers just the right amount of abstraction and low level access required for a game project.

TODO 

**[⬆ back to top](#table-of-contents)**

## Contact

Feel free to email me at matti@777-team.org.
