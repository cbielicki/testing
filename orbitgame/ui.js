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
  let board = new PIXI.Container();
  pixiApp.stage.addChild(board);
  let background = new Graphics();
  background.beginFill(0x103000);
  background.drawRect(0, 0, 900, 900);
  background.endFill();
  board.addChild(background);
  //lines
  for(let i = 0; i < 10; i++){
    let longitude = new Graphics();
    let latitude = new Graphics();
    longitude.beginFill(0x508000);
    latitude.beginFill(0x508000);
    let inc = (i * 100) - 1;
    longitude.drawRect(inc, 0, 2, 900);
    latitude.drawRect(0, inc, 900, 2);
    longitude.endFill();
    latitude.endFill();
    board.addChild(longitude);
    board.addChild(latitude);
  };

  let units = new PIXI.Container();
  pixiApp.stage.addChild(units);

  PIXI.loader
  .add('fighterImage', './img/fighter.png')
  .load(renderBoard);
};




//renders the board from data TODO add age or new boolean or extra reference for new units to be rendered
let defaultData = {
  units: [{
    type: 'unit',
    unitType: 'battleship',
    player: 1,
    shield: 50,
    health: 100,
    fusionCores: 0,
    lightMunitions: 3,
    heavyMunitions: 0,
    position: '40',
    behaviour: 'static',
  },{
    type: 'unit',
    unitType: 'battleship',
    player: 2,
    shield: 50,
    health: 100,
    fusionCores: 0,
    lightMunitions: 3,
    heavyMunitions: 0,
    position: '48',
    behaviour: 'static',
  },{
    type: 'unit',
    type: 'depot',
    player: 0,
    position: '14',
    depotTimer: 0,
  },{
    type: 'unit',
    type: 'depot',
    player: 0,
    position: '44',
    depotTimer: 0,
  },{
    type: 'unit',
    type: 'depot',
    player: 0,
    position: '74',
    depotTimer: 0,
  }],
};
function renderBoard(data = defaultData){
  if(typeof data === 'undefined') return;
  data = defaultData;
  for(let i = 0; i < data.units.length; i++){
    //TODO this loop should only add new units, so check age/new key or pull from new unit array or w/e
    let unit = data.units[i];
    let sprite = new PIXI.Sprite(PIXI.loader.resources.fighterImage.texture);
    sprite.height = 20;
    sprite.width = 20;
    let coordinates = unit.position.split("");
    sprite.position.x = (coordinates[0] * 100) + 40;
    sprite.position.y = (coordinates[1] * 100) + 40;
    pixiApp.stage.children[1].addChild(sprite);
    //sort the units array into arrays based on position and player
    //array index will refer to position on grid
    //each array will consist of object with two arrays - one for each player
    //TODO figure out what to do with the depots/battleships
  };
  //render each position on grid

  //test sprite
  // let testSprite = new PIXI.Sprite(
  //   PIXI.loader.resources.fighterImage.texture
  // );
  // testSprite.scale.x = 0.2;
  // testSprite.scale.y = 0.2;
  // pixiApp.stage.children[1].addChild(testSprite);
};


window.onload = () => {
  init();
};
