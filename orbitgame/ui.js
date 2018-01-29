// sets up the ui from client data




//called once the page is loaded
let pixiApp;
function init(){
  let loader = document.querySelector('#loader');
  loader.style.display = 'none';

  let type = "WebGL"
  if(!PIXI.utils.isWebGLSupported()){
    type = "canvas"
  };

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

  startBoard();
};




//starts the hand builder
function startBuilder(){}




//renders the hand builder
function renderBuilder(){};




//starts the board
function startBoard(data){
  let Graphics = PIXI.Graphics;
  let background = new Graphics();
  background.beginFill(0x103000);
  background.drawRect(0, 0, 900, 900);
  background.endFill();
  pixiApp.stage.addChild(background);
  //lines
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

  PIXI.loader
  .add('fighterImage', './img/fighter.png')
  .load(addSprite);

  //test sprite
  function addSprite() {
    let testSprite = new PIXI.Sprite(
      PIXI.loader.resources.fighterImage.texture
    );
    pixiApp.stage.addChild(testSprite);
  };
};




//renders the board from data
function renderBoard(data){
  for(let i = 0; i < data.units.length; i++){
    //sort the units array until arrays based on position and player
    //array index will refer to position on grid
    //each array will consist of object with two arrays - one for each player
    //TODO figure out what to do with the depots/battleships
  };
  //render each position on grid
};


window.onload = () => {
  init();
};
