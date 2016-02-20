/*
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
  PROGRESS,
  TRADE,
  ROBBER_EVENT,
  ROBBER_MOVE,
  ROB_PLAYER,
  TRANSACTION_WITH_BANK,
  WIN,

  //TODO: Might need to add move types for builds during initialization

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

function numberResourceCards(player: Player): number {
  var total: number = 0;
  for (var i=0; i < Resource.SIZE; i++) {
    total += player.resources[i];
  }
  return total;
}

function stealFromPlayer(playerStealing: Player, playerStolen: Player): void {

  // no cards to steal
  if (numberResourceCards(playerStolen) == 0) return;

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
      break;
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
      break;
  }
  return false;
}

function canBuildRoadLegally(player: Player, board: Board, row: number, col: number, edge: number, initial: boolean): boolean {

  if (edge < 0 || edge > 5) return false;
  if (row < 0 || row > gameLogic.ROWS || col < 0 || col > gameLogic.COLS) return false;

  // edge must be empty - no other roads
  if (board[row][col].edges[edge] >= 0) return false;

  let adjHex: number[] = getHexAdjcentToEdge(row, col, edge);

  // both hexes cannot be water
  if (board[row][col].label == Resource.Water && board[adjHex[0]][adjHex[1]].label == Resource.Water) {
    return false;
  }

  // player owns adjacent road in current hex or adjacent road in adjacent hex
  if (board[row][col].edges[((edge+1) % 6 + 6) % 6] == player.id ||
    board[row][col].edges[((edge-1) % 6 + 6) % 6] == player.id ||
    board[adjHex[0]][adjHex[1]].edges[((edge+3+1) % 6 + 6) % 6] == player.id ||
    board[adjHex[0]][adjHex[1]].edges[((edge+3-1) % 6 + 6) % 6] == player.id) {

    // check if other player's settlement/city is inbetween existing road and proposed road
    // cannot build through player's settlement/city, even with connecting road

    // building CC on same hex
    if (board[row][col].edges[((edge+1) % 6 + 6) % 6] == player.id &&
      ((board[row][col].vertices[edge] == Construction.Settlement ||
      board[row][col].vertices[edge] == Construction.City) &&
      board[row][col].vertexOwner[edge] != player.id)) {

      return false;
    }
    // building CW on same hex
    if (board[row][col].edges[((edge-1) % 6 + 6) % 6] == player.id &&
      ((board[row][col].vertices[((edge-1) % 6 + 6) % 6] == Construction.Settlement ||
      board[row][col].vertices[((edge-1) % 6 + 6) % 6] == Construction.City) &&
      board[row][col].vertexOwner[((edge-1) % 6 + 6) % 6] != player.id)) {

      return false;
    }
    // building CC on adj. hex
    if (board[adjHex[0]][adjHex[1]].edges[((edge+3-1) % 6 + 6) % 6] == player.id &&
      ((board[row][col].vertices[edge] == Construction.Settlement ||
      board[row][col].vertices[edge] == Construction.City) &&
      board[row][col].vertexOwner[edge] != player.id)) {

      return false;
    }
    // building CW on adj. hex
    if (board[adjHex[0]][adjHex[1]].edges[((edge+3+1) % 6 + 6) % 6] == player.id &&
      ((board[row][col].vertices[((edge-1) % 6 + 6) % 6] == Construction.Settlement ||
      board[row][col].vertices[((edge-1) % 6 + 6) % 6] == Construction.City) &&
      board[row][col].vertexOwner[((edge-1) % 6 + 6) % 6] != player.id)) {

      return false;
    }

    return true;
  }

  // can build road off own existing settlement (for initial roads)
  if (initial) {
      if ((board[row][col].vertices[edge] == Construction.Settlement && board[row][col].vertexOwner[edge] == player.id) ||
          (board[row][col].vertices[(edge+1) % 6] == Construction.Settlement && board[row][col].vertexOwner[(edge+1) % 6] == player.id))
          return true;
  }
  return false;
}

function canBuildSettlementLegally(player: Player, board: Board, row: number, col: number, vertex: number, initial: boolean): boolean {

  if (vertex < 0 || vertex > 5) return false;
  if (row < 0 || row > gameLogic.ROWS || col < 0 || col > gameLogic.COLS) return false;

  // proposed vertex must be empty - no other settlement/city
  if (board[row][col].vertices[vertex] != -1) return false;

  // one of the 3 hexes must be land
  // TODO: is Water sufficient with "ANY" being allowed?
  let [hex1, hex2] = getHexesAdjacentToVertex(row, col, vertex);
  if (board[row][col].label == Resource.Water &&
    board[hex1[0]][hex1[1]].label == Resource.Water &&
    board[hex2[0]][hex2[1]].label == Resource.Water) {
    return false;
  }

  // needs adjacent road to build on if not initial settlements
  if (!initial && !hasAdjacentRoad(player, board, row, col, vertex)) return false;

  // new settlement has to be 2+ vertices away from another settlement/city
  if (hasNearbyConstruct(board, row, col, vertex)) return false;

  return true;
}

function canUpgradeSettlement(player: Player, board: Board, row: number, col: number, vertex: number): boolean {

  if (vertex < 0 || vertex > 5) return false;
  if (row < 0 || row > gameLogic.ROWS || col < 0 || col > gameLogic.COLS) return false;

  // proposed vertex must be empty - no other settlement/city
  if (board[row][col].vertices[vertex] == Construction.Settlement &&
    board[row][col].vertexOwner[vertex] == player.id)
    return true;
  return false;
}

// *****************
// Helper functions for player-based functions
// *****************

function hasAdjacentRoad(player: Player, board: Board, row: number, col: number, vertex: number): boolean {

  if (board[row][col].edges[vertex] = player.id) return true;
  if (board[row][col].edges[(vertex+1) % 6] = player.id) return true;

  let [hex1, hex2] = getHexesAdjacentToVertex(row, col, vertex);
  if (board[hex1[0]][hex1[1]].edges[hex1[3]] == player.id) return true;
  if (board[hex1[0]][hex1[1]].edges[(hex1[3]+1) % 6] == player.id) return true;

  if (board[hex2[0]][hex2[1]].edges[hex2[3]] == player.id) return true;
  if (board[hex2[0]][hex2[1]].edges[(hex2[3]+1) % 6] == player.id) return true;

  return false;
}

function hasNearbyConstruct(board: Board, row: number, col: number, vertex: number): boolean {

  if (board[row][col].vertices[vertex] == Construction.Settlement ||
    board[row][col].vertices[vertex] == Construction.City)
    return true;

  if (board[row][col].vertices[(vertex+1) % 6] == Construction.Settlement ||
    board[row][col].vertices[(vertex+1) % 6] == Construction.City ||
    board[row][col].vertices[((vertex-1) % 6 + 6) % 6] == Construction.Settlement ||
    board[row][col].vertices[((vertex-1) % 6 + 6) % 6] == Construction.City)
    return true;
  
  let [hex1, hex2] = getHexesAdjacentToVertex(row, col, vertex);
  
  if (board[hex1[0]][hex1[1]].vertices[(hex1[3]+1) % 6] == Construction.Settlement ||
    board[hex1[0]][hex1[1]].vertices[(hex1[3]+1) % 6] == Construction.City ||
    board[hex1[0]][hex1[1]].vertices[((hex1[3]-1) % 6 + 6) % 6] == Construction.Settlement ||
    board[hex1[0]][hex1[1]].vertices[((hex1[3]-1) % 6 + 6) % 6] == Construction.City)
    return true;
    
  if (board[hex2[0]][hex2[1]].vertices[(hex2[3]+1) % 6] == Construction.Settlement ||
    board[hex2[0]][hex2[1]].vertices[(hex2[3]+1) % 6] == Construction.City ||
    board[hex2[0]][hex2[1]].vertices[((hex2[3]-1) % 6 + 6) % 6] == Construction.Settlement ||
    board[hex2[0]][hex2[1]].vertices[((hex2[3]-1) % 6 + 6) % 6] == Construction.City)
    return true;
    
  return false;
}


// return [row, col] pair that shares edge with original edge
function getHexAdjcentToEdge(row: number, col: number, edge: number): number[] {

  // TODO: add check for new row/col out of bounds

  if (edge == 0)
    return [row, col+1];

  if (edge == 1 && row%2 == 0)
    return [row-1, col+1];
  if (edge == 1 && row%2 == 1)
    return [row-1, col];

  if (edge == 2 && row%2 == 0)
    return [row-1, col];
  if (edge == 2 && row%2 == 1)
    return [row-1, col-1];

  if (edge == 3)
    return [row, col-1];

  if (edge == 4 && row%2 == 0)
    return [row+1, col];
  if (edge == 4 && row%2 == 1)
    return [row+1, col-1];

  if (edge == 5 && row%2 == 0)
    return [row+1, col+1];
  if (edge == 5 && row%2 == 1)
    return [row+1, col];

  // default - shouldn't happen though
  return [-1, -1];
}

// will return 2 hexes in [row, col, vertex] that share the original vertex
function getHexesAdjacentToVertex(row: number, col: number, vertex: number): number[][] {

  // TODO: add check for new row/col hexes out of bounds

  if (vertex == 0 && row%2 == 0)
    return [[row, col+1, 2], [row-1, col+1, 4]];
  if (vertex == 0 && row%2 == 1)
    return [[row, col+1, 2], [row-1, col, 4]];

  if (vertex == 1 && row%2 == 0)
    return [[row-1, col, 5], [row-1, col+1, 3]];
  if (vertex == 1 && row%2 == 1)
    return [[row-1, col-1, 5], [row-1, col, 3]];
    
  if (vertex == 2 && row%2 == 0)
    return [[row, col-1, 0], [row-1, col, 4]];
  if (vertex == 2 && row%2 == 1)
    return [[row, col-1, 0], [row-1, col-1, 4]];

  if (vertex == 3 && row%2 == 0)
    return [[row, col-1, 5], [row+1, col, 1]];
  if (vertex == 3 && row%2 == 1)
    return [[row, col-1, 5], [row+1, col-1, 1]];

  if (vertex == 4 && row%2 == 0)
    return [[row+1, col, 0], [row+1, col+1, 2]];
  if (vertex == 4 && row%2 == 1)
    return [[row+1, col-1, 0], [row+1, col, 2]];

  if (vertex == 5 && row%2 == 0)
    return [[row+1, col+1, 1], [row, col+1, 3]];
  if (vertex == 5 && row%2 == 1)
    return [[row+1, col, 1], [row, col+1, 3]];

  // default - shouldn't happen though
  return [[-1, -1, -1], [-1, -1, -1]];
}
*/
/**
 * Constants definitions
 */
/*
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
*/
/**
 * Constants for harbors
 */
/*
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

*/
//# sourceMappingURL=common.js.map