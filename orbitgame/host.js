// The functions called to/by the host
// example game deck (might split between attacks, units & events):
// deck = [{
//   cardType: 'battleship',
//   size: 1,
//   shield: 50,
//   health: 10000,
//   crew: 100,
//   fusionCores: 0,
//   attacks: [{
//     name: 'standoff',
//     accuracy: 1,
//     range: 1,
//     falloff: 1,
//     power: 1,
//     latency: 0,
//     rate: 0,
//   },{
//     name: 'turret',
//     accuracy: 0,
//     range: 2,
//     falloff: 2,
//     power: 5,
//     latency: 0,
//     rate: 5,
//   }],
// },{
//   cardType: 'fighter',
//   size: 0,
//   squadron: 12,
//   health: 2,
//   attacks: [{
//     name: 'smallMissile',
//     accuracy: 1,
//     range: 2,
//     falloff: 0,
//     power: 2,
//     latency: 1,
//     rate: 3,
//   },{
//     name: 'standoff',
//     accuracy: 1,
//     range: 1,
//     falloff: 1,
//     power: 1,
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
  // figure out the draws from the last turn
  let data = load('data');
  for(let i = data.draws.length - 1; i >= 0; i--){
    let draw = data.draws.pop();
    switch(draw.type){
      case 'unit':
        //needs logic for if draw is legal (resources, position etc)
        data.units = spawnUnit(data.units, draw.player, draw.unitType, draw.position);
        break;
      case 'trap':
        //needs logic for if draw is legal (resources, position etc)
        data.events.push(draw);
        break;
    };
  };
  // compute the events
  for(let i = 0; i < data.events.length){
    if(data.events[i].timer === 0){
      data = computeEvent(data, i); //all damage/buffs/cc/kills will go here
    }else{
      data.events[i].timer--;
    };
  };
  // determine unit behaviour and push events from the units
  for(let i = 0; i < data.units.length){
    data.units = unitAct(data.units, i);
  };
  //determine resource distribution and resource point capture
  for(let i = 2; i < 5; i++){
    data.units = computeDepot(data.units, i);
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
  let event = data.event[index];
  if(event.expired === true) return;
  if(event.timer === 0){
    switch(event.eventType){
      case 'attackTarget':
        let unit = data.units[event.target];
        if(unit.position === event.position){
          if(unit.shield === 0){
            unit.health = unit.health - event.power; //TODO all the accuracy stuff is going to replace this
            if(unit.health <== 0) unit['expired'] = true;
          }else{
            unit.shield = unit.shield - event.power;
          };
        };
        data.units[event.target] = unit;
        break;
      case 'attackArea':
        for(let i = 0; i < data.units.length; i++){
          let unit = data.units[i]
          if(unit.position === event.position && unit.player === event.targetPlayer){
            if(unit.shield === 0){
              unit.health = unit.health - event.power; //TODO put something here for squadrons
              if(unit.health <== 0) unit['expired'] = true;
            }else{
              unit.shield = unit.shield - event.power;
            };
          };
          data.units[i] = unit;
        };
        break;
    };
    event['expired'] = true;
  }else{
    event.timer--;
  };
  data.event[index] = event;
  return data;
};




// determines a units actions
unitAct(units, index){
  return units
};




//determines depot caputer and resource distribution
computeDepot(units, index){
  return units;
};




//default draws - battleships and depots
let defaultDraws = [{
  type: 'unit',
  player: 1,
  unitType: 'battleship',
  position: 0049,
  lightMunitions: 3,
  heavyMunitions: 0,
  fusionCores: 0,
},{
  type: 'unit',
  player: 2,
  unitType: 'battleship',
  position: 9949,
  lightMunitions: 3,
  heavyMunitions: 0,
  fusionCores: 0,
},{
  type: 'unit',
  player: 0,
  unitType: 'depot',
  position: 4905,
},{
  type: 'unit',
  player: 0,
  unitType: 'depot',
  position: 4949,
},{
  type: 'unit',
  player: 0,
  unitType: 'depot',
  position: 4994,
}];
