/**
 * Created by Odin on 20.04.2016.
 */

var DisappearingWall = {
    setDisWall: function (disWall, tarWall, appearedTime, disappearedTime) {
        disWall.wall = tarWall;
        disWall.wallAlive = true;

        disWall.appearedTime = appearedTime;
        disWall.disappearedTime = disappearedTime;

        disWall.nextAppearTime = game.time.now + disWall.appearedTime;
    },

    //TODO: Come up with better name for this function
    //TODO: reference "the_game"="this" from game.js without passing it; should be BasicGame.game
    changeAppearance: function (disWall, the_game) {
        if(game.time.now >= disWall.nextAppearTime) {
            if(disWall.wallAlive) {
                this.disappear(disWall);
            }
            else {
                this.appear(disWall, the_game);
            }
        }
    },

    disappear: function (disWall) {
        disWall.wall.kill();
        disWall.wall = null; //if we don't set this then appear might highjack a newly appeared wall because the dead wall is still referenced here
        disWall.wallAlive = false;

        disWall.nextAppearTime = game.time.now + disWall.disappearedTime;
    },

    appear: function (disWall, the_game) {
        disWall.wall = the_game.spawnWall(disWall.x, disWall.y);
        disWall.wallAlive = true;
        disWall.nextAppearTime = game.time.now + disWall.appearedTime;
    }
};