enum Resource {
  Brick,
  Lumber,
  Wool,
  Grain,
  Ore,
  Dust,
  Water,

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

interface Harbor {
  trading: Resource;
  ratio: number;
}

interface Hex {
  label: Resource;
  edges: Edges;
  vertices: Vertices;
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
  constructions: Constructions;
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
