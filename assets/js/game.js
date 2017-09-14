var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

document.body.appendChild(canvas);

// Background image
var bgReady = false;
var bgImage = new Image();

bgImage.onload = function(){
	bgReady = true;
};

bgImage.src = "assets/img/background.png";

// Player image
var playerReady = false;
var playerImage = new Image();

playerImage.onload = function(){
	playerReady = true;
};

playerImage.src = "assets/img/player.png";

// Enemy image
var enemyReady = false;
var enemyImage = new Image();

enemyImage.onload = function(){
	enemyReady = true;
};

enemyImage.src = "assets/img/monster.png";

// Game objects
var Hero = function(){
	this.size    = 32; // Size in pixels of image
	this.speed   = 200; // movement in pixels per second
	this.health  = 100;
	this.spawned = false;

	this.x = Math.round(this.size + (Math.random() * (canvas.width - 64)));
	this.y = Math.round(this.size + (Math.random() * (canvas.height - 64)));
};

var Enemy = function(){
	this.size    = 32;
	this.speed   = 100;
	this.health  = 100;
	this.action  = 'wander';
	this.spawned = false;

	this.moveTo = {
		x: null,
		y: null
	};

	this.config = {
		attack: {
			damage: 50,
			distance: 175
		}
	};

	this.x = this.size + (Math.random() * (canvas.width - 64));
	this.y = this.size + (Math.random() * (canvas.height - 64));
};

var keysDown = {};
var NPCEntities = [];
var Player = new Hero();

var score = 0;
var showScore = false;

var enemyCur = 0;
var enemyMax = 400;

addEventListener("keydown", function(e){
	keysDown[e.keyCode] = true;
}, false);

addEventListener("keyup", function(e){
	delete keysDown[e.keyCode];
}, false);

var reset = function(){
	if(!Player.spawned){
		Player.x = canvas.width / 2;
		Player.y = canvas.height / 2;
		
		Player.spawned = true;
	}

	// Spawn more enemies
	while(enemyCur != enemyMax){
		NPCEntities.push(new Enemy());
		enemyCur++;
	}

	// Garbage collect dead NPC's
	for(var i = 0; i != NPCEntities.length; i++){
		if(NPCEntities[i] !== undefined){
			if(NPCEntities[i].health <= 0){
				NPCEntities.splice(i, 1);
			}
		}
	}
};

