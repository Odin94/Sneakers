/**
 * Created by Odin on 23.03.2016.
 */

var Watcher = {

    setWatcher: function (watcher) {
        window.game.physics.enable(watcher, Phaser.Physics.ARCADE);
        watcher.positionChangeTime = 0;

        watcher.destX = watcher.x;
        watcher.destY = watcher.y;

        watcher.lastPosX = watcher.x;
        watcher.lastPosY = watcher.y;

        watcher.patrolPositions = [[watcher.x + 200, watcher.y], [watcher.x, watcher.y]];
        watcher.patrolPosIterator = 0;

        watcher.patrolStatus = "waiting";
    },

    // if current patrol-destination has been reached, move to next patrol-destination
    patrol: function (watcher) {
        if (watcher.patrolStatus === "waiting") {
            if (window.game.time.now > watcher.positionChangeTime) {
                var nextTarPos = watcher.patrolPositions[watcher.patrolPosIterator];
                watcher.patrolPosIterator = (watcher.patrolPosIterator + 1) % watcher.patrolPositions.length;

                watcher.patrolStatus = "moving";
                this.turnAndMoveToPos(watcher, nextTarPos[0], nextTarPos[1]);
            }
        }
        else if (watcher.patrolStatus === "moving") {
            if (this.reachedDestination(watcher)) {
                watcher.positionChangeTime = window.game.time.now
                    + window.game.rnd.integerInRange(BasicGame.WATCHER_MOVE_DELAY_MIN, BasicGame.WATCHER_MOVE_DELAY_MAX);

                watcher.patrolStatus = "waiting";
                this.stopMoving(watcher);
            }
        }
    },

    reachedDestination: function (watcher) {
        var distanceToDest = Math.abs(Phaser.Math.distance(watcher.x, watcher.y, watcher.destX, watcher.destY));
        var distanceTravelled = Math.abs(Phaser.Math.distance(watcher.x, watcher.y, watcher.lastPosX, watcher.lastPosY));

        return distanceToDest < distanceTravelled;
    },

    turnAndMoveToPos: function (watcher, x, y) {
        watcher.destX = x;
        watcher.destY = y;

        watcher.rotation = window.game.physics.arcade.moveToXY(watcher, x, y, BasicGame.WATCHER_MOVE_SPEED) - Math.PI / 2;
    },

    stopMoving: function (watcher) {
        watcher.destX = watcher.x;
        watcher.destY = watcher.y;

        watcher.body.velocity.setTo(0,0);
        //watcher.velocity.x = 0;
        //watcher.velocity.y = 0;
    },

    updateLastPos: function (watcher) {
        watcher.lastPosX = watcher.x;
        watcher.lastPosY = watcher.y;
    }

};