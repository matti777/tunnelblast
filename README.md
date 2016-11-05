# tunnel.blast - PoC Javascript game

This is a PoC project for trying out the limits of making a mobile game with Javascript/WebGL/similar web based technologies. The goal was to push the envelope on how much of the game code / logic could be put into the cross-platform Javascript layer.

## Table of Contents

1. [Concept](#concept)
1. [Overall Architecture](#overall-architecture)
	* [Screenshots](#screenshots)
	* [User Interface](#user-interface)
	* [3D Graphics](#3d-graphics)
	* TODO
	
## Concept 

The game is essentially a 3D version of [Pong](https://en.wikipedia.org/wiki/Pong). Yes, there are a million such games in existence already.

It is a proof-of-concept attempt at building a responsive and well performing mobile game using only cross platform web technologies.

## Overall Architecture

[Javascript ES5](https://en.wikipedia.org/wiki/ECMAScript#5th_Edition) was chosen as the development language. The main reason for this was that the core libraries ThreeJS and CANNON.js were developed in ES5. Also the mobile browsers do not (at the time of writing) natively support ES6, nor did I want to bloat the project with gulp/babel etc due to reason no.1.

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

### Mobile clients

To provide a proper mobile user experience, native clients for iOS and Android can be built, wrapped in [React Native](https://facebook.github.io/react-native/). 

**[⬆ back to top](#table-of-contents)**

## Client Development

You can develop the client on any browser; simply run a local web server (eg. python -m SimpleHTTPServer) and open ```client/html/index.html``` in the browser. Use your favourite text editor and follow best practices & conventions for Javascript.

### Building the mobile clients

You need to have React Native installed to build the clients. See [React Native: Getting Started](https://facebook.github.io/react-native/docs/getting-started.html).

#### iOS

Open ```client/ios/TunnelBlast.xcodeproj``` in Xcode and Run it.

#### Android

Import ```client/android/``` as a project into [Android Studio](https://developer.android.com/studio/) and Run it.

**[⬆ back to top](#table-of-contents)**

## Server Development

You need to have [NodeJS](https://nodejs.org/en/) installed to run the server.

To run the server for development, go into ```server/``` and run ```node .```.  Use your favourite text editor and follow best practices & conventions for Javascript.

To run the server in development, set up [PM2](https://github.com/Unitech/pm2) or similar to manager your server application.

## Contact

Feel free to email me at matti@777-team.org.
