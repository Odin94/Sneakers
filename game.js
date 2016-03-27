BasicGame.Game = function (game) {

};

BasicGame.Game.prototype = {


    create: function () {
        this.setupBackground();
        this.setupMap();
        this.setupWatchers();
        this.setupPlayer();
        this.setupPlayerIcons();
        this.setupText();
        this.setupLines();

        this.cursors = this.input.keyboard.createCursorKeys();
    },

    update: function () {
        this.checkCollisions();
        this.updateWatchers();
        this.processPlayerInput();
        this.processDelayedEffects();
    },

    setupBackground: function () {
        this.ground = this.add.tileSprite(0, 0, this.game.width, this.game.height, 'ground');
    },

    setupMap: function () {
        this.setupWalls();
        this.setupGoals();
    },

    setupGoals: function () {
        this.goal = this.add.sprite(this.game.width / 2, 0 + 50, 'goal');
        this.goal.anchor.setTo(0.5, 0.5);

        this.physics.enable(this.goal, Phaser.Physics.ARCADE);
    },

    setupWalls: function () {
        this.wallPool = this.add.group();
        this.wallPool.enableBody = true;
        this.wallPool.physicsBodyType = Phaser.Physics.ARCADE;
        this.wallPool.createMultiple(BasicGame.MAX_WALL_COUNT, 'wall1');
        /* this.wallPool.setAll('anchor.x', 0.5); //this breaks the ray casting algorithm
         this.wallPool.setAll('anchor.y', 0.5);*/
        this.wallPool.forEach(function (wall) {
            wall.body.immovable = true;
        });

        var wallPositions = [[0, 14, 6], [9, 14, 14], [3, 9, 8], [12, 9, 18], [5, 6, 18], [5, 3, 15]];

        for (var i = 0; i < wallPositions.length; i++) {
            var pos = wallPositions[i];
            for (var j = pos[0]; j < pos[2]; j++) {
                this.spawnWall(j, pos[1]);
            }
        }
    },

    spawnWall: function (x, y) {
        if (this.wallPool.countDead() > 0) {
            var wall = this.wallPool.getFirstExists(false);

            wall.reset(x * BasicGame.WALL_WIDTH, y * BasicGame.WALL_HEIGHT);
        }
    },

    setupWatchers: function () {
        this.watcherPool = this.add.physicsGroup();
        this.watcherPool.createMultiple(BasicGame.MAX_WATCHER_COUNT, 'greenEnemy');
        this.watcherPool.setAll('anchor.x', 0.5);
        this.watcherPool.setAll('anchor.y', 0.5);


        /*for (var i = 6; i < 15; i += 3) {
         this.spawnWatcher(i, 2);
         }

         for (var i = 6; i < 15; i += 6) {
         this.spawnWatcher(i, 8);
         }*/

        this.spawnWatcher(6, 8);
    },

    spawnWatcher: function (x, y) {
        if (this.watcherPool.countDead() > 0) {
            var watcher = this.watcherPool.getFirstExists(false);

            watcher.reset(x * BasicGame.WALL_WIDTH, y * BasicGame.WALL_HEIGHT);
            Watcher.setWatcher(watcher);
        }
    },

    //from gamemechanicsexplorer
    getWallIntersection: function (ray) {
        var distanceToWall = Number.POSITIVE_INFINITY;
        var closestIntersection = null;

        // For each of the walls...
        this.wallPool.forEach(function (wall) {
            // Create an array of lines that represent the four edges of each wall
            var lines = [
                new Phaser.Line(wall.x, wall.y, wall.x + wall.width, wall.y),
                new Phaser.Line(wall.x, wall.y, wall.x, wall.y + wall.height),
                new Phaser.Line(wall.x + wall.width, wall.y,
                    wall.x + wall.width, wall.y + wall.height),
                new Phaser.Line(wall.x, wall.y + wall.height,
                    wall.x + wall.width, wall.y + wall.height)
            ];

            // Test each of the edges in this wall against the ray.
            // If the ray intersects any of the edges then the wall must be in the way.
            for (var i = 0; i < lines.length; i++) {
                var intersect = Phaser.Line.intersects(ray, lines[i]);
                if (intersect) {
                    // Find the closest intersection
                    var distance = this.game.math.distance(ray.start.x, ray.start.y, intersect.x, intersect.y);
                    if (distance < distanceToWall) {
                        distanceToWall = distance;
                        closestIntersection = intersect;
                    }
                }
            }
        }, this);

        return closestIntersection;
    },

    setupPlayer: function () {
        this.player = this.add.sprite(this.game.width / 2, this.game.height - 50, 'player');
        this.player.anchor.setTo(0.5, 0.5);

        this.player.animations.add('fly', [0, 1, 2], 20, true);
        this.player.animations.add('ghost', [3, 0, 3, 1], 20, true);
        this.player.play('fly');

        this.physics.enable(this.player, Phaser.Physics.ARCADE);
        this.player.speed = BasicGame.PLAYER_SPEED;
        this.player.body.collideWorldBounds = true;
        // 20 x 20 pixel hitbox, centered a little bit higher than the center
        this.player.body.setSize(20, 20, 0, -5);
    }
    ,

    setupPlayerIcons: function () {
        this.powerUpPool = this.add.group();
        this.powerUpPool.enableBody = true;
        this.powerUpPool.physicsBodyType = Phaser.Physics.ARCADE;
        this.powerUpPool.createMultiple(5, 'powerup1');
        this.powerUpPool.setAll('anchor.x', 0.5);
        this.powerUpPool.setAll('anchor.y', 0.5);
        this.powerUpPool.setAll('outOfBoundsKill', true);
        this.powerUpPool.setAll('checkWorldBounds', true);
        this.powerUpPool.setAll('reward', BasicGame.POWERUP_REWARD, false, false, 0, true);

        this.lives = this.add.group();
        // calculate location of first life icon
        var firstLifeIconX = this.game.width - 10 - (BasicGame.PLAYER_EXTRA_LIVES * 30);
        for (var i = 0; i < BasicGame.PLAYER_EXTRA_LIVES; i++) {
            var life = this.lives.create(firstLifeIconX + (30 * i), 30, 'player');
            life.scale.setTo(0.5, 0.5);
            life.anchor.setTo(0.5, 0.5);
        }
    }
    ,

    setupText: function () {
        this.instructions = this.add.text(
            this.game.width / 2,
            this.game.height - 100,
            'Use Arrow Keys to Move, Press Y to Fire\n' +
            'Tapping/clicking does both',
            {
                font: '20px monospace', fill: '#fff', align: 'center'
            }
        );
        this.instructions.anchor.setTo(0.5, 0.5);
        this.instExpire = this.time.now + BasicGame.INSTRUCTION_EXPIRE;

        this.angleDiffText = this.add.text(
            this.game.width / 2, 30, '',
            {font: '20px monospace', fill: '#fff', align: 'center'}
        );
        this.angleDiffText.anchor.setTo(0.5, 0.5);

        this.rayAngleText = this.add.text(
            this.game.width / 2, 60, '',
            {font: '20px monospace', fill: '#fff', align: 'center'}
        );
        this.rayAngleText.anchor.setTo(0.5, 0.5);

        this.watcherAngleText = this.add.text(
            this.game.width / 2, 90, '',
            {font: '20px monospace', fill: '#fff', align: 'center'}
        );
        this.watcherAngleText.anchor.setTo(0.5, 0.5);
    }
    ,

    setupLines: function () {
        this.bitmap = this.game.add.bitmapData(this.game.width, this.game.height);
        this.bitmap.context.fillStyle = 'rgb(255, 255, 255)';
        this.bitmap.context.strokeStyle = 'rgb(255, 255, 255)';
        this.game.add.image(0, 0, this.bitmap);
    },

    updateWatchers: function () {
        this.setWatcherMovement();
        this.checkWatcherVision();

        this.watcherPool.forEachAlive(function (watcher) {
            Watcher.updateLastPos(watcher);
        }, this);
    },

    setWatcherMovement: function () {
        this.watcherPool.forEachAlive(function (watcher) {
            Watcher.patrol(watcher);
        }, this);
    },

    checkCollisions: function () {
        this.physics.arcade.collide(this.player, this.wallPool);
        this.physics.arcade.overlap(
            this.player, this.goal, this.loadNextLevel, null, this
        );
    },

    loadNextLevel: function () {
        window.alert("You win!");
    },

//from gamemechanicsexplorer
    checkWatcherVision: function () {
        // Clear the bitmap where we are drawing our lines
        this.bitmap.context.clearRect(0, 0, this.game.width, this.game.height);

        // Ray casting!
        // Test if each person can see the ball by casting a ray (a line) towards the ball.
        // If the ray intersects any walls before it intersects the ball then the wall
        // is in the way.
        this.watcherPool.forEach(function (watcher) {
            // Define a line that connects the watcher to the ball
            // This isn't drawn on screen. This is just mathematical representation
            // of a line to make our calculations easier. Unless you want to do a lot
            // of math, make sure you choose an engine that has things like line intersection
            // tests built in, like Phaser does.
            var ray = new Phaser.Line(watcher.x, watcher.y, this.player.x, this.player.y);


            var rayAngle = Phaser.Math.radToDeg(ray.angle); //line.angle is in radians

            // ensure rayAngle goes from 0 -> 180 and 0 -> -180
            if (rayAngle < 0) {
                rayAngle = rayAngle + 360;
            }

            // Angle of where the watcher looks compared to player position; looking str8 @ u = 0°
            // right behind is +/- 180°
            var visionAngleDiff = (rayAngle - watcher.angle) - 90;

            // ensure visionAngleDiff goes from 0 -> 180 and 0 -> -180
            if (visionAngleDiff > 180) {
                visionAngleDiff -= 360;
            }

            // if player isn't in watcher's cone of vision, return
            if (!(visionAngleDiff <= BasicGame.WATCHER_VISION_DEGREE && visionAngleDiff >= -BasicGame.WATCHER_VISION_DEGREE)) {
                watcher.tint = 0xffffff;
                return null;
            }

            // Test if any walls intersect the ray
            var intersect = this.getWallIntersection(ray);

            if (intersect) {
                // A wall is blocking this persons vision so change them back to their default color
                watcher.tint = 0xffffff;
            } else {
                // This watcher can see the player so change their color
                watcher.tint = 0xffaaaa;
                this.angleDiffText.text = "angleDiff: " + visionAngleDiff;
                this.rayAngleText.text = "rayAngle: " + rayAngle + " / originalAngle: " + Phaser.Math.radToDeg(ray.angle);
                this.watcherAngleText.text = "watcherAngle: " + watcher.angle;

                // Draw a line from the ball to the watcher
                this.bitmap.context.beginPath();
                this.bitmap.context.moveTo(watcher.x, watcher.y);
                this.bitmap.context.lineTo(this.player.x, this.player.y);
                this.bitmap.context.stroke();

                this.onPlayerSpotted();
            }
        }, this);

        // This just tells the engine it should update the texture cache
        this.bitmap.dirty = true;
    },

    onPlayerSpotted: function () {
        this.player.x = this.game.width / 2;
        this.player.y = this.game.height - 50;
    },

    render: function () {

    },


    processPlayerInput: function () {
        this.player.body.velocity.x = 0;
        this.player.body.velocity.y = 0;

        if (this.cursors.left.isDown || this.input.keyboard.isDown(Phaser.Keyboard.A)) {
            this.player.body.velocity.x = -this.player.speed;
        } else if (this.cursors.right.isDown || this.input.keyboard.isDown(Phaser.Keyboard.D)) {
            this.player.body.velocity.x = this.player.speed;
        }

        if (this.cursors.up.isDown || this.input.keyboard.isDown(Phaser.Keyboard.W)) {
            this.player.body.velocity.y = -this.player.speed;
        } else if (this.cursors.down.isDown || this.input.keyboard.isDown(Phaser.Keyboard.S)) {
            this.player.body.velocity.y = this.player.speed;
        }
        if (this.input.activePointer.isDown &&
            this.physics.arcade.distanceToPointer(this.player) > 15) {
            this.physics.arcade.moveToPointer(this.player, this.player.speed);
        }

        if (this.input.keyboard.isDown(Phaser.Keyboard.Y) ||
            this.input.activePointer.isDown) {
            if (this.returnText && this.returnText.exists) {
                this.quitGame();
            }
        }
    }
    ,


    processDelayedEffects: function () {
        if (this.instructions.exists && this.time.now > this.instExpire) {
            this.instructions.destroy();
        }

        if (this.ghostUntil && this.ghostUntil < this.time.now) {
            this.ghostUntil = null;
            this.player.play('fly');
        }

        if (this.showReturn && this.time.now > this.showReturn) {
            this.returnText = this.add.text(
                this.game.width / 2, this.game.height / 2 + 20,
                'Press Z or Tap Game to go back to Main Menu',
                {font: '16px sans-serif', fill: '#fff'}
            );
            this.returnText.anchor.setTo(0.5, 0.5);
            this.showReturn = false;
        }
    }
    ,


    quitGame: function (pointer) {
        // Here you should destroy anything you no longer need.
        // Stop music, delete sprites, purge caches, free resources, all that good stuff.
        this.ground.destroy();
        this.player.destroy();
        this.instructions.destroy();
        this.angleDiffText.destroy();
        this.returnText.destroy();

        // Then let's go back to the main menu.
        this.state.start('MainMenu');
    }

}
;
