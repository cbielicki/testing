// sets up the ui from client data



//starts the hand builder
function startBuilder(){}




//renders the hand builder
function renderBuilder(){};




//starts the board
function startBoard(data){
  let Graphics = PIXI.Graphics;
  let background = new Graphics();
  background.beginFill(0x105000);
  background.drawRect(0, 0, 900, 900);
  background.endFill();
  pixiApp.stage.addChild(background);
  //longitudes
  for(let i = 0; i < 8; i++){
    let longitude = new Graphics();
    let latitude = new Graphics();
    longitude.beginFill(0x508000);
    latitude.beginFill(0x508000);
    let inc = ((i + 1) * 100) - 1;
    longitude.drawRect(inc, 0, 2, 900);
    latitude.drawRect(0, inc, 900, 2);
    longitude.endFill();
    latitude.endFill();
    pixiApp.stage.addChild(longitude);
    pixiApp.stage.addChild(latitude);
  };
};




//renders the board from data
function renderBoard(data){};


let pixiApp;
window.onload = () => {
  let type = "WebGL"
  if(!PIXI.utils.isWebGLSupported()){
    type = "canvas"
  }

  PIXI.utils.sayHello(type)

  //Create a Pixi Application
  pixiApp = new PIXI.Application({
    width: 900,         // default: 800
    height: 900,        // default: 600
    antialias: true,    // default: false
    transparent: false, // default: false
    resolution: 1       // default: 1
  });

  //Add the canvas that Pixi automatically created for you to the HTML document
  document.body.appendChild(pixiApp.view);
};
