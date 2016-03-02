enum Resource {
  Brick,
  Lumber,
  Wool,
  Grain,
  Ore,

  SIZE,
  Dust,
  Water,
  ANY //Used for harbor 3:1
}

enum DevCard {
  Knight,
  Monopoly,
  RoadBuilding,
  YearOfPlenty,
  VictoryPoint,

  SIZE
}

enum Construction {
  Road,
  Settlement,
  City,
  DevCard,

  SIZE
}

enum MoveType {
  INIT,
  ROLL_DICE,
  BUILD_ROAD,
  BUILD_SETTLEMENT,
  BUILD_CITY,
  BUILD_DEVCARD,
  KNIGHT,
  MONOPOLY,
  YEAR_OF_PLENTY,
  TRADE,
  ROBBER_EVENT,
  ROBBER_MOVE,
  ROB_PLAYER,
  TRANSACTION_WITH_BANK,
  WIN,

  SIZE
}

type Board = Hex[][];
type Players = Player[];
type Resources = number[];
type DevCards = number[];
type Dices = number[];
type Edges = number[];
type Vertices = number[];

interface Harbor {
  trading: Resource;
  vertices: number[];
}

interface Hex {
  label: Resource;
  edges: Edges;
  vertices: Vertices;
  vertexOwner: number[];
  rollNum: number;
  harbor: Harbor;
  hasRobber: boolean;
}

interface Player {
  id: number;
  points: number;
  resources: Resources;
  devCards: DevCards;
  knightsPlayed: number;
  longestRoad: number;
  construction: Construction[];
}
  
interface Bank {
  resources: Resources;
  devCards: DevCards;
}

interface Robber {
  row: number;
  col: number;
}

interface Awards {
  longestRoad: {
    player: number,
    length: number
  },
  largestArmy: {
    player: number,
    num: number
  }
}

interface BuildInstruction {
  consType: Construction;
  hexRow: number;
  hexCol: number;
  vertexOrEdge: number;
  init: boolean;
}

interface StateDelta {
  board: Board;
  dices: Dices;
  players: Players;
  bank: Bank;
  robber: Robber;
  awards: Awards;
  diceRolled: boolean;
  devCardsPlayed: boolean;
  moveType: MoveType;
  eventIdx: number;
  building: BuildInstruction;
}

interface IState extends StateDelta {
  delta: StateDelta;
}

/**
 * Base class for turn instruction, in order to createMove
 */
interface TurnMove {
  moveType: MoveType;
  playerIdx: number;
  currState: IState;
}

interface BuildMove extends TurnMove {
  consType: Construction;
  hexRow: number;
  hexCol: number;
  vertexOrEdge: number;
}

interface MonopolyMove extends TurnMove {
  target: Resource;
}

interface YearOfPlentyMove extends TurnMove {
  target1: Resource;
  target2: Resource;
}

interface RobberEventMove extends TurnMove {
  tossed: Resources;
}

interface RobberMoveMove extends TurnMove {
  row: number;
  col: number;
}

interface RobPlayerMove extends TurnMove {
  stealingIdx: number;
  stolenIndx: number;
}

interface TradeWithBankMove extends TurnMove {
  sellingItem: Resource;
  sellingNum: number;
  buyingItem: Resource;
  buyingNum: number;
}

function numberResourceCards(player: Player): number {
  var total: number = 0;
  for (var i=0; i < Resource.SIZE; i++) {
    total += player.resources[i];
  }
  return total;
}

function stealFromPlayer(playerStealing: Player, playerStolen: Player): void {

  // no cards to steal
  if (numberResourceCards(playerStolen) === 0) return;

  // pick random card from other player's hand - from 1 to number of cards
  var cardIndex = Math.floor(Math.random() * numberResourceCards(playerStolen)) + 1;

  // take from other player, add to stealer
  var currentNumber: number = 0;
  for (var i = 0; i < Resource.SIZE; i++) {
    currentNumber = playerStolen.resources[i];
    if (cardIndex <= currentNumber) {
      playerStolen.resources[i]--;
      playerStealing.resources[i]++;
      return;
    }
    cardIndex -= currentNumber;
  }
}

