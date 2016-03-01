var gameLogic;
(function (gameLogic) {
    gameLogic.ROWS = 7;
    gameLogic.COLS = 7;
    gameLogic.NUM_PLAYERS = 4;
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
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
            devCards: getInitialArray(DevCard.SIZE),
            devCardsOrder: null
        };
        //Assign total size of resources/devCards in bank according to rules
        for (var i = 0; i < Resource.SIZE; i++) {
            bank.resources[i] = 19;
        }
        var devCardsOrder = [];
        for (var i = 0; i < DevCard.SIZE; i++) {
            switch (i) {
                case DevCard.Knight:
                    bank.devCards[i] = 14;
                    for (var _ = 0; _ < 14; _++) {
                        devCardsOrder.push(DevCard.Knight);
                    }
                    break;
                case DevCard.Monopoly:
                    bank.devCards[i] = 2;
                    for (var _ = 0; _ < 2; _++) {
                        devCardsOrder.push(DevCard.Monopoly);
                    }
                    break;
                case DevCard.RoadBuilding:
                    bank.devCards[i] = 2;
                    for (var _ = 0; _ < 2; _++) {
                        devCardsOrder.push(DevCard.RoadBuilding);
                    }
                    break;
                case DevCard.YearOfPlenty:
                    bank.devCards[i] = 2;
                    for (var _ = 0; _ < 2; _++) {
                        devCardsOrder.push(DevCard.YearOfPlenty);
                    }
                    break;
                case DevCard.VictoryPoint:
                    bank.devCards[i] = 5;
                    for (var _ = 0; _ < 5; _++) {
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
            moveType: MoveType.INIT_BUILD,
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
        checkInitBuild,
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
    function checkInitBuild(prevState, nextState, idx) {
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
        if (selling.item === Resource.Dust || buying.item === Resource.Dust) {
            throw new Error('Missing trading item!');
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
        var prevIdx = prevState.eventIdx === -1 ? prevState.eventIdx : stateTransition.turnIndexBeforeMove;
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
    function getStateBeforeMove(move) {
        var ret = angular.copy(move.currState);
        ret.delta = null;
        return ret;
    }
    function getStateAfterMove(move, stateBeforeMove) {
        var ret = angular.copy(move.currState);
        ret.delta = stateBeforeMove;
        return ret;
    }
    function onGameStart(move, turnIdx) {
        //TODO: A simple handler to set moveType to INIT so that game begins
        return null;
    }
    gameLogic.onGameStart = onGameStart;
    function onRollDice(move, turnIdx) {
        if (move.playerIdx !== turnIdx) {
            throw new Error('Not your turn to play!');
        }
        if (move.currState.diceRolled) {
            throw new Error('Dices already rolled!');
        }
        var stateBeforeMove = getStateBeforeMove(move);
        var stateAfterMove = getStateAfterMove(move, stateBeforeMove);
        stateAfterMove.moveType = MoveType.ROLL_DICE;
        //State transition
        stateAfterMove.diceRolled = true;
        stateAfterMove.dices[0] = getRandomInt(1, 7);
        stateAfterMove.dices[1] = getRandomInt(1, 7);
        var rollNum = stateAfterMove.dices[0] + stateAfterMove.dices[1];
        if (rollNum !== 7) {
            //State transition to resources production
            for (var i = 0; i < gameLogic.ROWS; i++) {
                for (var j = 0; j < gameLogic.COLS; j++) {
                    if (isSea(i, j) || stateBeforeMove.board[i][j].label === Resource.Dust ||
                        stateBeforeMove.board[i][j].hasRobber) {
                        continue;
                    }
                    for (var v = 0; v < stateBeforeMove.board[i][j].vertexOwner.length; v++) {
                        if (stateBeforeMove.board[i][j].vertexOwner[v] === -1) {
                            continue;
                        }
                        var owner = stateBeforeMove.board[i][j].vertexOwner[v];
                        var resourceInBank = stateBeforeMove.bank.resources[stateBeforeMove.board[i][j].label];
                        var toAdd = 0;
                        switch (stateBeforeMove.board[i][j].vertices[v]) {
                            case Construction.City:
                                toAdd = resourceInBank < 2 ? resourceInBank : 2;
                                break;
                            case Construction.Settlement:
                                toAdd = resourceInBank < 1 ? resourceInBank : 1;
                                break;
                            default:
                                break;
                        }
                        stateAfterMove.players[owner].resources[stateBeforeMove.board[i][j].label] += toAdd;
                        stateAfterMove.bank.resources[stateBeforeMove.board[i][j].label] -= toAdd;
                    }
                }
            }
        }
        else {
            //Robber event will start
            stateAfterMove.eventIdx = 0;
        }
        return {
            endMatchScores: countScores(stateAfterMove),
            turnIndexAfterMove: turnIdx,
            stateAfterMove: stateAfterMove
        };
    }
    gameLogic.onRollDice = onRollDice;
    function onInitBuilding(move, turnIdx) {
        var buildingMove = move;
        var playerIdx = buildingMove.playerIdx;
        if (playerIdx !== move.currState.eventIdx) {
            throw new Error('It\'s not your turn to build!');
        }
        var stateBeforeMove = getStateBeforeMove(move);
        var stateAfterMove = getStateAfterMove(move, stateBeforeMove);
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
        var player = stateAfterMove.players[playerIdx];
        if (player.construction[Construction.Settlement] === 1 && player.construction[Construction.Road] === 2) {
            stateAfterMove.eventIdx = (stateAfterMove.eventIdx + 1) % gameLogic.NUM_PLAYERS;
        }
        return {
            endMatchScores: countScores(stateAfterMove),
            turnIndexAfterMove: turnIdx,
            stateAfterMove: stateAfterMove
        };
    }
    gameLogic.onInitBuilding = onInitBuilding;
    function onBuilding(move, turnIdx) {
        var buildingMove = move;
        var playerIdx = buildingMove.playerIdx;
        if (playerIdx !== turnIdx) {
            throw new Error('It\'s not your turn!');
        }
        if (!move.currState.diceRolled) {
            throw new Error('Must roll the dices before construction!');
        }
        var stateBeforeMove = getStateBeforeMove(move);
        var stateAfterMove = getStateAfterMove(move, stateBeforeMove);
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
    gameLogic.onBuilding = onBuilding;
    function onKnight(move, turnIdx) {
        if (move.playerIdx !== turnIdx) {
            throw new Error('Not your turn to play!');
        }
        if (move.currState.devCardsPlayed) {
            throw new Error('Already played development card!');
        }
        if (move.currState.players[move.playerIdx].devCards[DevCard.Knight] <= 0) {
            throw new Error('Doesn\'t have knight card on hand!');
        }
        var stateBeforeMove = getStateBeforeMove(move);
        var stateAfterMove = getStateAfterMove(move, stateBeforeMove);
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
    gameLogic.onKnight = onKnight;
    function onMonopoly(move, turnIdx) {
        if (move.playerIdx !== turnIdx) {
            throw new Error('Not your turn to play!');
        }
        if (move.currState.devCardsPlayed) {
            throw new Error('Already played development card in this turn!');
        }
        if (move.currState.players[turnIdx].devCards[DevCard.Monopoly] <= 0) {
            throw new Error('No Monopoly card on hand!');
        }
        var monopolyMove = move;
        var stateBeforeMove = getStateBeforeMove(move);
        var stateAfterMove = getStateAfterMove(move, stateBeforeMove);
        stateAfterMove.moveType = MoveType.MONOPOLY;
        stateAfterMove.devCardsPlayed = true;
        //State transition to dev cards
        stateAfterMove.players[turnIdx].devCards[DevCard.Monopoly]--;
        stateAfterMove.bank.devCards[DevCard.Monopoly]++;
        stateAfterMove.bank.devCardsOrder.push(DevCard.Monopoly);
        //State transition to resource cards
        var numCards = 0;
        for (var p = 0; p < gameLogic.NUM_PLAYERS; p++) {
            if (p !== turnIdx) {
                var resources = stateAfterMove.players[p].resources[monopolyMove.target];
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
    gameLogic.onMonopoly = onMonopoly;
    function onYearOfPlenty(move, turnIdx) {
        if (move.playerIdx !== turnIdx) {
            throw new Error('Not your turn to play!');
        }
        if (move.currState.devCardsPlayed) {
            throw new Error('Already played development card in this turn!');
        }
        if (move.currState.players[turnIdx].devCards[DevCard.YearOfPlenty] <= 0) {
            throw new Error('No Year of Plenty card on hand!');
        }
        var yearOfPlentyMove = move;
        var stateBeforeMove = getStateBeforeMove(move);
        var stateAfterMove = getStateAfterMove(move, stateBeforeMove);
        stateAfterMove.moveType = MoveType.YEAR_OF_PLENTY;
        //State transition to dev cards
        stateAfterMove.players[turnIdx].devCards[DevCard.YearOfPlenty]--;
        stateAfterMove.bank.devCards[DevCard.YearOfPlenty]++;
        stateAfterMove.bank.devCardsOrder.push(DevCard.YearOfPlenty);
        //State transition to resources
        angular.forEach([yearOfPlentyMove.target1, yearOfPlentyMove.target2], function (tar) {
            if (stateAfterMove.bank.resources[tar] > 0) {
                stateAfterMove.players[turnIdx].resources[tar]++;
                stateAfterMove.bank.resources[tar]--;
            }
            else {
                throw new Error('Insufficient resources in bank: ' + Resource[tar]);
            }
        });
        return {
            endMatchScores: countScores(stateAfterMove),
            turnIndexAfterMove: turnIdx,
            stateAfterMove: stateAfterMove
        };
    }
    gameLogic.onYearOfPlenty = onYearOfPlenty;
    function onRobberEvent(move, turnIdx) {
        var robberEventMove = move;
        var stateBeforeMove = getStateBeforeMove(move);
        var stateAfterMove = getStateAfterMove(move, stateBeforeMove);
        stateAfterMove.moveType = MoveType.ROBBER_EVENT;
        var playerIdx = stateBeforeMove.eventIdx;
        var prevSum = 0;
        for (var i = 0; i < Resource.SIZE; i++) {
            prevSum += stateBeforeMove.players[playerIdx].resources[i];
        }
        if (prevSum > 7) {
            //State transition to toss resource cards
            for (var i = 0; i < Resource.SIZE; i++) {
                stateAfterMove.players[playerIdx].resources[i] -= robberEventMove.tossed[i];
                if (stateAfterMove.players[playerIdx].resources[i] < 0) {
                    throw new Error('Insufficient resource: ' + Resource[i]);
                }
            }
        }
        stateAfterMove.eventIdx = (stateAfterMove.eventIdx + 1) % gameLogic.NUM_PLAYERS;
        return {
            endMatchScores: countScores(stateAfterMove),
            turnIndexAfterMove: turnIdx,
            stateAfterMove: stateAfterMove
        };
    }
    gameLogic.onRobberEvent = onRobberEvent;
    function onRobberMove(move, turnIdx) {
        if (move.playerIdx !== turnIdx) {
            throw new Error('Not your turn to play!');
        }
        var robberMove = move;
        if (isSea(robberMove.row, robberMove.col)) {
            throw new Error('Cannot move robber to sea!');
        }
        var stateBeforeMove = getStateBeforeMove(move);
        var stateAfterMove = getStateAfterMove(move, stateBeforeMove);
        stateAfterMove.moveType = MoveType.ROBBER_MOVE;
        var robber = stateBeforeMove.robber;
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
    gameLogic.onRobberMove = onRobberMove;
    function onRobPlayer(move, turnIdx) {
        if (move.playerIdx !== turnIdx) {
            throw new Error('Not your turn to play!');
        }
        var robPlayerMove = move;
        if (robPlayerMove.stealingIdx !== turnIdx || robPlayerMove.stealingIdx === robPlayerMove.stolenIdx) {
            throw new Error('Invalid robbing action!');
        }
        var stateBeforeMove = getStateBeforeMove(move);
        var stateAfterMove = getStateAfterMove(move, stateBeforeMove);
        stateAfterMove.moveType = MoveType.ROB_PLAYER;
        var resourcesOnHand = [];
        for (var i = 0; i < Resource.SIZE; i++) {
            if (stateBeforeMove.players[robPlayerMove.stolenIdx].resources[i] > 0) {
                for (var _ = 0; _ < stateBeforeMove.players[robPlayerMove.stolenIdx].resources[i]; _++) {
                    resourcesOnHand.push(i);
                }
            }
        }
        //State transition to robbing
        resourcesOnHand = shuffleArray(resourcesOnHand);
        var idx = getRandomInt(0, resourcesOnHand.length);
        stateAfterMove.players[robPlayerMove.stealingIdx].resources[resourcesOnHand[idx]]++;
        stateAfterMove.players[robPlayerMove.stolenIdx].resources[resourcesOnHand[idx]]--;
        return {
            endMatchScores: countScores(stateAfterMove),
            turnIndexAfterMove: turnIdx,
            stateAfterMove: stateAfterMove
        };
    }
    gameLogic.onRobPlayer = onRobPlayer;
    function onTradingWithBank(move, turnIdx) {
        if (move.playerIdx !== turnIdx) {
            throw new Error('Not your turn to play!');
        }
        var tradeWithBankMove = move;
        var stateBeforeMove = getStateBeforeMove(move);
        var stateAfterMove = getStateAfterMove(move, stateBeforeMove);
        stateAfterMove.moveType = MoveType.TRANSACTION_WITH_BANK;
        if (!stateBeforeMove.diceRolled) {
            throw new Error('Need to roll dices first!');
        }
        //State transition to transaction
        stateAfterMove.players[turnIdx].resources[tradeWithBankMove.sellingItem] -= tradeWithBankMove.sellingNum;
        stateAfterMove.players[turnIdx].resources[tradeWithBankMove.buyingItem] += tradeWithBankMove.buyingNum;
        stateAfterMove.bank.resources[tradeWithBankMove.sellingItem] += tradeWithBankMove.sellingNum;
        stateAfterMove.bank.resources[tradeWithBankMove.buyingItem] -= tradeWithBankMove.buyingNum;
        if (stateAfterMove.players[turnIdx].resources[tradeWithBankMove.sellingItem] < 0) {
            throw new Error('Player has insufficient resources to trade!');
        }
        if (stateAfterMove.bank.resources[tradeWithBankMove.buyingItem] < 0) {
            throw new Error('Bank has insufficient resources to trade!');
        }
        return {
            endMatchScores: countScores(stateAfterMove),
            turnIndexAfterMove: turnIdx,
            stateAfterMove: stateAfterMove
        };
    }
    gameLogic.onTradingWithBank = onTradingWithBank;
    function onEndTurn(move, turnIdx) {
        if (move.playerIdx !== turnIdx) {
            throw new Error('Not your turn to play!');
        }
        if (!move.currState.diceRolled) {
            throw new Error('Must roll the dices!');
        }
        var stateBeforeMove = getStateBeforeMove(move);
        var scores = countScores(stateBeforeMove);
        var hasWinner = false;
        for (var i = 0; i < gameLogic.NUM_PLAYERS; i++) {
            if (scores[i] >= 10) {
                hasWinner = true;
                break;
            }
        }
        var stateAfterMove = getStateAfterMove(move, stateBeforeMove);
        stateAfterMove.diceRolled = false;
        stateAfterMove.devCardsPlayed = false;
        stateAfterMove.moveType = hasWinner ? MoveType.WIN : MoveType.INIT;
        stateAfterMove.eventIdx = -1;
        stateAfterMove.building = null;
        return {
            endMatchScores: scores,
            turnIndexAfterMove: (turnIdx + 1) % gameLogic.NUM_PLAYERS,
            stateAfterMove: stateAfterMove
        };
    }
    gameLogic.onEndTurn = onEndTurn;
})(gameLogic || (gameLogic = {}));
//# sourceMappingURL=gameLogic.js.map