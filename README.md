##Dorta

[![Live Demo](https://img.shields.io/badge/demo-online-green.svg)](http://dorta.herokuapp.com)[![Jenkins](https://img.shields.io/jenkins/s/https/jenkins.qa.ubuntu.com/precise-desktop-amd64_default.svg)]()[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/quirkycorgi/Dorta/blob/master/LICENSE)

### Online Browser Fighting Game 
Inspired by Super Smash Bros, Street Fighter, Legend of Zelda, and Dragon Ball Z, Dorta is an online multiplayer fighting game made during a 4-day hackathon.

![](https://github.com/quirkycorgi/Dorta/blob/master/img/Dorta.gif)

### Live Demo
A playable, offline, single-machine build of Dorta can be found [here](https://dorta.herokuapp.com). Dorta is Chrome only.
To control player 1, use the arrow keys to move, the spacebar to jump, and the Q & W keys for attacks. To control player 2, use the UNEI keys to move, the C key to jump, and the 1 & 2 keys for attacks.

To play the online version of Dorta, please checkout the 'socket' branch of this repository and follow the installation instructions below.

### Architecture
For the online-based 'socket' branch of this repository, Dorta is built on [Node.js](https://nodejs.org/) using [Socket.IO](http://socket.io/) for client-server interaction. The game logic is run server-side, with clients sending their input requests to the server and receiving game states to render. A custom game engine was built using the Canvas API to render the visuals on-screen. 

### Installation
To install Dorta on your computer, you will need [Node.js with NPM](https://nodejs.org/en/download/).

Once you have Node.js with NPM, install the game's dependencies with the following command:
```
npm install
```

When the dependencies have been installed, run the server with the following command:

```
npm start
```

The game will then be accessible at `http://localhost:8000`. 

### Help
Create an [issue](https://github.com/quirkycorgi/dorta/issues) if you need help.