function canAffordConstruction(player: Player, construct: Construction): boolean {
  switch (construct) {
    case Construction.Road:
      if (player.resources[Resource.Brick] >= 1 && player.resources[Resource.Lumber] >= 1)
        return true;
      break;
    case Construction.Settlement:
      if (player.resources[Resource.Brick] >= 1 && player.resources[Resource.Lumber] >= 1 && 
        player.resources[Resource.Wool] >= 1 && player.resources[Resource.Grain] >= 1)
        return true;
      break;
    case Construction.City:
      if (player.resources[Resource.Grain] >= 2 && player.resources[Resource.Ore] >= 3)
        return true;
      break;
    case Construction.DevCard:
      if (player.resources[Resource.Wool] >= 1 && player.resources[Resource.Grain] >= 1 && player.resources[Resource.Ore] >= 1)
        return true;
      break;
    default:
      return false;
  }
  return false;
}

function hasSufficientConstructsToBuild(player: Player, construct: Construction, bank: Bank): boolean {
  switch (construct) {
    case Construction.Road:
      if (player.construction[Construction.Road] < 15)
        return true;
      break;
    case Construction.Settlement:
      if (player.construction[Construction.Settlement] < 5)
        return true;
      break;
    case Construction.City:
      if (player.construction[Construction.City] < 4 && player.construction[Construction.Settlement] > 0)
        return true;
      break;
    case Construction.DevCard:
      for (let i = 0; i < bank.devCards.length; i++) {
        if (bank.devCards[i] > 0) {
          return true;
        }
      }
      break;
    default:
      return false;
  }
  return false;
}

function canBuildRoadLegally(player: Player, board: Board, row: number, col: number, edge: number, initial: boolean): boolean {

  if (edge < 0 || edge > 5) return false;
  if (row < 0 || row > gameLogic.ROWS || col < 0 || col > gameLogic.COLS) return false;

  // edge must be empty - no other roads
  if (board[row][col].edges[edge] !== -1) return false;

  let adjHex: number[] = getHexAdjcentToEdge(row, col, edge);
  if (adjHex.length === 0)
    return false;

  // both hexes cannot be water
  if (board[row][col].label === Resource.Water && board[adjHex[0]][adjHex[1]].label === Resource.Water) {
    return false;
  }

  // player owns adjacent road in current hex or adjacent road in adjacent hex
  if (board[row][col].edges[((edge+1) % 6 + 6) % 6] === player.id ||
    board[row][col].edges[((edge-1) % 6 + 6) % 6] === player.id || 
    board[adjHex[0]][adjHex[1]].edges[((edge+3+1) % 6 + 6) % 6] === player.id ||
    board[adjHex[0]][adjHex[1]].edges[((edge+3-1) % 6 + 6) % 6] === player.id) {

    // check if other player's settlement/city is inbetween existing road and proposed road
    // cannot build through player's settlement/city, even with connecting road

    // building CC on same hex
    if (board[row][col].edges[((edge+1) % 6 + 6) % 6] === player.id &&
      ((board[row][col].vertices[edge] === Construction.Settlement ||
      board[row][col].vertices[edge] === Construction.City) && 
      board[row][col].vertexOwner[edge] !== player.id)) {

      return false;
    }
    // building CW on same hex
    if (board[row][col].edges[((edge-1) % 6 + 6) % 6] === player.id && 
      ((board[row][col].vertices[((edge-1) % 6 + 6) % 6] === Construction.Settlement || 
      board[row][col].vertices[((edge-1) % 6 + 6) % 6] === Construction.City) && 
      board[row][col].vertexOwner[((edge-1) % 6 + 6) % 6] !== player.id)) {

      return false;
    }
    // building CC on adj. hex
    if (board[adjHex[0]][adjHex[1]].edges[((edge+3-1) % 6 + 6) % 6] === player.id && 
      ((board[row][col].vertices[edge] === Construction.Settlement || 
      board[row][col].vertices[edge] === Construction.City) && 
      board[row][col].vertexOwner[edge] !== player.id)) {

      return false;
    }
    // building CW on adj. hex
    if (board[adjHex[0]][adjHex[1]].edges[((edge+3+1) % 6 + 6) % 6] === player.id && 
      ((board[row][col].vertices[((edge-1) % 6 + 6) % 6] === Construction.Settlement || 
      board[row][col].vertices[((edge-1) % 6 + 6) % 6] === Construction.City) && 
      board[row][col].vertexOwner[((edge-1) % 6 + 6) % 6] !== player.id)) {

      return false;
    }

    return true;
  }

  if ((board[row][col].vertices[edge] === Construction.Settlement && board[row][col].vertexOwner[edge] === player.id) || 
    (board[row][col].vertices[(edge+1) % 6] === Construction.Settlement && board[row][col].vertexOwner[(edge+1) % 6] === player.id) ||
    (board[row][col].vertices[edge] === Construction.City && board[row][col].vertexOwner[edge] === player.id) || 
    (board[row][col].vertices[(edge+1) % 6] === Construction.City && board[row][col].vertexOwner[(edge+1) % 6] === player.id))
    return true;

  return false;
}

