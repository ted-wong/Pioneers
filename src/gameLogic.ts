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
    let newNumTokens: number[] = angular.copy(tokens);
    let newTerrains: Resource[] = shuffleArray(terrains);
    let tokenPtr: number = 0;
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
          rollNum: isSea(i, j) || label === Resource.Dust ? -1 : newNumTokens[tokenPtr++],
          harbor: assignHarbor(i, j),
          hasRobber: label === Resource.Dust
        };
        board[i][j] = hex;
      }
    }

    return board;
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
        case DevCard.Monopoly:
          bank.devCards[i] = 2;
        case DevCard.RoadBuilding:
          bank.devCards[i] = 2;
        case DevCard.YearOfPlenty:
          bank.devCards[i] = 2;
        case DevCard.VictoryPoint:
          bank.devCards[i] = 5;
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
      moveType: MoveType.INIT,
      eventIdx: -1
    };
  }

  /**
   * Validation logics
   */
  function rollDice(prevState: IState, nextState: IState, idx: number): void {
    if (prevState.diceRolled) {
      throw new Error('Dices already rolled');
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

  /**
   * create move logics
   */
  function createResources(board: Board, players: Players): Players {
    let ret: Players = angular.copy(players);

    return ret;
  }

  function onDicesRolled(prevState: IState, playerIdx: number): IState {
    let dices: number[] = [];
    dices[0] = Math.floor(Math.random() * 6) + 1;
    dices[1] = Math.floor(Math.random() * 6) + 1;
    let rollNum: number = dices[0] + dices[1];
    let ret: IState = angular.copy(prevState);
    ret.dices = dices;

    if (rollNum === 7) {
      //Robber Event
      ret.moveType = MoveType.ROBBER_EVENT;
      ret.eventIdx = playerIdx;
    } else {
      //Create resources
    }

    return ret;
  }

  export function checkMoveOk(stateTransition: IStateTransition): void {

  }
}
