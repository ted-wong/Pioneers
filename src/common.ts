enum Resource {
  Brick,
  Lumber,
  Wool,
  Grain,
  Ore,
  Dust,

  SIZE
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

  SIZE
}

type Board = Hex[][];
type Players = Player[];
type Resources = number[];
type DevCards = number[];
type Dices = number[];
type Constructions = number[];
type Edges = number[];
type Vertices = number[];

interface Hex {
  label: Resource;
  edges: Edges;
  vertices: Vertices;
  rollNum: number;
  tradingRatio: number;
  hasRobber: boolean;
}

interface Player {
  id: number;
  points: number;
  resources: Resources;
  devCards: DevCards;
  knightsPlayed: number;
  longestRoad: number;
  constructions: Constructions;

  function canAffordConstruction(construct: number): boolean {
    switch (construct) {
      case Constructions.Road:
        if (this.resources[0] >= 1 && this.resources[1] >= 1)
          return true;
        break;
      case Constructions.Settlement:
        if (this.resources[0] >= 1 && this.resources[1] >= 1 && this.resources[2] >= 1 && this.resources[3] >= 1)
          return true;
        break;
      case Constructions.City:
        if (this.resources[3] >= 2 && this.resources[4] >= 3)
          return true;
        break;
      case Constructions.DevelopmentCard:
        if (this.resources[2] >= 1 && this.resources[3] >= 1 && this.resources[4] >= 1)
          return true;
        break;
      default:
        return false;
        break;
    }
    return false;
  }
  
  function hasSuffucientConstructsToBuild(construct: number): boolean {
    switch (construct) {
      case Constructions.Road:
        if (this.constructions[Constructions.Road] < 15)
          return true;
        break;
      case Constructions.Settlement:
        if (this.constructions[Constructions.Settlement] < 5)
          return true;
        break;
      case Constructions.City:
        if (this.constructions[Constructions.City] < 4 && this.constructions[Constructions.Settlement] > 0)
          return true;
        break;
      case Constructions.DevelopmentCard:
        return true;
        break;
      default:
        return false;
        break;
    }
    return false;
  }
  
  function canBuildRoadLegally(board: Board, row: number, col: number, edge: number): boolean {
  
    if (edge < 0 || edge > 5) return false;
    if (row < 0 || row > ROWS || col < 0 || col > COLS) return false;
    
    // edge must be empty - no other roads
    if (board[row][col].edges[edge] >= 0) return false;
    
    let adjHex: number[] = getHexAdjcentToEdge(row, col, edge);
    
    // both hexes cannot be water
    if (board[row][col].label = Resource.Water) {
      if (board[adjHex[0]][adjHex[1]].label = Resource.Water) {
        return false;
      }
    }
    
    // player owns adjacent road in current hex or adjacent road in adjacent hex
    if (board[row][col].edges[((edge+1) % 6 + 6) % 6] = this.id || \
      board[row][col].edges[((edge-1) % 6 + 6) % 6] = this.id || \
      board[adjHex[0]][adjHex[1]].edges[((edge+3+1) % 6 + 6) % 6] = this.id || \
      board[adjHex[0]][adjHex[1]].edges[((edge+3-1) % 6 + 6) % 6] = this.id) {
      
      // check if other player's settlement/city is inbetween existing road and proposed road
      // cannot build through player's settlement/city, even with connecting road
      
      // building CC on same hex
      if (board[row][col].edges[((edge+1) % 6 + 6) % 6] = this.id && \
        ((board[row][col].vertices[edge] == Constructions.Settlement || \
        board[row][col].vertices[edge] == Constructions.City) && \
        board[row][col].vertexOwner[edge] != this.id)) {
        
        return false;
      }
      // building CW on same hex
      if (board[row][col].edges[((edge-1) % 6 + 6) % 6] = this.id && \
        ((board[row][col].vertices[((edge-1) % 6 + 6) % 6] == Constructions.Settlement || \
        board[row][col].vertices[((edge-1) % 6 + 6) % 6] == Constructions.City) && \
        board[row][col].vertexOwner[((edge-1) % 6 + 6) % 6] != this.id)) {
        
        return false;
      }
      // building CC on adj. hex
      if (board[adjHex[0]][adjHex[1]].edges[((edge+3-1) % 6 + 6) % 6] = this.id && \
        ((board[row][col].vertices[edge] == Constructions.Settlement || \
        board[row][col].vertices[edge] == Constructions.City) && \
        board[row][col].vertexOwner[edge] != this.id)) {
        
        return false;
      }
      // building CW on adj. hex
      if (board[adjHex[0]][adjHex[1]].edges[((edge+3+1) % 6 + 6) % 6] = this.id && \
        ((board[row][col].vertices[((edge-1) % 6 + 6) % 6] == Constructions.Settlement || \
        board[row][col].vertices[((edge-1) % 6 + 6) % 6] == Constructions.City) && \
        board[row][col].vertexOwner[((edge-1) % 6 + 6) % 6] != this.id)) {
        
        return false;
      }
      
      return true;
    }
    return false;
  }
  
