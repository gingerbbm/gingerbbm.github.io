//
// KNOW THE BOARD
//
// 2016.08.29    2.1    First version going up.
// 2016.08.30    2.2    Supporting 4, 5 and 7 strings.
//
// (c) Stuart Jones, until I've had time to look into CC licenses, hosting on github, etc.
//

var bpm = 60;
var bps = 2;  // 1, 2 or 4
var spg = 6;  // 4, 5, 6 or 7

// Mid and end points for each number of strings supported.
var string_mid = { 4: 2, 5: 3, 6: 4, 7: 4 }; // access with string_mid[spg]
var string_end = { 4: 4, 5: 5, 6: 6, 7: 7 }; // access with string_end[spg]

var CROTCHET = "&#9834;";
var FLAT = "&#9837;";
var SHARP = "&#9839;";

var audio;

var allnotes = [
	[0, "C"],
	[1, "C#"], [1, "Db"],
	[2, "D"], 
	[3, "D#"], [3, "Eb"],
	[4, "E"],
	[5, "F"],
	[6, "F#"], [6, "Gb"],
	[7, "G"], 
	[8, "G#"], [8, "Ab"],
	[9, "A"],
	[10, "A#"], [10, "Bb"],
	[11, "B"]
];

var notes; // array of arrays of note ID and note name
var phase; // countin, nownote, finishing.
var cnt_bps;
var cnt_countin;
var cnt_note;
var cnt_string;
var nownote = "";
var nextnote = "";
var timer;
var starting_now = false;


/**
 * When the HTML is loaded, wire up the event handlers and initialise stuff.
 */
window.onload = function () {

	applyCookiesToSettings();
	toggleStrings(getSelectedRBG("fSPG", 6));
	
	//
	// The Info button.
	//
	document.getElementById("info_button").addEventListener("click", showInfo);

	//
	// The close button on the info panel.
	//
	document.getElementById("info_close").addEventListener("click", hideInfo);

	//
	// The Settings button.
	//
	document.getElementById("settings_button").addEventListener("click", showSettings);
		
	//
	// The label for the BPM slider.
	//
	var o = document.getElementById("settings_bpm_display");
	var i = document.getElementById("fBPM");
	o.innerHTML = i.value;
	i.addEventListener("input", function () { o.innerHTML = i.value; } );

	//
	// The apply button on the settings panel.
	//
	document.getElementById("settings_apply").addEventListener("click", function () { 
		createCookie("bpm", document.getElementById("fBPM").value, 1000);
		createCookie("bps", getSelectedRBG("fBPS", 1), 1000);
		createCookie("spg", getSelectedRBG("fSPG", 6), 1000);
		toggleStrings(getSelectedRBG("fSPG", 6));
		hideSettings();
	} ); 

	//
	// The cancel button on the settings panel.
	//
	document.getElementById("settings_cancel").addEventListener("click", function () { 
		applyCookiesToSettings();
		hideSettings();
	} );

	//
	// The button to start the show.
	//
	document.getElementById("butt").addEventListener("click", start); 

	audio = new Audio('tick.mp3');
}

/**
 * Helper to get the selected "value" of the the passed-in radio button group.
 */
function getSelectedRBG(elName, defaultValue) {
	var rbg_value = defaultValue; // Initialise just in case.
	if (document.getElementsByName(elName)) {
		var rbs = document.getElementsByName(elName);
		for (var i = 0; i < rbs.length; i++) {
			if (rbs[i].checked) {
				rbg_value = rbs[i].value;
			}
		}
	}
	return rbg_value;
}

/**
 * Adjust the number of strings (blue dots) in the UI.
 */
function toggleStrings(n) {
	document.getElementById("string5").style.display = (n <= 4) ? "none" : "inline-block";
	document.getElementById("string6").style.display = (n <= 5) ? "none" : "inline-block";
	document.getElementById("string7").style.display = (n <= 6) ? "none" : "inline-block";
}

/**
 * Start the show.
 */
function start() {
	initialise();
	notes = getTwelveNotes(allnotes);
	bpm = readCookie("bpm") != null ? readCookie("bpm") : document.getElementById("fBPM").value;
	bps = readCookie("bps") != null ? readCookie("bps") : getSelectedRBG("fBPS", 1);
	spg = readCookie("spg") != null ? readCookie("spg") : getSelectedRBG("fSPG", 1);
	var INTERVAL = 60 / bpm * 1000;

	var butt = document.getElementById("butt");
	butt.removeEventListener("click", start);
	document.getElementById("settings_button").removeEventListener("click", showSettings);
	document.getElementById("info_button").removeEventListener("click", showInfo);

	initialiseNotes();
	initialiseStrings();
	
	timer = window.setInterval(function(){ tick() }, INTERVAL);   
}

/**
 * Abort the show.
 */
function abort () {
	clearInterval(timer);
	initialise();
	reset();
};

