/**
 * Created by Odin on 23.03.2016.
 */

var Watcher = {

    setWatcher: function (watcher) {
        window.game.physics.enable(watcher, Phaser.Physics.ARCADE);
        watcher.positionChangeTime = 0;

        watcher.tarX = watcher.x;
        watcher.tarY = watcher.y;

        watcher.patrolPositions = [[watcher.x + 200, watcher.y], [watcher.x, watcher.y]];
        watcher.patrolPosIterator = 0;
    },

    // if current patrol-target has been reached, move to next patrol-target
    patrol: function (watcher) {
        var distanceToTar = Math.abs(Phaser.Math.distance(watcher.body.x, watcher.body.y, watcher.tarX, watcher.tarY));
        if (distanceToTar > BasicGame.WATCHER_MOVE_SPEED * Phaser.Timer.SECOND) {
            return;
        }

        var nextTarPos = watcher.patrolPositions[watcher.patrolPosIterator];
        watcher.patrolPosIterator = (watcher.patrolPosIterator + 1) % watcher.patrolPositions.length;

        this.turnAndMoveToPos(watcher, nextTarPos[0], nextTarPos[1]);
    },

    turnAndMoveToPos: function (watcher, x, y) {
        watcher.tarX = x;
        watcher.tarY = y;

        watcher.rotation = window.game.physics.arcade.moveToXY(watcher, x, y, BasicGame.WATCHER_MOVE_SPEED) - Math.PI / 2;
    },

    stopMoving: function (watcher) {
        watcher.tarX = watcher.x;
        watcher.tarY = watcher.y;

        watcher.velocity.setTo(0, 0)
    }

};