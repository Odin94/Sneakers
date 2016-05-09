BasicGame.Game = function (game) {

};

BasicGame.Game.prototype = {

    create: function () {
        this.currentLevel = 1;

        this.createLevel("level1");
        this.setupPlayerIcons();
        this.setupText();
        this.setupLines();

        this.cursors = this.input.keyboard.createCursorKeys();
    },

    createLevel: function (filename) {
        /**
         * @param levelData
         * @param levelData.player1Spawn
         * @param levelData.player2Spawn
         * @param levelData.walls
         * @param levelData.walls.startX
         * @param levelData.walls.endX
         * @param levelData.walls.startY
         * @param levelData.disappearingWalls
         * @param levelData.disappearingWalls.startX
         * @param levelData.disappearingWalls.endX
         * @param levelData.disappearingWalls.startY
         * @param levelData.disappearingWalls.appearTime
         * @param levelData.disappearingWalls.disappearTime
         * @param levelData.watchers
         * @param levelData.goal
         */
        this.levelData = JSON.parse(this.game.cache.getText(filename));

        //set background; TODO: make more backgrounds and load them from the JSON level-files
        this.ground = this.add.tileSprite(0, 0, this.game.width, this.game.height, 'ground');

        this.setupMap();
        this.setupWatchers();
        this.setupText();

        this.player1 = this.add.sprite(this.levelData.player1Spawn.x, this.levelData.player1Spawn.y, 'player');
        this.player2 = this.add.sprite(this.levelData.player2Spawn.x, this.levelData.player2Spawn.y, 'player');
        this.setupplayer(this.player1);
        this.setupplayer(this.player2);
    },

    update: function () {
        this.checkCollisions();
        this.checkGoals();
        this.updateWatchers();
        this.updateDisappearingWalls();
        this.processplayer1Input();
        this.processplayer2Input();
        this.processDelayedEffects();
    },

    setupMap: function () {
        this.setupWalls();
        this.setupGoals();
    },

    setupGoals: function () {
        var goalData = this.levelData.goal;

        this.goal1 = this.add.sprite(goalData.x1, goalData.y1, 'goal');
        this.setGoalAttributes(this.goal1);

        this.goal2 = this.add.sprite(goalData.x2, goalData.y2, 'goal');
        this.setGoalAttributes(this.goal2);
    },

    setGoalAttributes: function (goal) {
        goal.touchedByPlayer = false;
        goal.anchor.setTo(0.5, 0.5);
        this.physics.enable(goal, Phaser.Physics.ARCADE);
    },

    //maybe split this function up for all sub-walls?
    setupWalls: function () {
        var i, j, k = undefined;

        this.wallPool = this.add.group();
        this.wallPool.enableBody = true;
        this.wallPool.physicsBodyType = Phaser.Physics.ARCADE;
        this.wallPool.createMultiple(BasicGame.MAX_WALL_COUNT, 'wall1');

        this.wallPool.forEach(function (wall) {
            wall.body.immovable = true;
        });

        var walls = this.levelData.walls;

        for (i = 0; i < walls.length; i++) {
            var wall = walls[i];
            if (typeof wall.endX === 'undefined') {
                wall.endX = wall.startX;
            }
            if (typeof wall.endY === 'undefined') {
                wall.endY = wall.startY;
            }

            for (j = wall.startX; j <= wall.endX; j++) {
                for (k = wall.startY; k <= wall.endY; k++) {
                    this.spawnWall(j, k);
                }
            }
        }

        //setup disappearingWalls
        var disappearingWalls = this.levelData.disappearingWalls;

        this.disappearingWallPool = this.add.group();
        this.disappearingWallPool.createMultiple(BasicGame.MAX_DISAPPEARING_WALL_COUNT);
        for (i = 0; i < disappearingWalls.length; i++) {
            var disWall = disappearingWalls[i];
            for (j = disWall.startX; j <= disWall.endX; j++) {
                this.spawnDisappearingWall(j, disWall.startY);
            }
        }

        //setup pressurePlates
        this.pressurePlatePool = this.add.group();
        this.pressurePlatePool.enableBody = true;
        this.pressurePlatePool.physicsBodyType = Phaser.Physics.ARCADE;
        this.pressurePlatePool.createMultiple(BasicGame.MAX_PRESSURE_PLATE_COUNT, 'pressure_plate');

        this.spawnPressurePlate(0, 0, [{x: 0, y: 3}], [{x: 3, y: 0}], true);

        this.spawnPressurePlate(15, 0, [{x: 15, y: 2}], [{x: 15, y: 1}], false);
    },

    spawnWall: function (x, y) {
        if (this.wallPool.countDead() > 0) {
            var wall = this.wallPool.getFirstExists(false);

            wall.reset(x * BasicGame.WALL_WIDTH, y * BasicGame.WALL_HEIGHT);
            return wall;
        }
    },

    spawnDisappearingWall: function (x, y) {
        if (this.disappearingWallPool.countDead() > 0
            && this.wallPool.countDead() > 0) {

            var disWall = this.disappearingWallPool.getFirstExists(false);
            disWall.reset(x, y);

            var wall = this.spawnWall(x, y);
            DisappearingWall.setDisWall(disWall, wall, Phaser.Timer.SECOND, Phaser.Timer.SECOND);

            return disWall;
        }
    },

    spawnPressurePlate: function (pressurePlateX, pressurePlateY, killWallCoords, spawnWallCoords, permanent) {
        if (this.pressurePlatePool.countDead() > 0
            && this.wallPool.countDead() > 0) {

            var presPlate = this.pressurePlatePool.getFirstExists(false);
            presPlate.reset(pressurePlateX * BasicGame.WALL_WIDTH, pressurePlateY * BasicGame.WALL_HEIGHT);

            var killWalls = []; //walls that are killed when plate is pressed

            for (var i = 0; i < killWallCoords.length; i++) {
                killWalls.push(this.spawnWall(killWallCoords[i].x, killWallCoords[i].y))
            }

            PressurePlate.setPressurePlate(presPlate, killWalls, spawnWallCoords, permanent);

            return presPlate;
        }
    },

    setupWatchers: function () {
        this.watcherPool = this.add.physicsGroup();
        this.watcherPool.createMultiple(BasicGame.MAX_WATCHER_COUNT, 'greenEnemy');
        this.watcherPool.setAll('anchor.x', 0.5);
        this.watcherPool.setAll('anchor.y', 0.5);

        var watchers = this.levelData.watchers;

        for (var i = 0; i < watchers.length; i++) {
            this.spawnWatcher(watchers[i]);
        }
    },

    spawnWatcher: function (watcherData) {
        if (this.watcherPool.countDead() > 0) {
            var watcher = this.watcherPool.getFirstExists(false);

            watcher.reset(watcherData.x * BasicGame.WALL_WIDTH, watcherData.y * BasicGame.WALL_HEIGHT);
            Watcher.setWatcher(watcher, watcherData.patrolActions);
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

    setupplayer: function (player) {
        player.anchor.setTo(0.5, 0.5);

        player.animations.add('fly', [0, 1, 2], 20, true);
        player.animations.add('ghost', [3, 0, 3, 1], 20, true);
        player.play('fly');

        this.physics.enable(player, Phaser.Physics.ARCADE);
        player.speed = BasicGame.PLAYER_SPEED;
        player.body.collideWorldBounds = true;
        // 20 x 20 pixel hitbox, centered a little bit higher than the center
        player.body.setSize(20, 20, 0, -5);
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
        // Countdown timer for reset when spotted for player1 and player2
        this.spottedTimerText1 = this.add.text(this.game.width / 4, this.game.height / 2 - 50, ""
            , {
                font: '60px monospace', fill: '#fff', align: 'center'
            });
        this.spottedTimerText1.anchor.setTo(0.5, 0.5);
        this.spottedTimerText1.alpha = 0.75;

        this.spottedTimerText2 = this.add.text(this.game.width / 2 + this.game.width / 4, this.game.height / 2 - 50, ""
            , {
                font: '60px monospace', fill: '#fff', align: 'center'
            });
        this.spottedTimerText2.anchor.setTo(0.5, 0.5);
        this.spottedTimerText2.alpha = 0.75;


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
            Watcher.update(watcher);
        }, this);
    },

    updateDisappearingWalls: function () {
        this.disappearingWallPool.forEachAlive(function (disWall) {
            DisappearingWall.changeAppearance(disWall, this);
        }, this);
    },

    checkCollisions: function () {
        this.physics.arcade.collide(this.player1, this.wallPool);
        this.physics.arcade.collide(this.player2, this.wallPool);

        var self = this;
        this.physics.arcade.overlap(
            this.player1, this.goal1, function () {
                self.goal1.touchedByPlayer = true
            }, null, this
        );
        this.physics.arcade.overlap(
            this.player2, this.goal2, function () {
                self.goal2.touchedByPlayer = true
            }, null, this
        );

        //TODO: reconsider if this really belongs here; it's not a collision but more of a collision-based trigger I think
        this.pressurePlatePool.forEachAlive(function (presPlate) {
            if (self.physics.arcade.overlap(self.player1, presPlate)
                || self.physics.arcade.overlap(self.player2, presPlate)) {

                if (!presPlate.triggered) {
                    PressurePlate.trigger(presPlate, self);
                }
            }
            else {
                if(presPlate.triggered) {
                    PressurePlate.unTrigger(presPlate, self);
                }
            }

            /*self.physics.arcade.overlap(
             self.player1, presPlate, function () {
             PressurePlate.trigger(presPlate, self);
             }, null, presPlate
             );*/
        });

    },

    checkGoals: function () {
        if (this.goal1.touchedByPlayer && this.goal2.touchedByPlayer) {
            this.loadNextLevel();
        }
        else {
            this.goal1.touchedByPlayer = false;
            this.goal2.touchedByPlayer = false;
        }
    },

    loadNextLevel: function () {
        this.clearLevel();

        this.currentLevel++;
        this.createLevel("level" + this.currentLevel);
    },

    clearLevel: function () {
        this.disappearingWallPool.forEachAlive(function (x) {
            x.destroy();
        });
        this.wallPool.forEachAlive(function (x) {
            x.destroy();
        });
        this.watcherPool.forEachAlive(function (x) {
            x.destroy();
        });
        this.player1.destroy();
        this.player2.destroy();
    },

    checkWatcherVision: function () {
        // Clear the bitmap where we are drawing our lines
        this.bitmap.context.clearRect(0, 0, this.game.width, this.game.height);

        this.watcherPool.forEach(function (watcher) {
            this.watchForPlayer(watcher, this.player1);
            this.watchForPlayer(watcher, this.player2);
        }, this);

        // This just tells the engine it should update the texture cache
        this.bitmap.dirty = true;
    }
    ,

    watchForPlayer: function (watcher, player) {
        var ray = new Phaser.Line(watcher.x, watcher.y, player.x, player.y);

        var rayAngle = Phaser.Math.radToDeg(ray.angle); //line.angle is in radians

        // ensure rayAngle goes from 0 -> 180 and 0 -> -180
        if (rayAngle < 0) {
            rayAngle = rayAngle + 360;
        }

        // Angle of where the watcher looks compared to player1 position; looking str8 @ u = 0°
        // right behind is +/- 180°
        var visionAngleDiff = (rayAngle - watcher.angle) - 90;

        // ensure visionAngleDiff goes from 0 -> 180 and 0 -> -180
        if (visionAngleDiff > 180) {
            visionAngleDiff -= 360;
        }

        var intersect = this.getWallIntersection(ray);

        // if player isn't in watcher's cone of vision, return
        if (intersect || !(visionAngleDiff <= BasicGame.WATCHER_VISION_DEGREE && visionAngleDiff >= -BasicGame.WATCHER_VISION_DEGREE)) {
            if (player == this.player1 && watcher.spotsPlayer1) {
                watcher.spotsPlayer1 = false;
                this.spottedTimerText1.text = "";
            }
            else if (player == this.player2 && watcher.spotsPlayer2) {
                watcher.spotsPlayer2 = false;
                this.spottedTimerText2.text = "";
            }

            return null;
        } else {
            // This watcher can see the player so change their color
            watcher.tint = 0xffaaaa;
            /*this.angleDiffText.text = "angleDiff: " + visionAngleDiff;
             this.rayAngleText.text = "rayAngle: " + rayAngle + " / originalAngle: " + Phaser.Math.radToDeg(ray.angle);
             this.watcherAngleText.text = "watcherAngle: " + watcher.angle;*/

            // Draw a line from the player to the watcher
            this.bitmap.context.beginPath();
            this.bitmap.context.moveTo(watcher.x, watcher.y);
            this.bitmap.context.lineTo(player.x, player.y);
            this.bitmap.context.stroke();

            //TODO: solve this in a more elegant way; maybe give watchers a "playersBeingSpotted"-list
            //TODO: and check against that instead of "if player1spotted"
            if (player == this.player1) {
                this.onPlayer1Spotted(watcher);
            }
            else if (player == this.player2) {
                this.onPlayer2Spotted(watcher);
            }
        }
    },


    //TODO: Unify onPlayer1Spotted and onPlayer2Spotted; having to methods do the same is super inelegant :/
    onPlayer1Spotted: function (watcher) {
        if (watcher.spotsPlayer1) {
            this.spottedTimerText1.text = (Math.round((watcher.spotTimer - this.time.now) / 1000 * 100) / 100).toFixed(2);
            if (watcher.spotTimer < this.time.now) {
                this.player1.x = this.levelData.player1Spawn.x;
                this.player1.y = this.levelData.player1Spawn.y;
            }
        } else {
            watcher.spotsPlayer1 = true;
            watcher.spotTimer = this.time.now + BasicGame.WATCHER_SPOT_TIME;
        }
    }
    ,

    onPlayer2Spotted: function (watcher) {
        if (watcher.spotsPlayer2) {
            this.spottedTimerText2.text = (Math.round((watcher.spotTimer - this.time.now) / 1000 * 100) / 100).toFixed(2);
            if (watcher.spotTimer < this.time.now) {
                this.player2.x = this.levelData.player2Spawn.x;
                this.player2.y = this.levelData.player1Spawn.y;
            }
        } else {
            watcher.spotsPlayer2 = true;
            watcher.spotTimer = this.time.now + BasicGame.WATCHER_SPOT_TIME;
        }
    }
    ,

    render: function () {

    }
    ,


    processplayer1Input: function () {
        this.player1.body.velocity.x = 0;
        this.player1.body.velocity.y = 0;

        if (this.input.keyboard.isDown(Phaser.Keyboard.A)) {
            this.player1.body.velocity.x = -this.player1.speed;
        } else if (this.input.keyboard.isDown(Phaser.Keyboard.D)) {
            this.player1.body.velocity.x = this.player1.speed;
        }

        if (this.input.keyboard.isDown(Phaser.Keyboard.W)) {
            this.player1.body.velocity.y = -this.player1.speed;
        } else if (this.input.keyboard.isDown(Phaser.Keyboard.S)) {
            this.player1.body.velocity.y = this.player1.speed;
        }

        if (this.input.activePointer.isDown &&
            this.physics.arcade.distanceToPointer(this.player1) > 15) {
            this.physics.arcade.moveToPointer(this.player1, this.player1.speed);
        }
    }
    ,

    processplayer2Input: function () {
        this.player2.body.velocity.x = 0;
        this.player2.body.velocity.y = 0;

        if (this.cursors.left.isDown) {
            this.player2.body.velocity.x = -this.player2.speed;
        } else if (this.cursors.right.isDown) {
            this.player2.body.velocity.x = this.player2.speed;
        }

        if (this.cursors.up.isDown) {
            this.player2.body.velocity.y = -this.player2.speed;
        } else if (this.cursors.down.isDown) {
            this.player2.body.velocity.y = this.player2.speed;
        }

    }
    ,


    processDelayedEffects: function () {
    }
    ,


    quitGame: function (pointer) {
        // Here you should destroy anything you no longer need.
        // Stop music, delete sprites, purge caches, free resources, all that good stuff.
        this.ground.destroy();
        this.player1.destroy();
        this.angleDiffText.destroy();

        // Then let's go back to the main menu.
        this.state.start('MainMenu');
    }

}
;
