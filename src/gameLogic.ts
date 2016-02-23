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
  INIT_BUILD,
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
  END,
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

module gameLogic {
  export const ROWS = 7;
  export const COLS = 7;
  export const NUM_PLAYERS = 4;

  function shuffleArray<T>(src: T[]): T[] {
    let ret: T[] = angular.copy(src);

    for (let j: number, x: T, i = ret.length; i;
        j = Math.floor(Math.random() * i), x = ret[--i], ret[i] = ret[j], ret[j] = x);

    return ret;
  }

  function isSea(row: number, col: number): boolean {
    if (row === 0 || col === 0 || row === ROWS-1 || col === COLS-1) {
      return true;
    } else if (row === 1 || row === 5) {
      if (col === 1 || col > 4) {
        return true;
      }
    } else if (row === 2 || row === 4) {
      if (col > 4) {
        return true;
      }
    }

    return false;
  }

  function assignRollNum(board: Board): Board {
    let visited: boolean[][] = [];
    for (let i: number = 0; i < ROWS; i++) {
      visited[i] = [];
      for (let j: number = 0; j < COLS; j++) {
        visited[i][j] = i === 0 || j === 0 || i === ROWS-1 || j === COLS-1;
      }
    }

    let dir: number[][] = [
      [1, 0], //down
      [0, 1], //right
      [-1, 0], //up
      [0, -1] //left
    ];
    let r: number = 1;
    let c: number = 1;
    let tokenPtr: number = 0;
    let dirPtr: number = 0;
    while (!visited[r][c]) {
      visited[r][c] = true;
      if (board[r][c].label !== Resource.Water && board[r][c].label !== Resource.Dust) {
        board[r][c].rollNum = tokens[tokenPtr++];
      }

      if (visited[r + dir[dirPtr][0]][c + dir[dirPtr][1]]) {
        dirPtr = (dirPtr + 1) % dir.length;
      }
      r += dir[dirPtr][0];
      c += dir[dirPtr][1];
    }

    return board;
  }

  function assignHarbor(row: number, col: number): Harbor {
    for (let i = 0; i < harborPos.length; i++) {
      if (harborPos[i][0] === row && harborPos[i][1] === col) {
        return harbors[i];
      }
    }

    return null;
  }

  function getInitialBoard(): Board {
    let board: Board = [];

    //Shuffle & terrains
    let newTerrains: Resource[] = shuffleArray(terrains);
    let terrainPtr: number = 0;
    for (let i = 0; i < ROWS; i++) {
      board[i] = [];
      for (let j = 0; j < COLS; j++) {
        let edges: Edges = [-1, -1, -1, -1, -1, -1];
        let vertices: Vertices = [-1, -1, -1, -1, -1, -1];
        let vertexOwner: number[] = [-1, -1, -1, -1, -1, -1];
        let label: Resource = isSea(i, j) ? Resource.Water : newTerrains[terrainPtr++];

        let hex: Hex = {
          label: label,
          edges: edges,
          vertices: vertices,
          vertexOwner: vertexOwner,
          rollNum: -1,
          harbor: assignHarbor(i, j),
          hasRobber: label === Resource.Dust
        };
        board[i][j] = hex;
      }
    }

    return assignRollNum(board);
  }

  function getInitialArray(size: number): number[] {
    let ret: number[] = [];
    for (let i = 0; i < size; i++) {
      ret[i] = 0;
    }

    return ret;
  }

  function getInitialPlayers(): Players {
    let players: Players = [];

    for (let i = 0; i < NUM_PLAYERS; i++) {
      players[i] = {
        id: i,
        points: 0,
        resources: getInitialArray(Resource.SIZE),
        devCards: getInitialArray(DevCard.SIZE),
        knightsPlayed: 0,
        longestRoad: 0,
        construction: getInitialArray(Construction.SIZE)
      };
    }

    return players;
  }

  function getInitialBank(): Bank {
    let bank: Bank = {
      resources: getInitialArray(Resource.SIZE),
      devCards: getInitialArray(DevCard.SIZE)
    };

    //Assign total size of resources/devCards in bank according to rules
    for (let i = 0; i < Resource.SIZE; i++) {
      bank.resources[i] = 19;
    }
    for (let i = 0; i < DevCard.SIZE; i++) {
      switch (i) {
        case DevCard.Knight:
          bank.devCards[i] = 14;
          break;
        case DevCard.Monopoly:
          bank.devCards[i] = 2;
          break;
        case DevCard.RoadBuilding:
          bank.devCards[i] = 2;
          break;
        case DevCard.YearOfPlenty:
          bank.devCards[i] = 2;
          break;
        case DevCard.VictoryPoint:
          bank.devCards[i] = 5;
          break;
        default:
          break;
      }
    }

    return bank;
  }