function canBuildSettlementLegally(player: Player, board: Board, row: number, col: number, vertex: number, initial: boolean): boolean {

  if (vertex < 0 || vertex > 5) return false;
  if (row < 0 || row >= gameLogic.ROWS || col < 0 || col >= gameLogic.COLS) return false;

  // proposed vertex must be empty - no other settlement/city
  if (board[row][col].vertices[vertex] !== -1) return false;

  // TODO: is Water sufficient with "ANY" being allowed?
  var has_land: boolean = false;
  let hexes = getHexesAdjacentToVertex(row, col, vertex);
  for (var i = 0; i < hexes.length; i++) {
    if (board[hexes[i][0]][hexes[i][1]].label != Resource.Water)
      has_land = true;
  }
  if (has_land === false)
    return false;

  // needs adjacent road to build on if not initial settlements
  if (!initial && !hasAdjacentRoad(player, board, row, col, vertex)) return false;

  // new settlement has to be 2+ vertices away from another settlement/city
  if (hasNearbyConstruct(board, row, col, vertex)) return false;

  return true;
}

function canUpgradeSettlement(player: Player, board: Board, row: number, col: number, vertex: number): boolean {

  if (vertex < 0 || vertex > 5) return false;
  if (row < 0 || row >= gameLogic.ROWS || col < 0 || col >= gameLogic.COLS) return false;

  // proposed vertex must be empty - no other settlement/city
  if (board[row][col].vertices[vertex] === Construction.Settlement && 
    board[row][col].vertexOwner[vertex] === player.id)
    return true;
  return false;
}

// *****************
// Helper functions for player-based functions
// *****************

function hasAdjacentRoad(player: Player, board: Board, row: number, col: number, vertex: number): boolean {

  if (board[row][col].edges[vertex] === player.id) return true;
  if (board[row][col].edges[(vertex+1) % 6] === player.id) return true;

  let hexes = getHexesAdjacentToVertex(row, col, vertex);
//  console.log(hexes);
  for (var i=0; i < hexes.length; i++) {
    if (hexes[i].length === 0) continue;
    if (board[hexes[i][0]][hexes[i][1]].edges[hexes[i][3]] === player.id) return true;
    if (board[hexes[i][0]][hexes[i][1]].edges[(hexes[i][3]+1) % 6] === player.id) return true;
  }
  return false;
}

function hasNearbyConstruct(board: Board, row: number, col: number, vertex: number): boolean {

  if (board[row][col].vertices[vertex] === Construction.Settlement ||
    board[row][col].vertices[vertex] === Construction.City)
    return true;

  if (board[row][col].vertices[(vertex+1) % 6] === Construction.Settlement || 
    board[row][col].vertices[(vertex+1) % 6] === Construction.City || 
    board[row][col].vertices[((vertex-1) % 6 + 6) % 6] === Construction.Settlement || 
    board[row][col].vertices[((vertex-1) % 6 + 6) % 6] === Construction.City)
    return true;
  
  let hexes = getHexesAdjacentToVertex(row, col, vertex);
  
  for (var i = 0; i < hexes.length; i++) {
    if (hexes[i] === null) continue;
    if (board[hexes[i][0]][hexes[i][1]].vertices[(hexes[i][3]+1) % 6] === Construction.Settlement || 
      board[hexes[i][0]][hexes[i][1]].vertices[(hexes[i][3]+1) % 6] === Construction.City || 
      board[hexes[i][0]][hexes[i][1]].vertices[((hexes[i][3]-1) % 6 + 6) % 6] === Construction.Settlement || 
      board[hexes[i][0]][hexes[i][1]].vertices[((hexes[i][3]-1) % 6 + 6) % 6] === Construction.City)
      return true;
  }
  
  return false;
}


