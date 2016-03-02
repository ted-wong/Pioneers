describe('Initial state tests', function() {
  it('Check that all terrains are assigned', function() {
    function check(): void {
      let terrainCheck: boolean[] = [];
      for (let i = 0; i < terrains.length; i++) {
        terrainCheck[i] = false;
      }

      let state: IState = gameLogic.getInitialState();
      let cnt: number = 0;
      for (let i = 0; i < gameLogic.ROWS; i++) {
        for (let j = 0; j < gameLogic.COLS; j++) {
          if ((state.board[i][j].label < Resource.SIZE || state.board[i][j].label === Resource.Dust)) {
            for (let idx = 0; idx < terrains.length; idx++) {
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

    for (let i = 0; i < 10; i++) {
      check();
    }
  });

  it('Check if all number tokens are assigned', function() {
    function check(): void {
      let tokenCheck: boolean[] = [];
      for (let i = 0; i < tokens.length; i++) {
        tokenCheck[i] = false;
      }
      let state: IState = gameLogic.getInitialState();
      let cnt: number = 0;

      for (let i = 0; i < gameLogic.ROWS; i++) {
        for (let j = 0; j < gameLogic.COLS; j++) {
          if (state.board[i][j].rollNum !== -1) {
            for (let idx = 0; idx < tokenCheck.length; idx++) {
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

    for (let i = 0; i < 10; i++)  check();
  });

  it('Check initial bank inventories', function() {
    let state: IState = gameLogic.getInitialState();

    for (let i = 0; i < Resource.SIZE; i++) {
      if (state.bank.resources[i] !== 19) {
        throw new Error('Resource ' + Resource[i] + ' has wrong starting inventory in bank!');
      }
    }
    for (let i = 0; i < DevCard.SIZE; i++) {
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

  it('Check robber is in desert at beginning', function() {
    let state: IState = gameLogic.getInitialState();
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
describe('Construction Tests', function() {
  it('Check valid initial settlement placement', function() {
    function check(x: number, y: number, v:number): void {
      let state: IState = gameLogic.getInitialState();
      let player: Player = state.players[0];
      
      if (!canBuildSettlementLegally(player, state.board, x, y, v, true)) {
        throw new Error('Cannot build initial settlement legally at legal location (' + x + ', ' + y + '): ' + v + '!');
      }
    }
    check(0, 3, 5);
  });
  
  it('Check invalid initial settlement placement', function() {
    function check(x: number, y: number, v:number): void {
      let state: IState = gameLogic.getInitialState();
      let player: Player = state.players[0];
      
      if (canBuildSettlementLegally(player, state.board, x, y, v, true)) {
        throw new Error('Can build initial settlement legally at illegal location (' + x + ', ' + y + '): ' + v + '!');
      }
    }
    check(0, 3, 0);
  });
  
  it('Check invalid initial settlement placement too close', function() {
    function check(x: number, y: number, v:number): void {
      let state: IState = gameLogic.getInitialState();
      let player: Player = state.players[0];
      
      state.board[3][3].vertices[3] = 1; // settlement
      state.board[3][3].vertexOwner[3] = 0; // owned by player 0
      
      // updating other 2 hexes
      state.board[3][2].vertices[5] = 1;
      state.board[3][2].vertexOwner[5] = 0;
      
      state.board[4][2].vertices[1] = 1;
      state.board[4][2].vertexOwner[1] = 0;
      
      if (canBuildSettlementLegally(player, state.board, x, y, v, true)) {
        throw new Error('Can build settlement illegally at illegal location (' + x + ', ' + y + '): ' + v + '!');
      }
    }
    // all 4 are illegal spots
    check(3, 3, 3); // same vertex - same hex
    check(3, 3, 4); // adj vertex - same hex
    check(4, 2, 1); // same vertex - different hex
    check(4, 2, 0); // adj vertex - different hex
  });

  it('Check valid initial settlement placement far away', function() {
    function check(x: number, y: number, v:number): void {
      let state: IState = gameLogic.getInitialState();
      let player: Player = state.players[0];
      
      state.board[3][3].vertices[3] = 1; // settlement
      state.board[3][3].vertexOwner[3] = 0; // owned by player 0
      
      // updating other 2 hexes
      state.board[3][2].vertices[5] = 1;
      state.board[3][2].vertexOwner[5] = 0;
      
      state.board[4][2].vertices[1] = 1;
      state.board[4][2].vertexOwner[1] = 0;
      
      if (!canBuildSettlementLegally(player, state.board, x, y, v, true)) {
        throw new Error('Can build settlement illegally at illegal location (' + x + ', ' + y + '): ' + v + '!');
      }
    }
    // all 3 valid spots - same vertex
    check(4, 4, 1);
    check(3, 4, 5);
    check(3, 5, 3);
  });


  // non-initial settlements
  it('Check settlement placement wrt road', function() {
    function check(x: number, y: number, v:number): void {
      let state: IState = gameLogic.getInitialState();
      let player: Player = state.players[0];
      
      state.board[3][3].vertices[3] = 1; // settlement
      state.board[3][3].vertexOwner[3] = 0; // owned by player 0
      
      // updating other 2 hexes
      state.board[3][2].vertices[5] = 1;
      state.board[3][2].vertexOwner[5] = 0;      
      state.board[4][2].vertices[1] = 1;
      state.board[4][2].vertexOwner[1] = 0;

      // roads for settlement
      state.board[3][3].edges[3] = 0;
      state.board[3][2].edges[0] = 0;
      
      state.board[3][3].edges[2] = 0;
      state.board[2][2].edges[5] = 0;
      
      if (!canBuildSettlementLegally(player, state.board, x, y, v, false)) {
        throw new Error('Cannot build settlement legally at legal location (' + x + ', ' + y + '): ' + v + '!');
      }
    }
    // all 3 are legal spots
    check(2, 2, 5);
    //check(2, 3, 3);
    check(3, 3, 1);
  });

  
  it('Check valid road placement', function() {
    function check(x: number, y: number, v: number): void {
      let state: IState = gameLogic.getInitialState();
      let cnt: number = 0;
      let player: Player = state.players[0];
      
      state.board[3][3].vertices[3] = 1;
      state.board[3][3].vertexOwner[3] = 0;
      
      state.board[3][3].edges[3] = 0;
      state.board[3][2].edges[0] = 0;
      
      if (!canBuildRoadLegally(player, state.board, x, y, v, false)) {
        throw new Error('Cannot build road legally at (' + x + ', ' + y + '): ' + v + '!');
      }
    }
    check(3, 3, 2);
    check(2, 2, 5);

  });
  
  it('Check invalid road placement', function() {
    function check(x: number, y: number, v: number): void {
      let state: IState = gameLogic.getInitialState();
      let cnt: number = 0;
      let player: Player = state.players[0];
      
      state.board[3][3].vertices[3] = 1;
      state.board[3][3].vertexOwner[3] = 0;
      
      state.board[3][3].edges[3] = 0;
      state.board[3][2].edges[0] = 0;
      
      if (canBuildRoadLegally(player, state.board, x, y, v, true)) {
        throw new Error('Can build road legally at (' + x + ', ' + y + '): ' + v + '!');
      }
    }
    check(5, 3, 2);

  });

  it('Check valid settlement placements too close', function() {
    function check(x: number, y: number, v: number): void {
      let state: IState = gameLogic.getInitialState();
      let cnt: number = 0;
      let player: Player = state.players[0];
      
      state.board[3][3].vertices[3] = 1;
      state.board[3][3].vertexOwner[3] = 0;
            
      if (!canBuildRoadLegally(player, state.board, x, y, v, true)) {
        throw new Error('Can build settlement illegally at illegal location (' + x + ', ' + y + '): ' + v + '!');
      }
    }
    check(3, 3, 2)
  });

  it('Check simple road length', function() {
    function check(): void {
      let state: IState = gameLogic.getInitialState();
      let cnt: number = 0;
      let player: Player = state.players[0];
      
      state.board[3][3].edges[3] = 0;
      state.board[3][2].edges[0] = 0;

      state.board[3][3].edges[2] = 0;
      state.board[2][2].edges[5] = 0;

      if (getLongestRoad(player, state.board) != 2) {
        throw new Error('Road length is not 2');
      }
    }
    check();
  });

  it('Check longer road length', function() {
    function check(): void {
      let state: IState = gameLogic.getInitialState();
      let cnt: number = 0;
      let player: Player = state.players[0];
      
      state.board[3][3].edges[3] = 0;
      state.board[3][2].edges[0] = 0;

      state.board[3][3].edges[2] = 0;
      state.board[2][2].edges[5] = 0;
	  
      state.board[3][3].edges[1] = 0;
      state.board[2][3].edges[4] = 0;
	  
      // creating fork in road path
      state.board[2][3].edges[3] = 0;
      state.board[2][2].edges[0] = 0;

      if (getLongestRoad(player, state.board) != 3) {
        throw new Error('Road length is not 3');
      }
    }
    check();
  });



});


