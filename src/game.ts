interface SupportedLanguages { en: string, iw: string};
interface Translations {
  [index: string]: SupportedLanguages;
}

enum MouseTarget {
  NONE,
  HEX,
  VERTEX,
  EDGE
}

module game {
  // I export all variables to make it easy to debug in the browser by
  // simply typing in the console:
  // game.state
  export let animationEnded = false;
  export let canMakeMove = false;
  export let isComputerTurn = false;
  export let move: IMove = null;
  export let state: IState = null;
  export let isHelpModalShown: boolean = false;
  export let isHexModalShown: boolean = false;
  export let hexRow: number = 3;
  export let hexCol: number = 3;
  export let height: number = 0;
  export let width: number = 0;

  export let coordinates: string[][][] = [];
  export let playerColor = ['red', 'blue', 'brown', 'green'];
  export let myIndex: number = -2;
  export let mockPlayerIdx: number = -2;

  export let alertStyle = 'success';
  export let alertMsg = 'Welcome to Pioneers Game!';

  export let showInfoModal = false;
  export let infoModalHeader = '';
  export let infoModalMsg = '';
  export let onOkClicked : {(): void} = null;
  export let onCloseModal: {(): void} = cleanupInfoModal;
  export let canInfoModalTurnOff = true;

  export let showResourcePicker = false;
  let targetOneResource = -1;

  export let devRoads: BuildMove[] = [];
  export let playingDevRoadBuild = false;

  export let showResourcePickerMultiple = false;
  export let resourcesPicked: number[] = [];

  export let onClickHex : {(row: number, col: number): void} = onMouseOverHex;

  let settlementPadding = [[0, 25], [25, 0], [25, 25], [-25, 25], [-25, 0]];

  let mouseTarget = MouseTarget.NONE;
  let mouseRow = 0;
  let mouseCol = 0;
  let targetNum = 0;

  let buildTarget = 0;
  let buildRow = 0;
  let buildCol = 0;
  let buildNum = 0;

  let makeMove: TurnMove = null;

  let robberMovedRow = -1;
  let robberMovedCol = -1;
  export let showRobberPanel = false;
  let robberVictomIdx = -1;

  export let showTradingPanel = false;
  let tradingResource: Resource = -1;
  export let tradingNum: number = 0;
  let wantedResource: Resource = -1;
  export let wantedNum: number = 0;
  let tradeWithBank: boolean = false;

  export function getPlayerInfo(playerIndex:number): Player {
//    if (state == null)
//      state = gameLogic.getInitialState();
    return state.players[playerIndex];
  }

  // type 0 for resource cards, 1 for dev cards
  export function getPlayerCardCount(playerIndex:number, type:number): number {
//    if (state == null)
//      state = gameLogic.getInitialState();
  
    var total: number = 0;
    if (type === 0) {
      for (var i = 0; i < Resource.SIZE; i++) {
        total += state.players[playerIndex].resources[i];
      }
    } else {
      for (var i = 0; i < DevCard.SIZE; i++) {
        total += state.players[playerIndex].devCards[i];
      }
    }
    return total;
  }

  export function init_callback(gameAreaWidth: number, gameAreaHeight: number): void {
    height = gameAreaHeight;
    width = gameAreaWidth;
  }
  export function init() {
    resizeGameAreaService.setWidthToHeight(1.33333);
    //resizeGameAreaService.setWidthToHeight(1.33333, init_callback);
    
    translate.setTranslations(getTranslations());
    translate.setLanguage('en');
    log.log("Translation of 'RULES_OF_TICTACTOE' is " + translate('RULES_OF_TICTACTOE'));
//    resizeGameAreaService.setWidthToHeight(1);
    resizeGameAreaService.setWidthToHeight(1.33333);
    moveService.setGame({
      minNumberOfPlayers: 4,
      maxNumberOfPlayers: 4,
      checkMoveOk: gameLogic.checkMoveOk,
      updateUI: updateUI
    });

    // See http://www.sitepoint.com/css3-animation-javascript-event-handlers/
    document.addEventListener("animationend", animationEndedCallback, false); // standard
    document.addEventListener("webkitAnimationEnd", animationEndedCallback, false); // WebKit
    document.addEventListener("oanimationend", animationEndedCallback, false); // Opera

    let w: any = window;
    if (w["HTMLInspector"]) {
      setInterval(function () {
        w["HTMLInspector"].inspect({
          excludeRules: ["unused-classes", "script-placement"],
        });
      }, 3000);
    }
   
    for (let row = 0; row < gameLogic.ROWS; row++) {
      coordinates[row] = [];
      for (let col = 0; col < gameLogic.COLS; col++) {
        let coords = getBoardHex(row, col);
        //To conform data model
        coordinates[row][col] = coords.slice(2, 6).concat(coords.slice(0, 2));
      }
    }

    resourcesPicked = getZerosArray(Resource.SIZE);
  }

