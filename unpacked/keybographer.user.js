// ==UserScript==
// @name Keybographer for Klavogonki
// @namespace   klavogonki
// @description A script to record, analyze and present the keybogarm of a Klavogonki race.
// @author MMMAAANNN
// @license https://creativecommons.org/licenses/by-sa/4.0/
// @grant none
// @version 0.0.8.4
// @include http://klavogonki.ru/g/*
// @run-at      document-end
// ==/UserScript==

function mainK() {
    Keybographer = {    

        verboseStatus: false,

        keybogram: [],

        watchedTarget: document.getElementById('inputtext'),

        interimReports: 0,

        status: function(message){
            document.getElementById('keybographerStatus').innerHTML = message;
        },

        initialize: function (){
            var keybogramShower = document.createElement('div');
            keybogramShower.id = 'keybogramShower';
            document.getElementById('status-block').appendChild(keybogramShower);

            var keybographerStatus = document.createElement('div');
            keybographerStatus.innerHTML = 'Keybographer status line initialized.';
            keybographerStatus.id = 'keybographerStatus';
            keybogramShower.appendChild(keybographerStatus);

            var keyboAnalysis = document.createElement('div');
            keyboAnalysis.id = 'keyboAnalysis';
            keyboAnalysis.style.display = 'none';
            keyboAnalysis.innerHTML = '<b>Keybogram Analysis</b>';
            keybogramShower.appendChild(keyboAnalysis);

            var keyboDetail = document.createElement('div');
            keyboDetail.id = 'keyboDetail';
            keyboDetail.style.display = 'none';
            keyboDetail.innerHTML = '<b>Detailed Keybogram</b>';
            keybogramShower.appendChild(keyboDetail);

            var keyboTable = document.createElement('table');
            keyboTable.id = 'keyboTable';
            keyboTable.setAttribute('border', '1px');
            keyboDetail.appendChild(keyboTable);

            Keybographer.lag = false;
            this.record();
        },

        record: function () {
            this.status('Keybographer is waiting for the start of the race...');
            this.watchedTarget.addEventListener('keydown',  this.eventRecorder, true);
            this.watchedTarget.addEventListener('keypress', this.eventRecorder, true);
            this.watchedTarget.addEventListener('keyup',    this.eventRecorder, true);
            this.watchedTarget.addEventListener('focus',    this.eventRecorder, true);
            this.watchedTarget.addEventListener('blur',     this.eventRecorder, true);
            this.timer = setInterval(Keybographer.initiateAnalysis, 500);
        },

        eventRecorder: function(event) {
            if (Keybographer.verboseStatus) {
                Keybographer.status('Recording event no. ' + (Keybographer.keybogram.length + 1));
            } else {
                Keybographer.status('...');
            }
            if (event.type === 'keypress' && !Keybographer.lag) {
                Keybographer.lag = (new Date()).getTime() - game.begintime;
        	}
	        event.game = {
                                status: game.gamestatus,
                                error:  game.error,
                                inputStatus:  document.getElementById('inputtext').value
                             };
            // Backspace and Control-Backspace markup.
            // Known issue: does not handle situations like "b.8" well for Ctrl+BS.
            // Known issue: any characters outside standard Russian and English charsets.
            event.isDeleted = false;
            if ((event.code === 'Backspace' || event.keyCode === 8) && event.type === 'keydown') {
                var backwardsSeeker = Keybographer.keybogram.length - 2;
                var deletedChars = '';
                while (backwardsSeeker > -1) {
                    if (Keybographer.keybogram[backwardsSeeker + 1].game.inputStatus === '') {
                        console.log('Klavogonki-specific behaviour at', backwardsSeeker,
                                    '- Input field empty, cannot delete backwards no more!');
                        break;
                    }
                    if (Keybographer.keybogram[backwardsSeeker].type === 'keypress' &&
                        !Keybographer.keybogram[backwardsSeeker].isDeleted) {
                        deletedChars = String.fromCharCode(Keybographer.keybogram[backwardsSeeker].charCode)
                                        + deletedChars;
                        console.log(Keybographer.keybogram.length-1, backwardsSeeker, deletedChars);
                        if (event.ctrlKey) {
                            if (deletedChars.match(/[^a-zA-Zа-яА-ЯёЁ0-9][a-zA-Zа-яА-ЯёЁ0-9]/)) {
                                break;
                            } else {
                                Keybographer.keybogram[backwardsSeeker].isDeleted = true;
                            }
                        } else {
                            Keybographer.keybogram[backwardsSeeker].isDeleted = true;
                            break;
                        }
                    }
                    backwardsSeeker--;
                }
            }
            Keybographer.keybogram.push(event);
            if (Keybographer.verboseStatus) {
                Keybographer.status('Recorded event no. ' +
                                (Keybographer.keybogram.length) + ": " +
                                event.type + ' ' +
                                (['focus', 'blur'].indexOf(event.type) === -1 ? event.code : ''));
            }
        },

        initiateAnalysis: function () {
            if (game.finished) {
                clearInterval(Keybographer.timer);
                console.log('Repetitive analysis timer (id', Keybographer.timer, ')stopped.');
                Keybographer.status('Final analysis started');
                var analysis = document.createElement('div');
                analysis.innerHTML = "<b>Final analysis</b>";
                document.getElementById('keyboAnalysis').appendChild(analysis);
                Keybographer.analyze();
            } else if (game.gamestatus === 'racing' && Keybographer.interimReports) {
                Keybographer.status('Interim analysis started');
                var analysis = document.createElement('div');
                analysis.innerHTML = "<b>Interim analysis</b>";
                document.getElementById('keyboAnalysis').appendChild(analysis);
                Keybographer.analyze();
            }
        },

        analyze: function() {

            Keybographer.keydowns = Keybographer.keybogram.filter(function(downSeeker) {
                return downSeeker.type === "keydown";
            });

            Keybographer.keypresses = Keybographer.keybogram.filter(function(pressSeeker) {
                return pressSeeker.type === "keypress";
            });

            // This is the totalTime algorithm used in TypingStatistics.
            // It does not account for preceding keydown of a Shift.
            // This is why 'keypresses' are used.
            Keybographer.totalTime = Keybographer.keypresses[Keybographer.keypresses.length - 1].timeStamp -
                            Keybographer.keypresses[0].timeStamp;

            // This is buggy, needs attention.
            Keybographer.errorTime = 0;
            for (var eventCounter = 1; eventCounter < Keybographer.keybogram.length; eventCounter++) {
                if (Keybographer.keybogram[eventCounter].game.error && !Keybographer.keybogram[eventCounter - 1].game.error) {
                    Keybographer.errorTime -= Keybographer.keybogram[eventCounter - 1].timeStamp;
                }
                if (!Keybographer.keybogram[eventCounter].game.error && Keybographer.keybogram[eventCounter - 1].game.error) {
                    Keybographer.errorTime += Keybographer.keybogram[eventCounter - 1].timeStamp;
                }
            }

            // This is exactly how brutto* is calculated in Typing Statistics.
            // It completely removes everything related to the correction,
            // including the normal keypress preceding it
            // (probably because the pause after it is not representative).
            Keybographer.correctionLossTime = 0;
            Keybographer.correctionSeriesCounter = 0;
            for (var eventCounter = 0; eventCounter < Keybographer.keypresses.length; eventCounter++) {
                var thisDeleted = Keybographer.keypresses[eventCounter].isDeleted;
                var previousDeleted;
                if (eventCounter === 0) {
                    previousDeleted = false;
                } else {
                    previousDeleted = Keybographer.keypresses[eventCounter - 1].isDeleted;
                }
                if (thisDeleted && !previousDeleted) {
                    Keybographer.correctionLossTime -= Keybographer.keypresses[eventCounter].timeStamp;
                    if (eventCounter > 0) {
                        Keybographer.correctionLossTime += Keybographer.keypresses[eventCounter].timeStamp -
                                              Keybographer.keypresses[eventCounter-1].timeStamp;
                    }
                    Keybographer.correctionSeriesCounter++;
                }
                if (!thisDeleted && previousDeleted) {
                    Keybographer.correctionLossTime += Keybographer.keypresses[eventCounter].timeStamp;
                }
            }

            Keybographer.typedTextLength = game.input_words.join(' ').replace(/\s+/g, ' ').length + game.last_correct_char + 1;
            Keybographer.netSpeed = 60000 * Keybographer.typedTextLength / Keybographer.totalTime;
            Keybographer.cleanSpeed = 60000 * (Keybographer.typedTextLength - Keybographer.correctionSeriesCounter) /
                                     (Keybographer.totalTime - Keybographer.correctionLossTime);
            Keybographer.report();
        },

        report: function(){
            // Show clean speed at a visible spot
    		var toggleAnalysis = function() {
    			$('keyboAnalysis').style.display = $('keyboAnalysis').style.display === 'none' ? 'block' : 'none';
    		};
    		var toggleKeyboDetail = function() {
    			$('keyboDetail').style.display = $('keyboDetail').style.display === 'none' ? 'block' : 'none';
    		};
    		
            // Export to JSON
            var playerID = '';
            for (var playerIndex = 0; playerIndex < game.players.length; playerIndex++) {
                if (game.players[playerIndex].you) {
                    playerInfo = game.players[playerIndex].info.user;
                    if (playerInfo === null) {
                        playerInfo.id = 'Guest';
                    }
                    break;
                }
            }
            var flattenKeybogram = function(keybogram){
                var output = [];
                for (var eventIndex = 0; eventIndex < keybogram.length; eventIndex++) {
                    var flatEvent = {};
                    for (var key in keybogram[eventIndex]) {
                        var exclusions = "view path sourceCapabilities target currentTarget srcElement " +
                                         "returnValue bubble cancelable defaultPrevented cancelBubble eventPhase " +
                                         "NONE CAPTURING_PHASE AT_TARGET BUBBLING_PHASE " +
                                         "MOUSEDOWN MOUSEUP MOUSEOVER MOUSEOUT MOUSEMOVE MOUSEDRAG CLICK DBLCLICK " +
                                         "KEYDOWN KEYUP KEYPRESS DRAGDROP FOCUS BLUR SELECT CHANGE " +
                                         "DOM_KEY_LOCATION_STANDARD DOM_KEY_LOCATION_LEFT DOM_KEY_LOCATION_RIGHT " +
                                         "DOM_KEY_LOCATION_NUMPAD"
                        if (exclusions.indexOf(key) === -1){
                            flatEvent[key] = keybogram[eventIndex][key];
                        }
                    }
                    output.push(flatEvent);
                }
                return output;
            };
            var jsonKeybogram = JSON.stringify({KeybogramFormatVersion: "0.1",
                                                Browser: navigator.userAgent,
                                                Platform: navigator.platform,
                                                KlavogonkiPlayerInfo: playerInfo,
                                                GameID: game.id,
                                                GameParams: game.params,
                                                GameTextInfo: game.textinfo,
                                                GameBeginTimeServer: game.begintimeServer*1000,
                                                GameBeginTimeDelayed: game.begintime_delayed,
                                                StartLag: Keybographer.lag,
                                                Keybogram: flattenKeybogram(Keybographer.keybogram)}, null, 4);
            var data = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonKeybogram);
            var filename = ['keybogram',
                            playerInfo.id,
                            game.params.gametype,
                            game.begintimeServer*1000,
                            '.json'].join('_');
            //END OF EXPORT TO JSON

            // Showing clean speed and controls
            Keybographer.status("Clean speed: <b>" + Keybographer.cleanSpeed.toFixed(2) + '</b> cpm ' +
                '<a href = "' + data +  '" download = "' + filename + '">[Save]</a> ' +
    			'<button id = "keyboAnalysisButton" onclick="(' + toggleAnalysis + ')()">Analysis</button> ' +
    			'<button id = "keyboDetailButton" onclick="(' + toggleKeyboDetail + ')()">Details</button><br/>');


            // Showing report
            var report;
            report  = 'Start lag: '       + Keybographer.lag                               + ' ms<br/>';
            report += 'Total time: '      + (Keybographer.totalTime/1000).toFixed(3)            + ' s<br/>';
            report += '<br/>';
            report += 'Series of correctons: ' + Keybographer.correctionSeriesCounter          + '<br/>';
            report += 'Correction loss: ' + (Keybographer.correctionLossTime/1000).toFixed(3)   + ' s<br/>';
            report += 'Error time: '      + (Keybographer.errorTime/1000).toFixed(3)            + ' s<br/>';
            report += '<br/>';
            report += 'Net speed: '       + Keybographer.netSpeed.toFixed(2)                    + ' cpm<br/>';
            report += 'Clean speed: <b>'  + Keybographer.cleanSpeed.toFixed(2)                  + '</b> cpm<br/>';
            report += '<br/>';
            report += 'Full text length: '  + game.text.length                       + ' characters<br/>';
            report += 'Typed text length: ' + Keybographer.typedTextLength           + ' characters<br/>';
            report += 'No. of keydowns: '   + Keybographer.keydowns.length           + ' events<br/>';
            report += 'No. of keypresses: ' + Keybographer.keypresses.length         + ' events<br/>';
            report += '<br/>';

    		var analysis = document.createElement('div');
    		analysis.innerHTML = report;
    		document.getElementById('keyboAnalysis').appendChild(analysis);
    		
    		// Showing detailed keybogram
    		var tableHeader = document.createElement('tr');
    		tableHeader.innerHTML = '<th>Index</th>' + 
    								'<th>Type</th>' + 
                                    '<th>.code</th>' +                              
                                    '<th>.keyCode</th>' +                              
    								'<th>.charCode</th>' +
    								'<th>Char</th>' +
    								'<th>Shift</th>' + 
    								'<th>Ctrl</th>' + 
    								'<th>Alt</th>' + 
    								'<th>Time</th>' + 
    								'<th>Pause</th>' +
    								'<th>Error state</th>' + 
    								'<th>Deleted?</th>' + 
    								'<th>Result in inputtext</th>';
    		document.getElementById('keyboTable').appendChild(tableHeader);
    		for (var k = 0; k < Keybographer.keybogram.length; k++) {
    			var ev = Keybographer.keybogram[k];
    			var line = [ k,
    						 ev.type,
    						 ev.code,
                             ev.keyCode,
    						 ev.charCode,
    						 ev.charCode === 32 ? '[ ]' : String.fromCharCode(ev.charCode),
    						 ev.shiftKey ? 'Shift' : '',
    						 ev.ctrlKey  ? 'Ctrl'  : '',
    						 ev.altKey   ? 'Alt'   : '',
    						(ev.timeStamp - Keybographer.keybogram[1].timeStamp + Keybographer.lag).toFixed(3),
    						k ? (ev.timeStamp - Keybographer.keybogram[k-1].timeStamp).toFixed(3) : 'N/A',
    						 ev.game.error ? "ERROR" : " ",
    						 ev.isDeleted ? 'DELETED' : '',
    						 ev.game.inputStatus.replace(' ', '&middot;')];
    	        var printLine = document.createElement('tr');
    	        var style = '';
    	        if (ev.type === 'keyup') {
    	        	style = 'color: #cccccc;';
    	        }
    	        if (ev.type === 'keydown') {
    	        	style = 'color: #666999;';
    	        }
    	        if (ev.isDeleted) {
    	        	style = 'color: #ff3333;';
    	        }
                if (ev.game.error) {
                    style += ' background: #ff9999';
                }
                if ((ev.code === 'Backspace' || ev.keyCode === 8) && ev.type === 'keydown') {
                    style = 'background: #cccccc;';
                    if (ev.ctrlKey) {
                        style = 'background: #999999;';
                    }
                }
    	        printLine.style = style;
    	        for (var i = 0; i < line.length; i++) {
    	        	var printCell = document.createElement('td');
    	        	printCell.innerHTML = line[i];
    	        	printLine.appendChild(printCell);
    	        }
            	document.getElementById('keyboTable').appendChild(printLine);
        	}
        },
    };
    Keybographer.initialize();
}

var script = document.createElement("script");
script.id = 'keybographerScript';
script.innerHTML = "(" + mainK + ")()";
document.body.appendChild(script);