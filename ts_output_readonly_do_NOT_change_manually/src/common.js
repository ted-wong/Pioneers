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