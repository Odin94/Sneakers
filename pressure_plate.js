/**
 * Created by Odin on 25.04.2016.
 */

var PressurePlate = {
    setPressurePlate: function (presPlate, killWalls, spawnWallCoords, permanent) {
        presPlate.killWalls = killWalls;
        presPlate.spawnedWalls = [];

        presPlate.killWallCoords = [];
        presPlate.spawnWallCoords = spawnWallCoords;

        presPlate.permanent = permanent;
    },

    trigger: function (presPlate, game) {
        this.killWallsAndSetKillWallCoords(presPlate);
        this.spawnWallsAndSetSpawnedWalls(presPlate, game);

        // don't need the plate anymore after activation
        if (presPlate.permanent) {
            presPlate.kill();
        }
    },

    killWallsAndSetKillWallCoords: function(presPlate) {
        var killWallCoords = [];
        for (var i = 0; i < presPlate.killWalls.length; i++) {
            killWallCoords.push({x: presPlate.killWalls[i].x / BasicGame.WALL_WIDTH,
                y: presPlate.killWalls[i].y / BasicGame.WALL_HEIGHT});
            presPlate.killWalls[i].kill();
        }
    },

    spawnWallsAndSetSpawnedWalls: function(presPlate, game) {
        var spawnedWalls = [];
        for (var j = 0; j < presPlate.spawnWallCoords.length; j++) {
            spawnedWalls.push(game.spawnWall(presPlate.spawnWallCoords[j].x, presPlate.spawnWallCoords[j].y));
        }

        presPlate.spawnedWalls = spawnedWalls;
    }
};