  function getTranslations(): Translations {
    return {
      RULES_OF_TICTACTOE: {
        en: "Rules of Pioneers",
        iw: "חוקי המשחק",
      },
      RULES_SLIDE1: {
        en: "You and your opponent take turns to mark the grid in an empty spot. The first mark is X, then O, then X, then O, etc.",
        iw: "אתה והיריב מסמנים איקס או עיגול כל תור",
      },
      RULES_SLIDE2: {
        en: "The first to mark a whole row, column or diagonal wins.",
        iw: "הראשון שמסמן שורה, עמודה או אלכסון מנצח",
      },
      CLOSE:  {
        en: "Close",
        iw: "סגור",
      },
    };
  }

  function animationEndedCallback() {
    $rootScope.$apply(function () {
      log.info("Animation ended");
      animationEnded = true;
      sendComputerMove();
    });
  }

  function sendComputerMove() {
    if (!isComputerTurn) {
      return;
    }
    isComputerTurn = false; // to make sure the computer can only move once.
    moveService.makeMove(aiService.findComputerMove(move));
  }

  function checkCanMakeMove(): boolean {
    /*
    if (state.eventIdx === -1) {
      return myIndex === move.turnIndexAfterMove;
    } else {
      return myIndex === state.eventIdx;
    }
    */
    return true;
  }

  function updateAlert() {
    switch (state.moveType) {
      case MoveType.INIT:
        break;
      case MoveType.INIT_BUILD:
        alertStyle = 'success';
        if (state.eventIdx === myIndex) {
          if (state.players[myIndex].construction[Construction.Settlement] === 1 && state.players[myIndex].construction[Construction.Road] === 2) {
            alertMsg = 'Initial buildings done, time to start the game!';
          } else {
            alertMsg = 'Please place your initial buildings...';
          }
        } else {
          alertMsg = 'Player' + (state.eventIdx + 1) + ' placing initial buildings...'
        }
        break;
      case MoveType.ROLL_DICE:
        break;
      case MoveType.BUILD_ROAD:
        break;
      case MoveType.BUILD_SETTLEMENT:
        break;
      case MoveType.BUILD_CITY:
        break;
      case MoveType.BUILD_DEVCARD:
        break;
      case MoveType.KNIGHT:
        break;
      case MoveType.MONOPOLY:
        break;
      case MoveType.YEAR_OF_PLENTY:
        break;
      case MoveType.TRADE:
        break;
      case MoveType.ROBBER_EVENT:
        break;
      case MoveType.ROBBER_MOVE:
        break;
      case MoveType.ROB_PLAYER:
        break;
      case MoveType.TRANSACTION_WITH_BANK:
        break;
      case MoveType.WIN:
        break;
      default:
        alertStyle = 'danger';
        alertMsg = 'Unknown Move!';
    }
  }

