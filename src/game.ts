interface SupportedLanguages { en: string, iw: string};
interface Translations {
  [index: string]: SupportedLanguages;
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
  export let hexRowChosen: number = -1;
  export let hexColChosen: number = -1;
  

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
        coordinates[row][col] = getBoardHex(row, col);
      }
    }
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

  function updateUI(params: IUpdateUI): void {
    log.info("Game got updateUI:", params);
    animationEnded = false;
    move = params.move;
    state = move.stateAfterMove;
    if (!state) {
      state = gameLogic.getInitialState();
    }

    //TODO: REMOVE!!
    state.board[3][3].edges[2] = 1;
    state.board[3][3].vertices[1] = Construction.Settlement;
    state.board[3][3].vertexOwner[1] = 1;

    canMakeMove = move.turnIndexAfterMove >= 0 && // game is ongoing
      params.yourPlayerIndex === move.turnIndexAfterMove; // it's my turn

    // Is it the computer's turn?
    isComputerTurn = canMakeMove &&
        params.playersInfo[params.yourPlayerIndex].playerId === '';
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

  export function cellClicked(row: number, col: number): void {
    /*
    log.info("Clicked on cell:", row, col);
    if (window.location.search === '?throwException') { // to test encoding a stack trace with sourcemap
      throw new Error("Throwing the error because URL has '?throwException'");
    }
    if (!canMakeMove) {
      return;
    }
    try {
      let nextMove = gameLogic.createMove(
          state, row, col, move.turnIndexAfterMove);
      canMakeMove = false; // to prevent making another move
      moveService.makeMove(nextMove);
    } catch (e) {
      log.info(["Cell is already full in position:", row, col]);
      return;
    }
    */
  }

  export function shouldEdgeSlowlyAppear(row: number, col: number, edge:number): boolean {
    /*
    return !animationEnded &&
        state.delta &&
        state.delta.row === row && state.delta.col === col;
    */
    return false;
  }

  export function shouldVertexSlowlyAppear(row: number, col: number, vertex:number): boolean {
    /*
    return !animationEnded &&
        state.delta &&
        state.delta.row === row && state.delta.col === col;
    */
    return false;
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

  export function showHex(row: number, col: number): boolean {
    if ((row === 0 || row === 6) && (col === 0 || col > 4)) return false;
    if ((row === 1 || row === 5) && (col === 0 || col === 6)) return false;
    if ((row === 2 || row === 4) && col === 6)  return false;

    return true;
  }

  export function onHexClicked(row: number, col: number) {
    this.hexRowChosen = row;
    this.hexColChosen = col;
    this.isHexModalShown = true;
  }

  export function onClickedHexModal(evt: Event) {
    if (evt.target === evt.currentTarget) {
      evt.preventDefault();
      evt.stopPropagation();
      this.isHexModalShown = false;
    }
  }

  export function getHelperHex(): string {
    return getHexPoints(120, 100, 120).join(' ');
  }

  export function getHelperHexLabel(): number {
    return this.state.board[this.hexRowChosen][this.hexColChosen].label;
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

  //TODO: onMouseOverHex & onMouseOutHex
}

function getArray(length: number): number[] {
  let ret : number[] = [];

  for (let i = 0; i < length; i++) {
    ret[i] = i;
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
    game.init();
  });
