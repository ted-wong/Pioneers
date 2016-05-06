;
var MouseTarget;
(function (MouseTarget) {
    MouseTarget[MouseTarget["NONE"] = 0] = "NONE";
    MouseTarget[MouseTarget["HEX"] = 1] = "HEX";
    MouseTarget[MouseTarget["VERTEX"] = 2] = "VERTEX";
    MouseTarget[MouseTarget["EDGE"] = 3] = "EDGE";
})(MouseTarget || (MouseTarget = {}));
var game;
(function (game) {
    // I export all variables to make it easy to debug in the browser by
    // simply typing in the console:
    // game.state
    game.animationEnded = false;
    game.canMakeMove = false;
    game.isComputerTurn = false;
    game.move = null;
    game.state = null;
    game.isHelpModalShown = false;
    game.isHexModalShown = false;
    game.hexRow = 3;
    game.hexCol = 3;
    game.height = 0;
    game.width = 0;
    game.coordinates = [];
    game.playerColor = ['#ED3B3B', '#3889F2', '#2AC761', '#CC9D04'];
    game.myIndex = -2;
    game.alertStyle = 'success';
    game.alertMsg = 'WELCOME_MSG';
    game.showInfoModal = false;
    game.infoModalHeader = '';
    game.infoModalMsg = '';
    game.onOkClicked = null;
    game.onCloseModal = cleanupInfoModal;
    game.canInfoModalTurnOff = true;
    game.showResourcePicker = false;
    var targetOneResource = -1;
    game.devRoads = [];
    game.playingDevRoadBuild = false;
    game.showResourcePickerMultiple = false;
    game.resourcesPicked = [];
    game.onClickHex = onMouseOverHex;
    var settlementPadding = [[0, 25], [25, 0], [25, 25], [-25, 25], [-25, 0]];
    var mouseTarget = MouseTarget.NONE;
    var mouseRow = 0;
    var mouseCol = 0;
    var targetNum = 0;
    var buildTarget = 0;
    var buildRow = 0;
    var buildCol = 0;
    var buildNum = 0;
    var makeMove = null;
    var robberMovedRow = -1;
    var robberMovedCol = -1;
    game.showRobberPanel = false;
    var robberVictomIdx = -1;
    game.showTradingPanel = false;
    var tradingResource = -1;
    game.tradingNum = 0;
    var wantedResource = -1;
    game.wantedNum = 0;
    var tradeWithBank = false;
    // needed for initial building phase
    game.initialBuilding = true;
    var initBuildingReverse = false;
    function init_callback(gameAreaWidth, gameAreaHeight) {
        game.height = gameAreaHeight;
        game.width = gameAreaWidth;
    }
    game.init_callback = init_callback;
    function init() {
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
        var w = window;
        if (w["HTMLInspector"]) {
            setInterval(function () {
                w["HTMLInspector"].inspect({
                    excludeRules: ["unused-classes", "script-placement"],
                });
            }, 3000);
        }
        for (var row = 0; row < gameLogic.ROWS; row++) {
            game.coordinates[row] = [];
            for (var col = 0; col < gameLogic.COLS; col++) {
                var coords = getBoardHex(row, col);
                //To conform data model
                game.coordinates[row][col] = coords.slice(2, 6).concat(coords.slice(0, 2));
            }
        }
        game.resourcesPicked = getZerosArray(Resource.SIZE);
    }
    game.init = init;
    function getTranslations() {
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
            CLOSE: {
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
            game.animationEnded = true;
            sendComputerMove();
        });
    }
    function sendComputerMove() {
        if (!game.isComputerTurn) {
            return;
        }
        game.isComputerTurn = false; // to make sure the computer can only move once.
        moveService.makeMove(aiService.findComputerMove(game.move));
    }
    function checkCanMakeMove() {
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
        switch (game.state.moveType) {
            case MoveType.INIT:
                game.alertStyle = 'success';
                game.alertMsg = "INIT_MSG";
                break;
            case MoveType.INIT_BUILD:
                game.alertStyle = 'success';
                if (game.state.eventIdx === game.myIndex) {
                    if (game.state.players[game.myIndex].construction[Construction.Settlement] === 2 && game.state.players[game.myIndex].construction[Construction.Road] === 2) {
                        game.alertMsg = 'INIT_BUILD_DONE';
                    }
                    else {
                        game.alertMsg = 'INIT_BUILD_MYTURN';
                    }
                }
                else {
                    if (game.state.players[game.state.eventIdx].construction[Construction.Settlement] >
                        game.state.players[game.state.eventIdx].construction[Construction.Road]) {
                        game.alertMsg = 'INIT_BUILD_OTHER_MOVE_MADE';
                    }
                    else {
                        game.alertMsg = 'INIT_BUILD_OTHER_MOVE_MAKING';
                    }
                }
                break;
            case MoveType.ROLL_DICE:
                game.alertStyle = 'success';
                game.alertMsg = 'ROLL_DICE';
                break;
            case MoveType.BUILD_ROAD:
                game.alertStyle = 'success';
                game.alertMsg = 'BUILD_ROAD';
                break;
            case MoveType.BUILD_SETTLEMENT:
                game.alertStyle = 'success';
                game.alertMsg = 'BUILD_SETTLEMENT';
                break;
            case MoveType.BUILD_CITY:
                game.alertStyle = 'success';
                game.alertMsg = 'BUILD_CITY';
                break;
            case MoveType.BUILD_DEVCARD:
                game.alertStyle = 'success';
                game.alertMsg = "Player 1" + " bought a development card!";
                break;
            case MoveType.KNIGHT:
                game.alertStyle = 'success';
                game.alertMsg = 'PLAY_KNIGHT';
                break;
            case MoveType.MONOPOLY:
                game.alertStyle = 'success';
                game.alertMsg = 'PLAY_MONOPOLY';
                break;
            case MoveType.YEAR_OF_PLENTY:
                game.alertStyle = 'success';
                game.alertMsg = 'PLAY_YEAR_OF_PLENTY';
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
                game.alertMsg = 'TRADE_WITH_BANK';
                break;
            case MoveType.WIN:
                break;
            default:
                game.alertStyle = 'danger';
                game.alertMsg = 'UNKNOWN_MOVE';
        }
    }
    function updateUI(params) {
        log.info("Game got updateUI:", params);
        game.animationEnded = false;
        game.move = params.move;
        game.state = game.move.stateAfterMove;
        if (!game.state) {
            game.state = gameLogic.getInitialState();
        }
        game.myIndex = params.yourPlayerIndex;
        game.canMakeMove = checkCanMakeMove();
        updateAlert();
        cleanupInfoModal();
        switch (game.state.moveType) {
            case MoveType.INIT_BUILD:
                if (game.state.eventIdx === 0 && initBuildingReverse === true) {
                    var allDoneInitBuild = true;
                    for (var i = 0; i < gameLogic.NUM_PLAYERS; i++) {
                        if (game.state.players[i].construction[Construction.Road] !== 2 || game.state.players[i].construction[Construction.Settlement] !== 2) {
                            allDoneInitBuild = false;
                            break;
                        }
                    }
                    if (allDoneInitBuild) {
                        game.showInfoModal = true;
                        game.infoModalHeader = 'Start Game';
                        game.infoModalMsg = "Everyone is ready, it's time to start the game!";
                        game.canInfoModalTurnOff = false;
                        game.initialBuilding = false;
                        var turnMove = {
                            moveType: MoveType.INIT,
                            playerIdx: game.myIndex,
                            currState: game.state
                        };
                        game.onOkClicked = function () {
                            try {
                                var nextMove = gameLogic.onGameStart(turnMove, 0);
                                moveService.makeMove(nextMove);
                                cleanupInfoModal();
                            }
                            catch (e) {
                                game.alertStyle = 'danger';
                                game.alertMsg = e.message;
                            }
                        };
                    }
                }
                if (game.state.eventIdx === gameLogic.NUM_PLAYERS - 1) {
                    initBuildingReverse = true;
                }
                break;
            case MoveType.ROLL_DICE:
                if (game.state.dices[0] + game.state.dices[1] === 7 && game.move.turnIndexAfterMove === game.myIndex) {
                    whenRobberEvent();
                }
                break;
            case MoveType.ROBBER_EVENT:
                if (game.state.eventIdx === game.move.turnIndexAfterMove) {
                    if (game.myIndex === game.move.turnIndexAfterMove) {
                        game.alertStyle = 'warning';
                        game.alertMsg = 'ROBBER_MOVE_ON_DICE';
                        whenMoveRobberStart();
                    }
                }
                else {
                    if (game.state.eventIdx === game.myIndex) {
                        whenRobberEvent();
                    }
                }
                break;
            case MoveType.ROBBER_MOVE:
                if (game.myIndex === game.move.turnIndexAfterMove) {
                    whenRobPlayerStart();
                }
                break;
            case MoveType.KNIGHT:
                if (game.myIndex === game.move.turnIndexAfterMove) {
                    game.alertStyle = 'warning';
                    game.alertMsg = 'ROBBER_MOVE_ON_KNIGHT';
                    whenMoveRobberStart();
                }
                break;
        }
        /*
        // Is it the computer's turn?
        isComputerTurn = canMakeMove &&
            params.playersInfo[params.yourPlayerIndex].playerId === '';
        */
        if (game.isComputerTurn) {
            // To make sure the player won't click something and send a move instead of the computer sending a move.
            game.canMakeMove = false;
            // We calculate the AI move only after the animation finishes,
            // because if we call aiService now
            // then the animation will be paused until the javascript finishes.
            if (!game.state.delta) {
                // This is the first move in the match, so
                // there is not going to be an animation, so
                // call sendComputerMove() now (can happen in ?onlyAIs mode)
                sendComputerMove();
            }
        }
    }
    function clickedOnModal(evt) {
        if (evt.target === evt.currentTarget) {
            evt.preventDefault();
            evt.stopPropagation();
            game.isHelpModalShown = false;
        }
        return true;
    }
    game.clickedOnModal = clickedOnModal;
    function clickedOnInfoModal(evt) {
        if (!game.canInfoModalTurnOff) {
            return;
        }
        if (evt.target === evt.currentTarget) {
            evt.preventDefault();
            evt.stopPropagation();
            game.onCloseModal();
        }
    }
    game.clickedOnInfoModal = clickedOnInfoModal;
    function getOffset(row, radius) {
        return (Math.sqrt(3) * radius) / 2;
    }
    function getHexPoints(x, y, radius) {
        var ret = [];
        for (var theta = 0; theta < Math.PI * 2; theta += Math.PI / 3) {
            var pointX = x + radius * Math.sin(theta);
            var pointY = y + radius * Math.cos(theta);
            ret.push(pointX + ',' + pointY);
        }
        return ret;
    }
    function getBoardHex(row, col) {
        var offset = getOffset(row, 45);
        var x = 105 + offset * col * 2 - (row % 2 === 1 ? offset : 0);
        var y = 100 + offset * row * Math.sqrt(3);
        return getHexPoints(x, y, 45);
    }
    function getCenter(row, col) {
        var offset = getOffset(row, 45);
        var x = 105 + offset * col * 2 - (row % 2 === 1 ? offset : 0);
        var y = 100 + offset * row * Math.sqrt(3);
        return [x.toString(), y.toString()];
    }
    game.getCenter = getCenter;
    function showHex(row, col) {
        if ((row === 0 || row === 6) && (col === 0 || col > 4))
            return false;
        if ((row === 1 || row === 5) && (col === 0 || col === 6))
            return false;
        if ((row === 2 || row === 4) && col === 6)
            return false;
        return true;
    }
    game.showHex = showHex;
    function onClickedHexModal(evt) {
        if (evt.target === evt.currentTarget) {
            evt.preventDefault();
            evt.stopPropagation();
            this.isHexModalShown = false;
        }
    }
    game.onClickedHexModal = onClickedHexModal;
    function getHexVertices(row, col) {
        return game.coordinates[row][col].join(' ');
    }
    game.getHexVertices = getHexVertices;
    function getVertexCenter(row, col, vertex) {
        return game.coordinates[row][col][vertex].split(',');
    }
    game.getVertexCenter = getVertexCenter;
    function getEdgeCoordinates(row, col, edge) {
        var src = edge === 0 ? 5 : edge - 1;
        return [game.coordinates[row][col][src].split(','), game.coordinates[row][col][edge].split(',')];
    }
    game.getEdgeCoordinates = getEdgeCoordinates;
    function showVertex(row, col, vertex) {
        if (game.state.board[row][col].vertices[vertex] !== -1 || game.playingDevRoadBuild) {
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
        if (game.initialBuilding && game.state.players[game.myIndex].construction[Construction.Settlement] >
            game.state.players[game.myIndex].construction[Construction.Road]) {
            return false;
        }
        // only show buildable locations
        if (gameLogic.canBuildSettlementLegally(game.state.players[game.myIndex], game.state.board, row, col, vertex, game.initialBuilding)) {
            return true;
        }
        else {
            return false;
        }
    }
    game.showVertex = showVertex;
    function getVertexClass(row, col, vertex) {
        if (mouseTarget === MouseTarget.NONE || mouseTarget === MouseTarget.EDGE) {
            return '';
        }
        if (mouseRow !== row || mouseCol !== col) {
            return '';
        }
        if (mouseTarget === MouseTarget.VERTEX) {
            return targetNum === vertex ? 'emphasize-vertex' : '';
        }
        else {
            return 'mouse-to-display-vertex';
        }
    }
    game.getVertexClass = getVertexClass;
    function showEdge(row, col, edge) {
        if (game.state.board[row][col].edges[edge] !== -1) {
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
        if (game.initialBuilding && game.state.players[game.myIndex].construction[Construction.Settlement] ===
            game.state.players[game.myIndex].construction[Construction.Road]) {
            return false;
        }
        // only show buildable locations
        if (gameLogic.canBuildRoadLegally(game.state.players[game.myIndex], game.state.board, row, col, edge, true)) {
            return true;
        }
        else {
            return false;
        }
    }
    game.showEdge = showEdge;
    function getEdgeClass(row, col, edge) {
        if (mouseTarget === MouseTarget.NONE || mouseTarget === MouseTarget.VERTEX) {
            return '';
        }
        if (mouseRow !== row || mouseCol !== col) {
            return '';
        }
        if (mouseTarget === MouseTarget.EDGE) {
            return targetNum === edge ? 'emphasize-edge' : '';
        }
        else {
            return 'mouse-to-display-edge';
        }
    }
    game.getEdgeClass = getEdgeClass;
    function showRoad(row, col, edge) {
        if (game.state.board[row][col].edges[edge] >= 0) {
            return true;
        }
        for (var i = 0; i < game.devRoads.length; i++) {
            if (game.devRoads[i].hexRow === row && game.devRoads[i].hexCol === col && game.devRoads[i].vertexOrEdge === edge) {
                return true;
            }
        }
        return false;
    }
    game.showRoad = showRoad;
    function showSettlement(row, col, vertex) {
        return game.state.board[row][col].vertices[vertex] === Construction.Settlement;
    }
    game.showSettlement = showSettlement;
    function showCity(row, col, vertex) {
        return game.state.board[row][col].vertices[vertex] === Construction.City;
    }
    game.showCity = showCity;
    function getColor(idx) {
        return idx >= 0 ? game.playerColor[idx] : 'black';
    }
    game.getColor = getColor;
    function getRoadColor(row, col, edge) {
        if (game.state.board[row][col].edges[edge] >= 0) {
            return getColor(game.state.board[row][col].edges[edge]);
        }
        if (game.devRoads.length > 0 && showRoad(row, col, edge)) {
            return getColor(game.myIndex);
        }
        return getColor(-1);
    }
    game.getRoadColor = getRoadColor;
    function getSettlement(row, col, vertex) {
        var v = game.coordinates[row][col][vertex].split(',');
        var x = parseFloat(v[0]);
        var y = parseFloat(v[1]);
        var start = 'M' + x + ',' + (y - 10);
        return start + ' l-10,10' + ' v10' + ' h20' + ' v-10' + ' l-10,-10';
    }
    game.getSettlement = getSettlement;
    function getCity(row, col, vertex) {
        var v = game.coordinates[row][col][vertex].split(',');
        var x = parseFloat(v[0]);
        var y = parseFloat(v[1]);
        var start = 'M' + x + ',' + (y - 10);
        return start + ' l-10,10' + ' v10' + ' h30' + ' v-10' + ' h-10' + ' l-10,-10';
    }
    game.getCity = getCity;
    function getHarbor(row, col) {
        var cx = Number(getCenter(row, col)[0]);
        var cy = Number(getCenter(row, col)[1]);
        var start = 'M' + cx + ',' + cy;
        var v = game.coordinates[row][col][game.state.board[row][col].harbor.vertices[0]].split(',');
        var x1 = parseFloat(v[0]);
        var y1 = parseFloat(v[1]);
        v = game.coordinates[row][col][game.state.board[row][col].harbor.vertices[1]].split(',');
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
    game.getHarbor = getHarbor;
    function getHarborFill(row, col) {
        if (game.state.board[row][col].harbor.trading === Resource.ANY)
            return 'white';
        return 'url(#r' + game.state.board[row][col].harbor.trading + ')';
    }
    game.getHarborFill = getHarborFill;
    function harborIsAny(row, col) {
        if (game.state.board[row][col].harbor === null)
            return false;
        return game.state.board[row][col].harbor.trading === Resource.ANY;
    }
    game.harborIsAny = harborIsAny;
    function showHarbor(row, col) {
        return game.state.board[row][col].harbor !== null;
    }
    game.showHarbor = showHarbor;
    function showRollNum(row, col) {
        return game.state.board[row][col].rollNum > 0 || (game.state.robber.row === row && game.state.robber.col === col);
    }
    game.showRollNum = showRollNum;
    function getRollColor(row, col) {
        return game.state.board[row][col].hasRobber || (game.state.board[row][col].rollNum >= 6 && game.state.board[row][col].rollNum <= 8) ? 'red' : 'black';
    }
    game.getRollColor = getRollColor;
    function getNumSettlementCanBuild() {
        return game.myIndex >= 0 ? 5 - game.state.players[game.myIndex].construction[Construction.Settlement] : 0;
    }
    game.getNumSettlementCanBuild = getNumSettlementCanBuild;
    function getNumCityCanBuild() {
        return game.myIndex >= 0 ? 4 - game.state.players[game.myIndex].construction[Construction.City] : 0;
    }
    game.getNumCityCanBuild = getNumCityCanBuild;
    function getNumRoadCanBuild() {
        return game.myIndex >= 0 ? 15 - game.state.players[game.myIndex].construction[Construction.Road] : 0;
    }
    game.getNumRoadCanBuild = getNumRoadCanBuild;
    function getHexFill(row, col) {
        if (row === robberMovedRow && col === robberMovedCol) {
            return getColor(game.myIndex);
        }
        return 'url(#r' + game.state.board[row][col].label + ')';
    }
    game.getHexFill = getHexFill;
    function onMouseOverHex(row, col) {
        mouseTarget = MouseTarget.HEX;
        mouseRow = row;
        mouseCol = col;
    }
    game.onMouseOverHex = onMouseOverHex;
    function onMouseOverEdge(row, col, edgeNum) {
        mouseTarget = MouseTarget.EDGE;
        mouseRow = row;
        mouseCol = col;
        targetNum = edgeNum;
    }
    game.onMouseOverEdge = onMouseOverEdge;
    function onClickEdge(row, col, edgeNum) {
        if (game.playingDevRoadBuild) {
            var devRoad = {
                moveType: MoveType.BUILD_ROAD,
                playerIdx: game.myIndex,
                currState: game.state,
                consType: Construction.Road,
                hexRow: row,
                hexCol: col,
                vertexOrEdge: edgeNum
            };
            game.devRoads.push(devRoad);
            if (game.devRoads.length === 2) {
                game.showInfoModal = true;
                game.infoModalHeader = 'Playing Development Cards';
                game.infoModalMsg = 'Are you sure you want to build both roads?';
                game.onOkClicked = onRoadBuildingDone;
            }
            return;
        }
        buildTarget = Construction.Road;
        buildRow = row;
        buildCol = col;
        buildNum = edgeNum;
        game.showInfoModal = true;
        game.onOkClicked = onBuild;
        game.infoModalHeader = 'Building';
        game.infoModalMsg = 'Are you sure you want to build a road?';
    }
    game.onClickEdge = onClickEdge;
    function onMouseOverVertex(row, col, vertexNum) {
        mouseTarget = MouseTarget.VERTEX;
        mouseRow = row;
        mouseCol = col;
        targetNum = vertexNum;
    }
    game.onMouseOverVertex = onMouseOverVertex;
    function onClickVertex(row, col, vertexNum) {
        if (game.state.board[row][col].vertices[vertexNum] === -1) {
            buildTarget = Construction.Settlement;
            buildRow = row;
            buildCol = col;
            buildNum = vertexNum;
            game.showInfoModal = true;
            game.onOkClicked = onBuild;
            game.infoModalHeader = 'Building';
            game.infoModalMsg = 'Are you sure you want to build a settlement?';
        }
        else if (game.state.board[row][col].vertices[vertexNum] === Construction.Settlement && game.state.board[row][col].vertexOwner[vertexNum] === game.myIndex) {
            buildTarget = Construction.City;
            buildRow = row;
            buildCol = col;
            buildNum = vertexNum;
            game.showInfoModal = true;
            game.onOkClicked = onBuild;
            game.infoModalHeader = 'Building';
            game.infoModalMsg = 'Are you sure you want to upgrade this settlement to a city?';
        }
    }
    game.onClickVertex = onClickVertex;
    function onBuild() {
        game.showInfoModal = false;
        game.onOkClicked = null;
        if (!game.canMakeMove) {
            return;
        }
        var buildMove = {
            moveType: game.state.moveType,
            playerIdx: game.myIndex,
            currState: angular.copy(game.state),
            consType: buildTarget,
            hexRow: buildRow,
            hexCol: buildCol,
            vertexOrEdge: buildNum
        };
        try {
            var nextMove = game.state.moveType === MoveType.INIT_BUILD ? gameLogic.onInitBuilding(buildMove, game.move.turnIndexAfterMove) :
                gameLogic.onBuilding(buildMove, game.move.turnIndexAfterMove);
            moveService.makeMove(nextMove);
        }
        catch (e) {
            game.alertStyle = 'danger';
            game.alertMsg = e.message;
        }
    }
    game.onBuild = onBuild;
    function onMouseLeaveBoard() {
        mouseTarget = MouseTarget.NONE;
    }
    game.onMouseLeaveBoard = onMouseLeaveBoard;
    function cleanupInfoModal() {
        game.showInfoModal = false;
        game.infoModalHeader = '';
        game.infoModalMsg = '';
        game.onOkClicked = null;
        game.onCloseModal = cleanupInfoModal;
        game.canInfoModalTurnOff = true;
        makeMove = null;
        game.showResourcePicker = false;
        targetOneResource = -1;
        game.resourcesPicked = getZerosArray(Resource.SIZE);
        game.showResourcePickerMultiple = false;
        game.onClickHex = onMouseOverHex;
        robberMovedRow = -1;
        robberMovedCol = -1;
        game.showRobberPanel = false;
        robberVictomIdx = -1;
        game.showTradingPanel = false;
        tradingResource = -1;
        game.tradingNum = 0;
        wantedResource = -1;
        game.wantedNum = 0;
        tradeWithBank = false;
    }
    game.cleanupInfoModal = cleanupInfoModal;
    function getPlayerPoints(idx) {
        return game.state.players[idx].points;
    }
    game.getPlayerPoints = getPlayerPoints;
    function getPlayerKnights(idx) {
        return game.state.players[idx].knightsPlayed;
    }
    game.getPlayerKnights = getPlayerKnights;
    function getPlayerRoadLength(idx) {
        return gameLogic.getLongestRoad(game.state.players[idx], game.state.board);
    }
    game.getPlayerRoadLength = getPlayerRoadLength;
    function getPlayerBorder(idx) {
        return idx === game.myIndex ? 'my-info-border' : 'player-info-border';
    }
    game.getPlayerBorder = getPlayerBorder;
    function getRollNumText(row, col) {
        if (game.state.board[row][col].hasRobber) {
            if (game.state.board[row][col].rollNum === -1)
                return "R";
            return "R" + game.state.board[row][col].rollNum;
        }
        return "" + game.state.board[row][col].rollNum;
    }
    game.getRollNumText = getRollNumText;
    function getNumResources(playerIdx, resource) {
        if (!game.state || playerIdx < 0) {
            return 0;
        }
        if (resource === undefined || resource === null) {
            return game.state.players[playerIdx].resources.reduce(function (a, b) {
                return a + b;
            });
        }
        return game.state.players[playerIdx].resources[resource];
    }
    game.getNumResources = getNumResources;
    function getNumDevCards(playerIdx, dev) {
        if (!game.state || playerIdx < 0) {
            return 0;
        }
        if (dev === undefined || dev === null) {
            return game.state.players[playerIdx].devCards.reduce(function (a, b) {
                return a + b;
            });
        }
        return game.state.players[playerIdx].devCards[dev];
    }
    game.getNumDevCards = getNumDevCards;
    function getBankResources(resource) {
        if (!game.state || resource < 0) {
            return 0;
        }
        return game.state.bank.resources[resource];
    }
    game.getBankResources = getBankResources;
    function getBankDevCards() {
        return game.state.bank.devCardsOrder.length;
    }
    game.getBankDevCards = getBankDevCards;
    function showDice() {
        return game.state.moveType !== MoveType.INIT_BUILD && !game.state.diceRolled;
    }
    game.showDice = showDice;
    function showEndTurn() {
        return game.state.moveType !== MoveType.INIT_BUILD && game.state.diceRolled;
    }
    game.showEndTurn = showEndTurn;
    function endTurn() {
        var turnMove = {
            moveType: MoveType.INIT,
            playerIdx: game.myIndex,
            currState: angular.copy(game.state)
        };
        var nextMove = gameLogic.onEndTurn(turnMove, game.move.turnIndexAfterMove);
        moveService.makeMove(nextMove);
    }
    game.endTurn = endTurn;
    function getDicesNum() {
        return game.state.dices.reduce(function (a, b) { return a + b; });
    }
    game.getDicesNum = getDicesNum;
    function onRollDice() {
        var turnMove = {
            playerIdx: game.myIndex,
            moveType: MoveType.ROLL_DICE,
            currState: game.state
        };
        try {
            var nextMove = gameLogic.onRollDice(turnMove, game.move.turnIndexAfterMove);
            moveService.makeMove(nextMove);
        }
        catch (e) {
            game.alertStyle = 'danger';
            game.alertMsg = e.message;
        }
    }
    game.onRollDice = onRollDice;
    var devCardEventHandlers = [
        whenPlayKnight,
        whenPlayMonopoly,
        whenPlayRoadBuilding,
        whenPlayYearOfPlenty
    ];
    function onDevCardClicked(cardIdx) {
        makeMove = {
            moveType: null,
            playerIdx: game.myIndex,
            currState: angular.copy(game.state)
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
        game.showInfoModal = true;
        game.onOkClicked = devCardEventHandlers[cardIdx];
        game.infoModalHeader = 'Playing Development Cards';
        game.infoModalMsg = 'Are you sure you want to play ' + DevCard[cardIdx] + '?';
    }
    game.onDevCardClicked = onDevCardClicked;
    /**
     * Playing DevCards handlers
     */
    function whenPlayKnight() {
        console.log(makeMove);
        try {
            var nextMove = gameLogic.onKnight(makeMove, game.move.turnIndexAfterMove);
            moveService.makeMove(nextMove);
        }
        catch (e) {
            game.alertStyle = 'danger';
            game.alertMsg = e.message;
        }
        finally {
            cleanupInfoModal();
        }
    }
    function whenPlayMonopoly() {
        game.showResourcePicker = true;
        game.infoModalHeader = 'Please pick a resource';
        game.infoModalMsg = '';
        game.onOkClicked = onPlayMonopoly;
    }
    function onOneTargetResourcePicked(resource) {
        targetOneResource = resource;
    }
    game.onOneTargetResourcePicked = onOneTargetResourcePicked;
    function oneTargetResourceClass(resource) {
        return 'resource-pic' + (targetOneResource === resource ? ' on-highlighted' : '');
    }
    game.oneTargetResourceClass = oneTargetResourceClass;
    function onPlayMonopoly() {
        var turnMove = {
            moveType: makeMove.moveType,
            playerIdx: makeMove.moveType,
            currState: game.state,
            target: targetOneResource
        };
        try {
            var nextMove = gameLogic.onMonopoly(turnMove, game.move.turnIndexAfterMove);
            moveService.makeMove(nextMove);
        }
        catch (e) {
            game.alertStyle = 'danger';
            game.alertMsg = e.message;
        }
        finally {
            cleanupInfoModal();
        }
    }
    function whenPlayRoadBuilding() {
        game.alertStyle = 'warning';
        game.alertMsg = 'PLAY_ROAD_BUILDING';
        cleanupDevRoadBuild();
        game.playingDevRoadBuild = true;
        cleanupInfoModal();
    }
    function onRoadBuildingDone() {
        var turnMove = {
            moveType: MoveType.ROAD_BUILDING,
            playerIdx: game.myIndex,
            currState: angular.copy(game.state),
            road1: game.devRoads[0],
            road2: game.devRoads[1]
        };
        try {
            var nextMove = gameLogic.onRoadBuilding(turnMove, game.move.turnIndexAfterMove);
            moveService.makeMove(nextMove);
        }
        catch (e) {
            game.alertStyle = 'danger';
            game.alertMsg = e.message;
        }
        finally {
            cleanupDevRoadBuild();
            cleanupInfoModal();
        }
    }
    game.onRoadBuildingDone = onRoadBuildingDone;
    function onRoadBuildingCanceled() {
        game.alertStyle = 'success';
        game.alertMsg = 'BUILD_ROAD_CANCELED';
        cleanupDevRoadBuild();
    }
    game.onRoadBuildingCanceled = onRoadBuildingCanceled;
    function cleanupDevRoadBuild() {
        game.devRoads = [];
        game.playingDevRoadBuild = false;
    }
    function whenPlayYearOfPlenty() {
        game.showResourcePickerMultiple = true;
        game.infoModalHeader = 'Please pick two resources';
        game.infoModalMsg = '';
        game.onOkClicked = onPlayYearOfPlenty;
    }
    function onMultipleResourcesPicked(resource, add) {
        game.resourcesPicked[resource] += add ? 1 : -1;
    }
    game.onMultipleResourcesPicked = onMultipleResourcesPicked;
    function onPlayYearOfPlenty() {
        var turnMove = {
            moveType: makeMove.moveType,
            playerIdx: makeMove.playerIdx,
            currState: game.state,
            target: game.resourcesPicked
        };
        try {
            var nextMove = gameLogic.onYearOfPlenty(turnMove, game.move.turnIndexAfterMove);
            moveService.makeMove(nextMove);
        }
        catch (e) {
            game.alertStyle = 'danger';
            game.alertMsg = e.message;
        }
        finally {
            cleanupInfoModal();
        }
    }
    function whenRobberEvent() {
        if (game.state.players[game.myIndex].resources.reduce(function (a, b) { return a + b; }) > 7) {
            game.showResourcePickerMultiple = true;
            game.infoModalHeader = 'Please dump half of resources on hand';
            game.infoModalMsg = '';
        }
        else {
            game.infoModalHeader = 'Robber Event!';
            game.infoModalMsg = 'Luckily you do not have to dump resources!';
        }
        game.onOkClicked = onRobberEventDone;
        game.showInfoModal = true;
        game.canInfoModalTurnOff = false;
    }
    function onRobberEventDone() {
        var turnMove = {
            moveType: MoveType.ROBBER_EVENT,
            playerIdx: game.myIndex,
            currState: angular.copy(game.state),
            tossed: angular.copy(game.resourcesPicked)
        };
        try {
            var nextMove = gameLogic.onRobberEvent(turnMove, game.move.turnIndexAfterMove);
            moveService.makeMove(nextMove);
            cleanupInfoModal(); //Can only turn off info modal after a valid move
        }
        catch (e) {
            game.alertStyle = 'danger';
            game.alertMsg = e.message;
            whenRobberEvent(); //Do it again if it's an invalid move
        }
    }
    function whenMoveRobberStart() {
        if (game.myIndex !== game.move.turnIndexAfterMove) {
            return;
        }
        game.onClickHex = whenMoveRobber;
        game.onOkClicked = onMoveRobberDone;
        game.onCloseModal = function () {
            game.showInfoModal = false;
        };
        robberMovedRow = game.state.robber.row;
        robberMovedCol = game.state.robber.col;
    }
    function whenMoveRobber(row, col) {
        robberMovedRow = row;
        robberMovedCol = col;
        game.showInfoModal = true;
        game.infoModalHeader = 'Move Robber';
        game.infoModalMsg = 'Are you sure you want to move the robber here?';
    }
    function onMoveRobberDone() {
        var turnMove = {
            moveType: MoveType.ROBBER_MOVE,
            playerIdx: game.myIndex,
            currState: game.state,
            row: robberMovedRow,
            col: robberMovedCol
        };
        try {
            var nextMove = gameLogic.onRobberMove(turnMove, game.move.turnIndexAfterMove);
            moveService.makeMove(nextMove);
            cleanupInfoModal();
        }
        catch (e) {
            game.alertStyle = 'danger';
            game.alertMsg = e.message;
            game.onCloseModal();
            whenMoveRobberStart();
        }
    }
    function whenRobPlayerStart() {
        //Check if there has player(s) to rob.  If none, move on
        var noOneCanSteal = true, r = game.state.robber.row, c = game.state.robber.col;
        for (var v = 0; v < game.state.board[r][c].vertexOwner.length; v++) {
            if (game.state.board[r][c].vertexOwner[v] === -1) {
                continue;
            }
            var p = game.state.board[r][c].vertexOwner[v];
            if (game.state.players[p].resources.reduce(function (a, b) { return a + b; }) > 0) {
                noOneCanSteal = false;
                break;
            }
        }
        if (noOneCanSteal) {
            game.alertStyle = 'warning';
            game.alertMsg = 'NO_ONE_CAN_ROB';
            cleanupInfoModal();
            return;
        }
        game.showInfoModal = true;
        game.canInfoModalTurnOff = false;
        game.infoModalHeader = 'Select a player to rob';
        game.infoModalMsg = '';
        game.onOkClicked = onRobPlayerDone;
        game.showRobberPanel = true;
    }
    function onVictomSelected(idx) {
        robberVictomIdx = idx;
    }
    game.onVictomSelected = onVictomSelected;
    function onRobPlayerDone() {
        var turnMove = {
            moveType: MoveType.ROB_PLAYER,
            playerIdx: game.myIndex,
            currState: angular.copy(game.state),
            stealingIdx: game.myIndex,
            stolenIdx: robberVictomIdx
        };
        try {
            var nextMove = gameLogic.onRobPlayer(turnMove, game.move.turnIndexAfterMove);
            moveService.makeMove(nextMove);
            cleanupInfoModal();
        }
        catch (e) {
            game.alertStyle = 'danger';
            game.alertMsg = e.message;
            whenRobPlayerStart();
        }
    }
    function possibleRobberVictom(idx) {
        var r = game.state.robber.row, c = game.state.robber.col;
        for (var i = 0; i < game.state.board[r][c].vertexOwner.length; i++) {
            if (game.state.board[r][c].vertexOwner[i] === idx) {
                return idx !== game.myIndex && game.state.players[idx].resources.reduce(function (a, b) { return a + b; }) > 0;
            }
        }
        return false;
    }
    game.possibleRobberVictom = possibleRobberVictom;
    function showTradeButton() {
        return game.state.diceRolled && game.myIndex === game.move.turnIndexAfterMove;
    }
    game.showTradeButton = showTradeButton;
    function onTradeWithBankStart() {
        tradeWithBank = true;
        whenTradingStarted();
    }
    game.onTradeWithBankStart = onTradeWithBankStart;
    function whenTradingStarted() {
        game.showInfoModal = true;
        game.infoModalHeader = 'Trade';
        game.infoModalMsg = '';
        game.onOkClicked = tradeWithBank ? onTradingWithBankDone : null; //TODO: Trade with players
        game.showTradingPanel = true;
    }
    function onTradingWithBankDone() {
        if (tradingResource < 0 || tradingResource >= Resource.SIZE ||
            wantedResource < 0 || wantedResource >= Resource.SIZE) {
            game.alertStyle = 'danger';
            game.alertMsg = 'MUST_SELECT_TRADE_ITEM';
            return;
        }
        if (game.tradingNum <= 0 || game.wantedNum <= 0) {
            game.alertStyle = 'danger';
            game.alertMsg = 'MUST_SELECT_NUMBER_TO_TRADE';
            return;
        }
        var turnMove = {
            moveType: MoveType.TRANSACTION_WITH_BANK,
            playerIdx: game.myIndex,
            currState: angular.copy(game.state),
            sellingItem: tradingResource,
            sellingNum: game.tradingNum,
            buyingItem: wantedResource,
            buyingNum: game.wantedNum
        };
        try {
            var nextMove = gameLogic.onTradingWithBank(turnMove, game.move.turnIndexAfterMove);
            moveService.makeMove(nextMove);
            cleanupInfoModal();
        }
        catch (e) {
            game.alertStyle = 'danger';
            game.alertMsg = e.message;
        }
    }
    function onTradingSelected(resource) {
        tradingResource = resource;
    }
    game.onTradingSelected = onTradingSelected;
    function onWantedSelected(resource) {
        wantedResource = resource;
    }
    game.onWantedSelected = onWantedSelected;
    function tradingResourceClass(resource, trading) {
        var comp = wantedResource;
        if (trading) {
            comp = tradingResource;
        }
        return 'resource-pic' + (comp >= 0 && comp === resource ? ' on-highlighted' : '');
    }
    game.tradingResourceClass = tradingResourceClass;
    function changeTradingNum(add) {
        if (add) {
            game.tradingNum++;
        }
        else {
            game.tradingNum -= game.tradingNum <= 0 ? 0 : 1;
        }
    }
    game.changeTradingNum = changeTradingNum;
    function changeWantedNum(add) {
        if (add) {
            game.wantedNum++;
        }
        else {
            game.wantedNum -= game.wantedNum <= 0 ? 0 : 1;
        }
    }
    game.changeWantedNum = changeWantedNum;
    function showBuyDevCardButton() {
        return game.state.diceRolled && game.myIndex === game.move.turnIndexAfterMove;
    }
    game.showBuyDevCardButton = showBuyDevCardButton;
    function whenBuyDevCard() {
        game.infoModalHeader = 'Trade';
        game.infoModalMsg = 'Are you sure you want to buy a development card?';
        game.showInfoModal = true;
        game.onOkClicked = confirmBuyDevCard;
    }
    game.whenBuyDevCard = whenBuyDevCard;
    function confirmBuyDevCard() {
        var turnMove = {
            moveType: MoveType.BUILD_DEVCARD,
            playerIdx: game.myIndex,
            currState: angular.copy(game.state),
            consType: Construction.DevCard,
            hexRow: -1,
            hexCol: -1,
            vertexOrEdge: -1
        };
        try {
            var nextMove = gameLogic.onBuilding(turnMove, game.move.turnIndexAfterMove);
            moveService.makeMove(nextMove);
            cleanupInfoModal();
        }
        catch (e) {
            game.alertStyle = 'danger';
            game.alertMsg = e.message;
        }
    }
})(game || (game = {}));
function getArray(length) {
    var ret = [];
    for (var i = 0; i < length; i++) {
        ret[i] = i;
    }
    return ret;
}
function getZerosArray(length) {
    var ret = [];
    for (var i = 0; i < length; i++) {
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
//# sourceMappingURL=game.js.map