var gameLogic;
(function (gameLogic) {
    gameLogic.ROWS = 7;
    gameLogic.COLS = 7;
    gameLogic.NUM_PLAYERS = 4;
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
    function test_func() {
        var is = getInitialState();
        return is.board[3][3].label;
    }
    gameLogic.test_func = test_func;
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
    gameLogic.isSea = isSea;
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
    function assignRollNum2(board) {
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
    gameLogic.getInitialBoard = getInitialBoard;
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
            eventIdx: 0,
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
        checkPlayDevCard,
        null,
        checkRobberEvent,
        checkRobberMove,
        checkRobPlayer,
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
                throw new Error('ERR_INIT_BUILD');
        }
    }
    function checkRollDice(prevState, nextState, idx) {
        if (prevState.diceRolled) {
            throw new Error('ERR_DICE_ROLLED');
        }
    }
    function checkResourcesToBuild(player, consType, bank) {
        if (!canAffordConstruction(player, consType)) {
            throw new Error('ERR_INSUFFICIENT_RESOURCE');
        }
        if (!hasSufficientConstructsToBuild(player, consType, bank)) {
            throw new Error('ERR_INSUFFICIENT_BUILDING');
        }
    }
    function checkBuildRoad(prevState, nextState, idx) {
        var building = nextState.building;
        var player = nextState.players[idx];
        if (!building.init) {
            checkResourcesToBuild(prevState.players[idx], Construction.Road, prevState.bank);
        }
        if (!canBuildRoadLegally(player, prevState.board, building.hexRow, building.hexCol, building.vertexOrEdge, building.init)) {
            throw new Error('ERR_ILLEGAL_BUILD');
        }
    }
    function checkBuildSettlement(prevState, nextState, idx) {
        var building = nextState.building;
        var player = nextState.players[idx];
        if (!building.init) {
            checkResourcesToBuild(prevState.players[idx], Construction.Settlement, prevState.bank);
        }
        if (!canBuildSettlementLegally(player, prevState.board, building.hexRow, building.hexCol, building.vertexOrEdge, building.init)) {
            throw new Error('ERR_ILLEGAL_BUILD');
        }
    }
    function checkBuildCity(prevState, nextState, idx) {
        checkResourcesToBuild(prevState.players[idx], Construction.City, prevState.bank);
        var building = nextState.building;
        var player = nextState.players[idx];
        if (!canUpgradeSettlement(player, prevState.board, building.hexRow, building.hexCol, building.vertexOrEdge)) {
            throw new Error('ERR_ILLEGAL_BUILD');
        }
    }
    function canBuildRoadLegally(player, board, row, col, edge, initial) {
        if (edge < 0 || edge > 5)
            return false;
        if (row < 0 || row > gameLogic.ROWS || col < 0 || col > gameLogic.COLS)
            return false;
        // edge must be empty - no other roads
        if (board[row][col].edges[edge] !== -1)
            return false;
        var adjHex = getHexAdjcentToEdge(row, col, edge);
        if (adjHex.length === 0)
            return false;
        // both hexes cannot be water
        if (board[row][col].label === Resource.Water && board[adjHex[0]][adjHex[1]].label === Resource.Water) {
            return false;
        }
        //    //If it's first build instruction during INIT_BUILD, just build it
        //    if (initial && player.construction.reduce(function(a, b) {return a + b;}) === 1) {
        //      return true;
        //    }
        // player owns adjacent road in current hex or adjacent road in adjacent hex
        if (board[row][col].edges[((edge + 1) % 6 + 6) % 6] === player.id ||
            board[row][col].edges[((edge - 1) % 6 + 6) % 6] === player.id ||
            board[adjHex[0]][adjHex[1]].edges[((edge + 3 + 1) % 6 + 6) % 6] === player.id ||
            board[adjHex[0]][adjHex[1]].edges[((edge + 3 - 1) % 6 + 6) % 6] === player.id) {
            // check if other player's settlement/city is inbetween existing road and proposed road
            // cannot build through player's settlement/city, even with connecting road
            // building CC on same hex
            if (board[row][col].edges[((edge + 1) % 6 + 6) % 6] === player.id &&
                ((board[row][col].vertices[edge] === Construction.Settlement ||
                    board[row][col].vertices[edge] === Construction.City) &&
                    board[row][col].vertexOwner[edge] !== player.id)) {
                return false;
            }
            // building CW on same hex
            if (board[row][col].edges[((edge - 1) % 6 + 6) % 6] === player.id &&
                ((board[row][col].vertices[((edge - 1) % 6 + 6) % 6] === Construction.Settlement ||
                    board[row][col].vertices[((edge - 1) % 6 + 6) % 6] === Construction.City) &&
                    board[row][col].vertexOwner[((edge - 1) % 6 + 6) % 6] !== player.id)) {
                return false;
            }
            // building CC on adj. hex
            if (board[adjHex[0]][adjHex[1]].edges[((edge + 3 - 1) % 6 + 6) % 6] === player.id &&
                ((board[row][col].vertices[edge] === Construction.Settlement ||
                    board[row][col].vertices[edge] === Construction.City) &&
                    board[row][col].vertexOwner[edge] !== player.id)) {
                return false;
            }
            // building CW on adj. hex
            if (board[adjHex[0]][adjHex[1]].edges[((edge + 3 + 1) % 6 + 6) % 6] === player.id &&
                ((board[row][col].vertices[((edge - 1) % 6 + 6) % 6] === Construction.Settlement ||
                    board[row][col].vertices[((edge - 1) % 6 + 6) % 6] === Construction.City) &&
                    board[row][col].vertexOwner[((edge - 1) % 6 + 6) % 6] !== player.id)) {
                return false;
            }
            return true;
        }
        /*
        if ((board[row][col].vertices[edge] === Construction.Settlement && board[row][col].vertexOwner[edge] === player.id) ||
          (board[row][col].vertices[(edge+1) % 6] === Construction.Settlement && board[row][col].vertexOwner[(edge+1) % 6] === player.id) ||
          (board[row][col].vertices[edge] === Construction.City && board[row][col].vertexOwner[edge] === player.id) ||
          (board[row][col].vertices[(edge+1) % 6] === Construction.City && board[row][col].vertexOwner[(edge+1) % 6] === player.id))
          return true;
        */
        if (board[row][col].vertexOwner[edge] === player.id || board[row][col].vertexOwner[(edge + 5) % 6] === player.id) {
            return true;
        }
        return false;
    }
    gameLogic.canBuildRoadLegally = canBuildRoadLegally;
    function canBuildSettlementLegally(player, board, row, col, vertex, initial) {
        if (vertex < 0 || vertex > 5)
            return false;
        if (row < 0 || row >= gameLogic.ROWS || col < 0 || col >= gameLogic.COLS)
            return false;
        // proposed vertex must be empty - no other settlement/city
        if (board[row][col].vertices[vertex] !== -1)
            return false;
        // TODO: is Water sufficient with "ANY" being allowed?
        var has_land = false;
        if (board[row][col].label != Resource.Water)
            has_land = true;
        var hexes = getHexesAdjacentToVertex(row, col, vertex);
        for (var i = 0; i < hexes.length; i++) {
            if (hexes[i] === null)
                continue;
            if (board[hexes[i][0]][hexes[i][1]].label != Resource.Water)
                has_land = true;
        }
        if (has_land === false)
            return false;
        // new settlement has to be 2+ vertices away from another settlement/city
        if (hasNearbyConstruct(board, row, col, vertex))
            return false;
        for (var i = 0; i < hexes.length; i++) {
            if (hexes[i] === null)
                continue;
            if (hasNearbyConstruct(board, hexes[i][0], hexes[i][1], hexes[i][2]))
                return false;
        }
        //If it's during init build and it's first building, just do it
        if (initial) {
            return true;
        }
        // needs adjacent road to build
        if (!hasAdjacentRoad(player, board, row, col, vertex)) {
            return false;
        }
        return true;
    }
    gameLogic.canBuildSettlementLegally = canBuildSettlementLegally;
    function canUpgradeSettlement(player, board, row, col, vertex) {
        if (vertex < 0 || vertex > 5)
            return false;
        if (row < 0 || row >= gameLogic.ROWS || col < 0 || col >= gameLogic.COLS)
            return false;
        // proposed vertex must be empty - no other settlement/city
        if (board[row][col].vertices[vertex] === Construction.Settlement &&
            board[row][col].vertexOwner[vertex] === player.id)
            return true;
        return false;
    }
    gameLogic.canUpgradeSettlement = canUpgradeSettlement;
    /**
    * XXX: Assuming UI will disable this feature when bank has no dev cards
    */
    function checkBuildDevCards(prevState, nextState, idx) {
        if (!prevState.diceRolled) {
            throw new Error('ERR_DICE_NOT_ROLLED');
        }
        checkResources(nextState.players[idx].resources);
    }
    function checkPlayDevCard(prevState, nextState, idx) {
        if (prevState.devCardsPlayed) {
            throw new Error('ERR_DEV_CARD_PLAYED');
        }
        //Check when playing year of plenty
        try {
            checkResources(nextState.bank.resources);
        }
        catch (e) {
            throw new Error('ERR_INSUFFICIENT_RESOURCE_IN_BANK');
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
            throw new Error('ERR_TOSS_CARDS_NOT_ENOUGH');
        }
    }
    function checkRobberMove(prevState, nextState, idx) {
        if (angular.equals(prevState.robber, nextState.robber)) {
            throw new Error('ERR_NEED_TO_MOVE_ROBBER');
        }
    }
    function checkResources(resources) {
        for (var i = 0; i < Resource.SIZE; i++) {
            if (resources[i] < 0) {
                throw new Error('ERR_INSUFFICIENT_RESOURCE');
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
    function checkRobPlayer(prevState, nextState, idx) {
        var stealing = { player: -1, item: Resource.Dust, num: 0 };
        var stolen = { player: -1, item: Resource.Dust, num: 0 };
        for (var p = 0; p < gameLogic.NUM_PLAYERS; p++) {
            for (var r = 0; r < Resource.SIZE; r++) {
                var diff = nextState.players[p].resources[r] - prevState.players[p].resources[r];
                if (diff < 0) {
                    //Stolen scenario
                    if (stolen.player !== -1 || stolen.item !== Resource.Dust) {
                        throw new Error('ERR_STEAL_MORE_THAN_ONE_PLAYERS');
                    }
                    stolen = { player: p, item: r, num: -diff };
                }
                if (diff > 0) {
                    //Stealing scenario
                    if (stealing.player !== -1 || stealing.item !== Resource.Dust) {
                        throw new Error('ERR_STEAL_MORE_THAN_ONCE');
                    }
                    stealing = { player: p, item: r, num: diff };
                }
            }
        }
        if (stealing.player !== idx) {
            throw new Error('ERR_NOT_YOU_TO_STEAL');
        }
        if (stealing.player === stolen.player) {
            throw new Error('ERR_STEAL_SELF');
        }
        if (stealing.item !== stolen.item) {
            throw new Error('ERR_STEAL_ITEM_NO_MATCH');
        }
        if (stealing.item === Resource.Dust) {
            throw new Error('ERR_STEAL_NOTHING');
        }
        if (stealing.num !== stolen.num) {
            throw new Error('ERR_STEAL_NUMBER_NO_MATCH');
        }
        if (stealing.num !== 1) {
            throw new Error('ERR_STEAL_MORE_THAN_ONE_RESOURCE');
        }
        checkResources(nextState.players[stealing.player].resources);
        checkResources(nextState.players[stolen.player].resources);
    }
    function checkTradeResourceWithBank(prevState, nextState, idx) {
        if (!prevState.diceRolled) {
            throw new Error('ERR_DICE_NOT_ROLLED');
        }
        var selling = { item: Resource.Dust, num: 0 };
        var buying = { item: Resource.Dust, num: 0 };
        checkResources(nextState.players[idx].resources);
        for (var i = 0; i < Resource.SIZE; i++) {
            if (nextState.players[idx].resources[i] < prevState.players[idx].resources[i]) {
                if (selling.item !== Resource.Dust) {
                    throw new Error('ERR_DIFF_RESOURCE_ON_TRADING');
                }
                selling = {
                    item: i,
                    num: prevState.players[idx].resources[i] - nextState.players[idx].resources[i]
                };
            }
            if (nextState.players[idx].resources[i] > prevState.players[idx].resources[i]) {
                if (buying.item !== Resource.Dust) {
                    throw new Error('ERR_TRADE_MORE_THAN_ONE_RESOURCE');
                }
                buying = {
                    item: i,
                    num: nextState.players[idx].resources[i] - prevState.players[idx].resources[i]
                };
            }
        }
        if (selling.item === Resource.Dust || buying.item === Resource.Dust) {
            throw new Error('ERR_MISSING_TRADING_ITEM');
        }
        if (selling.item === buying.item) {
            throw new Error('ERR_TRADING_SAME_RESOURCE');
        }
        if (buying.num * findTradingRatio(nextState.board, buying.item, idx) !== selling.num) {
            throw new Error('ERR_WRONG_TRADING_RATIO');
        }
    }
    function checkMoveOk(stateTransition) {
        var prevState = stateTransition.stateBeforeMove ? stateTransition.stateBeforeMove : getInitialState();
        var nextState = stateTransition.move.stateAfterMove;
        var prevIdx = prevState.eventIdx !== -1 ? prevState.eventIdx : stateTransition.turnIndexBeforeMove;
        //TODO: What are these for, exactly?
        var nextIdx = stateTransition.move.turnIndexAfterMove;
        var delta = stateTransition.move.stateAfterMove.delta;
        if (nextState.moveType !== MoveType.INIT && nextState.moveType !== MoveType.WIN) {
            if (nextState.moveType >= MoveType.SIZE || validateHandlers[nextState.moveType] === null) {
                throw new Error('UNKNOWN_MOVE');
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
            scores[i] += 1 * player.construction[Construction.Settlement];
            scores[i] += 2 * player.construction[Construction.City];
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
        ret.eventIdx = -1;
        ret.building = null;
        ret.delta = stateBeforeMove;
        return ret;
    }
    function onGameStart(move, turnIdx) {
        if (move.playerIdx !== turnIdx) {
            throw new Error('ERR_NOT_YOUR_TURN');
        }
        var stateBeforeMove = getStateBeforeMove(move);
        if (stateBeforeMove.eventIdx !== 0) {
            throw new Error('ERR_INIT_BUILD_NOT_FINISHED');
        }
        if (stateBeforeMove.moveType !== MoveType.INIT_BUILD) {
            throw new Error('UNKNOWN_MOVE');
        }
        var stateAfterMove = getStateAfterMove(move, stateBeforeMove);
        stateAfterMove.moveType = MoveType.INIT;
        return {
            endMatchScores: null,
            turnIndexAfterMove: 0,
            stateAfterMove: stateAfterMove
        };
    }
    gameLogic.onGameStart = onGameStart;
    function onRollDice(move, turnIdx) {
        if (move.playerIdx !== turnIdx) {
            throw new Error('ERR_NOT_YOUR_TURN');
        }
        if (move.currState.diceRolled) {
            throw new Error('ERR_DICE_ROLLED');
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
            for (var pIndex = turnIdx; pIndex < turnIdx + gameLogic.NUM_PLAYERS; pIndex++) {
                var playerIndex = pIndex % gameLogic.NUM_PLAYERS;
                for (var i = 0; i < gameLogic.ROWS; i++) {
                    for (var j = 0; j < gameLogic.COLS; j++) {
                        if (isSea(i, j) || stateBeforeMove.board[i][j].label === Resource.Dust ||
                            stateBeforeMove.board[i][j].hasRobber || stateBeforeMove.board[i][j].rollNum !== rollNum) {
                            continue;
                        }
                        for (var v = 0; v < stateBeforeMove.board[i][j].vertexOwner.length; v++) {
                            if (stateBeforeMove.board[i][j].vertexOwner[v] !== playerIndex) {
                                continue;
                            }
                            var resourceInBank = stateBeforeMove.bank.resources[stateBeforeMove.board[i][j].label];
                            var toAdd = 0;
                            switch (stateBeforeMove.board[i][j].vertices[v]) {
                                case Construction.City:
                                    toAdd = resourceInBank < 2 ? resourceInBank : 2;
                                    break;
                                case Construction.Settlement:
                                    toAdd = resourceInBank < 1 ? resourceInBank : 1;
                                    break;
                            }
                            stateAfterMove.players[playerIndex].resources[stateBeforeMove.board[i][j].label] += toAdd;
                            stateAfterMove.bank.resources[stateBeforeMove.board[i][j].label] -= toAdd;
                        }
                    }
                }
            }
        }
        else {
            //Robber event will start
            stateAfterMove.eventIdx = turnIdx;
        }
        return {
            endMatchScores: null,
            turnIndexAfterMove: turnIdx,
            stateAfterMove: stateAfterMove
        };
    }
    gameLogic.onRollDice = onRollDice;
    function onInitBuilding(move, turnIdx) {
        var buildingMove = move;
        var playerIdx = buildingMove.playerIdx;
        if (playerIdx !== move.currState.eventIdx) {
            throw new Error('ERR_NOT_YOUR_TURN');
        }
        var stateBeforeMove = getStateBeforeMove(move);
        var stateAfterMove = getStateAfterMove(move, stateBeforeMove);
        stateAfterMove.moveType = MoveType.INIT_BUILD;
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
                    throw new Error('ERR_INIT_BUILD');
                }
                if (stateAfterMove.board[buildingMove.hexRow][buildingMove.hexCol].edges[buildingMove.vertexOrEdge] !== -1) {
                    throw new Error('ERR_ILLEGAL_BUILD');
                }
                stateAfterMove.building.consType = Construction.Road;
                stateAfterMove.board = getNextStateToBuild(stateAfterMove.board, buildingMove);
                stateAfterMove.players[playerIdx].construction[Construction.Road]++;
                break;
            case Construction.Settlement:
                if (move.currState.players[playerIdx].construction[Construction.Settlement] >= 2) {
                    throw new Error('ERR_INIT_BUILD');
                }
                stateAfterMove.building.consType = Construction.Settlement;
                stateAfterMove.board = getNextStateToBuild(stateAfterMove.board, buildingMove);
                stateAfterMove.players[playerIdx].construction[Construction.Settlement]++;
                break;
            default:
                throw new Error('ERR_INIT_BUILD');
        }
        //Update eventIdx - does circle back for 2 rounds of settlement/road building
        var player = stateAfterMove.players[playerIdx];
        if (player.construction[Construction.Settlement] === 1 && player.construction[Construction.Road] === 0) {
            stateAfterMove.eventIdx = stateBeforeMove.eventIdx;
        }
        else if (player.construction[Construction.Settlement] === 1 && player.construction[Construction.Road] === 1) {
            if (playerIdx === gameLogic.NUM_PLAYERS - 1)
                stateAfterMove.eventIdx = stateBeforeMove.eventIdx;
            else
                stateAfterMove.eventIdx = stateBeforeMove.eventIdx + 1;
        }
        else if (player.construction[Construction.Settlement] === 2 && player.construction[Construction.Road] === 1) {
            // assign resources based on second settlement
            var hexes = getHexesAdjacentToVertex(buildingMove.hexRow, buildingMove.hexCol, buildingMove.vertexOrEdge);
            var resource = stateAfterMove.board[buildingMove.hexRow][buildingMove.hexCol].label;
            if (resource < Resource.SIZE) {
                stateAfterMove.players[playerIdx].resources[resource]++;
                stateAfterMove.bank.resources[resource]--;
            }
            for (var i = 0; i < hexes.length; i++) {
                var resource_1 = stateAfterMove.board[hexes[i][0]][hexes[i][1]].label;
                if (resource_1 < Resource.SIZE) {
                    stateAfterMove.players[playerIdx].resources[resource_1]++;
                    stateAfterMove.bank.resources[resource_1]--;
                }
            }
            stateAfterMove.eventIdx = stateBeforeMove.eventIdx;
        }
        else if (player.construction[Construction.Settlement] === 2 && player.construction[Construction.Road] === 2) {
            if (playerIdx === 0)
                stateAfterMove.eventIdx = stateBeforeMove.eventIdx;
            else
                stateAfterMove.eventIdx = stateBeforeMove.eventIdx - 1;
        }
        else {
            stateAfterMove.eventIdx = stateBeforeMove.eventIdx;
        }
        stateAfterMove.players[playerIdx].points = countScores(stateAfterMove)[playerIdx];
        stateAfterMove.players[playerIdx].points -= stateAfterMove.players[playerIdx].devCards[DevCard.VictoryPoint];
        return {
            endMatchScores: null,
            turnIndexAfterMove: turnIdx,
            stateAfterMove: stateAfterMove
        };
    }
    gameLogic.onInitBuilding = onInitBuilding;
    function onBuilding(move, turnIdx) {
        var buildingMove = move;
        var playerIdx = buildingMove.playerIdx;
        if (playerIdx !== turnIdx) {
            throw new Error('ERR_NOT_YOUR_TURN');
        }
        if (!move.currState.diceRolled) {
            throw new Error('ERR_DICE_NOT_ROLLED');
        }
        var stateBeforeMove = getStateBeforeMove(move);
        var stateAfterMove = getStateAfterMove(move, stateBeforeMove);
        stateAfterMove.players[playerIdx].construction[buildingMove.consType]++;
        if (buildingMove.consType === Construction.City)
            stateAfterMove.players[playerIdx].construction[Construction.Settlement]--;
        stateAfterMove.building = {
            consType: buildingMove.consType,
            hexRow: buildingMove.hexRow,
            hexCol: buildingMove.hexCol,
            vertexOrEdge: buildingMove.vertexOrEdge,
            init: false
        };
        var player = null;
        switch (buildingMove.consType) {
            case Construction.Road:
                stateAfterMove.moveType = MoveType.BUILD_ROAD;
                if (move.currState.board[buildingMove.hexRow][buildingMove.hexCol].edges[buildingMove.vertexOrEdge] !== -1) {
                    throw new Error('ERR_ILLEGAL_BUILD');
                }
                if (!canAffordConstruction(stateAfterMove.players[playerIdx], Construction.Road)) {
                    throw new Error('ERR_INSUFFICIENT_RESOURCE');
                }
                if (stateAfterMove.players[playerIdx].construction[Construction.Road] >= 15) {
                    throw new Error('ERR_INSUFFICIENT_BUILDING');
                }
                stateAfterMove.board = getNextStateToBuild(stateAfterMove.board, buildingMove);
                stateAfterMove.board[buildingMove.hexRow][buildingMove.hexCol].edges[buildingMove.vertexOrEdge] = playerIdx;
                stateAfterMove.players[playerIdx].resources[Resource.Brick]--;
                stateAfterMove.players[playerIdx].resources[Resource.Lumber]--;
                stateAfterMove.bank.resources[Resource.Brick]++;
                stateAfterMove.bank.resources[Resource.Lumber]++;
                break;
            case Construction.Settlement:
                stateAfterMove.moveType = MoveType.BUILD_SETTLEMENT;
                if (move.currState.board[buildingMove.hexRow][buildingMove.hexCol].vertexOwner[buildingMove.vertexOrEdge] !== -1) {
                    throw new Error('ERR_ILLEGAL_BUILD');
                }
                player = stateAfterMove.players[playerIdx];
                if (!canAffordConstruction(stateAfterMove.players[playerIdx], Construction.Settlement)) {
                    throw new Error('ERR_INSUFFICIENT_RESOURCE');
                }
                stateAfterMove.board = getNextStateToBuild(stateAfterMove.board, buildingMove);
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
                    throw new Error('ERR_ILLEGAL_BUILD');
                }
                player = stateAfterMove.players[playerIdx];
                if (!canAffordConstruction(stateAfterMove.players[playerIdx], Construction.City)) {
                    throw new Error('ERR_INSUFFICIENT_RESOURCE');
                }
                stateAfterMove.board = getNextStateToBuild(stateAfterMove.board, buildingMove);
                stateAfterMove.players[playerIdx].resources[Resource.Ore] -= 3;
                stateAfterMove.players[playerIdx].resources[Resource.Grain] -= 2;
                stateAfterMove.bank.resources[Resource.Ore] += 3;
                stateAfterMove.bank.resources[Resource.Grain] += 2;
                break;
            case Construction.DevCard:
                if (move.currState.bank.devCardsOrder.length <= 0) {
                    throw new Error('ERR_INSUFFICIENT_DEVCARD_IN_BANK');
                }
                player = stateAfterMove.players[playerIdx];
                if (!canAffordConstruction(stateAfterMove.players[playerIdx], Construction.DevCard)) {
                    throw new Error('ERR_INSUFFICIENT_RESOURCE');
                }
                //State transition to devCards
                stateAfterMove.moveType = MoveType.BUILD_DEVCARD;
                stateAfterMove.players[playerIdx].devCards[move.currState.bank.devCardsOrder[0]]++;
                stateAfterMove.bank.devCards[move.currState.bank.devCardsOrder[0]]--;
                stateAfterMove.bank.devCardsOrder.splice(0, 1);
                //State transition to resources
                stateAfterMove.players[playerIdx].resources[Resource.Ore]--;
                stateAfterMove.players[playerIdx].resources[Resource.Wool]--;
                stateAfterMove.players[playerIdx].resources[Resource.Grain]--;
                stateAfterMove.bank.resources[Resource.Ore]++;
                stateAfterMove.bank.resources[Resource.Wool]++;
                stateAfterMove.bank.resources[Resource.Grain]++;
                break;
            default:
                throw new Error('ERR_ILLEGAL_BUILD');
        }
        stateAfterMove.players[playerIdx].points = countScores(stateAfterMove)[playerIdx];
        stateAfterMove.players[playerIdx].points -= stateAfterMove.players[playerIdx].devCards[DevCard.VictoryPoint];
        return {
            endMatchScores: null,
            turnIndexAfterMove: turnIdx,
            stateAfterMove: stateAfterMove
        };
    }
    gameLogic.onBuilding = onBuilding;
    function onKnight(move, turnIdx) {
        if (move.playerIdx !== turnIdx) {
            throw new Error('ERR_NOT_YOUR_TURN');
        }
        if (move.currState.devCardsPlayed) {
            throw new Error('ERR_DEV_CARD_PLAYED');
        }
        if (move.currState.players[move.playerIdx].devCards[DevCard.Knight] <= 0) {
            throw new Error('ERR_NO_KNIGHT_ON_HAND');
        }
        var stateBeforeMove = getStateBeforeMove(move);
        var stateAfterMove = getStateAfterMove(move, stateBeforeMove);
        stateAfterMove.devCardsPlayed = true;
        stateAfterMove.moveType = MoveType.KNIGHT;
        //State transition to knight cards
        stateAfterMove.players[move.playerIdx].knightsPlayed++;
        stateAfterMove.players[move.playerIdx].devCards[DevCard.Knight]--;
        if (stateAfterMove.players[move.playerIdx].knightsPlayed > stateBeforeMove.awards.largestArmy.num) {
            stateAfterMove.awards.largestArmy = {
                player: move.playerIdx,
                num: stateAfterMove.players[move.playerIdx].knightsPlayed
            };
        }
        stateAfterMove.players[move.playerIdx].points = countScores(stateAfterMove)[move.playerIdx];
        stateAfterMove.players[move.playerIdx].points -= stateAfterMove.players[move.playerIdx].devCards[DevCard.VictoryPoint];
        return {
            endMatchScores: null,
            turnIndexAfterMove: turnIdx,
            stateAfterMove: stateAfterMove
        };
    }
    gameLogic.onKnight = onKnight;
    function onMonopoly(move, turnIdx) {
        if (move.playerIdx !== turnIdx) {
            throw new Error('ERR_NOT_YOUR_TURN');
        }
        if (move.currState.devCardsPlayed) {
            throw new Error('ERR_DEV_CARD_PLAYED');
        }
        if (move.currState.players[turnIdx].devCards[DevCard.Monopoly] <= 0) {
            throw new Error('ERR_NO_MONOPOLY_ON_HAND');
        }
        var monopolyMove = move;
        var stateBeforeMove = getStateBeforeMove(move);
        var stateAfterMove = getStateAfterMove(move, stateBeforeMove);
        stateAfterMove.moveType = MoveType.MONOPOLY;
        stateAfterMove.devCardsPlayed = true;
        //State transition to dev cards
        stateAfterMove.players[turnIdx].devCards[DevCard.Monopoly]--;
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
            endMatchScores: null,
            turnIndexAfterMove: turnIdx,
            stateAfterMove: stateAfterMove
        };
    }
    gameLogic.onMonopoly = onMonopoly;
    function onRoadBuilding(move, turnIdx) {
        if (move.playerIdx !== turnIdx) {
            throw new Error('ERR_NOT_YOUR_TURN');
        }
        if (move.currState.devCardsPlayed) {
            throw new Error('ERR_DEV_CARD_PLAYED');
        }
        if (move.currState.players[turnIdx].devCards[DevCard.RoadBuilding] <= 0) {
            throw new Error('ERR_NO_ROAD_BUILDING_ON_HAND');
        }
        var roadBuildMove = move;
        var stateBeforeMove = getStateBeforeMove(move);
        var stateAfterMove = getStateAfterMove(move, stateBeforeMove);
        stateAfterMove.moveType = MoveType.ROAD_BUILDING;
        stateAfterMove.devCardsPlayed = true;
        //State transition to dev cards
        stateAfterMove.players[turnIdx].devCards[DevCard.RoadBuilding]--;
        //State transition to roads and check if road can be legally built
        if (!canBuildRoadLegally(stateAfterMove.players[turnIdx], stateAfterMove.board, roadBuildMove.road1.hexRow, roadBuildMove.road1.hexCol, roadBuildMove.road1.vertexOrEdge, true) &&
            !canBuildRoadLegally(stateAfterMove.players[turnIdx], stateAfterMove.board, roadBuildMove.road2.hexRow, roadBuildMove.road2.hexCol, roadBuildMove.road2.vertexOrEdge, true)) {
            throw new Error('ERR_ILLEGAL_BUILD');
        }
        var road1Legal = canBuildRoadLegally(stateAfterMove.players[turnIdx], stateAfterMove.board, roadBuildMove.road1.hexRow, roadBuildMove.road1.hexCol, roadBuildMove.road1.vertexOrEdge, true);
        var tempBoard = road1Legal ? getNextStateToBuild(stateAfterMove.board, roadBuildMove.road1) :
            getNextStateToBuild(stateAfterMove.board, roadBuildMove.road2);
        if (road1Legal) {
            if (!canBuildRoadLegally(stateAfterMove.players[turnIdx], tempBoard, roadBuildMove.road2.hexRow, roadBuildMove.road2.hexCol, roadBuildMove.road2.vertexOrEdge, true)) {
                throw new Error('ERR_ILLEGAL_BUILD');
            }
            stateAfterMove.board = getNextStateToBuild(tempBoard, roadBuildMove.road2);
        }
        else {
            if (!canBuildRoadLegally(stateAfterMove.players[turnIdx], tempBoard, roadBuildMove.road1.hexRow, roadBuildMove.road1.hexCol, roadBuildMove.road1.vertexOrEdge, true)) {
                throw new Error('ERR_ILLEGAL_BUILD');
            }
            stateAfterMove.board = getNextStateToBuild(tempBoard, roadBuildMove.road1);
        }
        //State transition to players and possibly awards
        stateAfterMove.players[turnIdx].construction[Construction.Road] += 2;
        if (stateAfterMove.players[turnIdx].construction[Construction.Road] > stateBeforeMove.awards.longestRoad.length) {
            stateAfterMove.awards.longestRoad = {
                player: turnIdx,
                length: stateAfterMove.players[turnIdx].construction[Construction.Road]
            };
        }
        stateAfterMove.players[turnIdx].points = countScores(stateAfterMove)[turnIdx];
        stateAfterMove.players[turnIdx].points -= stateAfterMove.players[turnIdx].devCards[DevCard.VictoryPoint];
        return {
            endMatchScores: null,
            turnIndexAfterMove: turnIdx,
            stateAfterMove: stateAfterMove
        };
    }
    gameLogic.onRoadBuilding = onRoadBuilding;
    function onYearOfPlenty(move, turnIdx) {
        if (move.playerIdx !== turnIdx) {
            throw new Error('ERR_NOT_YOUR_TURN');
        }
        if (move.currState.devCardsPlayed) {
            throw new Error('ERR_DEV_CARD_PLAYED');
        }
        if (move.currState.players[turnIdx].devCards[DevCard.YearOfPlenty] <= 0) {
            throw new Error('ERR_NO_YEAR_OF_PLENTY_ON_HAND');
        }
        var yearOfPlentyMove = move;
        if (yearOfPlentyMove.target.reduce(function (a, b) { return a + b; }) !== 2) {
            throw new Error('ERR_MUST_CHOOSE_TWO_RESOURCE');
        }
        angular.forEach(yearOfPlentyMove.target, function (r) {
            if (r < 0) {
                throw new Error('ERR_DUMP_RESOURCES');
            }
        });
        var stateBeforeMove = getStateBeforeMove(move);
        var stateAfterMove = getStateAfterMove(move, stateBeforeMove);
        stateAfterMove.moveType = MoveType.YEAR_OF_PLENTY;
        //State transition to dev cards
        stateAfterMove.players[turnIdx].devCards[DevCard.YearOfPlenty]--;
        //State transition to resources
        for (var i = 0; i < Resource.SIZE; i++) {
            stateAfterMove.players[turnIdx].resources[i] += yearOfPlentyMove.target[i];
            stateAfterMove.bank.resources[i] -= yearOfPlentyMove.target[i];
            if (stateAfterMove.bank.resources[i] < 0) {
                throw new Error('ERR_INSUFFICIENT_RESOURCE_IN_BANK');
            }
        }
        return {
            endMatchScores: null,
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
                if (robberEventMove.tossed[i] < 0) {
                    throw new Error('ERR_DUMP_NEGATIVE_RESOURCE');
                }
                stateAfterMove.players[playerIdx].resources[i] -= robberEventMove.tossed[i];
                if (stateAfterMove.players[playerIdx].resources[i] < 0) {
                    throw new Error('ERR_INSUFFICIENT_RESOURCE');
                }
            }
        }
        stateAfterMove.eventIdx = (stateBeforeMove.eventIdx + 1) % gameLogic.NUM_PLAYERS;
        return {
            endMatchScores: null,
            turnIndexAfterMove: turnIdx,
            stateAfterMove: stateAfterMove
        };
    }
    gameLogic.onRobberEvent = onRobberEvent;
    function onRobberMove(move, turnIdx) {
        if (move.playerIdx !== turnIdx) {
            throw new Error('ERR_NOT_YOUR_TURN');
        }
        var robberMove = move;
        if (isSea(robberMove.row, robberMove.col)) {
            throw new Error('ERR_INVALID_PLACE_FOR_ROBBER');
        }
        var stateBeforeMove = getStateBeforeMove(move);
        var stateAfterMove = getStateAfterMove(move, stateBeforeMove);
        stateAfterMove.moveType = MoveType.ROBBER_MOVE;
        var robber = stateBeforeMove.robber;
        if (robber.row === robberMove.row && robber.col === robberMove.col) {
            throw new Error('ERR_INVALID_PLACE_FOR_ROBBER');
        }
        //State transition to robber
        stateAfterMove.board[robber.row][robber.col].hasRobber = false;
        stateAfterMove.board[robberMove.row][robberMove.col].hasRobber = true;
        stateAfterMove.robber.row = robberMove.row;
        stateAfterMove.robber.col = robberMove.col;
        return {
            endMatchScores: null,
            turnIndexAfterMove: turnIdx,
            stateAfterMove: stateAfterMove
        };
    }
    gameLogic.onRobberMove = onRobberMove;
    function onRobPlayer(move, turnIdx) {
        if (move.playerIdx !== turnIdx) {
            throw new Error('ERR_NOT_YOUR_TURN');
        }
        var robPlayerMove = move;
        if (robPlayerMove.stealingIdx !== turnIdx || robPlayerMove.stealingIdx === robPlayerMove.stolenIdx) {
            throw new Error('ERR_INVALID_ROBBING_MOVE');
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
            endMatchScores: null,
            turnIndexAfterMove: turnIdx,
            stateAfterMove: stateAfterMove
        };
    }
    gameLogic.onRobPlayer = onRobPlayer;
    function onTradingWithBank(move, turnIdx) {
        if (move.playerIdx !== turnIdx) {
            throw new Error('ERR_NOT_YOUR_TURN');
        }
        var tradeWithBankMove = move;
        var stateBeforeMove = getStateBeforeMove(move);
        var stateAfterMove = getStateAfterMove(move, stateBeforeMove);
        stateAfterMove.moveType = MoveType.TRANSACTION_WITH_BANK;
        if (!stateBeforeMove.diceRolled) {
            throw new Error('ERR_DICE_NOT_ROLLED');
        }
        //State transition to transaction
        stateAfterMove.players[turnIdx].resources[tradeWithBankMove.sellingItem] -= tradeWithBankMove.sellingNum;
        stateAfterMove.players[turnIdx].resources[tradeWithBankMove.buyingItem] += tradeWithBankMove.buyingNum;
        stateAfterMove.bank.resources[tradeWithBankMove.sellingItem] += tradeWithBankMove.sellingNum;
        stateAfterMove.bank.resources[tradeWithBankMove.buyingItem] -= tradeWithBankMove.buyingNum;
        if (stateAfterMove.players[turnIdx].resources[tradeWithBankMove.sellingItem] < 0) {
            throw new Error('ERR_INSUFFICIENT_RESOURCE');
        }
        if (stateAfterMove.bank.resources[tradeWithBankMove.buyingItem] < 0) {
            throw new Error('ERR_INSUFFICIENT_RESOURCE_IN_BANK');
        }
        return {
            endMatchScores: null,
            turnIndexAfterMove: turnIdx,
            stateAfterMove: stateAfterMove
        };
    }
    gameLogic.onTradingWithBank = onTradingWithBank;
    function onEndTurn(move, turnIdx) {
        if (move.playerIdx !== turnIdx) {
            throw new Error('ERR_NOT_YOUR_TURN');
        }
        if (!move.currState.diceRolled) {
            throw new Error('ERR_DICE_NOT_ROLLED');
        }
        var stateBeforeMove = getStateBeforeMove(move);
        // lowering road length if current player affected other players' longest road
        // can happen by building road to get longest, or by building settlement to break other person's road
        for (var i = turnIdx; i < turnIdx + gameLogic.NUM_PLAYERS; i++) {
            var j = i % gameLogic.NUM_PLAYERS;
            if (stateBeforeMove.awards.longestRoad.player === j &&
                getLongestRoad(stateBeforeMove.players[j], stateBeforeMove.board) < stateBeforeMove.awards.longestRoad.length) {
                if (getLongestRoad(stateBeforeMove.players[j], stateBeforeMove.board) >= 5) {
                    stateBeforeMove.awards.longestRoad = {
                        player: j,
                        length: getLongestRoad(stateBeforeMove.players[j], stateBeforeMove.board)
                    };
                }
                else {
                    stateBeforeMove.awards.longestRoad = {
                        player: -1,
                        length: 4
                    };
                }
            }
        }
        // determine new award winner for longest road
        for (var i = turnIdx; i < turnIdx + gameLogic.NUM_PLAYERS; i++) {
            var j = i % gameLogic.NUM_PLAYERS;
            if (getLongestRoad(stateBeforeMove.players[j], stateBeforeMove.board) > stateBeforeMove.awards.longestRoad.length) {
                stateBeforeMove.awards.longestRoad = {
                    player: j,
                    length: getLongestRoad(stateBeforeMove.players[j], stateBeforeMove.board)
                };
            }
        }
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
        return {
            endMatchScores: hasWinner ? scores : null,
            turnIndexAfterMove: (turnIdx + 1) % gameLogic.NUM_PLAYERS,
            stateAfterMove: stateAfterMove
        };
    }
    gameLogic.onEndTurn = onEndTurn;
    function getLongestRoad(player, board) {
        var max = 0;
        // loop over all unique vertices
        for (var i = 0; i < gameLogic.ROWS; i++) {
            for (var j = 0; j < gameLogic.COLS; j++) {
                // loop over every other vertex
                // only need to do calculate from every other vertex to reduce computations
                for (var k = 0; k < 6; k += 2) {
                    var roadLength = findRoadSubLength(player, board, i, j, k, []);
                    if (roadLength > max)
                        max = roadLength;
                }
            }
        }
        return max;
    }
    gameLogic.getLongestRoad = getLongestRoad;
})(gameLogic || (gameLogic = {}));
//# sourceMappingURL=gameLogic.js.map
;
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
;
var Resource;
(function (Resource) {
    Resource[Resource["Brick"] = 0] = "Brick";
    Resource[Resource["Lumber"] = 1] = "Lumber";
    Resource[Resource["Wool"] = 2] = "Wool";
    Resource[Resource["Grain"] = 3] = "Grain";
    Resource[Resource["Ore"] = 4] = "Ore";
    Resource[Resource["SIZE"] = 5] = "SIZE";
    Resource[Resource["Dust"] = 6] = "Dust";
    Resource[Resource["Water"] = 7] = "Water";
    Resource[Resource["ANY"] = 8] = "ANY"; //Used for harbor 3:1
})(Resource || (Resource = {}));
var DevCard;
(function (DevCard) {
    DevCard[DevCard["Knight"] = 0] = "Knight";
    DevCard[DevCard["Monopoly"] = 1] = "Monopoly";
    DevCard[DevCard["RoadBuilding"] = 2] = "RoadBuilding";
    DevCard[DevCard["YearOfPlenty"] = 3] = "YearOfPlenty";
    DevCard[DevCard["VictoryPoint"] = 4] = "VictoryPoint";
    DevCard[DevCard["SIZE"] = 5] = "SIZE";
})(DevCard || (DevCard = {}));
var Construction;
(function (Construction) {
    Construction[Construction["Road"] = 0] = "Road";
    Construction[Construction["Settlement"] = 1] = "Settlement";
    Construction[Construction["City"] = 2] = "City";
    Construction[Construction["DevCard"] = 3] = "DevCard";
    Construction[Construction["SIZE"] = 4] = "SIZE";
})(Construction || (Construction = {}));
var MoveType;
(function (MoveType) {
    MoveType[MoveType["INIT"] = 0] = "INIT";
    MoveType[MoveType["INIT_BUILD"] = 1] = "INIT_BUILD";
    MoveType[MoveType["ROLL_DICE"] = 2] = "ROLL_DICE";
    MoveType[MoveType["BUILD_ROAD"] = 3] = "BUILD_ROAD";
    MoveType[MoveType["BUILD_SETTLEMENT"] = 4] = "BUILD_SETTLEMENT";
    MoveType[MoveType["BUILD_CITY"] = 5] = "BUILD_CITY";
    MoveType[MoveType["BUILD_DEVCARD"] = 6] = "BUILD_DEVCARD";
    MoveType[MoveType["KNIGHT"] = 7] = "KNIGHT";
    MoveType[MoveType["MONOPOLY"] = 8] = "MONOPOLY";
    MoveType[MoveType["ROAD_BUILDING"] = 9] = "ROAD_BUILDING";
    MoveType[MoveType["YEAR_OF_PLENTY"] = 10] = "YEAR_OF_PLENTY";
    MoveType[MoveType["TRADE"] = 11] = "TRADE";
    MoveType[MoveType["ROBBER_EVENT"] = 12] = "ROBBER_EVENT";
    MoveType[MoveType["ROBBER_MOVE"] = 13] = "ROBBER_MOVE";
    MoveType[MoveType["ROB_PLAYER"] = 14] = "ROB_PLAYER";
    MoveType[MoveType["TRANSACTION_WITH_BANK"] = 15] = "TRANSACTION_WITH_BANK";
    MoveType[MoveType["WIN"] = 16] = "WIN";
    MoveType[MoveType["SIZE"] = 17] = "SIZE";
})(MoveType || (MoveType = {}));
function numberResourceCards(player) {
    var total = 0;
    for (var i = 0; i < Resource.SIZE; i++) {
        total += player.resources[i];
    }
    return total;
}
function stealFromPlayer(playerStealing, playerStolen) {
    // no cards to steal
    if (numberResourceCards(playerStolen) === 0)
        return;
    // pick random card from other player's hand - from 1 to number of cards
    var cardIndex = Math.floor(Math.random() * numberResourceCards(playerStolen)) + 1;
    // take from other player, add to stealer
    var currentNumber = 0;
    for (var i = 0; i < Resource.SIZE; i++) {
        currentNumber = playerStolen.resources[i];
        if (cardIndex <= currentNumber) {
            playerStolen.resources[i]--;
            playerStealing.resources[i]++;
            return;
        }
        cardIndex -= currentNumber;
    }
}
function canAffordConstruction(player, construct) {
    switch (construct) {
        case Construction.Road:
            if (player.resources[Resource.Brick] >= 1 && player.resources[Resource.Lumber] >= 1)
                return true;
            break;
        case Construction.Settlement:
            if (player.resources[Resource.Brick] >= 1 && player.resources[Resource.Lumber] >= 1 &&
                player.resources[Resource.Wool] >= 1 && player.resources[Resource.Grain] >= 1)
                return true;
            break;
        case Construction.City:
            if (player.resources[Resource.Grain] >= 2 && player.resources[Resource.Ore] >= 3)
                return true;
            break;
        case Construction.DevCard:
            if (player.resources[Resource.Wool] >= 1 && player.resources[Resource.Grain] >= 1 && player.resources[Resource.Ore] >= 1)
                return true;
            break;
        default:
            return false;
    }
    return false;
}
function hasSufficientConstructsToBuild(player, construct, bank) {
    switch (construct) {
        case Construction.Road:
            if (player.construction[Construction.Road] < 15)
                return true;
            break;
        case Construction.Settlement:
            if (player.construction[Construction.Settlement] < 5)
                return true;
            break;
        case Construction.City:
            if (player.construction[Construction.City] < 4 && player.construction[Construction.Settlement] > 0)
                return true;
            break;
        case Construction.DevCard:
            for (var i = 0; i < bank.devCards.length; i++) {
                if (bank.devCards[i] > 0) {
                    return true;
                }
            }
            break;
        default:
            return false;
    }
    return false;
}
// *****************
// Helper functions for player-based functions
// *****************
function hasAdjacentRoad(player, board, row, col, vertex) {
    if (board[row][col].edges[vertex] === player.id)
        return true;
    if (board[row][col].edges[(vertex + 1) % 6] === player.id)
        return true;
    var hexes = getHexesAdjacentToVertex(row, col, vertex);
    //  console.log(hexes);
    for (var i = 0; i < hexes.length; i++) {
        if (hexes[i].length === 0)
            continue;
        if (board[hexes[i][0]][hexes[i][1]].edges[hexes[i][2]] === player.id)
            return true;
        if (board[hexes[i][0]][hexes[i][1]].edges[(hexes[i][2] + 1) % 6] === player.id)
            return true;
    }
    return false;
}
function hasNearbyConstruct(board, row, col, vertex) {
    if (board[row][col].vertices[vertex] === Construction.Settlement ||
        board[row][col].vertices[vertex] === Construction.City)
        return true;
    if (board[row][col].vertices[(vertex + 1) % 6] === Construction.Settlement ||
        board[row][col].vertices[(vertex + 1) % 6] === Construction.City ||
        board[row][col].vertices[((vertex - 1) % 6 + 6) % 6] === Construction.Settlement ||
        board[row][col].vertices[((vertex - 1) % 6 + 6) % 6] === Construction.City)
        return true;
    var hexes = getHexesAdjacentToVertex(row, col, vertex);
    for (var i = 0; i < hexes.length; i++) {
        if (hexes[i] === null)
            continue;
        if (board[hexes[i][0]][hexes[i][1]].vertices[(hexes[i][3] + 1) % 6] === Construction.Settlement ||
            board[hexes[i][0]][hexes[i][1]].vertices[(hexes[i][3] + 1) % 6] === Construction.City ||
            board[hexes[i][0]][hexes[i][1]].vertices[((hexes[i][3] - 1) % 6 + 6) % 6] === Construction.Settlement ||
            board[hexes[i][0]][hexes[i][1]].vertices[((hexes[i][3] - 1) % 6 + 6) % 6] === Construction.City)
            return true;
    }
    return false;
}
// return [row, col] pair that shares edge with original edge
function getHexAdjcentToEdgeUnfiltered(row, col, edge) {
    // TODO: add check for new row/col out of bounds
    if (edge === 0)
        return [row, col + 1];
    if (edge === 1 && row % 2 === 0)
        return [row - 1, col + 1];
    if (edge === 1 && row % 2 === 1)
        return [row - 1, col];
    if (edge === 2 && row % 2 === 0)
        return [row - 1, col];
    if (edge === 2 && row % 2 === 1)
        return [row - 1, col - 1];
    if (edge === 3)
        return [row, col - 1];
    if (edge === 4 && row % 2 === 0)
        return [row + 1, col];
    if (edge === 4 && row % 2 === 1)
        return [row + 1, col - 1];
    if (edge === 5 && row % 2 === 0)
        return [row + 1, col + 1];
    if (edge === 5 && row % 2 === 1)
        return [row + 1, col];
    // default - shouldn't happen though
    return [];
}
function getHexAdjcentToEdge(row, col, edge) {
    var hex = getHexAdjcentToEdgeUnfiltered(row, col, edge);
    if (hex[0] < 0 || hex[1] < 0 || hex[0] >= gameLogic.ROWS || hex[1] >= gameLogic.COLS)
        return [];
    return hex;
}
// will return 2 hexes in [row, col, vertex] that share the original vertex
function getHexesAdjacentToVertexUnfiltered(row, col, vertex) {
    if (vertex === 0 && row % 2 === 0)
        return [[row, col + 1, 2], [row - 1, col + 1, 4]];
    if (vertex === 0 && row % 2 === 1)
        return [[row, col + 1, 2], [row - 1, col, 4]];
    if (vertex === 1 && row % 2 === 0)
        return [[row - 1, col, 5], [row - 1, col + 1, 3]];
    if (vertex === 1 && row % 2 === 1)
        return [[row - 1, col - 1, 5], [row - 1, col, 3]];
    if (vertex === 2 && row % 2 === 0)
        return [[row, col - 1, 0], [row - 1, col, 4]];
    if (vertex === 2 && row % 2 === 1)
        return [[row, col - 1, 0], [row - 1, col - 1, 4]];
    if (vertex === 3 && row % 2 === 0)
        return [[row, col - 1, 5], [row + 1, col, 1]];
    if (vertex === 3 && row % 2 === 1)
        return [[row, col - 1, 5], [row + 1, col - 1, 1]];
    if (vertex === 4 && row % 2 === 0)
        return [[row + 1, col, 0], [row + 1, col + 1, 2]];
    if (vertex === 4 && row % 2 === 1)
        return [[row + 1, col - 1, 0], [row + 1, col, 2]];
    if (vertex === 5 && row % 2 === 0)
        return [[row + 1, col + 1, 1], [row, col + 1, 3]];
    if (vertex === 5 && row % 2 === 1)
        return [[row + 1, col, 1], [row, col + 1, 3]];
    // default - shouldn't happen though
    return [];
}
function getHexesAdjacentToVertex(row, col, vertex) {
    var _a = getHexesAdjacentToVertexUnfiltered(row, col, vertex), hex1 = _a[0], hex2 = _a[1];
    // hex 1 oob
    if (hex1[0] < 0 || hex1[1] < 0 || hex1[0] >= gameLogic.ROWS || hex1[1] >= gameLogic.COLS) {
        // both hexes oob
        if (hex2[0] < 0 || hex2[1] < 0 || hex2[0] >= gameLogic.ROWS || hex2[1] >= gameLogic.COLS) {
            return [];
        }
        return [hex2];
    }
    // hex2 oob
    if (hex2[0] < 0 || hex2[1] < 0 || hex2[0] >= gameLogic.ROWS || hex2[1] >= gameLogic.COLS) {
        return [hex1];
    }
    return [hex1, hex2];
}
// traverse each node (vertex) and recurse if a road exists between a neighboring node
//
// TODO: stop adding to length if other player settlement/city is inbetween roads
//
function findRoadSubLength(player, board, row, col, vertex, traversed) {
    if (!hasAdjacentRoad(player, board, row, col, vertex))
        return 0;
    traversed.push("\"" + row + ", " + col + ", " + vertex + "\"");
    var _a = getHexesAdjacentToVertex(row, col, vertex), hex1 = _a[0], hex2 = _a[1];
    var length1 = 0;
    var length2 = 0;
    var length3 = 0;
    // TODO: fix hexes to allow for 0 or 1 hex instead of 2
    var _b = getHexesAdjacentToVertex(row, col, (vertex + 1) % 6), h1 = _b[0], h2 = _b[1];
    if (traversed.indexOf("\"" + row + ", " + col + ", " + ((vertex + 1) % 6) + "\"") === -1 &&
        traversed.indexOf("\"" + h1[0] + ", " + h1[1] + ", " + h1[2] + "\"") === -1 &&
        traversed.indexOf("\"" + h2[0] + ", " + h2[1] + ", " + h2[2] + "\"") === -1) {
        if (board[row][col].edges[(vertex + 1) % 6] === player.id)
            length1 = 1 + findRoadSubLength(player, board, row, col, (vertex + 1) % 6, angular.copy(traversed));
    }
    _c = getHexesAdjacentToVertex(hex1[0], hex1[1], (hex1[2] + 1) % 6), h1 = _c[0], h2 = _c[1];
    if (traversed.indexOf("\"" + hex1[0] + ", " + hex1[1] + ", " + ((hex1[2] + 1) % 6) + "\"") === -1 &&
        traversed.indexOf("\"" + h1[0] + ", " + h1[1] + ", " + h1[2] + "\"") === -1 &&
        traversed.indexOf("\"" + h2[0] + ", " + h2[1] + ", " + h2[2] + "\"") === -1) {
        if (board[hex1[0]][hex1[1]].edges[(hex1[2] + 1) % 6] === player.id)
            length2 = 1 + findRoadSubLength(player, board, hex1[0], hex1[1], (hex1[2] + 1) % 6, angular.copy(traversed));
    }
    _d = getHexesAdjacentToVertex(hex2[0], hex2[1], (hex2[2] + 1) % 6), h1 = _d[0], h2 = _d[1];
    if (traversed.indexOf("\"" + hex2[0] + ", " + hex2[1] + ", " + ((hex2[2] + 1) % 6) + "\"") === -1 &&
        traversed.indexOf("\"" + h1[0] + ", " + h1[1] + ", " + h1[2] + "\"") === -1 &&
        traversed.indexOf("\"" + h2[0] + ", " + h2[1] + ", " + h2[2] + "\"") === -1) {
        if (board[hex2[0]][hex2[1]].edges[(hex2[2] + 1) % 6] === player.id)
            length3 = 1 + findRoadSubLength(player, board, hex2[0], hex2[1], (hex2[2] + 1) % 6, angular.copy(traversed));
    }
    // first call to finding road length
    if (traversed.length === 1) {
        if (length1 < length2 && length1 < length3) {
            return length2 + length3;
        }
        else if (length2 < length1 && length2 < length3) {
            return length1 + length3;
        }
        else {
            return length1 + length2;
        }
    }
    else {
        if (length2 < length3) {
            return length3;
        }
        else {
            return length2;
        }
    }
    var _c, _d;
}
/**
 * Helper functions for making next state
 */
