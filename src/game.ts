interface SupportedLanguages { en: string};
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
  export let playerColor = ['#ED3B3B', '#3889F2', '#2AC761', '#CC9D04'];
  export let myIndex: number = -2;

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
  
  // needed for initial building phase
  export let initialBuilding: boolean = true;
  let initBuildingReverse: boolean = false;
  

  export function init_callback(gameAreaWidth: number, gameAreaHeight: number): void {
    height = gameAreaHeight;
    width = gameAreaWidth;
  }
  export function init() {
    resizeGameAreaService.setWidthToHeight(1.33333);
    //resizeGameAreaService.setWidthToHeight(1.33333, init_callback);
    
    translate.setTranslations(getTranslations());
    translate.setLanguage('en');
    log.log("Translation of 'Pioneers' is " + translate('RULES_OF_PIONEERS'));
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
      RULES_OF_PIONEERS: {
        en: "Rules of Pioneers",
      },
      RULES_SLIDE1: { 
        en: "You and your opponent take turns to building settlements and cities on the island.  The first to reach 10 points wins!",
    },
      RULES_SLIDE2: {
    en: "Initial building phase starts with a placing a settlement on a vertex and an adjacent road on an edge, once the last player finishes, " + 
      "it repeats in the opposite direction, gaining resources adjacent to the second settlement.  "  +
      "After the first player's finishes their second settlement and road, the game starts.  ",
    },
    RULES_SLIDE3: {
      en: "Settlements cannot be on adjacent vertices, they must be at least one vertex apart.  " + 
      "You can only build settlements if you have a road leading to the vertex (aside from the first two settlements).  " + 
      "When the dice are rolled, the number on the hex will yield that resource to players having a settlement or city adjacent to it.  " +
      "Having settlements on hexes with numbers closer to 7 are more likely to be rolled.  " + 
      "However, if a 7 is rolled, no resources will be handed out, but instead players must drop cards if they have too many.  " + 
      "In addition, the player who rolled the dice gets to move the robber to a new hex, allowing that person to steal a resource card from another player.  " + 
      "Settlements can be upgraded to cities to yield double resources when a number is rolled.  ",
      },
      RULES_SLIDE4: {
        en: "The cost of a road is: 1 wood and 1 brick.  " +
        "The cost of a settlement is: 1 wood, 1 brick, 1 sheep, and 1 wheat.  " + 
      "The cost of upgrading to a city is: 3 wheat and 2 ore.\r" + 
      "The cost of a development card is: 1 sheep, 1 wheat, and 1 ore.",
      },
      CLOSE:  {
        en: "Close",
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
        alertStyle = 'success';
        alertMsg = "It is now player 1's turn";
        break;
      case MoveType.INIT_BUILD:
        alertStyle = 'success';
        if (state.eventIdx === myIndex) {
          if (state.players[myIndex].construction[Construction.Settlement] === 2 && state.players[myIndex].construction[Construction.Road] === 2) {
            alertMsg = 'Initial buildings done, time to start the game!';
          } else {
            alertMsg = 'Please place your initial buildings and roads...';
          }
        } else {
          if (state.players[state.eventIdx].construction[Construction.Settlement] > 
            state.players[state.eventIdx].construction[Construction.Road]) {
            alertMsg = 'Player ' + (state.eventIdx + 1) + ' placed a settlement, but now needs a road...';
          } else {
            alertMsg = 'Player ' + (state.eventIdx + 1) + ' placing initial buildings and roads...';
          }
        }
        break;
      case MoveType.ROLL_DICE:
        alertStyle = 'success';
        alertMsg = "Player 1 rolled a " + state.dices.reduce(function(a, b) {return a+b;});
        break;
      case MoveType.BUILD_ROAD:
        alertStyle = 'success';
        alertMsg = "Player 1" + " built a road!";
        break;
      case MoveType.BUILD_SETTLEMENT:
        alertStyle = 'success';
        alertMsg = "Player 1" + " built a settlement!";
        break;
      case MoveType.BUILD_CITY:
        alertStyle = 'success';
        alertMsg = "Player 1" + " upgraded a settlement to a city!";
        break;
      case MoveType.BUILD_DEVCARD:
        alertStyle = 'success';
        alertMsg = "Player 1" + " bought a development card!";
        break;
      case MoveType.KNIGHT:
        alertStyle = 'success';
        alertMsg = "Player 1" + " played a knight!";
        break;
      case MoveType.MONOPOLY:
        alertStyle = 'success';
        alertMsg = "Player 1" + " played a monopoly development card!";
        break;
      case MoveType.YEAR_OF_PLENTY:
        alertStyle = 'success';
        alertMsg = "Player 1" + " played a year of plenty card!";
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
        alertMsg = "Player 1" + " traded with the bank!";
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
    canMakeMove = checkCanMakeMove();

    updateAlert();
    cleanupInfoModal();
    switch (state.moveType) {
      case MoveType.INIT_BUILD:
        if (state.eventIdx === 0 && initBuildingReverse === true) {
          let allDoneInitBuild = true;
          for (let i = 0; i < gameLogic.NUM_PLAYERS; i++) {
            if (state.players[i].construction[Construction.Road] !== 2 || state.players[i].construction[Construction.Settlement] !== 2) {
              allDoneInitBuild = false;
              break;
            }
          }
          if (allDoneInitBuild) {
            showInfoModal = true;
            infoModalHeader = 'Start Game';
            infoModalMsg = "Everyone is ready, it's time to start the game!";
            canInfoModalTurnOff = false;
            initialBuilding = false;

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
        if (state.eventIdx === gameLogic.NUM_PLAYERS - 1) {
          initBuildingReverse = true;
        }
        break;
      case MoveType.ROLL_DICE:
        if (state.dices[0] + state.dices[1] === 7 && move.turnIndexAfterMove === myIndex) {
          whenRobberEvent();
        }
        break;
      case MoveType.ROBBER_EVENT:
        if (state.eventIdx === move.turnIndexAfterMove) {
          if (myIndex === move.turnIndexAfterMove) {
            alertStyle = 'warning';
            alertMsg = 'Moving robber...';
            whenMoveRobberStart();
          }
        } else {
          if (state.eventIdx === myIndex) {
            whenRobberEvent();
          }
        }
        break;
      case MoveType.ROBBER_MOVE:
        if (myIndex === move.turnIndexAfterMove) {
          whenRobPlayerStart();
        }
        break;
      case MoveType.KNIGHT:
        if (myIndex === move.turnIndexAfterMove) {
          alertStyle = 'warning';
          alertMsg = 'Knight!  Moving robber...';
          whenMoveRobberStart();
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
    let x = 105 + offset * col * 2 - (row % 2 === 1 ? offset : 0);
    let y = 100 + offset * row * Math.sqrt(3);

    return getHexPoints(x, y, 45);
  }

  export function getCenter(row: number, col: number): string[] {
    let offset = getOffset(row, 45);
    let x = 105 + offset * col * 2 - (row % 2 === 1 ? offset : 0);
    let y = 100 + offset * row * Math.sqrt(3);

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
    }
    
    if (initialBuilding && state.players[myIndex].construction[Construction.Settlement] >
      state.players[myIndex].construction[Construction.Road]) {
      return false;
    }
    
    // only show buildable locations
    if (gameLogic.canBuildSettlementLegally(state.players[myIndex], state.board, row, col, vertex, initialBuilding)) {
      return true;
    } else {
      return false;
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
    }

    if (initialBuilding && state.players[myIndex].construction[Construction.Settlement] ===
      state.players[myIndex].construction[Construction.Road]) {
      return false;
    }

    // only show buildable locations
    if (gameLogic.canBuildRoadLegally(state.players[myIndex], state.board, row, col, edge, true)) {
      return true;
    } else {
      return false;
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
    return start + ' l-10,10' + ' v10' + ' h20' + ' v-10' + ' l-10,-10';
  }

  export function getCity(row: number, col: number, vertex: number): string {
    let v = coordinates[row][col][vertex].split(',');
    let x = parseFloat(v[0]);
    let y = parseFloat(v[1]);

    let start = 'M' + x + ',' + (y - 10);
    return start + ' l-10,10' + ' v10' + ' h30' + ' v-10' + ' h-10' + ' l-10,-10';
  }

  export function getHarbor(row: number, col: number): string {

    var cx = Number(getCenter(row, col)[0]);
    var cy = Number(getCenter(row, col)[1]);
    let start = 'M' + cx + ',' + cy;

    var v = coordinates[row][col][state.board[row][col].harbor.vertices[0]].split(',');
    var x1 = parseFloat(v[0]);
    var y1 = parseFloat(v[1]);
    
    v = coordinates[row][col][state.board[row][col].harbor.vertices[1]].split(',');
    var x2 = parseFloat(v[0]);
    var y2 = parseFloat(v[1]);

    var dx1 = x1 - cx;
    var dy1 = y1 - cy;
    var dx2 = x2 - x1;
    var dy2 = y2 - y1;
    var dx3 = cx - x2;
    var dy3 = cy - y2;

    return start + ' l' + dx1 + ',' + dy1 + ' l' + dx2 + ',' + dy2 + ' l' + dx3 + ',' + dy3;
  }

  export function getHarborFill(row: number, col: number): string {
    if (state.board[row][col].harbor.trading === Resource.ANY)
    return 'white';
    return 'url(#r' + state.board[row][col].harbor.trading + ')';
  }

  export function harborIsAny(row: number, col: number): boolean {
    if (state.board[row][col].harbor === null) return false;
    return state.board[row][col].harbor.trading === Resource.ANY;
  }

  export function showHarbor(row: number, col: number): boolean {
    return state.board[row][col].harbor !== null;
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
      return getColor(myIndex);
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
        playerIdx: myIndex,
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
        infoModalMsg = 'Are you sure you want to build both roads?';
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
    infoModalMsg = 'Are you sure you want to build a road?';
  }

  export function onMouseOverVertex(row: number, col: number, vertexNum: number) {
    mouseTarget = MouseTarget.VERTEX;
    mouseRow = row;
    mouseCol = col;
    targetNum = vertexNum;
  }

  export function onClickVertex(row: number, col: number, vertexNum: number) {
    
    if (state.board[row][col].vertices[vertexNum] === -1) {
      buildTarget = Construction.Settlement;
      buildRow = row;
      buildCol = col;
      buildNum = vertexNum;

      showInfoModal = true;
      onOkClicked = onBuild;
      infoModalHeader = 'Building';
      infoModalMsg = 'Are you sure you want to build a settlement?';

    } else if (state.board[row][col].vertices[vertexNum] === Construction.Settlement && state.board[row][col].vertexOwner[vertexNum] === myIndex) {
      buildTarget = Construction.City;
      buildRow = row;
      buildCol = col;
      buildNum = vertexNum;

      showInfoModal = true;
      onOkClicked = onBuild;
      infoModalHeader = 'Building';
      infoModalMsg = 'Are you sure you want to upgrade this settlement to a city?';
    }
  }

  export function onBuild() {
    showInfoModal = false;
    onOkClicked = null;
    if (!canMakeMove) {
      return;
    }

    let buildMove: BuildMove = {
      moveType: state.moveType,
      playerIdx: myIndex,
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

  export function getPlayerRoadLength(idx: number): number {
    return gameLogic.getLongestRoad(state.players[idx], state.board);
  }

  export function getPlayerBorder(idx: number): string {
    return idx === myIndex ? 'my-info-border' : 'player-info-border';
  }

  export function getRollNumText(row: number, col: number): string {
    if (state.board[row][col].hasRobber) {
      if (state.board[row][col].rollNum === -1)
        return "R";
      return "R" + state.board[row][col].rollNum;
    }
    return "" + state.board[row][col].rollNum;
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
    if (dev === undefined || dev === null) {
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

  export function endTurn(): void {
    let turnMove: TurnMove = {
      moveType: MoveType.INIT,
      playerIdx: myIndex,
      currState: angular.copy(state)
    }
    let nextMove: IMove = gameLogic.onEndTurn(turnMove, move.turnIndexAfterMove);
    moveService.makeMove(nextMove);
  }


  export function getDicesNum(): number {
    return state.dices.reduce(function(a, b) {return a+b;});
  }

  export function onRollDice() {
    let turnMove: TurnMove = {
      playerIdx: myIndex,
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
      playerIdx: myIndex,
      currState: angular.copy(state)
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
    infoModalMsg = 'Are you sure you want to play ' + DevCard[cardIdx] + '?';
  }

  /**
   * Playing DevCards handlers
   */
  function whenPlayKnight() {
    console.log(makeMove);
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
      playerIdx: myIndex,
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
    if (state.players[myIndex].resources.reduce(function(a, b) {return a+b;}) > 7) {
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
      playerIdx: myIndex,
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
    if (myIndex !== move.turnIndexAfterMove) {
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
    infoModalMsg = 'Are you sure you want to move the robber here?';
  }

  function onMoveRobberDone() {
    let turnMove: RobberMoveMove = {
      moveType: MoveType.ROBBER_MOVE,
      playerIdx: myIndex,
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
      playerIdx: myIndex,
      currState: angular.copy(state),
      stealingIdx: myIndex,
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
        return idx !== myIndex && state.players[idx].resources.reduce(function(a, b) {return a+b;}) > 0;
      }
    }

    return false;
  }

  export function showTradeButton(): boolean {
    return state.diceRolled && myIndex === move.turnIndexAfterMove;
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
    if (tradingResource < 0 || tradingResource >= Resource.SIZE ||
        wantedResource < 0 || wantedResource >= Resource.SIZE) {
      alertStyle = 'danger';
      alertMsg = 'Must select items to trade!';
      return;
    }
    if (tradingNum <= 0 || wantedNum <= 0) {
      alertStyle = 'danger';
      alertMsg = 'Must identify number of items to trade!';
      return;
    }

    let turnMove: TradeWithBankMove = {
      moveType: MoveType.TRANSACTION_WITH_BANK,
      playerIdx: myIndex,
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

  export function showBuyDevCardButton(): boolean {
    return state.diceRolled && myIndex === move.turnIndexAfterMove;
  }

  export function whenBuyDevCard() {
    infoModalHeader = 'Trade';
    infoModalMsg = 'Are you sure you want to buy a development card?';
    showInfoModal = true;
    onOkClicked = confirmBuyDevCard;
  }

  function confirmBuyDevCard() {
    let turnMove: BuildMove = {
      moveType: MoveType.BUILD_DEVCARD,
      playerIdx: myIndex,
      currState: angular.copy(state),
      consType: Construction.DevCard,
      hexRow: -1,
      hexCol: -1,
      vertexOrEdge: -1
    };

    try {
      let nextMove = gameLogic.onBuilding(turnMove, move.turnIndexAfterMove);
      moveService.makeMove(nextMove);
      cleanupInfoModal();
    } catch (e) {
      alertStyle = 'danger';
      alertMsg = e.message;
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
