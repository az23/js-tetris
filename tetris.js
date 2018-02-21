//Browser Tetris
//az23
"use strict";
//globals
const version = 1.32;
var pf;
var c;
var ctx;
var bricks;
var next;
var cur ;

var bg = new Image();
bg.src = "bg.png";
var tiles = new Image();
tiles.src = "bricks.png"
var font = new Image();
font.src = "font.png"
var border = new Image();
border.src = "border.png"
var gSet ={cellW:8,gridX:8,gridY:0,border:0};
var game ={level:0,score:0,lines:0,rows:18,cols:10,state:"init"};
var scores =[0,40,100,300,1200];

function begin(){
	init(190,game.rows*(gSet.cellW+gSet.border));
}

function init(w,h){
	setListeners();
	newPlayfield(game.cols,game.rows);
	bricks =createBricks();
	cur = copyBrick(newBrick());
	next = copyBrick(newBrick());
	createCanvas(w,h);
	introScreen();
	setTimeout(draw,2500,w,h);
	setTimeout(startGame,3000);
	setTimeout(play,3000);
}

function abutton(){
	if(game.state=="live" &&cur){
		rotateBrick(cur);
		playSample(6,0,0,512,0,false);	
	}
}
function bbutton(){
	if(game.state=="live" && cur){
		rotateBrick(rotateBrick(rotateBrick(cur)))
		playSample(6,0,0,512,0,false);
	}	
}

function moveLeft(){
	if(game.state=="live"&& cur){
		if(canMove(cur,(cur.x)-1,cur.y)){
			cur.x--;
			playSample(0,0,0,512,0,false);
		}
	}
}
function moveRight(){
	if(game.state=="live" && cur){
		if(canMove(cur,(cur.x)+1,cur.y)){
			cur.x++;
			playSample(0,0,0,512,0,false);
		}
	}
}
function moveDown(){
	if(game.state=="live" && cur){
		if(canMove(cur,cur.x,(cur.y)+1)){
			cur.y++;
		}
	}
}
//get key presses
function setListeners(){
	window.onkeydown = function (e) {
		e.preventDefault();
		let key = e.keyCode;
		switch (key) {
		case 32:
			pauseGame();
			break;
		case 37:
			moveLeft();
			break;
		case 38:
			abutton();
			break;
		case 39://right
			moveRight();
			break;
		case 40://down
			moveDown();
			break;
		}
	};
}

function pauseGame(){
	if(game.state != "live" && game.state != "paused"){return;}
	if(game.state=="live"){
		game.state="paused";
	}
	else{
		game.state="live"
	}
	playSample(7,0,0,512,0,false);
	pauseMusic();
}


function startGame(){
	game.state="live";
	doGame();
}
//per gameclock
function doGame(){
	if(game.state=="live"){
		if(!cur){
			cur = copyBrick(next);
			next = newBrick();
		}
		if(canMove(cur,cur.x,(cur.y +1))){
			cur.y++;
			setTimeout(doGame,300-(game.level*20));
		}
		else{
			if(cur.y>0){
				if(!placeBrick(cur,cur.x,cur.y)){
					setTimeout(doGame,300-(game.level*10));
				}
				cur = false;
			}
			else{
				//Game Over
				game.state ="over";
				play(); //stop music
				playSample(5,0,0,512,0,false);
			}
		}	
	}
}
//Define the shapes of the tetromimos
function createBricks(){
	let bricks = new Array;
	bricks.push({shape:[[1,1],[1,1]],colour:1}); //square
	bricks.push({shape:[[10,11,11,12]],colour:7});	//long (note:colour is unused apart from detecting straight block)
	bricks.push({shape:[[5,5,0],[0,5,5]],colour:5})//S
	bricks.push({shape:[[0,6,6],[6,6,0]],colour:6})//Z
	bricks.push({shape:[[0,2,0],[2,2,2]],colour:2})//T
	bricks.push({shape:[[4,4],[0,4],[0,4]],colour:4})//L
	bricks.push({shape:[[3,3],[3,0],[3,0]],colour:3})//Shit L
	return bricks;
}
function newBrick(){
	let r = bricks[Math.floor(Math.random()*7)];
	r.x=4;
	r.y=0;
	for(let i= Math.floor(Math.random()*4);i>0;i--){
		r=rotateBrick(r);
	}
	
	return r;
} 

