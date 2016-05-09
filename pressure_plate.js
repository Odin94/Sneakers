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
        presPlate.triggered = false;
    },

    trigger: function (presPlate, game) {
        presPlate.triggered = true;

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

        presPlate.killWallCoords = killWallCoords;
    },

    spawnWallsAndSetSpawnedWalls: function(presPlate, game) {
        var spawnedWalls = [];
        for (var j = 0; j < presPlate.spawnWallCoords.length; j++) {
            spawnedWalls.push(game.spawnWall(presPlate.spawnWallCoords[j].x, presPlate.spawnWallCoords[j].y));
        }

        presPlate.spawnedWalls = spawnedWalls;
    },

    unTrigger: function (presPlate, game) {
        presPlate.triggered = false;

        this.respawnAndSetKillWalls(presPlate, game);
        this.killSpawnWallsAndSetKillWallCoords(presPlate);
    },

    respawnAndSetKillWalls: function (presPlate, game) {
        var killWalls = [];
        for (var j = 0; j < presPlate.killWallCoords.length; j++) {
            killWalls.push(game.spawnWall(presPlate.killWallCoords[j].x, presPlate.killWallCoords[j].y));
        }

        presPlate.killWalls = killWalls;
    },

    killSpawnWallsAndSetKillWallCoords: function(presPlate) {
        var spawnWallCoords = [];
        for (var i = 0; i < presPlate.spawnedWalls.length; i++) {
            spawnWallCoords.push({x: presPlate.spawnedWalls[i].x / BasicGame.WALL_WIDTH,
                y: presPlate.spawnedWalls[i].y / BasicGame.WALL_HEIGHT});
            presPlate.spawnedWalls[i].kill();
        }

        presPlate.killWallCoords = spawnWallCoords;
    }
};