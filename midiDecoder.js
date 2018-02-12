//MidiDecoder V1.03a (Getting instrument data)
//Az23
//I would have thought the webmidi api would have done this
//
"use strict";
//Give me an ArrayBuffer full of midi file
function decodeMIDI(midiData){	
	let abstime =0; 				//Ticks since beginning
	let fp = 0;  					//filepointer
	let runS=0;						//Running status
	let patches = new Array(16);	//Running status of each channel's patch
	let dv = new DataView(midiData);
	let header = decodeMidiHeader();
	if(!header){return false;}
	let track = 0;
	let trackData =[]; 
	while(track < header.tracks){
		patches.forEach(function(c,i,a){a[i]=0});
		abstime=0;
		let t= decodeTrack();
		if(t){
			trackData.push(t);
			track++;
		}	
		else{console.log("Track Header Expected, But Not Found");}	
	}
	return{header:header,trackData:trackData};
	
	function decodeTrack(){
		let tdata={ons:[],offs:[],meta:[]};
		let length = decodeTrackHeader();
		if(!length){return false;}
		let eot= fp+length;
		let c=1;
		while(fp<eot){
			let e = readEvent();
			c++;
			if(typeof e !=="undefined"){
				if(e.type=="ON"){tdata.ons.push(e);}
				if(e.type=="OFF"){tdata.offs.push(e);}
				if(e.type=="META"&&e.type2!=="MEH"){tdata.meta.push(e);}
			}
		}
		
		return{notes:combineNotes(tdata.ons,tdata.offs),meta:tdata.meta};
		
		//Decodes Track header or says nope
		function decodeTrackHeader(){
			let length = 0;
			if(0x4D54726B == dv.getInt32(fp)){ //"MTrk"
					fp += 4;
					length = dv.getInt32(fp);fp += 4;
					return length;
			}
			else{
				console.log("No Track header found");
				return false;
			}
			
		}
	}
	
	function readEvent(){
		let etime = readVarLen();
		abstime += etime;
		let etype= dv.getUint8(fp);
		let elen =0;
		var edata = [];
		if(etype > 0x7F){ //Status byte
			fp++;	
			runS = etype; //Running status
		}
		if(etype >= 0xF0){
			if(etype == 0xF0 || 0xF7 == etype){
				let q=readVarLen();
				fp += q; //readVarLen();// skip over the data
				return{type:"SYSEX"};
			}
			if(etype == 0xFF){
				let etype2 =dv.getUint8(fp);
				fp++;
				elen = readVarLen();
				while(elen >0){
					edata.push(dv.getUint8(fp));
					elen --;
					fp++;
				}
				return decodeMeta(edata,etype2,abstime); 
			}
		}
		else{ //Actual midi event
			if(etype<0xB0){ 	//message is continuation of prev
				etype = runS;	//etype is actually data
								//don't increment fp
			}
			if(etype >= 0xC0 && etype <= 0xDF){ //these only have one byte of data
				let patch=dv.getUint8(fp);
				fp ++; //skip data 
				//0xCn is program (instrument) change for channel n 
				if(etype<0xD0){
					patches[etype-0xC0]=patch;
					return {type:"META", type2:"PATCH",time:abstime,patch:patch,channel:(etype-0xC0)};
					
				}
				else{return {type:"MEH"};}
			}
			else{
				var byte1 = dv.getUint8(fp);
				var byte2 = dv.getUint8(fp+1);  //If Zero turns note on into note off
				fp+=2;
				if(etype >= 0x90 && etype<= 0x9F){ //msn =command  ,lsn channel
					if(byte2>0){
						return{type:"ON",channel:etype - 0x90, note:byte1, time:abstime, vel:byte2, patch:patches[etype-0x90]};
					}
					else{
						return{type:"OFF",channel:etype - 0x90,note:byte1,time:abstime, vel:byte2};
					}
				}
				if(etype >= 0x80 && etype<= 0x8F){// actual note off command
					return{type:"OFF",channel:etype - 0x80,note:byte1,time:abstime, vel:byte2};
				}	
			}
		}	
	}
	//Reads variable length value from current position of fp
	//High bit set read another byte 
	//low 7 bits are number
	function readVarLen(){
		var t = dv.getUint8(fp);fp++;
		if(t<128){return t;}
		else{
			var buffer =[];
			while(t>127){
				buffer.push(t^128);
				t = dv.getUint8(fp);fp++;
			}
			while(buffer.length>0){
				t+=Math.pow(128,buffer.length)*buffer.shift();
			}
	
			return t;
		}
	}
	//Test for/decode Midi header
	function decodeMidiHeader(){
		let header={};
		if(0x4D546864 == dv.getInt32(fp)){//"MThd"
			fp += 4;
			header.length = dv.getUint32(fp);fp += 4;
			header.format = dv.getUint16(fp);fp += 2;
			header.tracks = dv.getUint16(fp);fp += 2;
			header.division = dv.getUint16(fp);fp +=2;
			if(header.division>0x7FFF){console.log("WARNING: SMPTE timing not supported");}
			return header;
		}
		else{
			console.log("MIDI header not found");
			return false;
		}
	}
}

//Combine note ons and note offs
function combineNotes(ons,offs){
	for(let i =0;i<ons.length;i++){
		for(let j=0;j<offs.length;j++){
			if(ons[i].channel == offs[j].channel && ons[i].note ==offs[j].note){
				ons[i].end = offs[j].time;
				offs.splice(j, 1);
				break;
			}
		}
	}
	return ons;
}

//Decyphers meta events
//Note: some are ignored
function decodeMeta(data,type,abstime){
		switch(type){
			case 1:
				return{type:"META",type2:"TEXT",data:String.fromCharCode.apply(String, data)};
			break; 
			case 2:
				return{type:"META",type2:"COPY",data:String.fromCharCode.apply(String, data)};
			break; 
			case 3:
				return{type:"META",type2:"TRACKNAME",data:String.fromCharCode.apply(String, data)};
			break; 
			case 4:
			return{type:"META",type2:"INSTRUMENT",data:String.fromCharCode.apply(String, data)};
			break; 
			case 5:
				return{type:"META",type2:"LYRIC",data:String.fromCharCode.apply(String, data),time:abstime};
			break; 
			case 6:
				return{type:"META",type2:"MARK",data:String.fromCharCode.apply(String, data),time:abstime};
			break; 
			case 7:
				return{type:"META",type2:"CUE",data:String.fromCharCode.apply(String, data),time:abstime};
			break; 
			case 32:
				return{type:"META",type2:"CHAN",data:data[0],time:abstime};
			break; 
			case 47:
				return{type:"META",type2:"EOT",time:abstime};
			break; 
			case 81:
				var ms =0;
				ms += (data[0] * 65536);
				ms += (data[1] * 256);
				ms += data[2];
				return{type:"META",type2:"TEMPO",uspq:ms,time:abstime};
			break; 
			case 84:
				console.log("OFFSET"+data[0]+" "+data[1]+" "+data[2]+" "+data[3]+" "+data[4]);
				return{type:"META",type2:"OFFSET"};
			break;
			default:
				return{type:"META",type2:"MEH"};
		}
}