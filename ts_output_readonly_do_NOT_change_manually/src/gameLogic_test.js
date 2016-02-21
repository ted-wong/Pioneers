describe('Initial state tests', function () {
    it('Check that all terrains are assigned', function () {
        function check() {
            var terrainCheck = [];
            for (var i = 0; i < terrains.length; i++) {
                terrainCheck[i] = false;
            }
            var state = gameLogic.getInitialState();
            var cnt = 0;
            for (var i = 0; i < gameLogic.ROWS; i++) {
                for (var j = 0; j < gameLogic.COLS; j++) {
                    if ((state.board[i][j].label < Resource.SIZE || state.board[i][j].label === Resource.Dust)) {
                        for (var idx = 0; idx < terrains.length; idx++) {
                            if (terrains[idx] === state.board[i][j].label && !terrainCheck[idx]) {
                                terrainCheck[idx] = true;
                                cnt++;
                            }
                        }
                    }
                }
            }
            if (cnt !== terrains.length) {
                throw new Error('Not all terrains are assigned!');
            }
        }
        for (var i = 0; i < 10; i++) {
            check();
        }
    });
    it('Check if all number tokens are assigned', function () {
        function check() {
            var tokenCheck = [];
            for (var i = 0; i < tokens.length; i++) {
                tokenCheck[i] = false;
            }
            var state = gameLogic.getInitialState();
            var cnt = 0;
            for (var i = 0; i < gameLogic.ROWS; i++) {
                for (var j = 0; j < gameLogic.COLS; j++) {
                    if (state.board[i][j].rollNum !== -1) {
                        for (var idx = 0; idx < tokenCheck.length; idx++) {
                            if (tokens[idx] === state.board[i][j].rollNum && !tokenCheck[idx]) {
                                tokenCheck[idx] = true;
                                cnt++;
                            }
                        }
                    }
                }
            }
            if (cnt !== tokens.length) {
                throw new Error('Not all number tokens are assigned!');
            }
        }
        for (var i = 0; i < 10; i++)
            check();
    });
    it('Check initial bank inventories', function () {
        var state = gameLogic.getInitialState();
        for (var i = 0; i < Resource.SIZE; i++) {
            if (state.bank.resources[i] !== 19) {
                throw new Error('Resource ' + Resource[i] + ' has wrong starting inventory in bank!');
            }
        }
        for (var i = 0; i < DevCard.SIZE; i++) {
            switch (i) {
                case DevCard.Knight:
                    if (state.bank.devCards[i] !== 14) {
                        throw new Error('Having wrong number of knight cards in bank!');
                    }
                    break;
                case DevCard.Monopoly:
                    if (state.bank.devCards[i] !== 2) {
                        throw new Error('Having wrong number of monopoly cards in bank!');
                    }
                    break;
                case DevCard.RoadBuilding:
                    if (state.bank.devCards[i] !== 2) {
                        throw new Error('Having wrong number of Road Building cards in bank!');
                    }
                    break;
                case DevCard.YearOfPlenty:
                    if (state.bank.devCards[i] !== 2) {
                        throw new Error('Having wrong number of Year of Plenty cards in bank!');
                    }
                    break;
                case DevCard.VictoryPoint:
                    if (state.bank.devCards[i] !== 5) {
                        throw new Error('Having wrong number of Victory Point cards in bank!');
                    }
                    break;
                default:
                    throw new Error('Unexpected index to dev cards!');
            }
        }
    });
    it('Check robber is in desert at beginning', function () {
        var state = gameLogic.getInitialState();
        if (state.board[state.robber.row][state.robber.col].label !== Resource.Dust) {
            throw new Error('Robber is in wrong position: ' + Resource[state.board[state.robber.row][state.robber.col].label]);
        }
    });
});
var sea = {
    label: Resource.Water,
    edges: [-1, -1, -1, -1, -1, -1],
    vertices: [-1, -1, -1, -1, -1, -1],
    vertexOwner: [-1, -1, -1, -1, -1, -1],
    rollNum: -1,
    harbor: null,
    hasRobber: false
};
/**
 * See design doc - Testing Plan for visualization
 */
