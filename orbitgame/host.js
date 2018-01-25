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




// sends data to the player
function send(options){};




// asks for saved game data or the game deck
function load(options){};




// saves game data
function save(options){};




// listens for tasks from the client - or maybe it doesn't? client actions could go straight to saved?




// checks that deck is legal and adds event listener for matcmaking?
function startSearch(options){};




// updates the game world at each game interval
function render(){
  // load the game deck here or keep the deck loaded?
  // figure out the draws from the last turn
  let data = load('data');
  for(let i = data.draws.length - 1; i >= 0; i--){
    let draw = data.draws.pop();
    switch(draw.type){
      case 'unit':
        //TODO needs logic for if draw is legal (resources, position etc)
        //TODO spend resources
        data.units = spawnUnit(data.units, draw.player, draw.unitType, draw.position); //TODO add some stuff for unit command
        break;
      case 'trap':
        //TODO needs logic for if draw is legal (resources, position etc)
        //TODO spend resources
        data.events.push(draw);
        break;
    };
  };
  // compute the events
  for(let i = 0; i < data.events.length; i++){
    if(data.events[i].timer === 0){
      data = computeEvent(data, i); //all damage/buffs/cc/kills will go here
    }else{
      data.events[i].timer--;
    };
  };
  // determine unit behaviour and push events from the units
  for(let i = 0; i < data.units.length; i++){
    data.units = unitAct(data.units, i);
  };
  //determine resource distribution and resource point capture
  for(let i = 2; i < 5; i++){
    data.units = computeDepot(data.units, i);
  };
  //determine win conditions will go here TODO make this end the game on return
  checkWin(data.units);
  save(data);
};




// spawns a unit from a player's battleship, or at an optional location
function spawnUnit(units, player, unitType, position){
  let newUnit = {
    player: player,
    type: unitType,
    position: position, //TODO add command in arguments and new unit
  };
  units.push(newUnit);
  return units;
};




// determines the outcome of an event
function computeEvent(data, index){
  let event = data.event[index];
  if(event.expired === true) return;
  if(event.timer === 0){
    switch(event.eventType){
      case 'attackTarget':
        let unit = data.units[event.target];
        if(unit.position === event.position){
          if(unit.shield === 0){
            unit.health -= event.power; //TODO all the accuracy stuff is going to replace this (also squadrons)
            if(unit.health <= 0) unit['expired'] = true;
          }else{
            unit.shield -= event.power;
          };
        };
        data.units[event.target] = unit;
        break;
      case 'attackArea':
        for(let i = 0; i < data.units.length; i++){
          let unit = data.units[i]
          if(unit.position === event.position && unit.player === event.targetPlayer){
            if(unit.shield === 0){
              unit.health -= event.power; //TODO put something here for squadrons
              if(unit.health <= 0) unit['expired'] = true;
            }else{
              unit.shield -= event.power;
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
function unitAct(units, index){
  let unit = units[index];
  //if there are no other objectives, attack the enemy battleship
  if(unit.player === 1){
    unit.destination = units[1].position;
  }else{
    unit.destination = units[0].position;
  };
  //capture the nearest uncaptured depot
  for(let i = 2; i < 5; i++){
    //TODO determine the closest uncaptured depot and move to it
  };
  //player given objective is highest priority
  if(unit.command.complete === false){
    unit.destination = unit.command.position;
  };
  //is there a unit in range?
  for(let i = 0; i < units.length; i++){
    if(i === index) continue;
    //TODO attack target in range - or at least add to array of possible targets until choosing best one
  };
  //TODO update the unit position with best square in direction of destination
  units[index] = unit;
  return units
};




//determines depot capture and resource distribution
function computeDepot(units, index){
  let depot = units[index];
  let capturers = [0,0,0];
  for(let i = 0; i < units.length; i++){
    if(units[i].position === depot.position){
      capturers[units[i].player]++
    };
  };
  if(capturers[1] > 0 && capturers[2] === 0 && depot.player !== 1){
    depot.player = 1;
    depot.timer = 5;
  };
  if(capturers[2] > 0 && capturers[1] === 0 && depot.player !== 2){
    depot.player = 2;
    depot.timer = 5;
  };
  switch(depot.player){
    case 0: break;
    case 1:
      if(depot.timer === 0){
        units[0].lightMunitions += 3;
        units[0].heavyMunitions += 2;
        units[0].fusionCores += 1;
      }else{
        depot.timer--;
      };
      break;
    case 2:
      if(depot.timer === 0){
        units[1].lightMunitions += 3;
        units[1].heavyMunitions += 2;
        units[1].fusionCores += 1;
      }else{
        depot.timer--;
      };
      break;
  };
  units[index] = depot;
  return units;
};




//check for win conditions
function checkWin(units){
  if(units[0].expired === true && units[1].expired === true) return 'draw';
  if(units[0].fusionCores >= 100 && units[1].fusionCores >= 100) return 'draw';
  if(units[0].expired === true) return 'player2Win';
  if(units[1].expired === true) return 'player1Win';
  if(units[0].fusionCores >= 100) return 'player1Win';
  if(units[1].fusionCores >= 100) return 'player2Win';
  return 'noEnd' //not sure if necessary? will prolly go over all the returns later
};




//default draws - battleships and depots
let defaultDraws = [{
  type: 'unit',
  player: 1,
  unitType: 'battleship',
  position: 04,
  lightMunitions: 3,
  heavyMunitions: 0,
  fusionCores: 0,
},{
  type: 'unit',
  player: 2,
  unitType: 'battleship',
  position: 94,
  lightMunitions: 3,
  heavyMunitions: 0,
  fusionCores: 0,
},{
  type: 'unit',
  player: 0,
  unitType: 'depot',
  position: 48,
  depotTimer: 0,
},{
  type: 'unit',
  player: 0,
  unitType: 'depot',
  position: 44,
  depotTimer: 0,
},{
  type: 'unit',
  player: 0,
  unitType: 'depot',
  position: 41,
  depotTimer: 0,
}];