//Rotate brick 90degrees (Clockwise)
//rotateBrick(rotateBrick(rotateBrick(brick))) will do ACw
//Swaps rows and columns ie 2x3 array -> 3x2 array
//Read inners backwards
function rotateBrick(brick){
	if(!brick){return true;}
	let rows = brick.shape.length;
	let cols = brick.shape[0].length;
	let output = new Array;
	for(let i=0; i<cols ; i++){
	//make array, push to output
		let col = new Array;
		for(let j=rows-1; j>=0; j--){
			let tile = brick.shape[j][i];
			switch(tile){ //Straight block is awkward
				case 7:
					tile=12;
				break;
				case 8:
					tile=11;
				break;
				case 9:
					tile=10;
				break;
				case 10:
					tile=7;
				break;
				case 11:
					tile=8;
				break;
				case 12:
					tile=9;
				break;
			}
			col.push(tile);
		}
		output.push(col);
	}
	let temp ={shape:output};
	
	//Adjust x pos of straight brick
	if(brick.colour==7){
		if(brick.shape.length==1){
			if(canMove(temp,brick.x+2,brick.y)){
				brick.shape = output;
				brick.x+=2;
			}
		}
		else{
			if(canMove(temp,brick.x-2,brick.y)){
				brick.shape = output;
				brick.x-=2;
			}
		}
	}
	
	
	
	else{
		if(canMove(temp,brick.x,brick.y)){
			brick.shape = output;
		}
	}
	return brick;
}


//can a brick be moved to a position?
function canMove(brick, x,y){
	if(!brick){return true;}
	//playfield bounds check 
	if(x<0 || y<0 || x > (pf.length - brick.shape[0].length) || y>(pf[0].length - brick.shape.length)){
		return false;
	}
	//check brick shape and playfield for colisions
	for(let i=0; i<brick.shape.length;i++){ //r
		for(let j=0; j<brick.shape[0].length;j++){// c
			if(brick.shape[i][j] > 0 && pf[x+j][y+i] > 0){
				return false;
			}
		}
	}
	return true;
}

//I know this is hacky af, but it is the *easiest* way to get a copy of an obj
function copyBrick(brick){
	return JSON.parse(JSON.stringify(brick));
}

//"Land" a brick
function placeBrick(brick,x,y){
	for(let i=0;i<brick.shape.length;i++){
		for(let j=0;j<brick.shape[0].length;j++){
			if(brick.shape[i][j]>0){
				pf[x+j][y+i]=brick.shape[i][j];
			}
		}
	}
	playSample(1,0,0,512,0,false);	
	return checkLines(y,brick.shape.length);	
}

function checkLines(height,number){
	let removed =[];
	let copies= [];
	for(let i=height;i<height+number;i++){
		let full =true;
		for(let j=0; j< pf.length;j++){
			if(pf[j][i]==0){
				full = false;	
			}
		}
		if(full){
			let dupe=[]						//copy out the line for reuse
			for(let k=0;k<pf.length; k++){
				dupe.push(pf[k][i])
			}
			copies.push(dupe)
			removed.push(i);
		}
	}
	if(removed.length>0 && removed.length<4){
		playSample(2,0.4,0,512,0,false);	
	}
	if(removed.length==4){
		playSample(3,0.4,0,512,0,false);	
	}
	removeLines(removed,copies,0);
	if(removed.length>0){
	 return true;
	}
	return false;
}

//Pause game logic, animate removal of lines
function removeLines(lines,copies,f){
	
	if(lines.length<1){
	 return;
	}
	if(f>15){
		lines.forEach(function(c,i,a){
			removeLine(c);
		});
		game.state = "live";
		game.lines += lines.length;
		game.score += scores[lines.length]*(game.level+1);
		if(game.level != Math.floor(game.lines/10)){
			game.level = Math.floor(game.lines/10);
			playSample(4,0,0,512,0,false);
		}
		setTimeout(doGame,300-(game.level*10));
	}
	else{
		game.state="busy";
		lines.forEach(function(c,i,a){
			
				for(let j=0; j<pf.length;j++){
					if(f%2==0){
						pf[j][c]=0;
					}
					else{
						pf[j][c] = copies[i][j];
					}
				}
			
			
		});
		f++;
		setTimeout(removeLines,64,lines,copies,f)
	}
	
}

//remove a line, shift others
function removeLine(y){
	let shifted = false;
	for(let i=y;i>0;i--){
		for(let j=0;j<pf.length;j++){
			if(pf[j][i-1]>0){
				shifted = true;
			}
			pf[j][i]=pf[j][i-1];
		}
	}
	if(shifted){
		playSample(8,0,0,512,0,false);
	}
}

//Empty playfield - init/reset
function newPlayfield(cols,rows){
	pf = new Array();
	for(let i=0; i<cols; i++){
		let col = new Array(rows);
		for(let j=0;j<col.length; j++){
			col[j] = 0;
		}
		pf.push(col);
	}	
}