  function updateUI(params: IUpdateUI): void {
    log.info("Game got updateUI:", params);
    animationEnded = false;
    move = params.move;
    state = move.stateAfterMove;
    if (!state) {
      state = gameLogic.getInitialState();
    }

    myIndex = params.yourPlayerIndex;
    mockPlayerIdx = state.eventIdx === -1 ? move.turnIndexAfterMove : state.eventIdx;
    canMakeMove = checkCanMakeMove();

    updateAlert();
    cleanupInfoModal();
    switch (state.moveType) {
      case MoveType.INIT_BUILD:
        if (state.eventIdx === gameLogic.NUM_PLAYERS - 1) {
          let allDoneInitBuild = true;
          for (let i = 0; i < gameLogic.NUM_PLAYERS; i++) {
            if (state.players[i].construction.reduce(function(a, b) {return a+b;}) !== 3) {
              allDoneInitBuild = false;
              break;
            }
          }
          if (allDoneInitBuild) {
            showInfoModal = true;
            infoModalHeader = 'Start Game';
            infoModalMsg = "Everyone is ready, it's time to start the game!";
            canInfoModalTurnOff = false;

            let turnMove: TurnMove = {
              moveType: MoveType.INIT,
              playerIdx: myIndex,
              currState: state
            };

            onOkClicked = function() {
              try {
                let nextMove = gameLogic.onGameStart(turnMove, 0);
                moveService.makeMove(nextMove);
                cleanupInfoModal();
              } catch (e) {
                alertStyle = 'danger';
                alertMsg = e.message;
              }
            };
          }
        }
        break;
      case MoveType.ROLL_DICE:
        if (state.dices[0] + state.dices[1] === 7 && move.turnIndexAfterMove === mockPlayerIdx) {
          whenRobberEvent();
        }
        break;
      case MoveType.ROBBER_EVENT:
        if (state.eventIdx === move.turnIndexAfterMove) {
          alertStyle = 'warning';
          alertMsg = 'Moving robber...';
          whenMoveRobberStart();
        } else {
          if (state.eventIdx === mockPlayerIdx) {
            whenRobberEvent();
          }
        }
        break;
      case MoveType.ROBBER_MOVE:
        if (mockPlayerIdx === move.turnIndexAfterMove) {
          whenRobPlayerStart();
        }
        break;
    }

    /*
    // Is it the computer's turn?
    isComputerTurn = canMakeMove &&
        params.playersInfo[params.yourPlayerIndex].playerId === '';
    */
    if (isComputerTurn) {
      // To make sure the player won't click something and send a move instead of the computer sending a move.
      canMakeMove = false;
      // We calculate the AI move only after the animation finishes,
      // because if we call aiService now
      // then the animation will be paused until the javascript finishes.
      if (!state.delta) {
        // This is the first move in the match, so
        // there is not going to be an animation, so
        // call sendComputerMove() now (can happen in ?onlyAIs mode)
        sendComputerMove();
      }
    }
  }

  export function clickedOnHexModal(evt: Event) {
    console.log("test");
    if (evt.target === evt.currentTarget) {
	  console.log("in if");
      evt.preventDefault();
      evt.stopPropagation();
      isHexModalShown = true;
    }
    return true;
  }

  export function clickedOnModal(evt: Event) {
    if (evt.target === evt.currentTarget) {
      evt.preventDefault();
      evt.stopPropagation();
      isHelpModalShown = false;
    }
    return true;
  }

  export function clickedOnInfoModal(evt: Event) {
    if (!canInfoModalTurnOff) {
      return;
    }
    if (evt.target === evt.currentTarget) {
      evt.preventDefault();
      evt.stopPropagation();
      onCloseModal();
    }
  }

  function getOffset(row: number, radius: number): number {
    return (Math.sqrt(3) * radius) / 2;
  }

  function getHexPoints(x: number, y: number, radius: number): string[] {
    let ret: string[] = [];
    for (let theta = 0; theta < Math.PI * 2; theta += Math.PI / 3) {
      let pointX = x + radius * Math.sin(theta);
      let pointY = y + radius * Math.cos(theta);
      ret.push(pointX + ',' + pointY);
    }

    return ret;
  }

  function getBoardHex(row: number, col: number): string[] {
    let offset = getOffset(row, 45);
    let x = 120 + offset * col * 2 - (row % 2 === 1 ? offset : 0);
    let y = 120 + offset * row * Math.sqrt(3);

    return getHexPoints(x, y, 45);
  }

  export function getCenter(row: number, col: number): string[] {
    let offset = getOffset(row, 45);
    let x = 120 + offset * col * 2 - (row % 2 === 1 ? offset : 0);
    let y = 120 + offset * row * Math.sqrt(3);

    return [x.toString(), y.toString()];
  }

  export function showHex(row: number, col: number): boolean {
    if ((row === 0 || row === 6) && (col === 0 || col > 4)) return false;
    if ((row === 1 || row === 5) && (col === 0 || col === 6)) return false;
    if ((row === 2 || row === 4) && col === 6)  return false;

    return true;
  }

  export function onClickedHexModal(evt: Event) {
    if (evt.target === evt.currentTarget) {
      evt.preventDefault();
      evt.stopPropagation();
      this.isHexModalShown = false;
    }
  }

  export function getHexVertices(row: number, col: number): string {
    return coordinates[row][col].join(' ');
  }

  export function getVertexCenter(row: number, col: number, vertex: number): string[] {
    return coordinates[row][col][vertex].split(',');
  }

  export function getEdgeCoordinates(row: number, col: number, edge: number): string[][] {
    let src = edge === 0 ? 5 : edge - 1;
    return [coordinates[row][col][src].split(','), coordinates[row][col][edge].split(',')];
  }

