/**
 * Created by Odin on 25.04.2016.
 */

var PressurePlate = {
    setPressurePlate: function (presPlate, tarWall) {
        presPlate.wall = tarWall;
    },

    trigger: function (presPlate) {
        presPlate.wall.kill();

        // don't need the plate anymore after activation
        presPlate.kill();
    }
};