function getNextStateToBuildRoad(board, row, col, e, idx) {
    var _a = getHexAdjcentToEdge(row, col, e), adjRow = _a[0], adjCol = _a[1];
    var adjEdge = (e + 3) % 6;
    board[row][col].edges[e] = idx;
    board[adjRow][adjCol].edges[adjEdge] = idx;
    return board;
}
function getNextStateToBuild(board, buildingMove) {
    var row = buildingMove.hexRow;
    var col = buildingMove.hexCol;
    var num = buildingMove.vertexOrEdge;
    var idx = buildingMove.playerIdx;
    if (buildingMove.consType === Construction.Road) {
        return getNextStateToBuildRoad(board, row, col, num, idx);
    }
    var hexes = getHexesAdjacentToVertex(row, col, num);
    for (var i = 0; i < hexes.length; i++) {
        var _a = hexes[i], r = _a[0], c = _a[1], v = _a[2];
        board[r][c].vertexOwner[v] = idx;
        board[r][c].vertices[v] = buildingMove.consType;
    }
    board[row][col].vertexOwner[num] = idx;
    board[row][col].vertices[num] = buildingMove.consType;
    return board;
}
/**
 * Constants definitions
 */
var tokens = [5, 2, 6, 3, 8, 10, 9, 12, 11, 4, 8, 10, 9, 4, 5, 6, 3, 11];
var terrains = [
    Resource.Brick,
    Resource.Brick,
    Resource.Brick,
    Resource.Lumber,
    Resource.Lumber,
    Resource.Lumber,
    Resource.Lumber,
    Resource.Wool,
    Resource.Wool,
    Resource.Wool,
    Resource.Wool,
    Resource.Grain,
    Resource.Grain,
    Resource.Grain,
    Resource.Grain,
    Resource.Ore,
    Resource.Ore,
    Resource.Ore,
    Resource.Dust
];
/**
 * Constants for harbors
 */