  export function showVertex(row: number, col: number, vertex: number): boolean {
    if (state.board[row][col].vertices[vertex] !== -1 || playingDevRoadBuild) {
      return false;
    }
    if (mouseTarget === MouseTarget.NONE || mouseTarget === MouseTarget.EDGE) {
      return false;
    }

    if (mouseRow !== row || mouseCol !== col) {
      return false;
    }

    if (robberMovedRow !== -1 && robberMovedCol !== -1) {
      return false;
    }

    if (mouseTarget === MouseTarget.VERTEX) {
      return targetNum === vertex;
    } else {
      return true;
    }
  }

  export function getVertexClass(row: number, col: number, vertex: number): string {
    if (mouseTarget === MouseTarget.NONE || mouseTarget === MouseTarget.EDGE) {
      return '';
    }

    if (mouseRow !== row || mouseCol !== col) {
      return '';
    }

    if (mouseTarget === MouseTarget.VERTEX) {
      return targetNum === vertex ? 'emphasize-vertex' : '';
    } else {
      return 'mouse-to-display-vertex';
    }
  }

  export function showEdge(row: number, col: number, edge: number): boolean {
    if (state.board[row][col].edges[edge] !== -1) {
      return false;
    }
    if (mouseTarget === MouseTarget.NONE || mouseTarget === MouseTarget.VERTEX) {
      return false;
    }

    if (mouseRow !== row || mouseCol !== col) {
      return false;
    }

    if (robberMovedRow !== -1 && robberMovedCol !== -1) {
      return false;
    }

    if (mouseTarget === MouseTarget.EDGE) {
      return targetNum === edge;
    } else {
      return true;
    }
  }

  export function getEdgeClass(row: number, col: number, edge: number): string {
    if (mouseTarget === MouseTarget.NONE || mouseTarget === MouseTarget.VERTEX) {
      return '';
    }

    if (mouseRow !== row || mouseCol !== col) {
      return '';
    }

    if (mouseTarget === MouseTarget.EDGE) {
      return targetNum === edge ? 'emphasize-edge' : '';
    } else {
      return 'mouse-to-display-edge';
    }
  }

  export function showRoad(row: number, col: number, edge: number): boolean {
    if (state.board[row][col].edges[edge] >= 0) {
      return true;
    }

    for (let i = 0; i < devRoads.length; i++) {
      if (devRoads[i].hexRow === row && devRoads[i].hexCol === col && devRoads[i].vertexOrEdge === edge) {
        return true;
      }
    }

    return false;
  }

  export function showSettlement(row: number, col: number, vertex: number): boolean {
    return state.board[row][col].vertices[vertex] === Construction.Settlement;
  }

  export function showCity(row: number, col: number, vertex: number): boolean {
    return state.board[row][col].vertices[vertex] === Construction.City;
  }

  export function getColor(idx: number): string {
    return idx >= 0 ? playerColor[idx] : 'black';
  }

  export function getRoadColor(row: number, col: number, edge: number): string {
    if (state.board[row][col].edges[edge] >= 0) {
      return getColor(state.board[row][col].edges[edge]);
    }

    if (devRoads.length > 0 && showRoad(row, col, edge)) {
      return getColor(myIndex);
    }

    return getColor(-1);
  }

  export function getSettlement(row: number, col: number, vertex: number): string {
    let v = coordinates[row][col][vertex].split(',');
    let x = parseFloat(v[0]);
    let y = parseFloat(v[1]);

    let start = 'M' + x + ',' + (y - 10);
    return start + ' l-10,10' + ' v10' + ' h20' + ' v-10' + ' l-12,-12';
  }

  export function getCity(row: number, col: number, vertex: number): string {
    let v = coordinates[row][col][vertex].split(',');
    let x = parseFloat(v[0]);
    let y = parseFloat(v[1]);

    let start = 'M' + x + ',' + (y - 10);
    return start + ' l-10,10' + ' v10' + ' h30' + ' v-10' + ' h-10' + ' l-12,-12';
  }

  export function showRollNum(row: number, col: number): boolean {
    return state.board[row][col].rollNum > 0 || (state.robber.row === row && state.robber.col === col);
  }

  export function getRollColor(row: number, col: number): string {
    return state.board[row][col].hasRobber || (state.board[row][col].rollNum >= 6 && state.board[row][col].rollNum <= 8) ? 'red' : 'black';
  }

  export function getNumSettlementCanBuild(): number {
    return myIndex >= 0 ? 5 - state.players[myIndex].construction[Construction.Settlement] : 0;
  }

