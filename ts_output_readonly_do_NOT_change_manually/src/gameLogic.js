var gameLogic;
(function (gameLogic) {
    gameLogic.ROWS = 7;
    gameLogic.COLS = 7;
    gameLogic.NUM_PLAYERS = 4;
    function shuffleArray(src) {
        var ret = angular.copy(src);
        for (var j = void 0, x = void 0, i = ret.length; i; j = Math.floor(Math.random() * i), x = ret[--i], ret[i] = ret[j], ret[j] = x)
            ;
        return ret;
    }
    function isSea(row, col) {
        if (row === 0 || col === 0 || row === gameLogic.ROWS - 1 || col === gameLogic.COLS - 1) {
            return true;
        }
        else if (row === 1 || row === 5) {
            if (col === 1 || col > 4) {
                return true;
            }
        }
        else if (row === 2 || row === 4) {
            if (col > 4) {
                return true;
            }
        }
        return false;
    }
    function assignHarbor(row, col) {
        for (var i = 0; i < harborPos.length; i++) {
            if (harborPos[i][0] === row && harborPos[i][1] === col) {
                return harbors[i];
            }
        }
        return null;
    }
    function getInitialBoard() {
        var board = [];
        //Shuffle & terrains
        var newNumTokens = angular.copy(tokens);
        var newTerrains = shuffleArray(terrains);
        var tokenPtr = 0;
        var terrainPtr = 0;
        for (var i = 0; i < gameLogic.ROWS; i++) {
            board[i] = [];
            for (var j = 0; j < gameLogic.COLS; j++) {
                var edges = [-1, -1, -1, -1, -1, -1];
                var vertices = [-1, -1, -1, -1, -1, -1];
                var vertexOwner = [-1, -1, -1, -1, -1, -1];
                var label = isSea(i, j) ? Resource.Water : newTerrains[terrainPtr++];
                var hex = {
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
    function getInitialArray(size) {
        var ret = [];
        for (var i = 0; i < size; i++) {
            ret[i] = 0;
        }
        return ret;
    }
    function getInitialPlayers() {
        var players = [];
        for (var i = 0; i < gameLogic.NUM_PLAYERS; i++) {
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
    function getInitialBank() {
        var bank = {
            resources: getInitialArray(Resource.SIZE),
            devCards: getInitialArray(DevCard.SIZE)
        };
        //Assign total size of resources/devCards in bank according to rules
        for (var i = 0; i < Resource.SIZE; i++) {
            bank.resources[i] = 19;
        }
        for (var i = 0; i < DevCard.SIZE; i++) {
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
    function getInitialAwards() {
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
    function getInitialRobber(board) {
        var row = -1;
        var col = -1;
        for (var i = 0; i < gameLogic.ROWS; i++) {
            for (var j = 0; j < gameLogic.COLS; j++) {
                if (board[i][j].hasRobber) {
                    row = i;
                    col = j;
                    break;
                }
            }
        }
        return { row: row, col: col };
    }
    function getInitialState() {
        var board = getInitialBoard();
        var robber = getInitialRobber(board);
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
            eventIdx: -1,
            building: null
        };
    }
    gameLogic.getInitialState = getInitialState;
    /**
     * Validation logics
     */
    /**
     * XXX: MUST have the same ordering as MoveType has
     */
    var validateHandlers = [
        null,
        checkRollDice,
        checkBuildRoad,
        checkBuildSettlement,
        checkBuildCity,
        checkBuildDevCards,
        checkPlayDevCard,
        checkPlayDevCard,
        null,
        checkRobberEvent,
        checkRobberMove,
        null,
        checkTradeResourceWithBank
    ];
    function checkRollDice(prevState, nextState, idx) {
        if (prevState.diceRolled) {
            throw new Error('Dices already rolled');
        }
    }
    function checkResourcesToBuild(player, consType, bank) {
        if (!canAffordConstruction(player, consType)) {
            throw new Error('Insufficient resources to build ' + consType);
        }
        if (!hasSufficientConstructsToBuild(player, consType, bank)) {
            throw new Error('Has no enough constructions to build ' + consType);
        }
    }
    function checkBuildRoad(prevState, nextState, idx) {
        checkResourcesToBuild(prevState.players[idx], Construction.Road, prevState.bank);
        var building = nextState.building;
        var player = nextState.players[idx];
        if (!canBuildRoadLegally(player, prevState.board, building.hexRow, building.hexCol, building.vertexOrEdge, building.init)) {
            throw new Error('Cannot build road legally!');
        }
    }
    function checkBuildSettlement(prevState, nextState, idx) {
        checkResourcesToBuild(prevState.players[idx], Construction.Settlement, prevState.bank);
        var building = nextState.building;
        var player = nextState.players[idx];
        if (!canBuildSettlementLegally(player, prevState.board, building.hexRow, building.hexCol, building.vertexOrEdge, building.init)) {
            throw new Error('Cannot build settlement legally!');
        }
    }
    function checkBuildCity(prevState, nextState, idx) {
        checkResourcesToBuild(prevState.players[idx], Construction.City, prevState.bank);
        var building = nextState.building;
        var player = nextState.players[idx];
        if (!canUpgradeSettlement(player, prevState.board, building.hexRow, building.hexCol, building.vertexOrEdge)) {
            throw new Error('Cannot build city legally!');
        }
    }
    /**
    * XXX: Assuming UI will disable this feature when bank has no dev cards
    */
    function checkBuildDevCards(prevState, nextState, idx) {
        if (!prevState.diceRolled) {
            throw new Error('Need to roll dices first');
        }
        checkResources(nextState.players[idx].resources);
    }
    function checkPlayDevCard(prevState, nextState, idx) {
        if (prevState.devCardsPlayed) {
            throw new Error('Already played development cards');
        }
        //Check when playing year of plenty
        try {
            checkResources(nextState.bank.resources);
        }
        catch (e) {
            throw new Error('Bank Error: ' + e.message);
        }
    }
    function checkRobberEvent(prevState, nextState, idx) {
        var prevSum = 0;
        var nextSum = 0;
        for (var i = 0; i < Resource.SIZE; i++) {
            prevSum += prevState.players[idx].resources[i];
            nextSum += nextState.players[idx].resources[i];
        }
        if (prevSum > 7 && nextSum > prevSum / 2) {
            throw new Error('Need to toss half of resource cards');
        }
    }
    function checkRobberMove(prevState, nextState, idx) {
        if (angular.equals(prevState.robber, nextState.robber)) {
            throw new Error('Need to move robber');
        }
    }
    function checkResources(resources) {
        for (var i = 0; i < Resource.SIZE; i++) {
            if (resources[i] < 0) {
                throw new Error('Insufficient resources: ' + Resource[i]);
            }
        }
    }
    function findTradingRatio(board, trading, idx) {
        for (var i = 0; i < gameLogic.ROWS; i++) {
            for (var j = 0; j < gameLogic.COLS; j++) {
                if (board[i][j].harbor === null || board[i][j].harbor.trading !== Resource.ANY ||
                    board[i][j].harbor.trading !== trading) {
                    continue;
                }
                var harbor = board[i][j].harbor;
                for (var v = 0; v < 6; v++) {
                    if (board[i][j].vertexOwner[v] === idx &&
                        (harbor.vertices[0] === v || harbor.vertices[1] === v)) {
                        return board[i][j].harbor.trading === Resource.ANY ? 3 : 2;
                    }
                }
            }
        }
        return 4;
    }
    function checkTradeResourceWithBank(prevState, nextState, idx) {
        if (!prevState.diceRolled) {
            throw new Error('Need to roll dices first');
        }
        var selling = { item: Resource.Dust, num: 0 };
        var buying = { item: Resource.Dust, num: 0 };
        checkResources(nextState.players[idx].resources);
        for (var i = 0; i < Resource.SIZE; i++) {
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
     * create move logics
     */
    function createResources(board, players) {
        var ret = angular.copy(players);
        return ret;
    }
    function onDicesRolled(prevState, playerIdx) {
        var dices = [];
        dices[0] = Math.floor(Math.random() * 6) + 1;
        dices[1] = Math.floor(Math.random() * 6) + 1;
        var rollNum = dices[0] + dices[1];
        var ret = angular.copy(prevState);
        ret.dices = dices;
        if (rollNum === 7) {
            //Robber Event
            ret.moveType = MoveType.ROBBER_EVENT;
            ret.eventIdx = playerIdx;
        }
        else {
        }
        return ret;
    }
    function checkMoveOk(stateTransition) {
        var prevState = stateTransition.stateBeforeMove;
        var nextState = stateTransition.move.stateAfterMove;
        var prevIdx = nextState.moveType === MoveType.ROBBER_EVENT ?
            prevState.eventIdx : stateTransition.turnIndexBeforeMove;
        //TODO: What does these for, exactly?
        var nextIdx = stateTransition.move.turnIndexAfterMove;
        var delta = stateTransition.move.stateAfterMove.delta;
        validateHandlers[nextState.moveType](prevState, nextState, prevIdx);
        /*
        TODO: Remove this once validateHandlers acts as expected
        switch (nextState.moveType) {
          case MoveType.ROLL_DICE:
            checkRollDice(prevState, nextState, prevIdx);
            break;
          case MoveType.BUILD_ROAD:
            checkBuildRoad(prevState, nextState, prevIdx);
            break;
          case MoveType.BUILD_SETTLEMENT:
            checkBuildSettlement(prevState, nextState, prevIdx);
            break;
          case MoveType.BUILD_CITY:
            checkBuildCity(prevState, nextState, prevIdx);
            break;
          case MoveType.BUILD_DEVCARD:
            checkBuildDevCards(prevState, nextState, prevIdx);
            break;
          case MoveType.KNIGHT:
            checkPlayDevCard(prevState, nextState, prevIdx);
            break;
          case MoveType.PROGRESS:
            checkPlayDevCard(prevState, nextState, prevIdx);
            break;
          case MoveType.TRADE:
            //TODO: On hold until after MVP
            break;
          case MoveType.ROBBER_EVENT:
            checkRobberEvent(prevState, nextState, prevState.eventIdx);
            break;
          case MoveType.ROBBER_MOVE:
            checkRobberMove(prevState, nextState, prevIdx);
            break;
          case MoveType.ROB_PLAYER:
            break;
          case MoveType.TRANSACTION_WITH_BANK:
            checkTradeResourceWithBank(prevState, nextState, prevIdx);
            break;
          default:
            if (nextState.moveType !== MoveType.INIT && nextState.moveType !== MoveType.WIN) {
              throw new Error('Unidentified Move: ' + nextState.moveType);
            }
            break;
        }
        */
    }
    gameLogic.checkMoveOk = checkMoveOk;
})(gameLogic || (gameLogic = {}));
//# sourceMappingURL=gameLogic.js.map