// return [row, col] pair that shares edge with original edge
function getHexAdjcentToEdgeUnfiltered(row: number, col: number, edge: number): number[] {

  // TODO: add check for new row/col out of bounds

  if (edge === 0)
    return [row, col+1];

  if (edge === 1 && row%2 === 0)
    return [row-1, col+1];
  if (edge === 1 && row%2 === 1)
    return [row-1, col];

  if (edge === 2 && row%2 === 0)
    return [row-1, col];
  if (edge === 2 && row%2 === 1)
    return [row-1, col-1];

  if (edge === 3)
    return [row, col-1];

  if (edge === 4 && row%2 === 0)
    return [row+1, col];
  if (edge === 4 && row%2 === 1)
    return [row+1, col-1];

  if (edge === 5 && row%2 === 0)
    return [row+1, col+1];
  if (edge === 5 && row%2 === 1)
    return [row+1, col];

  // default - shouldn't happen though
  return [];
}

function getHexAdjcentToEdge(row: number, col: number, edge: number): number[] {
  let hex = getHexAdjcentToEdgeUnfiltered(row, col, edge);

  if (hex[0] < 0 || hex[1] < 0 || hex[0] >= gameLogic.ROWS || hex[1] >= gameLogic.COLS)
    return [];
    
  return hex;
}


// will return 2 hexes in [row, col, vertex] that share the original vertex
function getHexesAdjacentToVertexUnfiltered(row: number, col: number, vertex: number): number[][] {

  if (vertex === 0 && row%2 === 0)
    return [[row, col+1, 2], [row-1, col+1, 4]];
  if (vertex === 0 && row%2 === 1)
    return [[row, col+1, 2], [row-1, col, 4]];

  if (vertex === 1 && row%2 === 0)
    return [[row-1, col, 5], [row-1, col+1, 3]];
  if (vertex === 1 && row%2 === 1)
    return [[row-1, col-1, 5], [row-1, col, 3]];
    
  if (vertex === 2 && row%2 === 0)
    return [[row, col-1, 0], [row-1, col, 4]];
  if (vertex === 2 && row%2 === 1)
    return [[row, col-1, 0], [row-1, col-1, 4]];

  if (vertex === 3 && row%2 === 0)
    return [[row, col-1, 5], [row+1, col, 1]];
  if (vertex === 3 && row%2 === 1)
    return [[row, col-1, 5], [row+1, col-1, 1]];

  if (vertex === 4 && row%2 === 0)
    return [[row+1, col, 0], [row+1, col+1, 2]];
  if (vertex === 4 && row%2 === 1)
    return [[row+1, col-1, 0], [row+1, col, 2]];

  if (vertex === 5 && row%2 === 0)
    return [[row+1, col+1, 1], [row, col+1, 3]];
  if (vertex === 5 && row%2 === 1)
    return [[row+1, col, 1], [row, col+1, 3]];

  // default - shouldn't happen though
  return [[]];
}

function getHexesAdjacentToVertex(row: number, col: number, vertex: number): number[][] {
  let [hex1, hex2] = getHexesAdjacentToVertexUnfiltered(row, col, vertex);
  
  // hex 1 oob
  if (hex1[0] < 0 || hex1[1] < 0 || hex1[0] >= gameLogic.ROWS || hex1[1] >= gameLogic.COLS) {
  
    // both hexes oob
    if (hex2[0] < 0 || hex2[1] < 0 || hex2[0] >= gameLogic.ROWS || hex2[1] >= gameLogic.COLS) {
      return [[]];
    }
    return [hex2];
  }
  
  // hex2 oob
  if (hex2[0] < 0 || hex2[1] < 0 || hex2[0] >= gameLogic.ROWS || hex2[1] >= gameLogic.COLS) {
    return [hex1];
  }
  return [hex1, hex2];
}

function getLongestRoad(player: Player, board: Board): number {

  var max = 0;

  // loop over all unique vertices
  for (var i=0; i < gameLogic.ROWS; i++) {
    for (var j=0; j < gameLogic.COLS; j++) {
      
      // loop over every other vertex
      // only need to do calculate from every other vertex to reduce computations
      for (var k=0; k < 6; k += 2) {
      
        var roadLength = findRoadSubLength(player, board, i, j, k, []);

        if (roadLength > max)
          max = roadLength;
      }
    }
  }
  return max;
}

