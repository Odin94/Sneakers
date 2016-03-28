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

    turnAction: function(angle) {
        this.angle = angle;

        this.execute = function (watcher) {
            watcher.angle = angle;
        };
    }
};