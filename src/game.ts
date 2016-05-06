interface SupportedLanguages { en: string, zh: string};
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
  export let alertMsg = 'WELCOME_MSG';

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
        zh: "Pioneers規則"
      },
      RULES_SLIDE1: { 
        en: "You and your opponent take turns to building settlements and cities on the island.  The first to reach 10 points wins!",
        zh: '遊戲目標: 您與其他玩家輪流建造路、房子與城市，第一個得到10分的玩家勝利!'
      },
      RULES_SLIDE2_TITLE: {
        en: 'How to earn victory points:',
        zh: '得分方式:'
      },
      RULES_SLIDE2_SETTLEMENT: {
        en: 'Each settlement earns 1 point',
        zh: '每棟房子可獲得1分'
      },
      RULES_SLIDE2_CITY: {
        en: 'Each city earns 2 points',
        zh: '每座城市可獲得2分'
      },
      RULES_SLIDE2_LARGEST_ARMY: {
        en: 'Player with largest army earns 2 points',
        zh: '獲得兵王的玩家可獲得2分'
      },
      RULES_SLIDE2_LONGEST_ROAD: {
        en: 'Player with longest road earns 2 points',
        zh: '獲得路王的玩家可獲得2分'
      },
      RULES_SLIDE2_DEV_CARD: {
        en: 'Each Victory Point development card worths 1 point',
        zh: '每張分卡(發展卡)為1分'
      },
      RULES_SLIDE2_HOWTO_LARGEST_ARMY: {
        en: 'Player with equal or more than 3 knights played and number of knights is the biggest earns Largest Army Award',
        zh: '使用過三個或以上的兵卡，並且為場上最多的玩家可獲得兵王獎勵'
      },
      RULES_SLIDE2_HOWTO_LONGEST_ROAD: {
        en: 'Player with equal or more than 5 roads constructed in a row earns Longest Road Award',
        zh: '連續的已建造的路，長度為5或以上的擁有最長的路的玩家，可獲得路王獎勵'
      },
      RULES_SLIDE3_TITLE: {
        en: 'Building Costs:',
        zh: '建造成本:'
      },
      RULES_SLIDE3_BUILD_ROAD: {
        en: 'Road: Brick x 1 + Lumber x 1',
        zh: '路: 磚頭 x 1 + 木頭 x 1'
      },
      RULES_SLIDE3_BUILD_SETTLEMENT: {
        en: 'Settlement: Brick x 1 + Lumber x 1 + Grain x 1 + Wool x 1',
        zh: '房子: 磚頭 x 1 + 木頭 x 1 + 小麥 x 1 + 羊毛 x 1'
      },
      RULES_SLIDE3_BUILD_CITY: {
        en: 'City: Grain x 2 + Ore x 3',
        zh: '城市: 小麥 x 2 + 鐵礦 x 3'
      },
      RULES_SLIDE3_BUILD_DEV_CARD: {
        en: 'Development Card: Wool x 1 + Grain x 1 + Ore x 1',
        zh: '發展卡: 羊毛 x 1 + 小麥 x 1 + 鐵礦 x 1'
      },

      CLOSE:  {
        en: "Close",
        zh: "關閉"
      },

      WELCOME_MSG: {
        en: 'Welcome to Pioneers Game!',
        zh: '歡迎來到Pioneers遊戲!'
      },
      PIECE_LEFT_TO_BUILD: {
        en: 'Pieces left to build:',
        zh: '剩餘可建築數量:'
      },
      GAME_PLAYER: {
        en: 'Player',
        zh: '玩家'
      },
      GAME_BANK: {
        en: 'Bank',
        zh: '銀行'
      },
      GAME_MY_CARDS: {
        en: 'My Cards',
        zh: '我的卡片'
      },

      INIT_MSG: {
        en: "Player's turn...",
        zh: "下一個玩家..."
      },
      INIT_BUILD_DONE: {
        en: 'Initial buildings done, time to start the game!',
        zh: '初始建築完成，開始遊戲!'
      },
      INIT_BUILD_MYTURN: {
        en: 'Please place your initial buildings and roads...',
        zh: '請建造您的初始建築...'
      },
      INIT_BUILD_OTHER_MOVE_MADE: {
        en: 'Other player is made an initial building move...',
        zh: '其他玩家建造了初始建築...'
      },
      INIT_BUILD_OTHER_MOVE_MAKING: {
        en: 'Other player is making an initial bulding move...',
        zh: '其他玩家正在建造初始建築...'
      },
      ROLL_DICE: {
        en: 'Dice rolled with number!',
        zh: '骰子骰出了!'
      },
      BUILD_ROAD: {
        en: 'Player built a road!',
        zh: '玩家建造了一條路!'
      },
      BUILD_SETTLEMENT: {
        en: 'Player built a settlement!',
        zh: '玩家建造了一棟房子!'
      },
      BUILD_CITY: {
        en: 'Player built a city!',
        zh: '玩家建造了一座城市!'
      },
      BUILD_ROAD_CANCELED: {
        en: 'Road Building canceled',
        zh: '道路建造取消'
      },
      BUILD_DEVCARD: {
        en: 'Player built a development card!',
        zh: '玩家購買了一張發展卡!'
      },
      PLAY_KNIGHT: {
        en: 'Player played a knight!',
        zh: '玩家使用了兵卡!'
      },
      PLAY_MONOPOLY: {
        en: 'Player played a monopoly development card!',
        zh: '玩家使用了獨佔卡!'
      },
      PLAY_YEAR_OF_PLENTY: {
        en: 'Player played a year of plenty card!',
        zh: '玩家使用了豐收卡!'
      },
      PLAY_ROAD_BUILDING: {
        en: 'Please select two roads',
        zh: '請建造兩條路'
      },
      TRADE_WITH_BANK: {
        en: 'Player traded with bank!',
        zh: '玩家與銀行進行了交易!'
      },
      ROBBER_MOVE_ON_DICE: {
        en: 'Moving robber...',
        zh: '移動強盜中...'
      },
      ROBBER_MOVE_ON_KNIGHT: {
        en: 'Knight! Moving robber...',
        zh: '騎士來了! 強盜移動中...'
      },
      NO_ONE_CAN_ROB: {
        en: 'No one can rob...',
        zh: '無人可搶劫...'
      },

      MUST_SELECT_TRADE_ITEM: {
        en: 'Must select items to trade!',
        zh: '必須選擇交易物品!'
      },
      MUST_SELECT_NUMBER_TO_TRADE: {
        en: 'Must identify number of items to trade!',
        zh: '必須指定交易數量!'
      },
      UNKNOWN_MOVE: {
        en: 'Unknown Move!',
        zh: '無效操作!'
      },

      ERR_NOT_YOUR_TURN: {
        en: 'Not your turn to play!',
        zh: '不是您的回合!'
      },
      ERR_INIT_BUILD: {
        en: 'Invalid build during initialization!',
        zh: '無效的初始建築!'
      },
      ERR_INIT_BUILD_NOT_FINISHED: {
        en: 'Initial construction not finished!',
        zh: '初始建築尚未結束!'
      },
      ERR_DICE_ROLLED: {
        en: 'Dices already rolled!',
        zh: '骰子已經骰過了!'
      },
      ERR_DICE_NOT_ROLLED: {
        en: 'Need to roll dices first!',
        zh: '請先使用骰子!'
      },
      ERR_DEV_CARD_PLAYED: {
        en: 'Already played development card!',
        zh: '已經使用過發展卡!'
      },
      ERR_NO_KNIGHT_ON_HAND: {
        en: "Doens't have knight card on hand!",
        zh: '手中無兵卡!'
      },
      ERR_NO_MONOPOLY_ON_HAND: {
        en: 'No Monopoly card on hand!',
        zh: '手中無獨佔卡!'
      },
      ERR_NO_ROAD_BUILDING_ON_HAND: {
        en: 'No Road Building cards on hand!',
        zh: '手中無建路卡!'
      },
      ERR_NO_YEAR_OF_PLENTY_ON_HAND: {
        en: 'No Year of Plenty cards on hand!',
        zh: '手中無豐年卡!'
      },
      ERR_MUST_CHOOSE_TWO_RESOURCE: {
        en: 'Must choose two resources (can be of same type)',
        zh: '必須選擇兩項資源(可以是同一種資源)'
      },
      ERR_DUMP_RESOURCES: {
        en: 'Cannot dump resources!',
        zh: '不可丟棄資源!'
      },
      ERR_DUMP_NEGATIVE_RESOURCE: {
        en: 'Cannot dump negative resources',
        zh: '丟棄資源數量不可為負數'
      },
      ERR_INSUFFICIENT_RESOURCE: {
        en: 'Insufficient resources!',
        zh: '資源不足!'
      },
      ERR_INSUFFICIENT_BUILDING: {
        en: 'Insufficient building to build!',
        zh: '建築數量不足!'
      },
      ERR_ILLEGAL_BUILD: {
        en: 'Cannot build legally!',
        zh: '無法在此建築!'
      },
      ERR_TOSS_CARDS_NOT_ENOUGH: {
        en: 'Need to toss half of resource cards!',
        zh: '需要丟棄一半的資源卡!'
      },
      ERR_NEED_TO_MOVE_ROBBER: {
        en: 'Need to move robber',
        zh: '必須移動強盜!'
      },
      ERR_STEAL_MORE_THAN_ONE_PLAYERS: {
        en: 'Cannot steal multiple players!',
        zh: '不可從多位玩家身上進行偷盜!'
      },
      ERR_STEAL_MORE_THAN_ONCE: {
        en: 'Cannot have multiple stealings!',
        zh: '不可偷盜多次!'
      },
      ERR_NOT_YOU_TO_STEAL: {
        en: 'Only current player can steal from others!',
        zh: '只有目前玩家可以進行偷盜!'
      },
      ERR_STEAL_SELF: {
        en: 'Cannot steal from self!',
        zh: '不可對自己進行偷盜!'
      },
      ERR_STEAL_ITEM_NO_MATCH: {
        en: 'Stealing item is not matching stolen item!',
        zh: '偷盜物品與被偷盜物品不符!'
      },
      ERR_STEAL_NOTHING: {
        en: 'Must choose what to steal!',
        zh: '必須選擇偷盜物品!'
      },
      ERR_STEAL_NUMBER_NO_MATCH: {
        en: 'Stealing number is not matching stolen number!',
        zh: '偷盜數量不符!'
      },
      ERR_STEAL_MORE_THAN_ONE_RESOURCE: {
        en: 'Must steal one resource at a time!',
        zh: '一次只能盜取一個資源!'
      },
      ERR_DIFF_RESOURCE_ON_TRADING: {
        en: 'Need to use same resources for trading',
        zh: '必須使用同樣資源進行交易'
      },
      ERR_TRADE_MORE_THAN_ONE_RESOURCE: {
        en: 'One resource per trade',
        zh: '一次交易一樣資源'
      },
      ERR_MISSING_TRADING_ITEM: {
        en: 'Missing trading item!',
        zh: '缺少交易資源!'
      },
      ERR_TRADING_SAME_RESOURCE: {
        en: 'Cannot trade the same resources',
        zh: '不可交易相同資源'
      },
      ERR_WRONG_TRADING_RATIO: {
        en: 'Wrong trading ratio',
        zh: '錯誤交易比例'
      },
      ERR_INSUFFICIENT_RESOURCE_IN_BANK: {
        en: 'Insufficient resources in bank for now!',
        zh: '銀行資源不足!'
      },
      ERR_INSUFFICIENT_DEVCARD_IN_BANK: {
        en: 'Insufficient development cards in bank!',
        zh: '銀行發展卡不足!'
      },
      ERR_INVALID_PLACE_FOR_ROBBER: {
        en: 'Invalid position for robber',
        zh: '無效強盜位置'
      },
      ERR_INVALID_ROBBING_MOVE: {
        en: 'Invalid robbing action!',
        zh: '無效偷盜行為!'
      }
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
        alertMsg = "INIT_MSG";
        break;
      case MoveType.INIT_BUILD:
        alertStyle = 'success';
        if (state.eventIdx === myIndex) {
          if (state.players[myIndex].construction[Construction.Settlement] === 2 && state.players[myIndex].construction[Construction.Road] === 2) {
            alertMsg = 'INIT_BUILD_DONE';
          } else {
            alertMsg = 'INIT_BUILD_MYTURN';
          }
        } else {
          if (state.players[state.eventIdx].construction[Construction.Settlement] > 
            state.players[state.eventIdx].construction[Construction.Road]) {
            alertMsg = 'INIT_BUILD_OTHER_MOVE_MADE';
          } else {
            alertMsg = 'INIT_BUILD_OTHER_MOVE_MAKING';
          }
        }
        break;
      case MoveType.ROLL_DICE:
        alertStyle = 'success';
        alertMsg = 'ROLL_DICE';
        break;
      case MoveType.BUILD_ROAD:
        alertStyle = 'success';
        alertMsg = 'BUILD_ROAD';
        break;
      case MoveType.BUILD_SETTLEMENT:
        alertStyle = 'success';
        alertMsg = 'BUILD_SETTLEMENT';
        break;
      case MoveType.BUILD_CITY:
        alertStyle = 'success';
        alertMsg = 'BUILD_CITY';
        break;
      case MoveType.BUILD_DEVCARD:
        alertStyle = 'success';
        alertMsg = "Player 1" + " bought a development card!";
        break;
      case MoveType.KNIGHT:
        alertStyle = 'success';
        alertMsg = 'PLAY_KNIGHT';
        break;
      case MoveType.MONOPOLY:
        alertStyle = 'success';
        alertMsg = 'PLAY_MONOPOLY';
        break;
      case MoveType.YEAR_OF_PLENTY:
        alertStyle = 'success';
        alertMsg = 'PLAY_YEAR_OF_PLENTY';
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
        alertMsg = 'TRADE_WITH_BANK';
        break;
      case MoveType.WIN:
        break;
      default:
        alertStyle = 'danger';
        alertMsg = 'UNKNOWN_MOVE';
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
            alertMsg = 'ROBBER_MOVE_ON_DICE';
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
          alertMsg = 'ROBBER_MOVE_ON_KNIGHT';
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
    alertMsg = 'PLAY_ROAD_BUILDING';

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
    alertMsg = 'BUILD_ROAD_CANCELED';
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
      alertMsg = 'NO_ONE_CAN_ROB';
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
      alertMsg = 'MUST_SELECT_TRADE_ITEM';
      return;
    }
    if (tradingNum <= 0 || wantedNum <= 0) {
      alertStyle = 'danger';
      alertMsg = 'MUST_SELECT_NUMBER_TO_TRADE';
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