  export function getNumCityCanBuild(): number {
    return myIndex >= 0 ? 4 - state.players[myIndex].construction[Construction.City] : 0;
  }

  export function getNumRoadCanBuild(): number {
    return myIndex >= 0 ? 15 - state.players[myIndex].construction[Construction.Road] : 0;
  }

  export function getHexFill(row: number, col: number): string {
    if (row === robberMovedRow && col === robberMovedCol) {
      return getColor(mockPlayerIdx);
    }

    return 'url(#r' + state.board[row][col].label + ')';
  }

  export function onMouseOverHex(row: number, col: number) {
    mouseTarget = MouseTarget.HEX;
    mouseRow = row;
    mouseCol = col;
  }

  export function onMouseOverEdge(row: number, col: number, edgeNum: number) {
    mouseTarget = MouseTarget.EDGE;
    mouseRow = row;
    mouseCol = col;
    targetNum = edgeNum;
  }

  export function onClickEdge(row: number, col: number, edgeNum: number) {
    if (playingDevRoadBuild) {
      let devRoad: BuildMove = {
        moveType: MoveType.BUILD_ROAD,
        playerIdx: mockPlayerIdx,
        currState: state,
        consType: Construction.Road,
        hexRow: row,
        hexCol: col,
        vertexOrEdge: edgeNum
      };
      devRoads.push(devRoad);

      if (devRoads.length === 2) {
        showInfoModal = true;
        infoModalHeader = 'Playing Development Cards';
        infoModalMsg = 'Are you sure to build both roads?';
        onOkClicked = onRoadBuildingDone;
      }

      return;
    }

    buildTarget = Construction.Road;
    buildRow = row;
    buildCol = col;
    buildNum = edgeNum;

    showInfoModal = true;
    onOkClicked = onBuild;
    infoModalHeader = 'Building';
    infoModalMsg = 'Are you sure to build a road?';
  }

  export function onMouseOverVertex(row: number, col: number, vertexNum: number) {
    mouseTarget = MouseTarget.VERTEX;
    mouseRow = row;
    mouseCol = col;
    targetNum = vertexNum;
  }

  export function onClickVertex(row: number, col: number, vertexNum: number) {
    buildTarget = Construction.Settlement;
    buildRow = row;
    buildCol = col;
    buildNum = vertexNum;

    showInfoModal = true;
    onOkClicked = onBuild;
    infoModalHeader = 'Building';
    infoModalMsg = 'Are you sure to build a settlement?';
  }

  export function onBuild() {
    showInfoModal = false;
    onOkClicked = null;
    if (!canMakeMove) {
      return;
    }

    let buildMove: BuildMove = {
      moveType: state.moveType,
      playerIdx: mockPlayerIdx,
      currState: angular.copy(state),
      consType: buildTarget,
      hexRow: buildRow,
      hexCol: buildCol,
      vertexOrEdge: buildNum
    };

    try {
      let nextMove = state.moveType === MoveType.INIT_BUILD ? gameLogic.onInitBuilding(buildMove, move.turnIndexAfterMove) :
          gameLogic.onBuilding(buildMove, move.turnIndexAfterMove);
      moveService.makeMove(nextMove);
    } catch (e) {
      alertStyle = 'danger';
      alertMsg = e.message;
    }
  }

  export function onMouseLeaveBoard() {
    mouseTarget = MouseTarget.NONE;
  }

  export function cleanupInfoModal() {
    showInfoModal = false;
    infoModalHeader = '';
    infoModalMsg = '';
    onOkClicked = null;
    onCloseModal = cleanupInfoModal;
    canInfoModalTurnOff = true;

    makeMove = null;
    showResourcePicker = false;
    targetOneResource = -1;
    resourcesPicked = getZerosArray(Resource.SIZE);
    showResourcePickerMultiple = false;

    onClickHex = onMouseOverHex;
    robberMovedRow = -1;
    robberMovedCol = -1;
    showRobberPanel = false;
    robberVictomIdx = -1;

    showTradingPanel = false;
    tradingResource = -1;
    tradingNum = 0;
    wantedResource = -1;
    wantedNum = 0;
    tradeWithBank = false;
  }

  export function getPlayerPoints(idx: number): number {
    return state.players[idx].points;
  }

  export function getPlayerKnights(idx: number): number {
    return state.players[idx].knightsPlayed;
  }

