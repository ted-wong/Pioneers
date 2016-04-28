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