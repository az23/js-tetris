//Generic Eight-Bit Audio System()
//v0.4x?
//Az23
var playing =false;
var interval;

var actx =  new window.AudioContext();
var anal = actx.createAnalyser(); //for scope
var musicVol= actx.createGain();
musicVol.connect(anal);
musicVol.gain.value=0.75;
var sfxVol = actx.createGain();
sfxVol.connect(anal);
var gebas =true;
var title="No Trackname found!";
anal.fftSize = 2048;
anal.connect(actx.destination);

var numSamples =0;
var loadedSamples =0;

var samples=[]; 
loadSample('samples/move.mp3',0,0,0);
loadSample('samples/land.mp3',1,0,0);
loadSample('samples/line.mp3',2,0,0);
loadSample('samples/tetris.mp3',3,0,0);
loadSample('samples/level.mp3',4,0,0);
loadSample('samples/gameover.mp3',5,0,0);
loadSample('samples/rotate.mp3',6,0,0);
loadSample('samples/pause.mp3',7,0,0);





var dlen = 0.03;
var baseFreq = 8.1758; //midi note 0 in hz
var doneIndex=[];
var noteMult = 1.0595; //Actually a Dodectave (1.0595^12 ~~2)
var startTime=false;
var pauseTime=false;
var endTime;
var tracks = 0;
var data;
var tChange =[];

function loadSample(file,index,note,lStart,lEnd){
	numSamples++;
	var xhttp = new XMLHttpRequest();
	xhttp.open('GET',file,true);
	xhttp.responseType = 'arraybuffer';
	xhttp.onload = function() {
			actx.decodeAudioData(xhttp.response, function(buffer) {
				loadedSamples++;
				samples[index] ={data:buffer,name:name,note:note,lStart:lStart,lEnd,lEnd};
				if(numSamples == loadedSamples){begin()}
			 });
		}
	xhttp.send();
}

function formatTime(time){
	var min = Math.floor(time /60);
	var sec = Math.floor(time % 60);
	if(sec<10){sec ="0"+sec;}
	return min+ " : "+sec;
}

function updateStatus(){
	time = actx.currentTime - startTime;
	document.getElementById("status").innerHTML = "Playing: "+title+" "+formatTime(time)+" || "+formatTime(endTime)+" @"+currentSpeed()+" BPM";
	
}

function currentSpeed(){
	let time = actx.currentTime - startTime;
	
	let tick = 0;
	tChange.forEach(function(c,i,a){
		if(ticksToSec(c.time) < time && ticksToSec(c.end) > time){
			tick = c.tick; 
		}
	})
	return Math.round((1/(tick * data.header.division))*60);
	
}

function fixTimeArray(){
	tChange.forEach(function(c,i,a){if(a[i+1]){c.end = a[i+1].time;}});
	var end=0;
	data.trackData.forEach(function(c,i,a){
		if(c.meta.length>0){
			if(c.meta[c.meta.length-1].time>end){
				end=c.meta[c.meta.length-1].time;
			}
		}
	});
	tChange[tChange.length-1].end = end;
	endTime =ticksToSec(end);	
}

function ticksToSec(ticks){
	var secs =0;
	var counted =0;
	
	if(tChange.length <1 || ticks < tChange[0].end){ //ez mode all at first speed
		return ticks * tChange[0].tick;
	}
	else{
		var i =0;
		while(counted < ticks && i < tChange.length){
			var len = tChange[i].end - tChange[i].time;
			if(len >= (ticks-counted)){ 
				secs += tChange[i].tick * (ticks - counted);
				return secs;
			}
			else{
				secs += tChange[i].tick*len;
				counted += len;
			}
			i++;
		}
	} 
	return secs;
}


function playNote(vol,note, start, end,type){
	if(end>start){ 
		if(type=="triangle"){vol=vol*2}
		let freq = baseFreq * Math.pow(noteMult,note);
		gain = actx.createGain();
		gain.gain.value = vol/2048;
		gain.connect(musicVol);
		meh = actx.createOscillator();
		meh.frequency.value = freq;
		meh.type =type;
		meh.connect(gain);
		meh.start(start);
		meh.stop(end);
		
	}
}

function noiseGen(vol,start,end){
	if(end>start){
		gain = actx.createGain();
		gain.gain.value = vol/2048;
		gain.connect(musicVol);
		var buffer = actx.createBuffer(1, (end-start)*22500, 22500);
		var arry = buffer.getChannelData(0);
		for(var i=0;i<arry.length;i++){
			arry[i] = Math.random() * 2 - 1;
		}
		var source = actx.createBufferSource();
		source.buffer = buffer;
		source.connect(gain);
		source.start(start);
		end = start +dlen;
		source.stop(end);
	}
}
//load midi file into midiData

