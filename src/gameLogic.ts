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
            scores[i] += 1 * player.construction[Construction.Settlement];
            break;
          case Construction.City:
            scores[i] += 2 * player.construction[Construction.City];
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

  export function onRollDice(move: TurnMove, turnIdx: number): IMove {
    if (move.currState.diceRolled) {
      throw new Error('Dices already rolled!');
    }

    //TODO

    return null;
  }

  export function onInitBuilding(move: TurnMove, turnIdx: number): IMove {
    //TODO
    return null;
  }

  export function onBuilding(move: TurnMove, turnIdx: number): IMove {
    let buildingMove = <BuildMove> move;
    //TODO
    return null;
  }

  export function onKnight(move: TurnMove, turnIdx: number): IMove {
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

  export function onMonopoly(move: TurnMove, turnIdx: number): IMove {
    let monopolyMove = <MonopolyMove> move;
    //TODO
    return null;
  }

  export function onYearOfPlenty(move: TurnMove, turnIdx: number): IMove {
    let yearOfPlentyMove = <YearOfPlentyMove> move;
    //TODO
    return null;
  }

  export function onRobberEvent(move: TurnMove, turnIdx: number): IMove {
    let robberEventMove = <RobberEventMove> move;
    //TODO
    return null;
  }

  export function onRobberMove(move: TurnMove, turnIdx: number): IMove {
    let robberMove = <RobberMoveMove> move;
    //TODO
    return null;
  }

  export function onRobPlayer(move: TurnMove, turnIdx: number): IMove {
    let robPlayerMove = <RobPlayerMove> move;
    //TODO
    return null;
  }

  export function onTradingWithBank(move: TurnMove, turnIdx: number): IMove {
    let tradeWithBankMove = <TradeWithBankMove> move;
    //TODO
    return null;
  }

  export function onEndTurn(move: TurnMove, turnIdx: number): IMove {
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

    let stateAfterMove: IState = angular.copy(stateBeforeMove);
    stateAfterMove.diceRolled = false;
    stateAfterMove.devCardsPlayed = false;
    stateAfterMove.moveType = hasWinner ? MoveType.WIN : MoveType.INIT;
    stateAfterMove.eventIdx = -1;
    stateAfterMove.building = null;
    stateAfterMove.delta = stateBeforeMove;

    return {
      endMatchScores: scores,
      turnIndexAfterMove: (turnIdx + 1) % NUM_PLAYERS,
      stateAfterMove: stateAfterMove
    };
  }
}