// Update game objects
var update = function(modifier){
	// Collision detection
	checkWallCollision(Player);
	checkWallCollision(NPCEntities);

	AIHandler();

	// Player holding up
	if(38 in keysDown) Player.y -= Player.speed * modifier;

	// Player holding down
	if(40 in keysDown) Player.y += Player.speed * modifier;

	// Player holding left
	if(37 in keysDown){
		if((38 || 40) in keysDown){
			Player.x -= Player.speed * modifier;
		}
		else {
			Player.x -= Player.speed * modifier;
		}
	}

	// Player holding right
	if(39 in keysDown){
		if((38 || 40) in keysDown){
			Player.x += Player.speed * modifier;
		}
		else {
			Player.x += Player.speed * modifier;
		}
	}

	if(17 in keysDown){
		showScore = true;
	}
	else if(showScore){
		showScore = false;
	}

	function getEntitiesDistance(ent1, ent2){
		return Math.round(Math.sqrt(Math.pow((ent2.x - ent1.x), 2) + Math.pow((ent2.y - ent1.y), 2)));
	}

	function AIHandler(){
		for(var i = 0; i != NPCEntities.length; i++){
			if(NPCEntities[i] !== undefined){
				if(checkEntitiesCollision(NPCEntities[i], Player)){
					NPCEntities[i].health = 0;

					enemyCur--;
					score++;

					reset();
				}

				if(NPCEntities[i].moveTo.x == null || NPCEntities[i].moveTo.y == null){
					NPCEntities[i].moveTo.x = Math.round(NPCEntities[i].size + (Math.random() * (canvas.width - 64)));
					NPCEntities[i].moveTo.y = Math.round(NPCEntities[i].size + (Math.random() * (canvas.height - 64)));
				}
			
				AIThink(NPCEntities[i]);
			}
		}
	}

	function AIThink(entity){
		// Check if entity is in distance of player
		if(getEntitiesDistance(entity, Player) < entity.config.attack.distance){
			entity.action = 'attack';
		}
		else {
			entity.action = 'wander';
		}

		switch(entity.action){
			case 'wander':
				aiWalk(entity);
				break;
			case 'attack':
				moveToTarget(entity, Player);
				break;
			case 'idle':
				// do idle stuff
				break;
		}
	}

	function aiWalk(entity){
		if(entity !== undefined){
			if(Math.round(entity.x) == entity.moveTo.x && Math.round(entity.y) == entity.moveTo.y){
				entity.moveTo.x = null;
				entity.moveTo.y = null;
			}
			else {
				moveToTarget(entity, entity.moveTo);
			}
		}
	}

	function moveToTarget(entity, target){
		if(entity.length === undefined){
			if(Math.round(entity.y) != Math.round(target.y)){
				if(entity.y <= target.y){
					entity.y += entity.speed * modifier;
				}
				else {
					entity.y -= entity.speed * modifier;
				}
			}
			
			if(Math.round(entity.x) != Math.round(target.x)){
				if(entity.x <= target.x){
					entity.x += entity.speed * modifier;
				}
				else {
					entity.x -= entity.speed * modifier;
				}
			}
		}
		else {
			for(var i = 0; i != entity.length; i++){
				if(Math.round(entity[i].y) != Math.round(target.y)){
					if(entity[i].y <= target.y){
						entity[i].y += entity[i].speed * modifier;
					}
					else {
						entity[i].y -= entity[i].speed * modifier;
					}
				}
				
				if(Math.round(entity[i].x) != Math.round(target.x)){
					if(entity[i].x <= target.x){
						entity[i].x += entity[i].speed * modifier;
					}
					else {
						entity[i].x -= entity[i].speed * modifier;
					}
				}
			}
		}
	}

	function checkWallCollision(ent){
		if(ent.length === undefined){
			if(ent.y <= 0) ent.y = 0;
			if(ent.y >= (canvas.height - ent.size)) ent.y = (canvas.height - ent.size);
		
			if(ent.x <= 0) ent.x = 0;
			if(ent.x >= (canvas.width - ent.size)) ent.x = (canvas.width - ent.size);
		}
		else {
			// Check collisions for multiple entities
			for(var i = 0; i != ent.length; i++){
				if(ent[i] !== undefined){
					if(ent[i].y <= 0) ent[i].y = 0;
					if(ent[i].y >= (canvas.height - ent[i].size)) ent[i].y = (canvas.height - ent[i].size);
		
					if(ent[i].x <= 0) ent[i].x = 0;
					if(ent[i].x >= (canvas.width - ent[i].size)) ent[i].x = (canvas.width - ent[i].size);
				}
			}
		}
	}

	function checkEntitiesCollision(ent1, ent2){
		if(ent1 !== undefined && ent2 !== undefined){
			if(ent1.x <= (ent2.x + ent2.size) && ent2.x <= (ent1.x + ent1.size) && ent1.y <= (ent2.y + ent2.size) && ent2.y <= (ent1.y + ent1.size)) return true;
		}

		return false;
	}
};

// Draw everything
var render = function(){
	if(bgReady) ctx.drawImage(bgImage, 0, 0);

	if(playerReady) ctx.drawImage(playerImage, Player.x, Player.y);

	if(enemyReady){
		for(var i = 0; i != NPCEntities.length; i++){
			// Draw all NPCEntities
			if(NPCEntities[i] !== undefined) ctx.drawImage(enemyImage, NPCEntities[i].x, NPCEntities[i].y);
		}
	}

	if(showScore){
		ctx.fillStyle = "rgb(250, 250, 250)";
		ctx.font = "24px Helvetica";
		ctx.textAlign = "left";
		ctx.textBaseline = "top";
		ctx.fillText("Score: " + score, 32, 32);
	}
	else {
		ctx.fillText("", 32, 32);
	}
};

// The main game loop
var main = function(){
	var now = Date.now();
	var delta = now - then;

	update(delta / 1000);
	render();

	then = now;

	// Request to do this again ASAP
	requestAnimationFrame(main);
};

// Cross-browser support for requestAnimationFrame
var w = window;

requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

// Let's play this game!
var then = Date.now();

reset();
main();
