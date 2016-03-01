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
      devCards: getInitialArray(DevCard.SIZE),
      devCardsOrder: null
    };

    //Assign total size of resources/devCards in bank according to rules
    for (let i = 0; i < Resource.SIZE; i++) {
      bank.resources[i] = 19;
    }
    let devCardsOrder: DevCard[] = [];
    for (let i = 0; i < DevCard.SIZE; i++) {
      switch (i) {
        case DevCard.Knight:
          bank.devCards[i] = 14;
          for (let _ = 0; _ < 14; _++) {
            devCardsOrder.push(DevCard.Knight);
          }
          break;
        case DevCard.Monopoly:
          bank.devCards[i] = 2;
          for (let _ = 0; _ < 2; _++) {
            devCardsOrder.push(DevCard.Monopoly);
          }
          break;
        case DevCard.RoadBuilding:
          bank.devCards[i] = 2;
          for (let _ = 0; _ < 2; _++) {
            devCardsOrder.push(DevCard.RoadBuilding);
          }
          break;
        case DevCard.YearOfPlenty:
          bank.devCards[i] = 2;
          for (let _ = 0; _ < 2; _++) {
            devCardsOrder.push(DevCard.YearOfPlenty);
          }
          break;
        case DevCard.VictoryPoint:
          bank.devCards[i] = 5;
          for (let _ = 0; _ < 5; _++) {
            devCardsOrder.push(DevCard.VictoryPoint);
          }
          break;
        default:
          break;
      }
    }
    bank.devCardsOrder = shuffleArray(devCardsOrder);

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
      moveType: MoveType.INIT_BUILD,
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
    checkInitBuild,
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

  function checkInitBuild(prevState: IState, nextState: IState, idx: number): void {
    switch (nextState.building.consType) {
      case Construction.Road:
        checkBuildRoad(prevState, nextState, idx);
        break;
      case Construction.Settlement:
        checkBuildSettlement(prevState, nextState, idx);
        break;
      default:
        throw new Error('Invalid build during initialization!');
    }
  }

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
    let prevIdx: number = prevState.eventIdx === -1 ? prevState.eventIdx : stateTransition.turnIndexBeforeMove;
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

  function getStateBeforeMove(move: TurnMove): IState {
    let ret: IState = angular.copy(move.currState);
    ret.delta = null;
    return ret;
  }

  function getStateAfterMove(move: TurnMove, stateBeforeMove: IState): IState {
    let ret: IState = angular.copy(move.currState);
    ret.delta = stateBeforeMove;
    return ret;
  }

  export function onGameStart(move: TurnMove, turnIdx: number): IMove {
    //TODO: A simple handler to set moveType to INIT so that game begins
    return null;
  }

  export function onRollDice(move: TurnMove, turnIdx: number): IMove {
    if (move.playerIdx !== turnIdx) {
      throw new Error('Not your turn to play!');
    }
    if (move.currState.diceRolled) {
      throw new Error('Dices already rolled!');
    }

    //TODO

    return null;
  }

  //TODO: Handle eventIdx when everyone finishes
  export function onInitBuilding(move: TurnMove, turnIdx: number): IMove {
    let buildingMove = <BuildMove> move;
    let playerIdx = buildingMove.playerIdx;
    if (playerIdx !== move.currState.eventIdx) {
      throw new Error('It\'s not your turn to build!');
    }

    let stateBeforeMove = getStateBeforeMove(move);
    let stateAfterMove = getStateAfterMove(move, stateBeforeMove);
    stateAfterMove.building = {
      consType: null,
      hexRow: buildingMove.hexRow,
      hexCol: buildingMove.hexCol,
      vertexOrEdge: buildingMove.vertexOrEdge,
      init: true
    };

    switch (buildingMove.consType) {
      case Construction.Road:
        if (move.currState.players[playerIdx].construction[Construction.Road] >= 2) {
          throw new Error('Can only build 2 roads during initialization!');
        }
        if (stateAfterMove.board[buildingMove.hexRow][buildingMove.hexCol].edges[buildingMove.vertexOrEdge] !== -1) {
          throw new Error('Road already built on this place!');
        }
        stateAfterMove.building.consType = Construction.Road;
        stateAfterMove.board[buildingMove.hexRow][buildingMove.hexCol].edges[buildingMove.vertexOrEdge] = playerIdx;
        stateAfterMove.players[playerIdx].construction[Construction.Road]++;
        break;
      case Construction.Settlement:
        if (move.currState.players[playerIdx].construction[Construction.Settlement] >= 1) {
          throw new Error('Can only build 1 settlement during initialization!');
        }
        stateAfterMove.building.consType = Construction.Settlement;
        stateAfterMove.board[buildingMove.hexRow][buildingMove.hexCol].vertices[buildingMove.vertexOrEdge] = Construction.Settlement;
        stateAfterMove.board[buildingMove.hexRow][buildingMove.hexCol].vertexOwner[buildingMove.vertexOrEdge] = playerIdx;
        stateAfterMove.players[playerIdx].construction[Construction.Settlement]++;
        break;
      default:
        throw new Error('Can only build road/settlement during initialization!');
    }

    //Advance eventIdx
    let player = stateAfterMove.players[playerIdx];
    if (player.construction[Construction.Settlement] === 1 && player.construction[Construction.Road] === 2) {
      stateAfterMove.eventIdx++;
    }

    return {
      endMatchScores: countScores(stateAfterMove),
      turnIndexAfterMove: turnIdx,
      stateAfterMove: stateAfterMove
    };
  }

  export function onBuilding(move: TurnMove, turnIdx: number): IMove {
    let buildingMove = <BuildMove> move;
    let playerIdx = buildingMove.playerIdx;
    if (playerIdx !== turnIdx) {
      throw new Error('It\'s not your turn!');
    }
    if (!move.currState.diceRolled) {
      throw new Error('Must roll the dices before construction!');
    }

    let stateBeforeMove = getStateBeforeMove(move);
    let stateAfterMove = getStateAfterMove(move, stateBeforeMove);
    stateAfterMove.players[playerIdx].construction[buildingMove.consType]++;
    stateAfterMove.building = {
      consType: buildingMove.consType,
      hexRow: buildingMove.hexRow,
      hexCol: buildingMove.hexCol,
      vertexOrEdge: buildingMove.vertexOrEdge,
      init: false
    };

    switch (buildingMove.consType) {
      case Construction.Road:
        stateAfterMove.moveType = MoveType.BUILD_ROAD;
        if (move.currState.board[buildingMove.hexRow][buildingMove.hexCol].edges[buildingMove.vertexOrEdge] !== -1) {
          throw new Error('Invalid building instruction!');
        }
        stateAfterMove.board[buildingMove.hexRow][buildingMove.hexCol].edges[buildingMove.vertexOrEdge] = playerIdx;

        stateAfterMove.players[playerIdx].resources[Resource.Brick]--;
        stateAfterMove.players[playerIdx].resources[Resource.Lumber]--;

        stateAfterMove.bank.resources[Resource.Brick]++;
        stateAfterMove.bank.resources[Resource.Lumber]++;
        break;
      case Construction.Settlement:
        stateAfterMove.moveType = MoveType.BUILD_SETTLEMENT;
        if (move.currState.board[buildingMove.hexRow][buildingMove.hexCol].vertexOwner[buildingMove.vertexOrEdge] !== -1) {
          throw new Error('Invalid building instruction!');
        }
        stateAfterMove.board[buildingMove.hexRow][buildingMove.hexCol].vertexOwner[buildingMove.vertexOrEdge] = playerIdx;
        stateAfterMove.board[buildingMove.hexRow][buildingMove.hexCol].vertices[buildingMove.vertexOrEdge] = Construction.Settlement;

        stateAfterMove.players[playerIdx].resources[Resource.Brick]--;
        stateAfterMove.players[playerIdx].resources[Resource.Lumber]--;
        stateAfterMove.players[playerIdx].resources[Resource.Wool]--;
        stateAfterMove.players[playerIdx].resources[Resource.Grain]--;

        stateAfterMove.bank.resources[Resource.Brick]++;
        stateAfterMove.bank.resources[Resource.Lumber]++;
        stateAfterMove.bank.resources[Resource.Wool]++;
        stateAfterMove.bank.resources[Resource.Grain]++;
        break;
      case Construction.City:
        stateAfterMove.moveType = MoveType.BUILD_CITY;
        if (move.currState.board[buildingMove.hexRow][buildingMove.hexCol].vertexOwner[buildingMove.vertexOrEdge] !== playerIdx ||
            move.currState.board[buildingMove.hexRow][buildingMove.hexCol].vertices[buildingMove.vertexOrEdge] !== Construction.Settlement) {
          throw new Error('Invalid building instruction!');
        }
        stateAfterMove.board[buildingMove.hexRow][buildingMove.hexCol].vertices[buildingMove.vertexOrEdge] = Construction.City;

        stateAfterMove.players[playerIdx].resources[Resource.Ore] -= 3;
        stateAfterMove.players[playerIdx].resources[Resource.Grain] -= 2;

        stateAfterMove.players[playerIdx].resources[Resource.Ore] += 3;
        stateAfterMove.players[playerIdx].resources[Resource.Grain] += 2;
        break;
      case Construction.DevCard:
        if (move.currState.bank.devCardsOrder.length <= 0) {
          throw new Error('No development cards in bank right now!');
        }
        stateAfterMove.moveType = MoveType.BUILD_DEVCARD;
        stateAfterMove.players[playerIdx].devCards[move.currState.bank.devCardsOrder[0]]++;
        stateAfterMove.bank.devCards[move.currState.bank.devCardsOrder[0]]--;
        stateAfterMove.bank.devCardsOrder = stateBeforeMove.bank.devCardsOrder.splice(0, 1);
        break;
      default:
        throw new Error('Invalid command!');
    }

    return {
      endMatchScores: countScores(stateAfterMove),
      turnIndexAfterMove: turnIdx,
      stateAfterMove: stateAfterMove
    };
  }

  export function onKnight(move: TurnMove, turnIdx: number): IMove {
    if (move.playerIdx !== turnIdx) {
      throw new Error('Not your turn to play!');
    }
    if (move.currState.devCardsPlayed) {
      throw new Error('Already played development card!');
    }
    if (move.currState.players[move.playerIdx].devCards[DevCard.Knight] <= 0) {
      throw new Error('Doesn\'t have knight card on hand!');
    }

    let stateBeforeMove = getStateBeforeMove(move);
    let stateAfterMove = getStateAfterMove(move, stateBeforeMove);
    stateAfterMove.devCardsPlayed = true;
    stateAfterMove.moveType = MoveType.KNIGHT;
    stateAfterMove.eventIdx = -1;
    stateAfterMove.building = null;

    //State transition to knight cards
    stateAfterMove.players[move.playerIdx].knightsPlayed++;
    stateAfterMove.players[move.playerIdx].devCards[DevCard.Knight]--;
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
    if (move.playerIdx !== turnIdx) {
      throw new Error('Not your turn to play!');
    }
    if (move.currState.devCardsPlayed) {
      throw new Error('Already played development card in this turn!');
    }
    if (move.currState.players[turnIdx].devCards[DevCard.Monopoly] <= 0) {
      throw new Error('No Monopoly card on hand!');
    }

    let monopolyMove = <MonopolyMove> move;
    let stateBeforeMove = getStateBeforeMove(move);
    let stateAfterMove = getStateAfterMove(move, stateBeforeMove);
    stateAfterMove.moveType = MoveType.MONOPOLY;
    stateAfterMove.devCardsPlayed = true;

    //State transition to dev cards
    stateAfterMove.players[turnIdx].devCards[DevCard.Monopoly]--;
    stateAfterMove.bank.devCards[DevCard.Monopoly]++;
    stateAfterMove.bank.devCardsOrder.push(DevCard.Monopoly);

    //State transition to resource cards
    let numCards: number = 0;
    for (let p = 0; p < NUM_PLAYERS; p++) {
      if (p !== turnIdx) {
        let resources = stateAfterMove.players[p].resources[monopolyMove.target];
        numCards += resources > 0 ? resources : 0;
        stateAfterMove.players[p].resources[monopolyMove.target] = 0;
      }
    }
    stateAfterMove.players[turnIdx].resources[monopolyMove.target] += numCards;

    return {
      endMatchScores: countScores(stateAfterMove),
      turnIndexAfterMove: turnIdx,
      stateAfterMove: stateAfterMove
    };
  }

  export function onYearOfPlenty(move: TurnMove, turnIdx: number): IMove {
    if (move.playerIdx !== turnIdx) {
      throw new Error('Not your turn to play!');
    }
    if (move.currState.devCardsPlayed) {
      throw new Error('Already played development card in this turn!');
    }
    if (move.currState.players[turnIdx].devCards[DevCard.YearOfPlenty] <= 0) {
      throw new Error('No Year of Plenty card on hand!');
    }

    let yearOfPlentyMove = <YearOfPlentyMove> move;
    let stateBeforeMove = getStateBeforeMove(move);
    let stateAfterMove = getStateAfterMove(move, stateBeforeMove);
    stateAfterMove.moveType = MoveType.YEAR_OF_PLENTY;

    //State transition to dev cards
    stateAfterMove.players[turnIdx].devCards[DevCard.YearOfPlenty]--;
    stateAfterMove.bank.devCards[DevCard.YearOfPlenty]++;
    stateAfterMove.bank.devCardsOrder.push(DevCard.YearOfPlenty);

    //State transition to resources
    angular.forEach([yearOfPlentyMove.target1, yearOfPlentyMove.target2], function(tar) {
      if (stateAfterMove.bank.resources[tar] > 0) {
        stateAfterMove.players[turnIdx].resources[tar]++;
        stateAfterMove.bank.resources[tar]--;
      } else {
        throw new Error('Insufficient resources in bank: ' + Resource[tar]);
      }
    });

    return {
      endMatchScores: countScores(stateAfterMove),
      turnIndexAfterMove: turnIdx,
      stateAfterMove: stateAfterMove
    };
  }

  export function onRobberEvent(move: TurnMove, turnIdx: number): IMove {
    let robberEventMove = <RobberEventMove> move;
    let stateBeforeMove = getStateBeforeMove(move);
    let stateAfterMove = getStateAfterMove(move, stateBeforeMove);
    stateAfterMove.moveType = MoveType.ROBBER_EVENT;
    let playerIdx = stateBeforeMove.eventIdx;

    let prevSum : number = 0;
    for (let i = 0; i < Resource.SIZE; i++) {
      prevSum += stateBeforeMove.players[playerIdx].resources[i];
    }

    if (prevSum > 7) {
      //State transition to toss resource cards
      for (let i = 0; i < Resource.SIZE; i++) {
        stateAfterMove.players[playerIdx].resources[i] -= robberEventMove.tossed[i];
        if (stateAfterMove.players[playerIdx].resources[i] < 0) {
          throw new Error('Insufficient resource: ' + Resource[i]);
        }
      }
    }

    stateAfterMove.eventIdx++;
    stateAfterMove.eventIdx = stateAfterMove.eventIdx === NUM_PLAYERS ? -1 : stateAfterMove.eventIdx;

    return {
      endMatchScores: countScores(stateAfterMove),
      turnIndexAfterMove: turnIdx,
      stateAfterMove: stateAfterMove
    };
  }

  export function onRobberMove(move: TurnMove, turnIdx: number): IMove {
    if (move.playerIdx !== turnIdx) {
      throw new Error('Not your turn to play!');
    }
    let robberMove = <RobberMoveMove> move;
    if (isSea(robberMove.row, robberMove.col)) {
      throw new Error('Cannot move robber to sea!');
    }

    let stateBeforeMove = getStateBeforeMove(move);
    let stateAfterMove = getStateAfterMove(move, stateBeforeMove);
    stateAfterMove.moveType = MoveType.ROBBER_MOVE;
    let robber = stateBeforeMove.robber;
    if (robber.row === robberMove.row && robber.col === robberMove.col) {
      throw new Error('Cannot move robber to same place!');
    }

    //State transition to robber
    stateAfterMove.board[robber.row][robber.col].hasRobber = false;
    stateAfterMove.board[robberMove.row][robberMove.col].hasRobber = true;
    stateAfterMove.robber.row = robberMove.row;
    stateAfterMove.robber.col = robberMove.col;

    return {
      endMatchScores: countScores(stateAfterMove),
      turnIndexAfterMove: turnIdx,
      stateAfterMove: stateAfterMove
    };
  }

  export function onRobPlayer(move: TurnMove, turnIdx: number): IMove {
    if (move.playerIdx !== turnIdx) {
      throw new Error('Not your turn to play!');
    }
    let robPlayerMove = <RobPlayerMove> move;
    //TODO
    return null;
  }

  export function onTradingWithBank(move: TurnMove, turnIdx: number): IMove {
    if (move.playerIdx !== turnIdx) {
      throw new Error('Not your turn to play!');
    }
    let tradeWithBankMove = <TradeWithBankMove> move;
    //TODO
    return null;
  }

  export function onEndTurn(move: TurnMove, turnIdx: number): IMove {
    if (move.playerIdx !== turnIdx) {
      throw new Error('Not your turn to play!');
    }
    if (!move.currState.diceRolled) {
      throw new Error('Must roll the dices!');
    }
    let stateBeforeMove = getStateBeforeMove(move);

    let scores: number[] = countScores(stateBeforeMove);
    let hasWinner: boolean = false;
    for (let i = 0; i < NUM_PLAYERS; i++) {
      if (scores[i] >= 10) {
        hasWinner = true;
        break;
      }
    }

    let stateAfterMove = getStateAfterMove(move, stateBeforeMove);
    stateAfterMove.diceRolled = false;
    stateAfterMove.devCardsPlayed = false;
    stateAfterMove.moveType = hasWinner ? MoveType.WIN : MoveType.INIT;
    stateAfterMove.eventIdx = -1;
    stateAfterMove.building = null;

    return {
      endMatchScores: scores,
      turnIndexAfterMove: (turnIdx + 1) % NUM_PLAYERS,
      stateAfterMove: stateAfterMove
    };
  }
}