  function canBuildSettlementLegally(board: Board, row: number, col: number, vertex: number): boolean {
  
    if (edge < 0 || edge > 5) return false;
    if (row < 0 || row > ROWS || col < 0 || col > COLS) return false;
    
    // proposed vertex must be empty - no other settlement/city
    if (board[row][col].vertices[vertex] != -1) return false;
  
    // needs adjacent road to build on
    if (!hasAdjacentRoad(board, row, col, vertex)) return false;
    
    // new settlement has to be 2+ vertices away from another settlement/city
    if (hasNearbyConstruct(board, row, col, vertex)) return false;
    
    return true;
  }
  
  function canUpgradeSettlement(board: Board, row: number, col: number, vertex: number): boolean {
  
    if (edge < 0 || edge > 5) return false;
    if (row < 0 || row > ROWS || col < 0 || col > COLS) return false;
    
    // proposed vertex must be empty - no other settlement/city
    if (board[row][col].vertices[vertex] == Constructions.Settlement && \
      board[row][col].VertexOwner[vertex] == this.id)
      return true;
    return false;
  }
  
  function hasAdjacentRoad(board: Board, row: number, col: number, vertex: number): boolean {
  
    if (board[row][col].edges[vertex] = this.id) return true;
    if (board[row][col].edges[(vertex+1) % 6] = this.id) return true;
    
    let [hex1, hex2] = getHexesAdjacentToVertex(row, col, vertex);
    if (board[hex1[0]][hex1[1]].edges[hex1[3]] == this.id) return true;
    if (board[hex1[0]][hex1[1]].edges[(hex1[3]+1) % 6] == this.id) return true;
    
    if (board[hex2[0]][hex2[1]].edges[hex2[3]] == this.id) return true;
    if (board[hex2[0]][hex2[1]].edges[(hex2[3]+1) % 6] == this.id) return true;
    
    return false;
  }

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
}

interface IState extends StateDelta {
  delta: StateDelta;
}

// *****************
// Helper functions for player interface
// *****************



function hasNearbyConstruct(board: Board, row: number, col: number, vertex: number): boolean {

  if (board[row][col].vertices[vertex] == Construction.Settlement || \
    board[row][col].vertices[vertex] == Construction.City)
    return true;

  if (board[row][col].vertices[(vertex+1) % 6] == Construction.Settlement || \
    board[row][col].vertices[(vertex+1) % 6] == Construction.City || \
    board[row][col].vertices[((vertex-1) % 6 + 6) % 6] == Construction.Settlement || \
    board[row][col].vertices[((vertex-1) % 6 + 6) % 6] == Construction.City)
    return true;
  
  let [hex1, hex2] = getHexesAdjacentToVertex(row, col, vertex);
  
  if (board[hex1[0]][hex1[1]].vertex[(hex1[3]+1) % 6] == Construction.Settlement || \
    board[hex1[0]][hex1[1]].vertex[(hex1[3]+1) % 6] == Construction.City || \
    board[hex1[0]][hex1[1]].vertices[((hex1[3]-1) % 6 + 6) % 6] == Construction.Settlement || \
    board[hex1[0]][hex1[1]].vertices[((hex1[3]-1) % 6 + 6) % 6] == Construction.City)
    return true;
    
  if (board[hex2[0]][hex2[1]].vertex[(hex2[3]+1) % 6] == Construction.Settlement || \
    board[hex2[0]][hex2[1]].vertex[(hex2[3]+1) % 6] == Construction.City || \
    board[hex2[0]][hex2[1]].vertices[((hex2[3]-1) % 6 + 6) % 6] == Construction.Settlement || \
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