  export function getNumResources(playerIdx: number, resource: Resource): number {
    if (!state || playerIdx < 0) {
      return 0;
    }
    if (resource === undefined || resource === null) {
      return state.players[playerIdx].resources.reduce(function(a, b) {
        return a + b;
      });
    }

    return state.players[playerIdx].resources[resource];
  }

  export function getNumDevCards(playerIdx: number, dev: DevCard): number {
    if (!state || playerIdx < 0) {
      return 0;
    }
    if (!dev) {
      return state.players[playerIdx].devCards.reduce(function(a, b) {
        return a + b;
      });
    }

    return state.players[playerIdx].devCards[dev];
  }

  export function getBankResources(resource: number): number {
    if (!state || resource < 0) {
      return 0;
    }

    return state.bank.resources[resource];
  }

  export function getBankDevCards(): number {
    return state.bank.devCardsOrder.length;
  }

  export function showDice(): boolean {
    return state.moveType !== MoveType.INIT_BUILD && !state.diceRolled;
  }

  export function showEndTurn(): boolean {
    return state.moveType !== MoveType.INIT_BUILD && state.diceRolled;
  }

  export function getDicesNum(): number {
    return state.dices.reduce(function(a, b) {return a+b;});
  }

  export function onRollDice() {
    let turnMove: TurnMove = {
      playerIdx: mockPlayerIdx,
      moveType: MoveType.ROLL_DICE,
      currState: state
    };

    try {
      let nextMove = gameLogic.onRollDice(turnMove, move.turnIndexAfterMove);
      moveService.makeMove(nextMove);
    } catch (e) {
      alertStyle = 'danger';
      alertMsg = e.message;
    }
  }

  let devCardEventHandlers: {(): void}[] = [
    whenPlayKnight,
    whenPlayMonopoly,
    whenPlayRoadBuilding,
    whenPlayYearOfPlenty
  ];

  export function onDevCardClicked(cardIdx: DevCard) {
    makeMove = {
      moveType: null,
      playerIdx: mockPlayerIdx,
      currState: state
    };
    switch (cardIdx) {
      case DevCard.Knight:
        makeMove.moveType = MoveType.KNIGHT;
        break;
      case DevCard.Monopoly:
        makeMove.moveType = MoveType.MONOPOLY;
        break;
      case DevCard.RoadBuilding:
        makeMove.moveType = MoveType.ROAD_BUILDING;
        break;
      case DevCard.YearOfPlenty:
        makeMove.moveType = MoveType.YEAR_OF_PLENTY;
        break;
      default:
        makeMove = null;
        return;
    }

    showInfoModal = true;
    onOkClicked = devCardEventHandlers[cardIdx];
    infoModalHeader = 'Playing Development Cards';
    infoModalMsg = 'Are you sure to play ' + DevCard[cardIdx];
  }

  /**
   * Playing DevCards handlers
   */
  function whenPlayKnight() {
    try {
      let nextMove = gameLogic.onKnight(makeMove, move.turnIndexAfterMove);
      moveService.makeMove(nextMove);
    } catch (e) {
      alertStyle = 'danger';
      alertMsg = e.message;
    } finally {
      cleanupInfoModal();
    }
  }

  function whenPlayMonopoly() {
    showResourcePicker = true;
    infoModalHeader = 'Please pick a resource';
    infoModalMsg = '';
    onOkClicked = onPlayMonopoly;
  }

  export function onOneTargetResourcePicked(resource: Resource) {
    targetOneResource = resource;
  }

  export function oneTargetResourceClass(resource: Resource): string {
    return 'resource-pic' + (targetOneResource === resource ? ' on-highlighted' : '');
  }

  function onPlayMonopoly() {
    let turnMove: MonopolyMove = {
      moveType: makeMove.moveType,
      playerIdx: makeMove.moveType,
      currState: state,
      target: targetOneResource
    };

    try {
      let nextMove = gameLogic.onMonopoly(turnMove, move.turnIndexAfterMove);
      moveService.makeMove(nextMove);
    } catch (e) {
      alertStyle = 'danger';
      alertMsg = e.message;
    } finally {
      cleanupInfoModal();
    }
  }

  function whenPlayRoadBuilding() {
    alertStyle = 'warning';
    alertMsg = 'Please select two roads';

    cleanupDevRoadBuild();
    playingDevRoadBuild = true;
    cleanupInfoModal();
  }

