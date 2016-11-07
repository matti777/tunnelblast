# tunnel.blast - PoC Javascript game

This is a PoC project for trying out the limits of making a mobile game with Javascript/WebGL/similar web based technologies.

## Table of Contents

1. [Concept](#concept)
1. [Overall Architecture](#overall-architecture)
	* [Screenshots](#screenshots)
	* [User Interface](#user-interface)
	* [3D Graphics](#3d-graphics)
	* [Collision physics](#collision-physics)
	* [Networking](#networking)
	* [Game server](#game-server)
	* [Audio](#audio)
	* [Mobile clients](#mobile-clients)
2. [Client Development](#client-development)
	* [Building the mobile clients](#building-the-mobile-clients)
	* [iOS](#ios)
	* [Android](#android)
3. [Server Development](#server-development)
4. [License](#license)
4. [Contact](#contact)

	
## Concept 

The game is essentially a 3D version of [Pong](https://en.wikipedia.org/wiki/Pong). Yes, there are a million such games in existence already. 

It is a proof-of-concept attempt at building a responsive and well performing mobile game using only cross platform web technologies.

There is a single player mode as well as a multiplayer mode ie. possibility to play against another player. The single player opponent AI is very naive, simply trying to move its paddle in front of the incoming ball to block. In the multiplayer mode, one of the players is the "host" and makes all the decisions; there is no server-side logic or validation for this. It is, after all, a PoC.

## Overall Architecture

[Javascript ES5](https://en.wikipedia.org/wiki/ECMAScript#5th_Edition) was chosen as the development language. The main reason for this was that the core libraries ThreeJS and CANNON.js were developed in ES5. Also the mobile browsers do not (at the time of writing) natively support ES6, nor did I want to bloat the project with gulp/babel etc due to reason no.1.

### Screenshots

Here are screenshots of the main menu and of single player game play.

![Main menu](https://bytebucket.org/mdahlbom/tunnel-blast/raw/eac2ba2b825d5e46b2dac7c02de0f1b58027a3ae/assets/screenshots/screenshot1.png)

![Gameplay](https://bytebucket.org/mdahlbom/tunnel-blast/raw/eac2ba2b825d5e46b2dac7c02de0f1b58027a3ae/assets/screenshots/screenshot2.png)


### User Interface

User interface is implemented purely in HTML / CSS3, including all "zoom" (scale) animations. This has its pros and cons, pros being the same UI works in web as well as the React Native clients, cons being all browsers are different and lots of special cases need handling.

[jQuery](http://jquery.org/) is used to manipulate the HTML DOM.

### 3D graphics

The 3D visuals are implemented with the de-facto Javascript 3D rendering library [ThreeJS](https://threejs.org/). Visual objects are backed by physics engine rigid bodies; some objects such as the paddle update their physical bodies according to the visual objects and some such as the ball update their visual object according to their physical body.

### Collision physics 

For handling the collision / physics part I chose the rather new [CannonJS](http://www.cannonjs.org/) library. While it is rather minimal with the minified source taking up only around 130kB, unfortunately so is its documentation.

### Networking

The networking layer is built on top of [SocketIO](http://socket.io/), which is closest to realtime networking you can get in cross-platform Javascript.

Ball update events are sent as soon as they are available, to avoid jitter. Paddle positions are updated with a frequent timer instead of every frame to avoid spamming the network connection. The physics engine takes care of interpolating the ball tracjectory; the paddle trajectories are interpolated in the client. 

Note that the client-side prediction/interpolation code is very naive and may display jitter on slower network connections.

### Game server

The game server is build on top of [NodeJS](https://nodejs.org/en/) for its IO scalability characteristics and [SocketIO](http://socket.io/) support.


### Audio

Audio is played through [WebAudio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API). It offers just the right amount of abstraction and low level access required for a game project.

All sounds in the game are loaded into AudioBuffer objects on startup and played on demand. 

### Mobile clients

To provide a proper mobile user experience, native clients for iOS and Android can be built, wrapped in [React Native](https://facebook.github.io/react-native/). 

**[⬆ back to top](#table-of-contents)**

## Client Development

You can develop the client on any browser; simply run a local web server (eg. python -m SimpleHTTPServer) and open ```client/html/index.html``` in the browser. Use your favourite text editor and follow best practices & conventions for Javascript.

### Building the mobile clients

You need to have React Native installed to build the clients. See [React Native: Getting Started](https://facebook.github.io/react-native/docs/getting-started.html).

You may need to run ```npm install``` in the ```client/``` directory.

#### iOS

Open ```client/ios/TunnelBlast.xcodeproj``` in Xcode and Run it.

Tested: iOS 10.

#### Android

Import ```client/android/``` as a project into [Android Studio](https://developer.android.com/studio/) and Run it.

Tested: Android 6.0 Marshmallow.

**[⬆ back to top](#table-of-contents)**

## Server Development

You need to have [NodeJS](https://nodejs.org/en/) installed to run the server.

To run the server for development, go into ```server/``` and run ```node .```.  Use your favourite text editor and follow best practices & conventions for Javascript.

To run the server in development, set up [PM2](https://github.com/Unitech/pm2) or similar to manager your server application.

## License

The project is released under the MIT License. See [LICENSE.md](LICENSE.md). 

## Contact

Feel free to email me at matti@777-team.org.