  function getInitialAwards(): Awards {
    return {
      longestRoad: {
        player: -1,
        length: 4
      },
      largestArmy: {
        player: -1,
        num: 2
      }
    };
  }

  function getInitialRobber(board: Board): Robber {
    let row: number = -1;
    let col: number = -1;

    for (let i = 0; i < ROWS; i++) {
      for (let j = 0; j < COLS; j++) {
        if (board[i][j].hasRobber) {
          row = i;
          col = j;
          break;
        }
      }
    }

    return { row: row, col: col};
  }

  export function getInitialState(): IState {
    let board: Board = getInitialBoard();
    let robber: Robber = getInitialRobber(board);

    return {
      board: board,
      dices: [1, 1],
      players: getInitialPlayers(),
      bank: getInitialBank(),
      awards: getInitialAwards(),
      robber: robber,
      diceRolled: false,
      devCardsPlayed: false,
      delta: null,
      moveType: MoveType.INIT, //TODO: Should be INIT_BUILD
      eventIdx: -1,
      building: null
    };
  }

  /**
   * Validation logics
   */

  /**
   * XXX: MUST have the same ordering as MoveType has
   */
  let validateHandlers: {(p: IState, n: IState, i: number): void}[] = [
    null, //INIT
    null, //INIT_BUILD
    checkRollDice,
    checkBuildRoad,
    checkBuildSettlement,
    checkBuildCity,
    checkBuildDevCards,
    checkPlayDevCard, //KNIGHT
    checkPlayDevCard, //MONOPOLY
    checkPlayDevCard, //YEAR_OF_PLENTY
    null, //TRADE
    checkRobberEvent,
    checkRobberMove,
    null, //ROB_PLAYER
    checkTradeResourceWithBank
  ];

  function checkRollDice(prevState: IState, nextState: IState, idx: number): void {
    if (prevState.diceRolled) {
      throw new Error('Dices already rolled');
    }
  }

  function checkResourcesToBuild(player: Player, consType: Construction, bank: Bank): void {
    if (!canAffordConstruction(player, consType)) {
      throw new Error('Insufficient resources to build ' + consType);
    }
    if (!hasSufficientConstructsToBuild(player, consType, bank)) {
      throw new Error('Has no enough constructions to build ' + consType);
    }
  }

  function checkBuildRoad(prevState: IState, nextState: IState, idx: number): void {
    checkResourcesToBuild(prevState.players[idx], Construction.Road, prevState.bank);
    let building: BuildInstruction = nextState.building;
    let player: Player = nextState.players[idx];

    if (!canBuildRoadLegally(player, prevState.board, building.hexRow, building.hexCol,
        building.vertexOrEdge, building.init)) {
      throw new Error('Cannot build road legally!');
    }
  }

  function checkBuildSettlement(prevState: IState, nextState: IState, idx: number): void {
    checkResourcesToBuild(prevState.players[idx], Construction.Settlement, prevState.bank);
    let building: BuildInstruction = nextState.building;
    let player: Player = nextState.players[idx];

    if (!canBuildSettlementLegally(player, prevState.board, building.hexRow, building.hexCol,
        building.vertexOrEdge, building.init)) {
      throw new Error('Cannot build settlement legally!');
    }
  }

  function checkBuildCity(prevState: IState, nextState: IState, idx: number): void {
    checkResourcesToBuild(prevState.players[idx], Construction.City, prevState.bank);
    let building: BuildInstruction = nextState.building;
    let player: Player = nextState.players[idx];

    if (!canUpgradeSettlement(player, prevState.board, building.hexRow, building.hexCol,
        building.vertexOrEdge)) {
      throw new Error('Cannot build city legally!');
    }
  }

  /**
  * XXX: Assuming UI will disable this feature when bank has no dev cards
  */
  function checkBuildDevCards(prevState: IState, nextState: IState, idx: number): void {
    if (!prevState.diceRolled) {
      throw new Error('Need to roll dices first');
    }

    checkResources(nextState.players[idx].resources);
  }

  function checkPlayDevCard(prevState: IState, nextState: IState, idx: number): void {
    if (prevState.devCardsPlayed) {
      throw new Error('Already played development cards');
    }

    //Check when playing year of plenty
    try {
      checkResources(nextState.bank.resources);
    } catch(e) {
      throw new Error('Bank Error: ' + e.message);
    }
  }


  function checkRobberEvent(prevState: IState, nextState: IState, idx: number): void {
    let prevSum: number = 0;
    let nextSum: number = 0;
    for (let i = 0; i < Resource.SIZE; i++) {
      prevSum += prevState.players[idx].resources[i];
      nextSum += nextState.players[idx].resources[i];
    }

    if (prevSum > 7 && nextSum > prevSum / 2) {
      throw new Error('Need to toss half of resource cards');
    }
  }

