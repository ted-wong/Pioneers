var Resource;
(function (Resource) {
    Resource[Resource["Brick"] = 0] = "Brick";
    Resource[Resource["Lumber"] = 1] = "Lumber";
    Resource[Resource["Wool"] = 2] = "Wool";
    Resource[Resource["Grain"] = 3] = "Grain";
    Resource[Resource["Ore"] = 4] = "Ore";
    Resource[Resource["Dust"] = 5] = "Dust";
    Resource[Resource["SIZE"] = 6] = "SIZE";
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
function canAffordConstruction(construct) {
    switch (construct) {
        case Constructions.Road:
            if (this.resources[0] >= 1 && this.resources[1] >= 1)
                return true;
            break;
        case Constructions.Settlement:
            if (this.resources[0] >= 1 && this.resources[1] >= 1 && this.resources[2] >= 1 && this.resources[3] >= 1)
                return true;
            break;
        case Constructions.City:
            if (this.resources[3] >= 2 && this.resources[4] >= 3)
                return true;
            break;
        case Constructions.DevelopmentCard:
            if (this.resources[2] >= 1 && this.resources[3] >= 1 && this.resources[4] >= 1)
                return true;
            break;
        default:
            return false;
            break;
    }
    return false;
}
function hasSuffucientConstructsToBuild(construct) {
    switch (construct) {
        case Constructions.Road:
            if (this.constructions[Constructions.Road] < 15)
                return true;
            break;
        case Constructions.Settlement:
            if (this.constructions[Constructions.Settlement] < 5)
                return true;
            break;
        case Constructions.City:
            if (this.constructions[Constructions.City] < 4 && this.constructions[Constructions.Settlement] > 0)
                return true;
            break;
        case Constructions.DevelopmentCard:
            return true;
            break;
        default:
            return false;
            break;
    }
    return false;
}
function canBuildRoadLegally(board, row, col, edge) {
    if (edge < 0 || edge > 5)
        return false;
    if (row < 0 || row > ROWS || col < 0 || col > COLS)
        return false;
    // edge must be empty - no other roads
    if (board[row][col].edges[edge] >= 0)
        return false;
    var adjHex = getHexAdjcentToEdge(row, col, edge);
    // both hexes cannot be water
    if (board[row][col].label = Resource.Water) {
        if (board[adjHex[0]][adjHex[1]].label = Resource.Water) {
            return false;
        }
    }
    // player owns adjacent road in current hex or adjacent road in adjacent hex
    if (board[row][col].edges[((edge + 1) % 6 + 6) % 6] = this.id || )
        ;
    board[row][col].edges[((edge - 1) % 6 + 6) % 6] = this.id || ;
    board[adjHex[0]][adjHex[1]].edges[((edge + 3 + 1) % 6 + 6) % 6] = this.id || ;
    board[adjHex[0]][adjHex[1]].edges[((edge + 3 - 1) % 6 + 6) % 6] = this.id;
    {
        // check if other player's settlement/city is inbetween existing road and proposed road
        // cannot build through player's settlement/city, even with connecting road
        // building CC on same hex
        if (board[row][col].edges[((edge + 1) % 6 + 6) % 6] = this.id && )
            ;
        ((board[row][col].vertices[edge] == Constructions.Settlement || ));
        board[row][col].vertices[edge] == Constructions.City;
         && ;
        board[row][col].vertexOwner[edge] != this.id;
        {
            return false;
        }
        // building CW on same hex
        if (board[row][col].edges[((edge - 1) % 6 + 6) % 6] = this.id && )
            ;
        ((board[row][col].vertices[((edge - 1) % 6 + 6) % 6] == Constructions.Settlement || ));
        board[row][col].vertices[((edge - 1) % 6 + 6) % 6] == Constructions.City;
         && ;
        board[row][col].vertexOwner[((edge - 1) % 6 + 6) % 6] != this.id;
        {
            return false;
        }
        // building CC on adj. hex
        if (board[adjHex[0]][adjHex[1]].edges[((edge + 3 - 1) % 6 + 6) % 6] = this.id && )
            ;
        ((board[row][col].vertices[edge] == Constructions.Settlement || ));
        board[row][col].vertices[edge] == Constructions.City;
         && ;
        board[row][col].vertexOwner[edge] != this.id;
        {
            return false;
        }
        // building CW on adj. hex
        if (board[adjHex[0]][adjHex[1]].edges[((edge + 3 + 1) % 6 + 6) % 6] = this.id && )
            ;
        ((board[row][col].vertices[((edge - 1) % 6 + 6) % 6] == Constructions.Settlement || ));
        board[row][col].vertices[((edge - 1) % 6 + 6) % 6] == Constructions.City;
         && ;
        board[row][col].vertexOwner[((edge - 1) % 6 + 6) % 6] != this.id;
        {
            return false;
        }
        return true;
    }
    return false;
}
function canBuildSettlementLegally(board, row, col, vertex) {
    if (edge < 0 || edge > 5)
        return false;
    if (row < 0 || row > ROWS || col < 0 || col > COLS)
        return false;
    // proposed vertex must be empty - no other settlement/city
    if (board[row][col].vertices[vertex] != -1)
        return false;
    // needs adjacent road to build on
    if (!hasAdjacentRoad(board, row, col, vertex))
        return false;
    // new settlement has to be 2+ vertices away from another settlement/city
    if (hasNearbyConstruct(board, row, col, vertex))
        return false;
    return true;
}
function canUpgradeSettlement(board, row, col, vertex) {
    if (edge < 0 || edge > 5)
        return false;
    if (row < 0 || row > ROWS || col < 0 || col > COLS)
        return false;
    // proposed vertex must be empty - no other settlement/city
    if (board[row][col].vertices[vertex] == Constructions.Settlement && )
        ;
    board[row][col].VertexOwner[vertex] == this.id;
    return true;
    return false;
}
function hasAdjacentRoad(board, row, col, vertex) {
    if (board[row][col].edges[vertex] = this.id)
        return true;
    if (board[row][col].edges[(vertex + 1) % 6] = this.id)
        return true;
    var _a = getHexesAdjacentToVertex(row, col, vertex), hex1 = _a[0], hex2 = _a[1];
    if (board[hex1[0]][hex1[1]].edges[hex1[3]] == this.id)
        return true;
    if (board[hex1[0]][hex1[1]].edges[(hex1[3] + 1) % 6] == this.id)
        return true;
    if (board[hex2[0]][hex2[1]].edges[hex2[3]] == this.id)
        return true;
    if (board[hex2[0]][hex2[1]].edges[(hex2[3] + 1) % 6] == this.id)
        return true;
    return false;
}
// *****************
// Helper functions for player interface
// *****************
function hasNearbyConstruct(board, row, col, vertex) {
    if (board[row][col].vertices[vertex] == Construction.Settlement || )
        ;
    board[row][col].vertices[vertex] == Construction.City;
    return true;
    if (board[row][col].vertices[(vertex + 1) % 6] == Construction.Settlement || )
        ;
    board[row][col].vertices[(vertex + 1) % 6] == Construction.City || ;
    board[row][col].vertices[((vertex - 1) % 6 + 6) % 6] == Construction.Settlement || ;
    board[row][col].vertices[((vertex - 1) % 6 + 6) % 6] == Construction.City;
    return true;
    var _a = getHexesAdjacentToVertex(row, col, vertex), hex1 = _a[0], hex2 = _a[1];
    if (board[hex1[0]][hex1[1]].vertex[(hex1[3] + 1) % 6] == Construction.Settlement || )
        ;
    board[hex1[0]][hex1[1]].vertex[(hex1[3] + 1) % 6] == Construction.City || ;
    board[hex1[0]][hex1[1]].vertices[((hex1[3] - 1) % 6 + 6) % 6] == Construction.Settlement || ;
    board[hex1[0]][hex1[1]].vertices[((hex1[3] - 1) % 6 + 6) % 6] == Construction.City;
    return true;
    if (board[hex2[0]][hex2[1]].vertex[(hex2[3] + 1) % 6] == Construction.Settlement || )
        ;
    board[hex2[0]][hex2[1]].vertex[(hex2[3] + 1) % 6] == Construction.City || ;
    board[hex2[0]][hex2[1]].vertices[((hex2[3] - 1) % 6 + 6) % 6] == Construction.Settlement || ;
    board[hex2[0]][hex2[1]].vertices[((hex2[3] - 1) % 6 + 6) % 6] == Construction.City;
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
//# sourceMappingURL=common.js.map