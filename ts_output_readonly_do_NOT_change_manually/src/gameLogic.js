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
            turnIndexAfterMove: stateAfterMove.eventIdx,
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