var TEST_BOARD = [
    [
        sea, sea, sea, sea, sea, sea, sea
    ],
    [
        sea, sea,
        {
            label: Resource.Brick,
            edges: [2, -1, -1, -1, -1, 2],
            vertices: [-1, -1, -1, -1, -1, Construction.Settlement],
            vertexOwner: [-1, -1, -1, -1, -1, 2],
            rollNum: 5,
            harbor: null,
            hasRobber: false
        },
        {
            label: Resource.Ore,
            edges: [-1, -1, 2, 2, -1, -1],
            vertices: [-1, Construction.Settlement, -1, Construction.Settlement, -1, -1],
            vertexOwner: [-1, 2, -1, 2, -1, -1],
            rollNum: 10,
            harbor: { trading: Resource.ANY, vertices: [1, 2] },
            hasRobber: false
        },
        {
            label: Resource.Brick,
            edges: [-1, -1, -1, -1, -1, -1],
            vertices: [-1, -1, -1, -1, -1, -1],
            vertexOwner: [-1, -1, -1, -1, -1, -1],
            rollNum: 8,
            harbor: { trading: Resource.Ore, vertices: [0, 1] },
            hasRobber: false
        },
        sea, sea
    ],
    [
        sea,
        {
            label: Resource.Lumber,
            edges: [2, -1, -1, -1, -1, 1],
            vertices: [-1, -1, -1, -1, -1, Construction.Settlement],
            vertexOwner: [-1, -1, -1, -1, -1, 1],
            rollNum: 8,
            harbor: { trading: Resource.Lumber, vertices: [1, 2] },
            hasRobber: false
        },
        {
            label: Resource.Grain,
            edges: [-1, -1, 2, 2, 2, -1],
            vertices: [-1, Construction.Settlement, -1, Construction.Settlement, -1, -1],
            vertexOwner: [-1, 2, -1, 1, -1, -1],
            rollNum: 9,
            harbor: null,
            hasRobber: false
        },
        {
            label: Resource.Lumber,
            edges: [-1, -1, -1, -1, -1, -1],
            vertices: [-1, -1, -1, -1, -1, -1],
            vertexOwner: [-1, -1, -1, -1, -1, -1],
            rollNum: 8,
            harbor: { trading: Resource.Ore, vertices: [0, 1] },
            hasRobber: false
        },
        {
            label: Resource.Grain,
            edges: [-1, -1, -1, -1, -1, -1],
            vertices: [-1, -1, -1, -1, -1, -1],
            vertexOwner: [-1, -1, -1, -1, -1, -1],
            rollNum: 8,
            harbor: { trading: Resource.Ore, vertices: [0, 1] },
            hasRobber: false
        },
        sea, sea
    ],
    [
        sea,
        {
            label: Resource.Wool,
            edges: [1, -1, -1, -1, -1, -1],
            vertices: [-1, -1, -1, -1, -1, Construction.Settlement],
            vertexOwner: [-1, -1, -1, -1, -1, 1],
            rollNum: 6,
            harbor: { trading: Resource.ANY, vertices: [2, 3] },
            hasRobber: false
        },
        {
            label: Resource.Wool,
            edges: [-1, 2, 1, 1, -1, -1],
            vertices: [-1, Construction.Settlement, -1, Construction.Settlement, -1, -1],
            vertexOwner: [-1, 1, -1, 1, -1, -1],
            rollNum: 4,
            harbor: null,
            hasRobber: false
        },
        {
            label: Resource.Dust,
            edges: [-1, -1, -1, -1, -1, -1],
            vertices: [-1, -1, -1, -1, -1, -1],
            vertexOwner: [-1, -1, -1, -1, -1, -1],
            rollNum: -1,
            harbor: null,
            hasRobber: true
        },
        {
            label: Resource.Wool,
            edges: [-1, -1, -1, -1, -1, -1],
            vertices: [-1, -1, -1, -1, -1, -1],
            vertexOwner: [-1, -1, -1, -1, -1, -1],
            rollNum: 3,
            harbor: null,
            hasRobber: false
        },
        {
            label: Resource.Wool,
            edges: [-1, -1, -1, -1, -1, -1],
            vertices: [-1, -1, -1, -1, -1, -1],
            vertexOwner: [-1, -1, -1, -1, -1, -1],
            rollNum: 11,
            harbor: null,
            hasRobber: false
        },
        sea
    ],
    [
        sea,
        {
            label: Resource.Grain,
            edges: [-1, -1, -1, -1, -1, -1],
            vertices: [-1, Construction.Settlement, -1, -1, -1, -1],
            vertexOwner: [-1, 1, -1, -1, -1, -1],
            rollNum: 3,
            harbor: { trading: Resource.Wool, vertices: [3, 4] },
            hasRobber: false
        },
        {
            label: Resource.Lumber,
            edges: [-1, -1, -1, -1, -1, -1],
            vertices: [-1, -1, -1, -1, Construction.Settlement, -1],
            vertexOwner: [-1, -1, -1, -1, 0, -1],
            rollNum: 5,
            harbor: null,
            hasRobber: false
        },
        {
            label: Resource.Grain,
            edges: [-1, -1, -1, -1, -1, -1],
            vertices: [-1, -1, -1, -1, Construction.Settlement, -1],
            vertexOwner: [-1, -1, -1, -1, 3, -1],
            rollNum: 6,
            harbor: null,
            hasRobber: false
        },
        {
            label: Resource.Lumber,
            edges: [-1, -1, -1, -1, -1, -1],
            vertices: [-1, -1, -1, -1, -1, -1],
            vertexOwner: [-1, -1, -1, -1, -1, -1],
            rollNum: 12,
            harbor: { trading: Resource.Brick, vertices: [0, 5] },
            hasRobber: false
        },
        sea, sea
    ],
    [
        sea, sea,
        {
            label: Resource.Ore,
            edges: [0, -1, -1, -1, -1, -1],
            vertices: [Construction.Settlement, -1, -1, -1, -1, -1],
            vertexOwner: [0, -1, -1, -1, -1, -1],
            rollNum: 8,
            harbor: null,
            hasRobber: false
        },
        {
            label: Resource.Brick,
            edges: [3, -1, -1, 0, -1, 3],
            vertices: [Construction.Settlement, -1, Construction.Settlement, -1, Construction.Settlement, -1],
            vertexOwner: [3, -1, 0, -1, 3, -1],
            rollNum: 10,
            harbor: { trading: Resource.Grain, vertices: [3, 4] },
            hasRobber: false
        },
        {
            label: Resource.Ore,
            edges: [-1, -1, -1, 3, -1, -1],
            vertices: [-1, -1, Construction.Settlement, -1, -1, -1],
            vertexOwner: [-1, 3, -1, -1, -1, -1],
            rollNum: 9,
            harbor: { trading: Resource.ANY, vertices: [4, 5] },
            hasRobber: false
        },
        sea, sea
    ],
    [
        sea, sea, sea, sea, sea, sea, sea
    ]
];
var PLAYERS = [
    {
        id: 0,
        points: 3,
        resources: [1, 1, 1, 1, 1],
        devCards: [0, 0, 0, 0, 2],
        knightsPlayed: 3,
        longestRoad: 1,
        construction: [1, 1, 0, 5]
    },
    {
        id: 1,
        points: 2,
        resources: [1, 1, 1, 1, 1],
        devCards: [1, 0, 0, 1, 0],
        knightsPlayed: 2,
        longestRoad: 2,
        construction: [2, 2, 0, 4]
    },
    {
        id: 2,
        points: 2,
        resources: [1, 1, 1, 1, 2],
        devCards: [0, 0, 1, 0, 0],
        knightsPlayed: 1,
        longestRoad: 4,
        construction: [5, 2, 0, 2]
    },
    {
        id: 3,
        points: 2,
        resources: [1, 1, 16, 1, 1],
        devCards: [0, 1, 0, 0, 0],
        knightsPlayed: 1,
        longestRoad: 2,
        construction: [2, 2, 0, 2]
    }
];
var BANK = {
    resources: [15, 15, 0, 15, 14],
    devCards: [6, 1, 1, 1, 3]
};
var ROBBER = {
    row: 3,
    col: 3
};
var AWARDS = {
    longestRoad: {
        player: -1,
        length: 4
    },
    largestArmy: {
        player: 0,
        num: 3
    }
};
var TEST_STATE = {
    board: TEST_BOARD,
    dices: [2, 3],
    players: PLAYERS,
    bank: BANK,
    robber: ROBBER,
    awards: AWARDS,
    diceRolled: false,
    devCardsPlayed: false,
    moveType: null,
    eventIdx: null,
    building: null,
    delta: null //Not using, stay null for now
};
/*
describe('Robber related validation', function() {
  it('TEST2', function() {
  });
});

describe('Playing dev cards validation', function() {

});

describe('Trading with bank validation', function() {

});
*/
//# sourceMappingURL=gameLogic_test.js.map