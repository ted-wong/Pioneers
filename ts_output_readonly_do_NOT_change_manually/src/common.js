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
    MoveType[MoveType["ROLL_DICE"] = 1] = "ROLL_DICE";
    MoveType[MoveType["BUILD_ROAD"] = 2] = "BUILD_ROAD";
    MoveType[MoveType["BUILD_SETTLEMENT"] = 3] = "BUILD_SETTLEMENT";
    MoveType[MoveType["BUILD_CITY"] = 4] = "BUILD_CITY";
    MoveType[MoveType["BUILD_DEVCARD"] = 5] = "BUILD_DEVCARD";
    MoveType[MoveType["KNIGHT"] = 6] = "KNIGHT";
    MoveType[MoveType["PROGRESS"] = 7] = "PROGRESS";
    MoveType[MoveType["TRADE"] = 8] = "TRADE";
    MoveType[MoveType["ROBBER_EVENT"] = 9] = "ROBBER_EVENT";
    MoveType[MoveType["ROBBER_MOVE"] = 10] = "ROBBER_MOVE";
    MoveType[MoveType["ROB_PLAYER"] = 11] = "ROB_PLAYER";
    MoveType[MoveType["TRANSACTION_WITH_BANK"] = 12] = "TRANSACTION_WITH_BANK";
    MoveType[MoveType["WIN"] = 13] = "WIN";
    MoveType[MoveType["SIZE"] = 14] = "SIZE";
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
    if (numberResourceCards(playerStolen) == 0)
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
            break;
    }
    return false;
}
function hasSuffucientConstructsToBuild(player, construct, bank) {
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
            break;
    }
    return false;
}
function canBuildRoadLegally(player, board, row, col, edge, initial) {
    if (edge < 0 || edge > 5)
        return false;
    if (row < 0 || row > gameLogic.ROWS || col < 0 || col > gameLogic.COLS)
        return false;
    // edge must be empty - no other roads
    if (board[row][col].edges[edge] >= 0)
        return false;
    var adjHex = getHexAdjcentToEdge(row, col, edge);
    // both hexes cannot be water
    if (board[row][col].label == Resource.Water && board[adjHex[0]][adjHex[1]].label == Resource.Water) {
        return false;
    }
    // player owns adjacent road in current hex or adjacent road in adjacent hex
    if (board[row][col].edges[((edge + 1) % 6 + 6) % 6] == player.id ||
        board[row][col].edges[((edge - 1) % 6 + 6) % 6] == player.id ||
        board[adjHex[0]][adjHex[1]].edges[((edge + 3 + 1) % 6 + 6) % 6] == player.id ||
        board[adjHex[0]][adjHex[1]].edges[((edge + 3 - 1) % 6 + 6) % 6] == player.id) {
        // check if other player's settlement/city is inbetween existing road and proposed road
        // cannot build through player's settlement/city, even with connecting road
        // building CC on same hex
        if (board[row][col].edges[((edge + 1) % 6 + 6) % 6] == player.id &&
            ((board[row][col].vertices[edge] == Construction.Settlement ||
                board[row][col].vertices[edge] == Construction.City) &&
                board[row][col].vertexOwner[edge] != player.id)) {
            return false;
        }
        // building CW on same hex
        if (board[row][col].edges[((edge - 1) % 6 + 6) % 6] == player.id &&
            ((board[row][col].vertices[((edge - 1) % 6 + 6) % 6] == Construction.Settlement ||
                board[row][col].vertices[((edge - 1) % 6 + 6) % 6] == Construction.City) &&
                board[row][col].vertexOwner[((edge - 1) % 6 + 6) % 6] != player.id)) {
            return false;
        }
        // building CC on adj. hex
        if (board[adjHex[0]][adjHex[1]].edges[((edge + 3 - 1) % 6 + 6) % 6] == player.id &&
            ((board[row][col].vertices[edge] == Construction.Settlement ||
                board[row][col].vertices[edge] == Construction.City) &&
                board[row][col].vertexOwner[edge] != player.id)) {
            return false;
        }
        // building CW on adj. hex
        if (board[adjHex[0]][adjHex[1]].edges[((edge + 3 + 1) % 6 + 6) % 6] == player.id &&
            ((board[row][col].vertices[((edge - 1) % 6 + 6) % 6] == Construction.Settlement ||
                board[row][col].vertices[((edge - 1) % 6 + 6) % 6] == Construction.City) &&
                board[row][col].vertexOwner[((edge - 1) % 6 + 6) % 6] != player.id)) {
            return false;
        }
        return true;
    }
    // can build road off own existing settlement (for initial roads)
    if (initial) {
        if ((board[row][col].vertices[edge] == Construction.Settlement && board[row][col].vertexOwner[edge] == player.id) ||
            (board[row][col].vertices[(edge + 1) % 6] == Construction.Settlement && board[row][col].vertexOwner[(edge + 1) % 6] == player.id))
            return true;
    }
    return false;
}
function canBuildSettlementLegally(player, board, row, col, vertex, initial) {
    if (vertex < 0 || vertex > 5)
        return false;
    if (row < 0 || row > gameLogic.ROWS || col < 0 || col > gameLogic.COLS)
        return false;
    // proposed vertex must be empty - no other settlement/city
    if (board[row][col].vertices[vertex] != -1)
        return false;
    // one of the 3 hexes must be land
    // TODO: is Water sufficient with "ANY" being allowed?
    var _a = getHexesAdjacentToVertex(row, col, vertex), hex1 = _a[0], hex2 = _a[1];
    if (board[row][col].label == Resource.Water &&
        board[hex1[0]][hex1[1]].label == Resource.Water &&
        board[hex2[0]][hex2[1]].label == Resource.Water) {
        return false;
    }
    // needs adjacent road to build on if not initial settlements
    if (!initial && !hasAdjacentRoad(player, board, row, col, vertex))
        return false;
    // new settlement has to be 2+ vertices away from another settlement/city
    if (hasNearbyConstruct(board, row, col, vertex))
        return false;
    return true;
}
function canUpgradeSettlement(player, board, row, col, vertex) {
    if (vertex < 0 || vertex > 5)
        return false;
    if (row < 0 || row > gameLogic.ROWS || col < 0 || col > gameLogic.COLS)
        return false;
    // proposed vertex must be empty - no other settlement/city
    if (board[row][col].vertices[vertex] == Construction.Settlement &&
        board[row][col].vertexOwner[vertex] == player.id)
        return true;
    return false;
}
function hasAdjacentRoad(player, board, row, col, vertex) {
    if (board[row][col].edges[vertex] = player.id)
        return true;
    if (board[row][col].edges[(vertex + 1) % 6] = player.id)
        return true;
    var _a = getHexesAdjacentToVertex(row, col, vertex), hex1 = _a[0], hex2 = _a[1];
    if (board[hex1[0]][hex1[1]].edges[hex1[3]] == player.id)
        return true;
    if (board[hex1[0]][hex1[1]].edges[(hex1[3] + 1) % 6] == player.id)
        return true;
    if (board[hex2[0]][hex2[1]].edges[hex2[3]] == player.id)
        return true;
    if (board[hex2[0]][hex2[1]].edges[(hex2[3] + 1) % 6] == player.id)
        return true;
    return false;
}
// *****************
// Helper functions for player-based functions
// *****************
function hasNearbyConstruct(board, row, col, vertex) {
    if (board[row][col].vertices[vertex] == Construction.Settlement ||
        board[row][col].vertices[vertex] == Construction.City)
        return true;
    if (board[row][col].vertices[(vertex + 1) % 6] == Construction.Settlement ||
        board[row][col].vertices[(vertex + 1) % 6] == Construction.City ||
        board[row][col].vertices[((vertex - 1) % 6 + 6) % 6] == Construction.Settlement ||
        board[row][col].vertices[((vertex - 1) % 6 + 6) % 6] == Construction.City)
        return true;
    var _a = getHexesAdjacentToVertex(row, col, vertex), hex1 = _a[0], hex2 = _a[1];
    if (board[hex1[0]][hex1[1]].vertices[(hex1[3] + 1) % 6] == Construction.Settlement ||
        board[hex1[0]][hex1[1]].vertices[(hex1[3] + 1) % 6] == Construction.City ||
        board[hex1[0]][hex1[1]].vertices[((hex1[3] - 1) % 6 + 6) % 6] == Construction.Settlement ||
        board[hex1[0]][hex1[1]].vertices[((hex1[3] - 1) % 6 + 6) % 6] == Construction.City)
        return true;
    if (board[hex2[0]][hex2[1]].vertices[(hex2[3] + 1) % 6] == Construction.Settlement ||
        board[hex2[0]][hex2[1]].vertices[(hex2[3] + 1) % 6] == Construction.City ||
        board[hex2[0]][hex2[1]].vertices[((hex2[3] - 1) % 6 + 6) % 6] == Construction.Settlement ||
        board[hex2[0]][hex2[1]].vertices[((hex2[3] - 1) % 6 + 6) % 6] == Construction.City)
        return true;
    return false;
}
// return [row, col] pair that shares edge with original edge
function getHexAdjcentToEdge(row, col, edge) {
    // TODO: add check for new row/col out of bounds
    if (edge == 0)
        return [row, col + 1];
    if (edge == 1 && row % 2 == 0)
        return [row - 1, col + 1];
    if (edge == 1 && row % 2 == 1)
        return [row - 1, col];
    if (edge == 2 && row % 2 == 0)
        return [row - 1, col];
    if (edge == 2 && row % 2 == 1)
        return [row - 1, col - 1];
    if (edge == 3)
        return [row, col - 1];
    if (edge == 4 && row % 2 == 0)
        return [row + 1, col];
    if (edge == 4 && row % 2 == 1)
        return [row + 1, col - 1];
    if (edge == 5 && row % 2 == 0)
        return [row + 1, col + 1];
    if (edge == 5 && row % 2 == 1)
        return [row + 1, col];
    // default - shouldn't happen though
    return [-1, -1];
}
// will return 2 hexes in [row, col, vertex] that share the original vertex
function getHexesAdjacentToVertex(row, col, vertex) {
    // TODO: add check for new row/col hexes out of bounds
    if (vertex == 0 && row % 2 == 0)
        return [[row, col + 1, 2], [row - 1, col + 1, 4]];
    if (vertex == 0 && row % 2 == 1)
        return [[row, col + 1, 2], [row - 1, col, 4]];
    if (vertex == 1 && row % 2 == 0)
        return [[row - 1, col, 5], [row - 1, col + 1, 3]];
    if (vertex == 1 && row % 2 == 1)
        return [[row - 1, col - 1, 5], [row - 1, col, 3]];
    if (vertex == 2 && row % 2 == 0)
        return [[row, col - 1, 0], [row - 1, col, 4]];
    if (vertex == 2 && row % 2 == 1)
        return [[row, col - 1, 0], [row - 1, col - 1, 4]];
    if (vertex == 3 && row % 2 == 0)
        return [[row, col - 1, 5], [row + 1, col, 1]];
    if (vertex == 3 && row % 2 == 1)
        return [[row, col - 1, 5], [row + 1, col - 1, 1]];
    if (vertex == 4 && row % 2 == 0)
        return [[row + 1, col, 0], [row + 1, col + 1, 2]];
    if (vertex == 4 && row % 2 == 1)
        return [[row + 1, col - 1, 0], [row + 1, col, 2]];
    if (vertex == 5 && row % 2 == 0)
        return [[row + 1, col + 1, 1], [row, col + 1, 3]];
    if (vertex == 5 && row % 2 == 1)
        return [[row + 1, col, 1], [row, col + 1, 3]];
    // default - shouldn't happen though
    return [[-1, -1, -1], [-1, -1, -1]];
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
    [1, 3],
    [1, 4],
    [2, 1],
    [2, 4],
    [3, 1],
    [4, 1],
    [4, 4],
    [5, 3],
    [5, 4]
];
var harbors = [
    {
        trading: Resource.ANY,
        vertices: [1, 2]
    },
    {
        trading: Resource.Ore,
        vertices: [0, 1]
    },
    {
        trading: Resource.Lumber,
        vertices: [1, 2]
    },
    {
        trading: Resource.ANY,
        vertices: [0, 5]
    },
    {
        trading: Resource.ANY,
        vertices: [2, 3]
    },
    {
        trading: Resource.Wool,
        vertices: [3, 4]
    },
    {
        trading: Resource.Brick,
        vertices: [0, 5]
    },
    {
        trading: Resource.Grain,
        vertices: [3, 4]
    },
    {
        trading: Resource.ANY,
        vertices: [4, 5]
    }
];
//# sourceMappingURL=common.js.map