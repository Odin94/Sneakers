/**
 * Created by Odin on 28.03.2016.
 */
var Action = {
    moveAction: function (x, y) {
        this.x = x;
        this.y = y;

        this.execute = function (watcher) {
            Watcher.turnAndMoveToPos(watcher, x, y);
        };
    },

    turnAction: function (angle) {
        this.angle = angle;

        this.execute = function (watcher) {
            watcher.angle = angle;
        };
    },

    generateActions: function (actionData) {
        var actions = [];

        for (var i = 0; i < actionData.length; i++) {
            if (actionData[i].type === "move") {
                actions.push(new this.moveAction(actionData[i].destX, actionData[i].destY));
            }
            else if (actionData[i].type === "turn") {
                actions.push(new this.turnAction(Phaser.Math.degToRad(actionData[i].degree)));
            }
        }
        return actions;
    }
};