  function checkRobberMove(prevState: IState, nextState: IState, idx: number): void {
    if (angular.equals(prevState.robber, nextState.robber)) {
      throw new Error('Need to move robber');
    }
  }

  function checkResources(resources: Resources): void {
    for (let i = 0; i < Resource.SIZE; i++) {
      if (resources[i] < 0) {
        throw new Error('Insufficient resources: ' + Resource[i]);
      }
    }
  }

  function findTradingRatio(board: Board, trading: Resource, idx: number): number {
    for (let i: number = 0; i < ROWS; i++) {
      for (let j: number = 0; j < COLS; j++) {
        if (board[i][j].harbor === null || board[i][j].harbor.trading !== Resource.ANY ||
            board[i][j].harbor.trading !== trading) {
          continue;
        }

        let harbor: Harbor = board[i][j].harbor;
        for (let v: number = 0; v < 6; v++) {
          if (board[i][j].vertexOwner[v] === idx &&
              (harbor.vertices[0] === v || harbor.vertices[1] === v)) {
            return board[i][j].harbor.trading === Resource.ANY ? 3 : 2;
          }
        }
      }
    }

    return 4;
  }

  function checkTradeResourceWithBank(prevState: IState, nextState: IState, idx: number): void {
    if (!prevState.diceRolled) {
      throw new Error('Need to roll dices first');
    }
    let selling = {item: Resource.Dust, num: 0};
    let buying = {item: Resource.Dust, num: 0};

    checkResources(nextState.players[idx].resources);
    for (let i = 0; i < Resource.SIZE; i++) {
      if (nextState.players[idx].resources[i] < prevState.players[idx].resources[i]) {
        if (selling.item !== Resource.Dust) {
          throw new Error('Need to use same resources for trading');
        }
        selling = {
          item: i,
          num: prevState.players[idx].resources[i] - nextState.players[idx].resources[i]
        };
      }
      if (nextState.players[idx].resources[i] > prevState.players[idx].resources[i]) {
        if (buying.item !== Resource.Dust) {
          throw new Error('One resource per trade');
        }
        buying = {
          item: i,
          num: nextState.players[idx].resources[i] - prevState.players[idx].resources[i]
        };
      }
    }
    if (selling.item === buying.item) {
      throw new Error('Cannot trade the same resources');
    }
    if (buying.num * findTradingRatio(nextState.board, buying.item, idx) !== selling.num) {
      throw new Error('Wrong trading ratio');
    }
  }

  export function checkMoveOk(stateTransition: IStateTransition): void {
    let prevState: IState = stateTransition.stateBeforeMove;
    let nextState: IState = stateTransition.move.stateAfterMove;
    let prevIdx: number = nextState.moveType === MoveType.ROBBER_EVENT ?
            prevState.eventIdx : stateTransition.turnIndexBeforeMove;
    //TODO: What are these for, exactly?
    let nextIdx: number = stateTransition.move.turnIndexAfterMove;
    let delta: StateDelta = stateTransition.move.stateAfterMove.delta;

    if (nextState.moveType !== MoveType.INIT && nextState.moveType !== MoveType.WIN) {
      if (nextState.moveType >= MoveType.SIZE || validateHandlers[nextState.moveType] === null) {
        throw new Error('Unknown move!');
      } else {
        validateHandlers[nextState.moveType](prevState, nextState, prevIdx);
      }
    }
  }

  /**
   * create move logics
   */
  let createMoveHandlers: {(m: TurnMove, t: number): IMove}[] = [
    noop, //INIT
    onBuilding, //INIT_BUILD
    onRollDice, //ROLL_DICE
    onBuilding, //BUILD_ROAD
    onBuilding, //BUILD_SETTLEMENT
    onBuilding, //BUILD_CITY
    onBuilding, //BUILD_DEVCARD
    onKnight, //KNIGHT
    onMonopoly, //MONOPOLY
    onYearOfPlenty, //YEAR_OF_PLENTY
    null, //TRADE
    onRobberEvent, //ROBBER_EVENT
    onRobberMove, //ROBBER_MOVE
    onRobPlayer, //ROB_PLAYER
    onTradingWithBank, //TRANSACTION_WITH_BANK
    onEndTurn, //END
    noop, //WIN
  ];

