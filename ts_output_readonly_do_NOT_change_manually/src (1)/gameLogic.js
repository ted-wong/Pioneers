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
    function assignRollNum(board) {
        var visited = [];
        for (var i = 0; i < gameLogic.ROWS; i++) {
            visited[i] = [];
            for (var j = 0; j < gameLogic.COLS; j++) {
                visited[i][j] = i === 0 || j === 0 || i === gameLogic.ROWS - 1 || j === gameLogic.COLS - 1;
            }
        }
        var dir = [
            [1, 0],
            [0, 1],
            [-1, 0],
            [0, -1] //left
        ];
        var r = 1;
        var c = 1;
        var tokenPtr = 0;
        var dirPtr = 0;
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
        var newTerrains = shuffleArray(terrains);
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
                    rollNum: -1,
                    harbor: assignHarbor(i, j),
                    hasRobber: label === Resource.Dust
                };
                board[i][j] = hex;
            }
        }
        return assignRollNum(board);
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
    function checkMoveOk(stateTransition) {
        var prevState = stateTransition.stateBeforeMove;
        var nextState = stateTransition.move.stateAfterMove;
        var prevIdx = nextState.moveType === MoveType.ROBBER_EVENT ?
            prevState.eventIdx : stateTransition.turnIndexBeforeMove;
        //TODO: What are these for, exactly?
        var nextIdx = stateTransition.move.turnIndexAfterMove;
        var delta = stateTransition.move.stateAfterMove.delta;
        if (nextState.moveType !== MoveType.INIT && nextState.moveType !== MoveType.WIN) {
            if (nextState.moveType >= MoveType.SIZE || validateHandlers[nextState.moveType] === null) {
                throw new Error('Unknown move!');
            }
            else {
                validateHandlers[nextState.moveType](prevState, nextState, prevIdx);
            }
        }
    }
    gameLogic.checkMoveOk = checkMoveOk;
    /**
     * create move logics
     */
    function countScores(state) {
        var scores = [];
        for (var i = 0; i < gameLogic.NUM_PLAYERS; i++) {
            scores[i] = 0;
        }
        for (var i = 0; i < gameLogic.NUM_PLAYERS; i++) {
            //Count scores from construction
            var player = state.players[i];
            for (var c = 0; c < Construction.SIZE; c++) {
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
    function onRollDice(move, turnIdx) {
        if (move.currState.diceRolled) {
            throw new Error('Dices already rolled!');
        }
        //TODO
        return null;
    }
    gameLogic.onRollDice = onRollDice;
    function onInitBuilding(move, turnIdx) {
        //TODO
        return null;
    }
    gameLogic.onInitBuilding = onInitBuilding;
    function onBuilding(move, turnIdx) {
        var buildingMove = move;
        //TODO
        return null;
    }
    gameLogic.onBuilding = onBuilding;
    function onKnight(move, turnIdx) {
        var stateBeforeMove = angular.copy(move.currState);
        stateBeforeMove.delta = null;
        if (stateBeforeMove.devCardsPlayed) {
            throw new Error('Already played development card!');
        }
        if (stateBeforeMove.players[move.playerIdx].devCards[DevCard.Knight] <= 0) {
            throw new Error('Doesn\'t have knight card on hand!');
        }
        var stateAfterMove = angular.copy(stateBeforeMove);
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
    gameLogic.onKnight = onKnight;
    function onMonopoly(move, turnIdx) {
        var monopolyMove = move;
        //TODO
        return null;
    }
    gameLogic.onMonopoly = onMonopoly;
    function onYearOfPlenty(move, turnIdx) {
        var yearOfPlentyMove = move;
        //TODO
        return null;
    }
    gameLogic.onYearOfPlenty = onYearOfPlenty;
    function onRobberEvent(move, turnIdx) {
        var robberEventMove = move;
        //TODO
        return null;
    }
    gameLogic.onRobberEvent = onRobberEvent;
    function onRobberMove(move, turnIdx) {
        var robberMove = move;
        //TODO
        return null;
    }
    gameLogic.onRobberMove = onRobberMove;
    function onRobPlayer(move, turnIdx) {
        var robPlayerMove = move;
        //TODO
        return null;
    }
    gameLogic.onRobPlayer = onRobPlayer;
    function onTradingWithBank(move, turnIdx) {
        var tradeWithBankMove = move;
        //TODO
        return null;
    }
    gameLogic.onTradingWithBank = onTradingWithBank;
    function onEndTurn(move, turnIdx) {
        var stateBeforeMove = angular.copy(move.currState);
        stateBeforeMove.delta = null;
        var scores = countScores(stateBeforeMove);
        var hasWinner = false;
        for (var i = 0; i < gameLogic.NUM_PLAYERS; i++) {
            if (scores[i] >= 10) {
                hasWinner = true;
                break;
            }
        }
        var stateAfterMove = angular.copy(stateBeforeMove);
        stateAfterMove.diceRolled = false;
        stateAfterMove.devCardsPlayed = false;
        stateAfterMove.moveType = hasWinner ? MoveType.WIN : MoveType.INIT;
        stateAfterMove.eventIdx = -1;
        stateAfterMove.building = null;
        stateAfterMove.delta = stateBeforeMove;
        return {
            endMatchScores: scores,
            turnIndexAfterMove: (turnIdx + 1) % gameLogic.NUM_PLAYERS,
            stateAfterMove: stateAfterMove
        };
    }
    gameLogic.onEndTurn = onEndTurn;
})(gameLogic || (gameLogic = {}));
//# sourceMappingURL=gameLogic.js.map