function LoadMidi(buffer){
	console.log("Attempting to Decode MIDI");
	midiData = buffer;
	meh = decodeMIDI(midiData);
	if(meh){
		console.log("midiDecoder Reports Success!");
		console.log("Tracks: " + meh.header.tracks);
		tracks = meh.header.tracks;
		console.log("TPQN: " + meh.header.division);
		doneIndex = new Array(); //reset
		tChange = new Array();
		for(let i=0;i<meh.header.tracks;i++){
			console.log("Notes on track "+i+": " +meh.trackData[i].notes.length);
			doneIndex.push(0);
		}
		for(let i=0; i<meh.trackData[0].meta.length;i++){		
			if(meh.trackData[0].meta[i].type2 =="TEXT" ||meh.trackData[0].meta[i].type2 =="TRACKNAME"){
				title=meh.trackData[0].meta[i].data;
				console.log(title);
				break;
			}
		}
		for(let i=0; i<meh.trackData[0].meta.length;i++){	
			if(meh.trackData[0].meta[i].type2 == "TEMPO"){
				tick = meh.trackData[0].meta[i].uspq/meh.header.division;
				tick = tick/1e6;
				tChange.push({time:meh.trackData[0].meta[i].time,tick:tick});
				}
		}
		
		data = meh;
		fixTimeArray();
		startTime =false;
		//setInterval(play,50);
	}
	else{
		console.log("midiDecoder Failed!");
	}
}	
	
function play(){
	playing = !playing;
	if (playing){
		startTime = false;
		interval=setInterval(doGebas,50)
	}
	else{
		 clearInterval(interval);
	}

	
}

function pauseMusic(){
	playing = !playing;
	if(!playing){//pause
		clearInterval(interval);
		pauseTime = actx.currentTime - startTime;
		musicVol.gain.value=0;
	}
	else{//unpause
		startTime = actx.currentTime - pauseTime;
		musicVol.gain.value=0.75;
		doGebas();
		interval=setInterval(doGebas,50);
	}
}
	
	
function doGebas(){
	now = actx.currentTime;
	til = actx.currentTime +.5;//.5s buffer
	if(!startTime|| now>(endTime+startTime)){startTime =now; doneIndex.forEach(function(c,i,a){a[i]=0;});} //loop
	for(i=0; i<tracks;i++){ //for each track
		for (var j = doneIndex[i]; j<data.trackData[i].notes.length;j++){
			if((ticksToSec(data.trackData[i].notes[j].time)) +startTime > til){}
			else{
				start= startTime+ticksToSec(data.trackData[i].notes[j].time);
				end = startTime+ticksToSec(data.trackData[i].notes[j].end);
				vol =data.trackData[i].notes[j].vel;
				if(data.trackData[i].notes[j].channel !=9){ //chan 9 is drums
					//freq = baseFreq * Math.pow(noteMult, data.trackData[i].notes[j].note);
					let sample =-1;
					let type="square";
					if(data.trackData[i].notes[j].patch >=33 && data.trackData[i].notes[j].patch <=40){ //bass
						sample =8;
						type="square";
						vol = vol *3;
					}
					else{
						if(data.trackData[i].notes[j].patch >=49 && data.trackData[i].notes[j].patch <=56){//voices
							sample =12;
							type="square";
							vol = vol *8;
						}
				
						else{
							if (data.trackData[i].notes[j].patch ==31){
								sample =1;
								type="sawtooth"
							}
							else{sample =11; vol=vol*1; type="square";}
						}
					}
					
					note = data.trackData[i].notes[j].note;
						if(!gebas){
							detune =(data.trackData[i].notes[j].note-samples[sample].note)*100
							playSample(sample,start,detune,vol,end,true);}
						else{
						playNote(data.trackData[i].notes[j].vel,note, start, end,type);
						}
					
				}
				else{
					switch(data.trackData[i].notes[j].note){ //Drums
						case 35:
							playSample(0,start,1,512,end,false);
						break;
						case 36:
							playSample(0,start,1.123,512,end,false);
						break;
						case 38:
							playSample(2,start,1,512,end,false);
						break;
						case 39:
							playSample(3,start,1,512,end,false);
						break;
						case 40:
							playSample(2,start,1.123,512,end,false);
						break;
						case 41:
							playSample(0,start,1.261,512,end,false);
						break;
						case 42:
							playSample(4,start,1,512,end,false);
						break;
						case 43:
							playSample(0,start,1.416,512,end,false);
						break;
						case 44:
							playSample(6,start,1,512,end,false);
						break;
						case 45:
							playSample(0,start,1.590,512,end,false);
						break;
						case 46:
							playSample(7,start,1,512,end,false);
						break;
						case 47:
							playSample(0,start,1.786,512,end,false);
						break;
						case 48:
							playSample(0,start,2.006,512,end,false);
						break;
						case 49:
							playSample(5,start,1,512,end,false);
						break;
						case 40:
							playSample(0,start,2.252,512,end,false);
						break;
						case 57:
							playSample(5,start,1.123,512,end,false);
						break;
						default:
							noiseGen(data.trackData[i].notes[j].vel,start,end);
					}
				}
				doneIndex[i]++;
			}
		}
	}
	//updateStatus();
}


function playSample(sample,when,detune,vol,end,loop){
	var source =  actx.createBufferSource();
	var gain = actx.createGain();
	gain.gain.value = vol/1024;
	gain.connect(anal);
	source.connect(gain);
	source.detune.value = detune;
	source.loop=loop;
	source.buffer = samples[sample].data;
	if(samples[sample].lStart){
		source.loopStart = samples[sample].lStart;
		source.loopEnd = samples[sample].lEnd;
	}
	source.start(when);
	
	if(end>0){source.stop(end)}
}