/**
 * Initialise vars.
 */
function initialise() {
	
	phase = "countin";
	cnt_bps = 1;
	cnt_countin = 0;
	cnt_note = 0;
	cnt_string = 1;
	nownote = "";
	nextnote = "";
	
};

/**
 * Reset screen state.
 */
function reset() {
	
	document.getElementById("notelabel").innerHTML = "KNOW THE BOARD";
	document.getElementById("notemain").innerHTML = CROTCHET;
	document.getElementById("notemain").classList.remove("go");
	document.getElementById("notesub").innerHTML = CROTCHET;
	document.getElementById("notesub").classList.remove("go");
	
	initialiseNotes();
	initialiseStrings();
	
	var butt = document.getElementById("butt");
	butt.innerHTML = "START";
	butt.classList.remove("abort");
	butt.removeEventListener("click", abort);
	butt.addEventListener("click", start);
	
	document.getElementById("settings_button").addEventListener("click", showSettings);
	document.getElementById("info_button").addEventListener("click", showInfo);

};


/**
 *
 */
function showSettings () {
	document.getElementById("settings_panel").classList.add("panel-revealer");	
	document.getElementById("settings_button").removeEventListener("click", showSettings);
		
	document.getElementById("butt").removeEventListener("click", start);
	document.getElementById("butt").classList.add("disable");

	document.getElementById("info_button").removeEventListener("click", showInfo);
}

/**
 *
 */
function hideSettings () {
	document.getElementById("settings_panel").classList.remove("panel-revealer");		
	document.getElementById("settings_button").addEventListener("click", showSettings);

	document.getElementById("butt").addEventListener("click", start);
	document.getElementById("butt").classList.remove("disable");

	document.getElementById("info_button").addEventListener("click", showInfo);

}

/**
 *
 */
function showInfo () {
	document.getElementById("info_panel").classList.add("panel-revealer");	
	document.getElementById("info_button").removeEventListener("click", showInfo);
	
	document.getElementById("butt").removeEventListener("click", start);
	document.getElementById("butt").classList.add("disable");

	document.getElementById("settings_button").removeEventListener("click", showSettings);
}

/**
 *
 */
function hideInfo () {
	document.getElementById("info_panel").classList.remove("panel-revealer");	
	document.getElementById("info_button").addEventListener("click", showInfo);

	document.getElementById("butt").addEventListener("click", start);
	document.getElementById("butt").classList.remove("disable");

	document.getElementById("settings_button").addEventListener("click", showSettings);
}


/**
 * If we have BPM and BPS and SPG stored in cookies, apply them to the UI elements.
 */
function applyCookiesToSettings() {

	// Beats per minute.
	if (readCookie("bpm")) {
		document.getElementById("settings_bpm_display").innerHTML = readCookie("bpm");
		document.getElementById("fBPM").value = readCookie("bpm");		
	}
	
	// Beats per string.
	if (readCookie("bps")) {
		var cookie_bps = readCookie("bps");
		if (cookie_bps == 1) {
			document.getElementById("fBPS_1").checked = true;
		} else if (cookie_bps == 2) {
			document.getElementById("fBPS_2").checked = true;
		} else if (cookie_bps == 4) {
			document.getElementById("fBPS_4").checked = true;
		}
	}
	
	// Strings per guitar.
	if (readCookie("spg")) {
		var cookie_spg = readCookie("spg");
		if (cookie_spg == 4) {
			document.getElementById("fSPG_4").checked = true;
		} else if (cookie_spg == 5) {
			document.getElementById("fSPG_5").checked = true;
		} else if (cookie_spg == 6) {
			document.getElementById("fSPG_6").checked = true;
		} else if (cookie_spg == 7) {
			document.getElementById("fSPG_7").checked = true;
		}
	}	
}


/**
 * The main method.
 */
