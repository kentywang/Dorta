## Dorta
This is an online multiplayer fighting game made for a hackathon.

![](https://github.com/kentywang/Dorta/blob/master/img/Dorta.gif)

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
To just play locally, open up the `index.html` file in a browser.

The game will then be accessible at `http://localhost:8000`. 

### Help
Create an [issue](https://github.com/kentywang/dorta/issues) if you need help.

### Credits
Thanks to [dogchicken](http://opengameart.org/users/dogchicken) for the cat fighter sprite sheets, [nkorth](http://opengameart.org/users/nkorth) for the health bar design, and to [ansimuz](http://opengameart.org/users/ansimuz) for the forest background.