  function countScores(state: IState): number[] {
    let scores: number[] = [];
    for (let i = 0; i < NUM_PLAYERS; i++) {
      scores[i] = 0;
    }

    for (let i = 0; i < NUM_PLAYERS; i++) {
      //Count scores from construction
      let player: Player = state.players[i];
      for (let c = 0; c < Construction.SIZE; c++) {
        switch (c) {
          case Construction.Settlement:
            scores[i] += 1;
            break;
          case Construction.City:
            scores[i] += 2;
            break;
          default:
            //noop
            break;
        }
      }

      //Count scores from victory point cards
      scores[i] += player.devCards[DevCard.VictoryPoint];
    }

    //Add scores if awards assigned
    if (state.awards.longestRoad.player !== -1) {
      scores[state.awards.longestRoad.player] += 2;
    }
    if (state.awards.largestArmy.player !== -1) {
      scores[state.awards.largestArmy.player] += 2;
    }

    return scores;
  }

  function noop(move: TurnMove, turnIdx: number): IMove {
    //TODO
    return null;
  }

  function onRollDice(move: TurnMove, turnIdx: number): IMove {
    //TODO
    return null;
  }

  function onBuilding(move: TurnMove, turnIdx: number): IMove {
    let buildingMove = <BuildMove> move;
    //TODO
    return null;
  }

  function onKnight(move: TurnMove, turnIdx: number): IMove {
    let stateBeforeMove = angular.copy(move.currState);
    stateBeforeMove.delta = null;
    if (stateBeforeMove.devCardsPlayed) {
      throw new Error('Already played development card!');
    }
    if (stateBeforeMove.players[move.playerIdx].devCards[DevCard.Knight] <= 0) {
      throw new Error('Doesn\'t have knight card on hand!');
    }

    let stateAfterMove: IState = angular.copy(stateBeforeMove);
    stateAfterMove.devCardsPlayed = true;
    stateAfterMove.moveType = MoveType.KNIGHT;
    stateAfterMove.eventIdx = -1;
    stateAfterMove.building = null;

    //State transition to knight cards
    stateAfterMove.players[move.playerIdx].knightsPlayed += 1;
    stateAfterMove.players[move.playerIdx].devCards[DevCard.Knight] -= 1;
    if (stateAfterMove.players[move.playerIdx].knightsPlayed > stateBeforeMove.awards.largestArmy.num) {
      stateAfterMove.awards.largestArmy = {
        player: move.playerIdx,
        num: stateAfterMove.players[move.playerIdx].knightsPlayed
      };
    }

    return {
      endMatchScores: countScores(stateAfterMove),
      turnIndexAfterMove: turnIdx,
      stateAfterMove: stateAfterMove
    };
  }

  function onMonopoly(move: TurnMove, turnIdx: number): IMove {
    let monopolyMove = <MonopolyMove> move;
    //TODO
    return null;
  }

  function onYearOfPlenty(move: TurnMove, turnIdx: number): IMove {
    let yearOfPlentyMove = <YearOfPlentyMove> move;
    //TODO
    return null;
  }

  function onRobberEvent(move: TurnMove, turnIdx: number): IMove {
    let robberEventMove = <RobberEventMove> move;
    //TODO
    return null;
  }

  function onRobberMove(move: TurnMove, turnIdx: number): IMove {
    let robberMove = <RobberMoveMove> move;
    //TODO
    return null;
  }

  function onRobPlayer(move: TurnMove, turnIdx: number): IMove {
    let robPlayerMove = <RobPlayerMove> move;
    //TODO
    return null;
  }

  function onTradingWithBank(move: TurnMove, turnIdx: number): IMove {
    let tradeWithBankMove = <TradeWithBankMove> move;
    //TODO
    return null;
  }

  function onEndTurn(move: TurnMove, turnIdx: number): IMove {
    let stateBeforeMove = angular.copy(move.currState);
    stateBeforeMove.delta = null;

    let scores: number[] = countScores(stateBeforeMove);
    let hasWinner: boolean = false;
    for (let i = 0; i < NUM_PLAYERS; i++) {
      if (scores[i] >= 10) {
        hasWinner = true;
        break;
      }
    }

    let stateAfterMove: IState = {
      board: angular.copy(stateBeforeMove.board),
      dices: angular.copy(stateBeforeMove.dices),
      players: angular.copy(stateBeforeMove.players),
      bank: angular.copy(stateBeforeMove.bank),
      robber: angular.copy(stateBeforeMove.robber),
      awards: angular.copy(stateBeforeMove.awards),
      diceRolled: false,
      devCardsPlayed: false,
      moveType: hasWinner ? MoveType.WIN : MoveType.INIT,
      eventIdx: -1,
      building: null,
      delta: stateBeforeMove
    };

    return {
      endMatchScores: scores,
      turnIndexAfterMove: (turnIdx + 1) % NUM_PLAYERS,
      stateAfterMove: stateAfterMove
    };
  }

  export function createMove(turnIndexBeforeMove: number, move: TurnMove): IMove {
    //TODO
    return createMoveHandlers[move.moveType](move, turnIndexBeforeMove);
  }
}