// traverse each node (vertex) and recurse if a road exists between a neighboring node
//
// TODO: stop adding to length if other player settlement/city is inbetween roads
//
function findRoadSubLength(player: Player, board: Board, row: number, col: number, vertex: number, traversed: string[]): number {
  if (!hasAdjacentRoad(player, board, row, col, vertex))
    return 0;

  traversed.push("\"" + row + ", " + col + ", " + vertex + "\"");
  let [hex1, hex2] = getHexesAdjacentToVertex(row, col, vertex);
  
  var length1 = 0;
  var length2 = 0;
  var length3 = 0;
  
  // TODO: fix hexes to allow for 0 or 1 hex instead of 2
  
  var [h1, h2] = getHexesAdjacentToVertex(row, col, (vertex+1) % 6);
  if (traversed.indexOf("\"" + row + ", " + col + ", " + ((vertex+1) % 6) + "\"") === -1 && 
    traversed.indexOf("\"" + h1[0] + ", " + h1[1] + ", " + h1[2] + "\"") === -1 &&
    traversed.indexOf("\"" + h2[0] + ", " + h2[1] + ", " + h2[2] + "\"") === -1) {
    if (board[row][col].edges[(vertex+1) % 6] === player.id)
      length1 = 1 + findRoadSubLength(player, board, row, col, (vertex+1) % 6, angular.copy(traversed));
  }
  
  [h1, h2] = getHexesAdjacentToVertex(hex1[0], hex1[1], (hex1[2]+1) % 6);
  if (traversed.indexOf("\"" + hex1[0] + ", " + hex1[1] + ", " + ((hex1[2]+1) % 6) + "\"") === -1 && 
    traversed.indexOf("\"" + h1[0] + ", " + h1[1] + ", " + h1[2] + "\"") === -1 &&
    traversed.indexOf("\"" + h2[0] + ", " + h2[1] + ", " + h2[2] + "\"") === -1) {
    if (board[hex1[0]][hex1[1]].edges[(hex1[2]+1)%6] === player.id)
      length2 = 1 + findRoadSubLength(player, board, hex1[0], hex1[1], (hex1[2]+1) % 6, angular.copy(traversed));
  }
  
  [h1, h2] = getHexesAdjacentToVertex(hex2[0], hex2[1], (hex2[2]+1) % 6);
  if (traversed.indexOf("\"" + hex2[0] + ", " + hex2[1] + ", " + ((hex2[2]+1) % 6) + "\"") === -1 && 
    traversed.indexOf("\"" + h1[0] + ", " + h1[1] + ", " + h1[2] + "\"") === -1 &&
    traversed.indexOf("\"" + h2[0] + ", " + h2[1] + ", " + h2[2] + "\"") === -1) {
    if (board[hex2[0]][hex2[1]].edges[(hex2[2]+1)%6] === player.id)
      length3 = 1 + findRoadSubLength(player, board, hex2[0], hex2[1], (hex2[2]+1) % 6, angular.copy(traversed));
  }
  
  // first call to finding road length
  if (traversed.length === 1) {
  
    if (length1 < length2 && length1 < length3) {
      return length2 +  length3;
    } else if (length2 < length1 && length2 < length3) {
      return length1 + length3;
    } else {
      return length1 + length2;
    }
  } else {
    if (length2 < length3) {
      return length3;
    } else {
      return length2;
    }
  }
}



/**
 * Constants definitions
 */
const tokens: number[] = [5, 2, 6, 3, 8, 10, 9, 12, 11, 4, 8, 10, 9, 4, 5, 6, 3, 11];
const terrains: Resource[] = [
  Resource.Brick,
  Resource.Brick,
  Resource.Brick,
  Resource.Lumber,
  Resource.Lumber,
  Resource.Lumber,
  Resource.Lumber,
  Resource.Wool,
  Resource.Wool,
  Resource.Wool,
  Resource.Wool,
  Resource.Grain,
  Resource.Grain,
  Resource.Grain,
  Resource.Grain,
  Resource.Ore,
  Resource.Ore,
  Resource.Ore,
  Resource.Dust
];

/**
 * Constants for harbors
 */
const harborPos: number[][] = [
  [1, 3],
  [1, 4],
  [2, 1],
  [2, 4],
  [3, 1],
  [4, 1],
  [4, 4],
  [5, 3],
  [5, 4]
];
const harbors: Harbor[] = [
  {
    trading: Resource.ANY,
    vertices: [1, 2]
  },
  {
    trading: Resource.Ore,
    vertices: [0, 1]
  },
  {
    trading: Resource.Lumber,
    vertices: [1, 2]
  },
  {
    trading: Resource.ANY,
    vertices: [0, 5]
  },
  {
    trading: Resource.ANY,
    vertices: [2, 3]
  },
  {
    trading: Resource.Wool,
    vertices: [3, 4]
  },
  {
    trading: Resource.Brick,
    vertices: [0, 5]
  },
  {
    trading: Resource.Grain,
    vertices: [3, 4]
  },
  {
    trading: Resource.ANY,
    vertices: [4, 5]
  }
];