  export function onRoadBuildingDone() {
    let turnMove: RoadBuildMove = {
      moveType: MoveType.ROAD_BUILDING,
      playerIdx: mockPlayerIdx,
      currState: angular.copy(state),
      road1: devRoads[0],
      road2: devRoads[1]
    };

    try {
      let nextMove = gameLogic.onRoadBuilding(turnMove, move.turnIndexAfterMove);
      moveService.makeMove(nextMove);
    } catch (e) {
      alertStyle = 'danger';
      alertMsg = e.message;
    } finally {
      cleanupDevRoadBuild();
      cleanupInfoModal()
    }
  }

  export function onRoadBuildingCanceled() {
    alertStyle = 'success';
    alertMsg = 'Road Building Canceled';
    cleanupDevRoadBuild();
  }

  function cleanupDevRoadBuild() {
    devRoads = [];
    playingDevRoadBuild = false;
  }

  function whenPlayYearOfPlenty() {
    showResourcePickerMultiple = true;
    infoModalHeader = 'Please pick two resources';
    infoModalMsg = '';
    onOkClicked = onPlayYearOfPlenty;
  }

  export function onMultipleResourcesPicked(resource: Resource, add: boolean) {
    resourcesPicked[resource] += add ? 1 : -1;
  }

  function onPlayYearOfPlenty() {
    let turnMove: YearOfPlentyMove = {
      moveType: makeMove.moveType,
      playerIdx: makeMove.playerIdx,
      currState: state,
      target: resourcesPicked
    };

    try {
      let nextMove = gameLogic.onYearOfPlenty(turnMove, move.turnIndexAfterMove);
      moveService.makeMove(nextMove);
    } catch (e) {
      alertStyle = 'danger';
      alertMsg = e.message;
    } finally {
      cleanupInfoModal();
    }
  }

  function whenRobberEvent() {
    if (state.players[mockPlayerIdx].resources.reduce(function(a, b) {return a+b;}) > 7) {
      showResourcePickerMultiple = true;
      infoModalHeader = 'Please dump half of resources on hand';
      infoModalMsg = '';
    } else {
      infoModalHeader = 'Robber Event!';
      infoModalMsg = 'Luckily you do not have to dump resources!';
    }

    onOkClicked = onRobberEventDone;
    showInfoModal = true;
    canInfoModalTurnOff = false;
  }

  function onRobberEventDone() {
    let turnMove = {
      moveType: MoveType.ROBBER_EVENT,
      playerIdx: mockPlayerIdx,
      currState: angular.copy(state),
      tossed: angular.copy(resourcesPicked)
    };

    try {
      let nextMove = gameLogic.onRobberEvent(turnMove, move.turnIndexAfterMove);
      moveService.makeMove(nextMove);
      cleanupInfoModal(); //Can only turn off info modal after a valid move
    } catch (e) {
      alertStyle = 'danger';
      alertMsg = e.message;
      whenRobberEvent(); //Do it again if it's an invalid move
    }
  }

  function whenMoveRobberStart() {
    if (mockPlayerIdx !== move.turnIndexAfterMove) {
      return;
    }

    onClickHex = whenMoveRobber;
    onOkClicked = onMoveRobberDone;
    onCloseModal = function() {
      showInfoModal = false;
    };

    robberMovedRow = state.robber.row;
    robberMovedCol = state.robber.col;
  }

  function whenMoveRobber(row: number, col: number) {
    robberMovedRow = row;
    robberMovedCol = col;

    showInfoModal = true;
    infoModalHeader = 'Move Robber';
    infoModalMsg = 'Are you sure to move robber to here?';
  }

  function onMoveRobberDone() {
    let turnMove: RobberMoveMove = {
      moveType: MoveType.ROBBER_MOVE,
      playerIdx: mockPlayerIdx,
      currState: state,
      row: robberMovedRow,
      col: robberMovedCol
    };

    try {
      let nextMove = gameLogic.onRobberMove(turnMove, move.turnIndexAfterMove);
      moveService.makeMove(nextMove);
      cleanupInfoModal();
    } catch (e) {
      alertStyle = 'danger';
      alertMsg = e.message;
      onCloseModal();
      whenMoveRobberStart();
    }
  }