/*!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!! DRAWING/GFX CODE							 !! 
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/
//per frame
function draw(w,h){
	if(game.state=="paused"){
		ctx.drawImage(bg,0,0);
		ctx.save();
		ctx.translate(32,64);
		drawString("paused");
		ctx.restore();
		//drawPlayField(w,h);
		drawStatus();
	}
	else{
		ctx.drawImage(bg,0,0);
		drawPlayField(w,h);
		drawCur();
		drawNext();
		drawStatus();
		
	}
	requestAnimationFrame(draw,w,h);
}
//create canvas element to draw to
function createCanvas(w,h){
	c =  document.createElement('canvas');
	c.style.position ="absolute";
	c.style.top="115px";
	c.style.left="130px";
	c.width  = w;
	c.style.width  = "260px";
	c.height = h;
	c.style.height = "232px";
	ctx = c.getContext("2d");
	document.getElementById("gb").appendChild(c);
}

function drawString(s){
	s = s.toUpperCase();
	ctx.save();
	for(let i=0;i<s.length;i++){
		let code=s.charCodeAt(i);
		if(code==32){code =37;}
		if(code==46){code =36;}
		if(code>=48 && code<=57){code -=48;}
		if(code>=65 && code <=90){code -=55;}
		if(code>37 || code<0){code=0;} 
		ctx.drawImage(font,8*code,0,8,8,0,0,8,8);
		ctx.translate(8,0);
	}
	ctx.restore();
}
//Draw the current brick in play
function drawCur(){
	ctx.save();
	ctx.translate(gSet.gridX+gSet.cellW,gSet.gridY);//move to pf
	ctx.translate(((gSet.cellW+gSet.border)*cur.x),(gSet.cellW+gSet.border)*cur.y);// move to position
	drawBrick(cur);
	ctx.restore();
}
function drawNext(){
	ctx.save();
	ctx.translate((gSet.gridX+(gSet.border+gSet.cellW)*game.cols)+2*(gSet.cellW+gSet.border),(game.rows-6)*(gSet.cellW+gSet.border));
	ctx.translate(16,-8);
	
	ctx.translate(0,gSet.border+gSet.cellW*2);
	drawBrick(next);
	ctx.restore();
}
function drawStatus(){
	ctx.save();
	ctx.translate((gSet.gridX+(gSet.border+gSet.cellW)*game.cols)+2*(gSet.cellW+gSet.border),gSet.gridY+gSet.border+gSet.cellW);
	ctx.translate(8,0);
	drawString("SCORE");
	ctx.translate(0,16);
	drawString(""+game.score);
	ctx.translate(0,22);
	drawString("lines");
	ctx.translate(0,8);
	drawString(""+game.lines);
	ctx.translate(0,16);
	drawString("LEVEL");
	ctx.translate(0,8);
	drawString(""+game.level);
	ctx.restore();

}
//draw a brick at current position of ctx
function drawBrick(brick){
	if(!brick){return;}
	for(let i=0; i<brick.shape.length;i++){ //r
		ctx.save();
		for(let j=0;j<brick.shape[0].length;j++){//c
			if(brick.shape[i][j]>=1){
				ctx.drawImage(tiles,gSet.cellW*brick.shape[i][j],0,gSet.cellW,gSet.cellW,0,0,gSet.cellW,gSet.cellW);

			}
			ctx.translate(gSet.cellW+gSet.border,0);
		}
		ctx.restore();
		ctx.translate(0,gSet.cellW+gSet.border);
	}
}

//width,height
function drawPlayField(w,h){
	ctx.save();
	ctx.fillStyle = "#C8D868";
	ctx.fillRect(0,0,w,h);
	drawGrid(gSet.gridX,gSet.gridY,game.cols,game.rows); 
	ctx.restore();
}

//xoffset, yoffset, width, height, rows, cols 
function drawGrid(x,y,r,c){
	ctx.save();
	ctx.translate(x,y); // move to position
	ctx.save();
	for(let i=0; i<(c/3);i++){
		ctx.translate((r+1)*(gSet.cellW+gSet.border),0);
		ctx.translate(0-((r+1)*(gSet.cellW+gSet.border)),0);
		ctx.translate(0,8*3);
	}
	ctx.restore();
	ctx.translate(gSet.cellW,0);

	for(let i=0; i<r;i++){ // for each row
		ctx.save();
		for(let j=0; j<c;j++){ // for each column			
			ctx.drawImage(tiles,gSet.cellW*pf[i][j],0,gSet.cellW,gSet.cellW,0,0,gSet.cellW,gSet.cellW);
			ctx.translate(0,gSet.cellW+gSet.border);
		}
		ctx.restore();
		ctx.translate(gSet.cellW+gSet.border,0)
	}
	ctx.restore();
}

function drawCString(s){
	ctx.save();
	ctx.translate(((23-s.length)/2)*8,0)
	drawString(s);
	ctx.restore();
}
function introScreen(){
	let strings= ["AZ23 PRESENTS","A TEAM ZEGGY PRODUCTION","2017 2018 BY AZ23"," ","JS TETRIS","USES","MIDIDECODER V1.03A","AND","GEBAS 0.4","BY AZ23"," ","GFX SFX STOLEN FROM","GAMEBOY GAME"," ","ARROW KEYS TO MOVE","SPACE TO PAUSE"];
    ctx.save();
	ctx.fillStyle = "#C8D868";
	ctx.fillRect(0,0,1024,1024);
	ctx.translate(4,0);
	drawString("v "+version);
	
	strings.forEach(function(c,i,a){
		ctx.translate(0,8);
		drawCString(c);
	})
	
	ctx.restore();
}