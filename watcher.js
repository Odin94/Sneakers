/**
 * Created by Odin on 23.03.2016.
 */

var Watcher = {

    setWatcher: function (watcher, patrolActionsData) {
        window.game.physics.enable(watcher, Phaser.Physics.ARCADE);
        watcher.positionChangeTime = 0;

        watcher.destX = watcher.x;
        watcher.destY = watcher.y;

        watcher.lastPosX = watcher.x;
        watcher.lastPosY = watcher.y;

        watcher.patrolActions = Action.generateActions(patrolActionsData);//[new Action.moveAction(watcher.x + 200, watcher.y), new Action.turnAction(Math.PI)
           // , new Action.moveAction(watcher.x, watcher.y)];//[[watcher.x + 200, watcher.y], [watcher.x, watcher.y]];
        watcher.patrolPosIterator = 0;

        watcher.patrolStatus = "waiting";

        watcher.spotsPlayer = false;
        watcher.spotTimer = 0;
    },

    // if current patrol-destination has been reached, move to next patrol-destination
    patrol: function (watcher) {
        if (watcher.patrolStatus === "waiting") {
            if (window.game.time.now > watcher.positionChangeTime) {
                var patrolAction = watcher.patrolActions[watcher.patrolPosIterator];
                watcher.patrolPosIterator = (watcher.patrolPosIterator + 1) % watcher.patrolActions.length;

                watcher.patrolStatus = "moving";
                patrolAction.execute(watcher);
            }
        }
        else if (watcher.patrolStatus === "moving") {
            if (this.reachedDestination(watcher)) {
                watcher.x = watcher.destX;
                watcher.y = watcher.destY;

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

        return distanceToDest < distanceTravelled || Math.abs(Phaser.Math.distance(watcher.x, watcher.y, watcher.destX, watcher.destY)) <= 5;
    },

    turnAndMoveToPos: function (watcher, x, y) {
        watcher.destX = x;
        watcher.destY = y;

        watcher.rotation = window.game.physics.arcade.moveToXY(watcher, x, y, BasicGame.WATCHER_MOVE_SPEED) - Math.PI / 2;
    },

    stopMoving: function (watcher) {
        watcher.destX = watcher.x;
        watcher.destY = watcher.y;

        watcher.body.velocity.setTo(0, 0);
        //watcher.velocity.x = 0;
        //watcher.velocity.y = 0;
    },

    updateLastPos: function (watcher) {
        watcher.lastPosX = watcher.x;
        watcher.lastPosY = watcher.y;
    }

};