  function whenRobPlayerStart() {
    //Check if there has player(s) to rob.  If none, move on
    let noOneCanSteal = true, r = state.robber.row, c = state.robber.col;
    for (let v = 0; v < state.board[r][c].vertexOwner.length; v++) {
      if (state.board[r][c].vertexOwner[v] === -1) {
        continue;
      }
      let p = state.board[r][c].vertexOwner[v];
      if (state.players[p].resources.reduce(function(a, b) {return a+b;}) > 0) {
        noOneCanSteal = false;
        break;
      }
    }
    if (noOneCanSteal) {
      alertStyle = 'warning';
      alertMsg = 'No one can rob...';
      cleanupInfoModal();
      return;
    }

    showInfoModal = true;
    canInfoModalTurnOff = false;
    infoModalHeader = 'Select a player to rob';
    infoModalMsg = '';
    onOkClicked = onRobPlayerDone;

    showRobberPanel = true;
  }

  export function onVictomSelected(idx: number) {
    robberVictomIdx = idx;
  }

  function onRobPlayerDone() {
    let turnMove: RobPlayerMove = {
      moveType: MoveType.ROB_PLAYER,
      playerIdx: mockPlayerIdx,
      currState: angular.copy(state),
      stealingIdx: mockPlayerIdx,
      stolenIdx: robberVictomIdx
    };

    try {
      let nextMove = gameLogic.onRobPlayer(turnMove, move.turnIndexAfterMove);
      moveService.makeMove(nextMove);
      cleanupInfoModal();
    } catch (e) {
      alertStyle = 'danger';
      alertMsg = e.message;
      whenRobPlayerStart();
    }
  }

  export function possibleRobberVictom(idx: number): boolean {
    let r = state.robber.row, c = state.robber.col;

    for (let i = 0; i < state.board[r][c].vertexOwner.length; i++) {
      if (state.board[r][c].vertexOwner[i] === idx) {
        return idx !== mockPlayerIdx && state.players[idx].resources.reduce(function(a, b) {return a+b;}) > 0;
      }
    }

    return false;
  }

  export function onTradeWithBankStart() {
    tradeWithBank = true;
    whenTradingStarted();
  }

  function whenTradingStarted() {
    showInfoModal = true;
    infoModalHeader = 'Trade';
    infoModalMsg = '';
    onOkClicked = tradeWithBank ? onTradingWithBankDone : null; //TODO: Trade with players
    showTradingPanel = true;
  }

  function onTradingWithBankDone() {
    let turnMove: TradeWithBankMove = {
      moveType: MoveType.TRANSACTION_WITH_BANK,
      playerIdx: mockPlayerIdx,
      currState: angular.copy(state),
      sellingItem: tradingResource,
      sellingNum: tradingNum,
      buyingItem: wantedResource,
      buyingNum: wantedNum
    };

    try {
      let nextMove = gameLogic.onTradingWithBank(turnMove, move.turnIndexAfterMove);
      moveService.makeMove(nextMove);
      cleanupInfoModal();
    } catch (e) {
      alertStyle = 'danger';
      alertMsg = e.message;
    }
  }

  export function onTradingSelected(resource: Resource) {
    tradingResource = resource;
  }

  export function onWantedSelected(resource: Resource) {
    wantedResource = resource;
  }

  export function tradingResourceClass(resource: Resource, trading: boolean): string {
    let comp = wantedResource;
    if (trading) {
      comp = tradingResource;
    }

    return 'resource-pic' + (comp >= 0 && comp === resource ? ' on-highlighted' : '');
  }

  export function changeTradingNum(add: boolean) {
    if (add) {
      tradingNum++;
    } else {
      tradingNum -= tradingNum <= 0 ? 0 : 1;
    }
  }

  export function changeWantedNum(add: boolean) {
    if (add) {
      wantedNum++;
    } else {
      wantedNum -= wantedNum <= 0 ? 0 : 1;
    }
  }
}

function getArray(length: number): number[] {
  let ret : number[] = [];

  for (let i = 0; i < length; i++) {
    ret[i] = i;
  }

  return ret;
}

function getZerosArray(length: number): number[] {
  let ret : number[] = [];

  for (let i = 0; i < length; i++) {
    ret[i] = 0;
  }

  return ret;
}

angular.module('myApp', ['ngTouch', 'ui.bootstrap', 'gameServices'])
  .run(function () {
    $rootScope['game'] = game;
    $rootScope['rows'] = getArray(gameLogic.ROWS);
    $rootScope['cols'] = getArray(gameLogic.COLS);
    $rootScope['vertices'] = getArray(6);
    $rootScope['edges'] = getArray(6);
    $rootScope['players'] = getArray(gameLogic.NUM_PLAYERS);
    $rootScope['resourceSize'] = getArray(Resource.SIZE);
    $rootScope['devCardsSize'] = getArray(DevCard.SIZE);
    game.init();
  });