var harborPos = [
    [0, 1],
    [0, 3],
    [1, 5],
    [2, 0],
    [3, 6],
    [4, 0],
    [5, 5],
    [6, 1],
    [6, 3]
];
var harbors = [
    {
        trading: Resource.ANY,
        vertices: [4, 5]
    },
    {
        trading: Resource.Grain,
        vertices: [3, 4]
    },
    {
        trading: Resource.Ore,
        vertices: [3, 4]
    },
    {
        trading: Resource.Lumber,
        vertices: [0, 5]
    },
    {
        trading: Resource.ANY,
        vertices: [2, 3]
    },
    {
        trading: Resource.Brick,
        vertices: [0, 5]
    },
    {
        trading: Resource.Wool,
        vertices: [1, 2]
    },
    {
        trading: Resource.ANY,
        vertices: [0, 1]
    },
    {
        trading: Resource.ANY,
        vertices: [1, 2]
    }
];
//# sourceMappingURL=common.js.map
;
var aiService;
(function (aiService) {
    /** Returns the move that the computer player should do for the given state in move. */
    function findComputerMove(move) {
        return createComputerMove(move, 
        // at most 1 second for the AI to choose a move (but might be much quicker)
        { millisecondsLimit: 1000 });
    }
    aiService.findComputerMove = findComputerMove;
    /**
     * Returns all the possible moves for the given state and turnIndexBeforeMove.
     * Returns an empty array if the game is over.
     */
    function getPossibleMoves(state, turnIndexBeforeMove) {
        var possibleMoves = [];
        for (var i = 0; i < gameLogic.ROWS; i++) {
            for (var j = 0; j < gameLogic.COLS; j++) {
                try {
                }
                catch (e) {
                }
            }
        }
        return possibleMoves;
    }
    aiService.getPossibleMoves = getPossibleMoves;
    /**
     * Returns the move that the computer player should do for the given state.
     * alphaBetaLimits is an object that sets a limit on the alpha-beta search,
     * and it has either a millisecondsLimit or maxDepth field:
     * millisecondsLimit is a time limit, and maxDepth is a depth limit.
     */
    function createComputerMove(move, alphaBetaLimits) {
        // We use alpha-beta search, where the search states are TicTacToe moves.
        return alphaBetaService.alphaBetaDecision(move, move.turnIndexAfterMove, getNextStates, getStateScoreForIndex0, null, alphaBetaLimits);
    }
    aiService.createComputerMove = createComputerMove;
    function getStateScoreForIndex0(move, playerIndex) {
        var endMatchScores = move.endMatchScores;
        if (endMatchScores) {
            return endMatchScores[0] > endMatchScores[1] ? Number.POSITIVE_INFINITY
                : endMatchScores[0] < endMatchScores[1] ? Number.NEGATIVE_INFINITY
                    : 0;
        }
        return 0;
    }
    function getNextStates(move, playerIndex) {
        return getPossibleMoves(move.stateAfterMove, playerIndex);
    }
})(aiService || (aiService = {}));
//# sourceMappingURL=aiService.js.map