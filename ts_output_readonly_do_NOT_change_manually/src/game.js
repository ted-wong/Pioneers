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
    game.playerColor = ['red', 'blue', 'brown', 'green'];
    game.myIndex = -2;
    var settlementPadding = [[0, 25], [25, 0], [25, 25], [-25, 25], [-25, 0]];
    var mouseTarget = MouseTarget.NONE;
    var mouseRow = 0;
    var mouseCol = 0;
    var targetNum = 0;
    function getPlayerInfo(playerIndex) {
        //    if (state == null)
        //      state = gameLogic.getInitialState();
        return game.state.players[playerIndex];
    }
    game.getPlayerInfo = getPlayerInfo;
    // type 0 for resource cards, 1 for dev cards
    function getPlayerCardCount(playerIndex, type) {
        //    if (state == null)
        //      state = gameLogic.getInitialState();
        var total = 0;
        if (type === 0) {
            for (var i = 0; i < Resource.SIZE; i++) {
                total += game.state.players[playerIndex].resources[i];
            }
        }
        else {
            for (var i = 0; i < DevCard.SIZE; i++) {
                total += game.state.players[playerIndex].devCards[i];
            }
        }
        return total;
    }
    game.getPlayerCardCount = getPlayerCardCount;
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
    }
    game.init = init;
    function getTranslations() {
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
            CLOSE: {
                en: "Close",
                iw: "סגור",
            },
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
    function updateUI(params) {
        log.info("Game got updateUI:", params);
        game.animationEnded = false;
        game.move = params.move;
        game.state = game.move.stateAfterMove;
        if (!game.state) {
            game.state = gameLogic.getInitialState();
        }
        game.myIndex = params.yourPlayerIndex;
        /*
        //TODO: REMOVE!!
        state.board[3][3].edges[2] = 1;
        state.board[3][3].vertices[1] = Construction.Settlement;
        state.board[3][3].vertexOwner[1] = 1;
        state.players[0].points = 1;
        state.players[1].points = 2;
        state.players[2].points = 3;
        state.players[3].points = 4;
        state.players[0].resources[0] = 2;
        state.players[0].resources[1] = 3;
        state.players[0].resources[2] = 4;
        */
        game.canMakeMove = game.move.turnIndexAfterMove >= 0 &&
            params.yourPlayerIndex === game.move.turnIndexAfterMove; // it's my turn
        // Is it the computer's turn?
        game.isComputerTurn = game.canMakeMove &&
            params.playersInfo[params.yourPlayerIndex].playerId === '';
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
    function cellClicked(row, col) {
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
    game.cellClicked = cellClicked;
    function shouldEdgeSlowlyAppear(row, col, edge) {
        /*
        return !animationEnded &&
            state.delta &&
            state.delta.row === row && state.delta.col === col;
        */
        return false;
    }
    game.shouldEdgeSlowlyAppear = shouldEdgeSlowlyAppear;
    function shouldVertexSlowlyAppear(row, col, vertex) {
        /*
        return !animationEnded &&
            state.delta &&
            state.delta.row === row && state.delta.col === col;
        */
        return false;
    }
    game.shouldVertexSlowlyAppear = shouldVertexSlowlyAppear;
    function clickedOnHexModal(evt) {
        console.log("test");
        if (evt.target === evt.currentTarget) {
            console.log("in if");
            evt.preventDefault();
            evt.stopPropagation();
            game.isHexModalShown = true;
        }
        return true;
    }
    game.clickedOnHexModal = clickedOnHexModal;
    function clickedOnModal(evt) {
        if (evt.target === evt.currentTarget) {
            evt.preventDefault();
            evt.stopPropagation();
            game.isHelpModalShown = false;
        }
        return true;
    }
    game.clickedOnModal = clickedOnModal;
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
        var x = 120 + offset * col * 2 - (row % 2 === 1 ? offset : 0);
        var y = 120 + offset * row * Math.sqrt(3);
        return getHexPoints(x, y, 45);
    }
    function getCenter(row, col) {
        var offset = getOffset(row, 45);
        var x = 120 + offset * col * 2 - (row % 2 === 1 ? offset : 0);
        var y = 120 + offset * row * Math.sqrt(3);
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
        if (game.state.board[row][col].vertices[vertex] !== -1) {
            return false;
        }
        if (mouseTarget === MouseTarget.NONE || mouseTarget === MouseTarget.EDGE) {
            return false;
        }
        if (mouseRow !== row || mouseCol !== col) {
            return false;
        }
        if (mouseTarget === MouseTarget.VERTEX) {
            return targetNum === vertex;
        }
        else {
            return true;
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
        if (mouseTarget === MouseTarget.EDGE) {
            return targetNum === edge;
        }
        else {
            return true;
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
        return game.state.board[row][col].edges[edge] >= 0;
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
    function getSettlement(row, col, vertex) {
        var v = game.coordinates[row][col][vertex].split(',');
        var x = parseFloat(v[0]);
        var y = parseFloat(v[1]);
        var start = 'M' + x + ',' + (y - 10);
        return start + ' l-10,10' + ' v10' + ' h20' + ' v-10' + ' l-12,-12';
    }
    game.getSettlement = getSettlement;
    function getCity(row, col, vertex) {
        var v = game.coordinates[row][col][vertex].split(',');
        var x = parseFloat(v[0]);
        var y = parseFloat(v[1]);
        var start = 'M' + x + ',' + (y - 10);
        return start + ' l-10,10' + ' v10' + ' h30' + ' v-10' + ' h-10' + ' l-12,-12';
    }
    game.getCity = getCity;
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
    function onMouseOverHex(row, col) {
        mouseTarget = MouseTarget.HEX;
        mouseRow = row;
        mouseCol = col;
    }
    game.onMouseOverHex = onMouseOverHex;
    function onClickHex(row, col) {
        //For touch screen, maybe
        onMouseOverHex(row, col);
    }
    game.onClickHex = onClickHex;
    function onMouseOverEdge(row, col, edgeNum) {
        mouseTarget = MouseTarget.EDGE;
        mouseRow = row;
        mouseCol = col;
        targetNum = edgeNum;
    }
    game.onMouseOverEdge = onMouseOverEdge;
    function onMouseClickEdge(row, col, edgeNum) {
        //TODO
        console.log('Mouse Click Edge: ' + row + ' : ' + col + ' -> ' + edgeNum);
    }
    game.onMouseClickEdge = onMouseClickEdge;
    function onMouseOverVertex(row, col, vertexNum) {
        mouseTarget = MouseTarget.VERTEX;
        mouseRow = row;
        mouseCol = col;
        targetNum = vertexNum;
    }
    game.onMouseOverVertex = onMouseOverVertex;
    function onClickVertex(row, col, vertexNum) {
        //TODO
        console.log('Mouse Click Vertex: ' + row + ' : ' + col + ' -> ' + vertexNum);
    }
    game.onClickVertex = onClickVertex;
    function onMouseLeaveBoard() {
        mouseTarget = MouseTarget.NONE;
    }
    game.onMouseLeaveBoard = onMouseLeaveBoard;
    function getPlayerPoints(idx) {
        return game.state.players[idx].points;
    }
    game.getPlayerPoints = getPlayerPoints;
    function getPlayerKnights(idx) {
        return game.state.players[idx].knightsPlayed;
    }
    game.getPlayerKnights = getPlayerKnights;
    function getNumResources(playerIdx, resource) {
        if (!game.state || playerIdx < 0) {
            return 0;
        }
        if (!resource) {
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
        if (!dev) {
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
    function test(i) {
        console.log('TEST: ' + i);
    }
    game.test = test;
})(game || (game = {}));
function getArray(length) {
    var ret = [];
    for (var i = 0; i < length; i++) {
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
    $rootScope['resourceSize'] = getArray(Resource.SIZE);
    $rootScope['devCardsSize'] = getArray(DevCard.SIZE);
    game.init();
});
//# sourceMappingURL=game.js.map