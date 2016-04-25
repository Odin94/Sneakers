/**
 * Created by Odin on 20.04.2016.
 */

var DisappearingWall = {
    setDisWall: function (disWall, tarWall, appearedTime, disappearedTime) {
        disWall.wall = tarWall;

        disWall.appearedTime = appearedTime;
        disWall.disappearedTime = disappearedTime;

        disWall.nextAppearTime = game.time.now + disWall.appearedTime;
    },

    //TODO: Come up with better name for this function
    //TODO: reference "the_game"="this" from game.js without passing it
    changeAppearance: function (disWall, the_game) {
        if(game.time.now >= disWall.nextAppearTime) {
            if(disWall.wall.alive) {
                this.disappear(disWall);
            }
            else {
                this.appear(disWall, the_game);
            }
        }
    },

    disappear: function (disWall) {
        disWall.wall.kill();
        disWall.nextAppearTime = game.time.now + disWall.disappearedTime;
    },

    appear: function (disWall, the_game) {
        disWall.wall = the_game.spawnWall(disWall.x, disWall.y);
        disWall.nextAppearTime = game.time.now + disWall.appearedTime;
    }
};