function tick() {

	audio.play();

	switch(phase) {


		case "countin":            
			cnt_countin++;
            document.getElementById("butt").innerHTML = 5 - cnt_countin;

            nownote = notes[cnt_note][1];
            document.getElementById("notemain").innerHTML = nownote;

            document.getElementById("notelabel").innerHTML = "FIRST UP";

			if (cnt_countin == 4) {
				// Special case - kind of reset the first note
				cnt_note--;

				// Set the next phase!
				phase = "nownote";
				starting_now = true;
			}
            break;



		case "nownote":
			if (starting_now) {
				var butt = document.getElementById("butt");
				butt.innerHTML = "ABORT";
				butt.classList.add("abort");
				butt.removeEventListener("click", start);
				butt.addEventListener("click", abort);
				starting_now = false;
			}
		
			//
			// First - handle dead ticks if necessary.
			//
			if (bps > 1) {
				if (cnt_bps > 1) {
					if (cnt_bps == bps) {
						cnt_bps = 1;
					} else {
						cnt_bps++;
					}
					return;            
				}
            }


			switch (cnt_string) {

				//
				// The first string is always number 1.
				//
				case 1: 
					cnt_note++;
					nownote = notes[cnt_note][1];
					document.getElementById("notemain").innerHTML = nownote;
					document.getElementById("notemain").classList.add("go");
					document.getElementById("notesub").classList.remove("go");
					document.getElementById("notelabel").innerHTML = "GO!";
                    
                    initialiseStrings();
					document.getElementById("string" + cnt_string).classList.add("string-fill");

					document.getElementById("note" + notes[cnt_note][0]).classList.add("note-fill");

					cnt_string++;
					break;


				//
				// The "mid" string changes according to SPG.
				//
				case string_mid[spg]: 
					//
					// Demote the "now" note and cue up the next one.
					//
					document.getElementById("notemain").innerHTML = (cnt_note < 11) ? notes[cnt_note+1][1] : CROTCHET;
					document.getElementById("notemain").classList.remove("go");

					document.getElementById("notesub").classList.add("go");
					document.getElementById("notesub").innerHTML = nownote;
					document.getElementById("notelabel").innerHTML = "NEXT UP";
					document.getElementById("string" + cnt_string).classList.add("string-fill");
					cnt_string++;
					break;

				//
				// The last string is always the total number of strings (i.e. SPG) but
				// we can't use a variable here, so need another array lookup.
				//
				case string_end[spg]: 
					document.getElementById("string" + cnt_string).classList.add("string-fill");
					cnt_string = 1;
					break;


				default:
					document.getElementById("string" + cnt_string).classList.add("string-fill");
					cnt_string++;
					break;
            
            
            }; // end switch
            
			//
			// Last - handle dead ticks if necessary.
			//
			if (bps > 1) cnt_bps++;

			//
			// Even laster - set the next phase!
			//
            if (cnt_note == 11 && cnt_string == 1) {
				phase = "finishing";
            }            
            break;


		case "finishing":
			document.getElementById("notelabel").innerHTML = "YOU'RE DONE";
			document.getElementById("notesub").innerHTML = CROTCHET;		        																document.getElementById("notesub").classList.remove("go");
			clearInterval(timer);
			
			var butt = document.getElementById("butt");
			butt.innerHTML = "START AGAIN";
			butt.classList.remove("abort");
			butt.removeEventListener("click", abort);
			butt.addEventListener("click", start);

			document.getElementById("settings_button").addEventListener("click", showSettings);
			document.getElementById("info_button").addEventListener("click", showInfo);			
            break;
        
    } // end switch
}

/**
 * Reset all the note indicators.
 */
function initialiseNotes(){
	for (var i = 0; i <= 11; i++){
		document.getElementById("note" + i).classList.remove("note-fill");
	}
}

/**
 * Reset all the string indicators.
 */
function initialiseStrings(){
	for (var i = 1; i <= spg; i++){
		document.getElementById("string" + i).classList.remove("string-fill");
	}
}

/**
 * Takes an array containing all notes including enharmonic ones. Returns a shuffled
 * version with only one of each enharmonic variation.
 */
function getTwelveNotes(array) {
	var shuffled = shuffle(array);
	var done_1 = false;
	var done_3 = false;
	var done_6 = false;
	var done_8 = false;
	var done_10 = false;
	var theTwelve = [];
	for (var i = 0; i < array.length; i++) {
		switch (shuffled[i][0]) {
			case 1: // C# Db
				if (!done_1) {
					theTwelve.push(shuffled[i]);
					done_1 = true; 
				}
				break;
				
			case 3: // D# Eb
				if (!done_3) {
					theTwelve.push(shuffled[i]);
					done_3 = true; 
				}
				break;

			case 6: // F# Gb
				if (!done_6) {
					theTwelve.push(shuffled[i]);
					done_6 = true; 
				}
				break;

			case 8: // G# Ab
				if (!done_8) {
					theTwelve.push(shuffled[i]);
					done_8 = true; 
				}
				break;

			case 10: // A# Bb
				if (!done_10) {
					theTwelve.push(shuffled[i]);
					done_10 = true; 
				}
				break;
				
			default: // Keep all the other notes!
				theTwelve.push(shuffled[i]);
				break;
				
		}
	}
	return theTwelve;
}


/**
 * Shuffle the passed-in arrary and return.
 */
function shuffle(arr) {
  var currentIndex = arr.length
    , temporaryValue
    , randomIndex
    ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = arr[currentIndex];
    arr[currentIndex] = arr[randomIndex];
    arr[randomIndex] = temporaryValue;
  }

  return arr;
}

// --------
/**
 * PPK's create cookie method.
 */
function createCookie(name,value,days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	}
	else var expires = "";
	document.cookie = name+"="+value+expires+"; path=/";
}

/**
 * PPK's read cookie method.
 */
function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

/**
 * PPK's erase cookie method.
 */
function eraseCookie(name) {
	createCookie(name,"",-1);
}
