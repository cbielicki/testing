// The functions called to/by the host
// example game deck (might split between attacks, units & events):
// deck = [{
//   cardType: 'battleship',
//   shield: 50,
//   health: 10000,
//   crew: 100,
//   fusionCores: 0,
//   attacks: [{
//     name: 'standoff',
//     accuracy: 1,
//     power: 0,
//     latency: 0,
//     rate: 0,
//   },{
//     name: 'turret',
//     accuracy: 0,
//     power: 1,
//     latency: 0,
//     rate: 5
//   }],
// },{
//   cardType: 'fighter',
//   squadron: 12,
//   health: 2,
//   attacks: [{
//     name: 'smallMissile',
//     accuracy: 1,
//     power: 1,
//     latency: 1,
//     rate: 3,
//   },{
//     name: 'standoff',
//     accuracy: 1,
//     power: 0,
//     latency: 0,
//     rate: 0,
//   }]
// }];
// example data object:
// data = {
//   units: [],
//   events: [],
//   time: 0,
// };
//example unit object:
// data.units[0] = {
//   type: 'battleship',
//   player: 'xX6969stealthninjadestroyer6969Xx',
//   shield: 35,
//   health: 100,
//   fusionCores: 16,
//   lighMunitions: 42,
//   heavyMunitions: 28,
//   position: 0049, // 100x100 grid?
//   behaviour: 'static', //prolly switch to a number based system
// };




// checks that deck is legal and adds event listener for matcmaking?
function startSearch(options){};




// sends data to the player
function send(options){};




// asks for saved game data or the game deck
function load(options){};




// saves game data
function save(options){};




// listens for tasks from the client - or maybe it doesn't? client actions could go straight to saved?




// updates the game world at each game interval
function render(){
  // load the game deck here or keep the deck loaded?
  let data = load('data');
  for(let i = data.draws.length - 1; i >= 0; i--){
    let draw = data.draws.pop();
    switch(draw){
      case 'unit':
        //will need some logic for the draw position here
        data.units = spawnUnit(data.units, draw.player, draw.unitType, draw.position);
        break;
      case 'trap':
        data.events.push(draw.event);
        break;
    };
  };
  for(let i = 0; i < data.events.length){
    if(data.events[i].timer === 0){
      computeEvent(data, i);
    }else{
      data.events[i].timer--;
    };
  };
  for(let i = 0; i < data.units.length){
    data.units = unitAct(data.units, i);
  };
  //determine win conditions will go here
  save(data);
};




// spawns a unit from a player's battleship, or at an optional location
function spawnUnit(units, player, unitType, position){
  let newUnit = {
    player: player,
    type: unitType,
    position: position,
  };
  units.push(newUnit);
  return units;
};




// determines the outcome of an event
computeEvent(data index){
  delete data.events[i];
  return data;
};




// determines a units actions
unitAct(units, index){
  return units
};
