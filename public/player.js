var g_current_track = 1  // track number -- NOT track index, because g_tracks can be filtered/sorted
var g_tracks = []



function getQueryStringParameter(name) {
    var url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function loadData(callback) {   
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json; charset=utf-8")
    xobj.open('GET', 'data.json')
    xobj.onreadystatechange = function () {
      if (xobj.readyState == 4 && xobj.status == "200") {
        json = xobj.responseText
        callback(JSON.parse(json))
      }
    }
    xobj.send()
}

function padTrackNumber(track) {
    var trackpadded = '' + track
    while (trackpadded.length < 4)
        trackpadded = '0' + trackpadded
    return trackpadded
}




// dir = 1 to find next track, dir = -1 to find prev track
function findNextTrack(dir) {
    var idx = -1
    
    // first, find the current index of g_tracks we are on based on g_current_track
    for (var i = 0; i < g_tracks.length; ++i) {
        if (g_current_track == g_tracks[i].track) {
            idx = i
            break
        }
    }
    
    if (idx == -1) {
        if (g_tracks.length > 0) {
            return (dir > 0 ? g_tracks[0].track : g_tracks[g_tracks.length - 1].track)
        } else {
            return -1
        }
    }

    var started_over = false
    idx += dir

    while (true)
    {
        if ((dir > 0 && idx < g_tracks.length) || (dir < 0 && idx >= 0))
        {
            if (g_tracks[idx].selected) {
                return g_tracks[idx].track
            }
        }
         else
        {
            // start over at the other side
            if (g_tracks.length > 0 && !started_over) {
                if (dir > 0) {
                    idx = -1
                } else {
                    idx = g_tracks.length
                }
                started_over = true
            } else {
                return -1
            }
        }
        
        idx += dir
    }
}


function playTrack(track) {

    var audio = document.getElementById("audio")
    audio.src = "https://s3.us-east-1.amazonaws.com/my-music-diary.com/music/" + padTrackNumber(track) + ".mp3"
    audio.load()
    audio.play()

    g_current_track = track
}

function isPaused() {
    return document.getElementById("audio").paused
}

function pausePlayback() {
    document.getElementById("audio").pause()
}

function resumePlayback() {
    document.getElementById("audio").play()
}

function skipTrack(dir) {
    var id = 'row-' + padTrackNumber(g_current_track)
    var tr = document.getElementById(id)
    if (tr) {
        tr.cells[0].classList.remove("current-playing")
        tr.cells[0].classList.remove("current-paused")

        var next_track = findNextTrack(dir)
        if (next_track != -1) {
            playTrack(next_track)
            
            id = 'row-' + padTrackNumber(next_track)
            tr = document.getElementById(id)
            tr.cells[0].classList.add("current-playing")
        }
    }
 }
 


function onClickPlay(event) {
    var tr = event.target.closest("tr")
    var track, trackpadded = tr.id
    if (trackpadded.substr(0,4) == 'row-')
    {
        trackpadded = trackpadded.substr(4)
        track = parseInt(trackpadded,10)
        if (track == g_current_track) {
        
            if (isPaused()) {
                resumePlayback()
                tr.cells[0].classList.add("pause-button-hover")
                tr.cells[0].classList.remove("play-button-hover")
            } else {
                pausePlayback()
                tr.cells[0].classList.add("play-button-hover")
                tr.cells[0].classList.remove("pause-button-hover")
            }
            
        } else {

        /*
            var oldtr = document.getElementById('row-' + padTrackNumber(g_current_track))
            oldtr.cells[0].classList.remove("current-playing")
            oldtr.cells[0].classList.remove("current-paused")
                */
                
            var elems = document.querySelectorAll(".current-playing");

            [].forEach.call(elems, function(el) {
                el.classList.remove("current-playing");
            });       

            var elems = document.querySelectorAll(".current-paused");

            [].forEach.call(elems, function(el) {
                el.classList.remove("current-paused");
            });            
                

            
                
            playTrack(track)
            tr.cells[0].classList.add("pause-button-hover")
            tr.cells[0].classList.remove("play-button-hover")
        }
    }
}

function onToggleSelected(event) {
    var td = event.target
    var tr = event.target.closest("tr")
    var track, trackpadded = tr.id
    if (trackpadded.substr(0,4) == 'row-')
    {
        trackpadded = trackpadded.substr(4)
        track = parseInt(trackpadded,10)

        for (var i = 0; i < g_tracks.length; ++i) {
            if (g_tracks[i].track == track) {
                g_tracks[i].selected = !g_tracks[i].selected
                if (g_tracks[i].selected) {
                    td.classList.add("checkmark")
                } else {
                    td.classList.remove("checkmark")
                }
            }
        }
    }
}

function addClasses(tr, arr) {
    for (var i = 0; i < arr.length; ++i) {
        tr.classList.add(arr[i])
    }
}

function isMobile() {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
};

function populateTable(tracks) {

    var row, cell, a, i, stars, tbl = document.getElementById('tracks-table').getElementsByTagName('tbody')[0]
    var trackpadded
    

    var column_classes = [
        [ "priority-1" ],
        [ "priority-1" ],
        [ "priority-2" ],
        [ "priority-1" ],
        [ "priority-1" ], 
        [ "priority-2" ],  
        [ "priority-2" ],     
        [ "priority-1", "stars" ],
        [ "priority-2" ],  
        [ "priority-2" ],     
        [ "priority-2" ]
    ]


    for (var i = 0; i < tracks.length; ++i) {

        track = tracks[i]
        
        trackpadded = padTrackNumber(track.track)
        
        row = tbl.insertRow(tbl.rows.length)
        row.id = "row-"+trackpadded

        row.addEventListener("mouseover", function(event) {   
            var tr = event.target.closest("tr")
            var track = (tr.id.substr(0,4) == 'row-' ? parseInt(tr.id.substr(4),10) : -1)
            
            tr.cells[0].classList.remove("current-playing")
            tr.cells[0].classList.remove("current-paused")
            
            if (track == g_current_track && !isPaused()) {
                tr.cells[0].classList.add("pause-button-hover")
            } else {
                tr.cells[0].classList.add("play-button-hover")
            }
        }, false);
        row.addEventListener("mouseout", function(event) {   
            var tr = event.target.closest("tr")
            var track = (tr.id.substr(0,4) == 'row-' ? parseInt(tr.id.substr(4),10) : -1)
            
            tr.cells[0].classList.remove("current-playing")
            tr.cells[0].classList.remove("current-paused")
            tr.cells[0].classList.remove("play-button-hover")
            tr.cells[0].classList.remove("pause-button-hover")
            
            if (track == g_current_track) {
                if (isPaused()) {
                    tr.cells[0].classList.add("current-paused")
                } else {
                    tr.cells[0].classList.add("current-playing")
                }
            }
        }, false);

        
        // play column
        cell = row.insertCell(row.cells.length)
        cell.appendChild(document.createTextNode(''))
        cell.addEventListener("click", onClickPlay, false);
        addClasses(cell, column_classes[row.cells.length-1])
        
        // track number
        cell = row.insertCell(row.cells.length)
        cell.appendChild(document.createTextNode(track.track))
        cell.addEventListener("click", onClickPlay, false);
        addClasses(cell, column_classes[row.cells.length-1])
        
        // selected
        cell = row.insertCell(row.cells.length)
        cell.addEventListener("click", onToggleSelected, false);
        if (track.selected) {
            cell.classList.add('checkmark')
        }
        addClasses(cell, column_classes[row.cells.length-1])
        
        // track date
        cell = row.insertCell(row.cells.length)
        cell.appendChild(document.createTextNode(track.date))
        cell.addEventListener("click", onClickPlay, false);
        addClasses(cell, column_classes[row.cells.length-1])

        // track title
        cell = row.insertCell(row.cells.length)
        cell.appendChild(document.createTextNode(track.title))
        cell.addEventListener("click", onClickPlay, false);
        addClasses(cell, column_classes[row.cells.length-1])
        
        // sample set
        cell = row.insertCell(row.cells.length)
        cell.appendChild(document.createTextNode(track.sampleset))
        cell.addEventListener("click", onClickPlay, false);
        addClasses(cell, column_classes[row.cells.length-1])
        
        // score
        cell = row.insertCell(row.cells.length)
        cell.appendChild(document.createTextNode(track.score))
        cell.addEventListener("click", onClickPlay, false);
        addClasses(cell, column_classes[row.cells.length-1])
        
        // stars
        cell = row.insertCell(row.cells.length)
        stars = "\u2605".repeat(track.stars) + "\u2606".repeat(5 - track.stars)
        cell.innerHTML = "<div style='color:#2196f3'>" + stars + "</div>"
        cell.addEventListener("click", onClickPlay, false);
        addClasses(cell, column_classes[row.cells.length-1])
        
        // notes
        cell = row.insertCell(row.cells.length)
        cell.appendChild(document.createTextNode(track.notes))
        cell.addEventListener("click", onClickPlay, false);
        addClasses(cell, column_classes[row.cells.length-1])
        
        // duration
        cell = row.insertCell(row.cells.length)
        cell.align = 'right'
        cell.appendChild(document.createTextNode(track.duration))
        cell.addEventListener("click", onClickPlay, false);
        addClasses(cell, column_classes[row.cells.length-1])
        
        // download
        cell = row.insertCell(row.cells.length)
        cell.align = 'center'
        a = document.createElement('a')
        //a.appendChild(document.createTextNode("Link"))
        var img = document.createElement('img')
        img.src = "/assets/img/download.svg"
        img.style = "height: 1em; width:auto"
         
        a.appendChild(img)
        a.title = "Listen to '" + track.title + "'"
        a.href = "https://s3.us-east-1.amazonaws.com/my-music-diary.com/music/" + trackpadded + ".mp3";
        cell.appendChild(a)  
    }
}



function doInit() {

    var audio = document.getElementById("audio")
    var controls_skip_prev = document.getElementById("controls-skip-prev")
    var controls_skip_next = document.getElementById("controls-skip-next")
    var controls_play_pause = document.getElementById("controls-play-pause")
    var controls_position = document.getElementById("controls-position")
    var controls_volume = document.getElementById("controls-volume")

    audio.addEventListener("ended", function(event) {
        skipTrack(1)
    }, false);

    audio.addEventListener("play", function(event) {   
        var id = 'row-' + padTrackNumber(g_current_track)
        var tr = document.getElementById(id)
        if (!tr.cells[0].classList.contains("play-button-hover") && !tr.cells[0].classList.contains("pause-button-hover")) {
            tr.cells[0].classList.add("current-playing")
            tr.cells[0].classList.remove("current-paused")
        }
        
        if (controls_play_pause) {
            // music is playing, so change the play button to pause
            controls_play_pause.classList.remove("controls-play")
            controls_play_pause.classList.add("controls-pause")
        }
        
    }, false);

    audio.addEventListener("loadedmetadata", function(event) {
        if (controls_position) {
            controls_position.max = Math.floor(audio.duration)
            controls_position.value = Math.floor(audio.currentTime)
        }
        
        if (controls_volume) {
            controls_volume.value = audio.volume * 100
        }
    })

    audio.addEventListener("pause", function(event) {   
        var id = 'row-' + padTrackNumber(g_current_track)
        var tr = document.getElementById(id)
        if (!tr.cells[0].classList.contains("play-button-hover") && !tr.cells[0].classList.contains("pause-button-hover")) {
            tr.cells[0].classList.remove("current-playing")
            tr.cells[0].classList.add("current-paused")
        }
        
        if (controls_play_pause) {
            // music is playing, so change the play button to pause
            controls_play_pause.classList.add("controls-play")
            controls_play_pause.classList.remove("controls-pause")
        }
        
    }, false);

    
    
    if (controls_play_pause) {
        controls_play_pause.addEventListener("click", function(event) {
            if (controls_play_pause) {
                // this is included here to yield instant feedback
                controls_play_pause.classList.remove("controls-play")
                controls_play_pause.classList.add("controls-pause")
            }
        
            if (audio.paused) {
                audio.play()
            } else {
                audio.pause()
            }
        }, false)
    }
    
    if (controls_position) {
        audio.addEventListener("timeupdate", function(event) {   
            controls_position.value = audio.currentTime
        }, false)
        
        controls_position.addEventListener("change", function(event) {
            audio.currentTime = controls_position.value
        }, false)
    }
    
    if (controls_volume) {
        audio.addEventListener("volumechange", function(event) {   
            controls_volume.value = audio.volume * 100
        }, false)
        
        // event handler for volume with mouse tracking
        controls_volume.addEventListener("input", function(event) {
            audio.volume = controls_volume.value / 100
        }, false)
    }
    
    if (controls_skip_prev) {
        controls_skip_prev.addEventListener("click", function(event) {
            if (controls_play_pause) {
                // this is included here to yield instant feedback
                controls_play_pause.classList.remove("controls-play")
                controls_play_pause.classList.add("controls-pause")
            }
            skipTrack(-1)
        }, false)
    }
    
    if (controls_skip_next) {
        controls_skip_next.addEventListener("click", function(event) {
            if (controls_play_pause) {
                // this is included here to yield instant feedback
                controls_play_pause.classList.remove("controls-play")
                controls_play_pause.classList.add("controls-pause")
            }
            skipTrack(1)
        }, false)
    }


    loadData(function(tracks) {
        g_tracks = tracks
        g_tracks.reverse()
        populateTable(g_tracks)
        
        if (g_tracks.length > 0) {
            g_current_track = g_tracks[0].track
            var audio = document.getElementById("audio")
            audio.src = "https://s3.us-east-1.amazonaws.com/my-music-diary.com/music/" + padTrackNumber(g_current_track) + ".mp3"
            audio.load()
            var id = 'row-' + padTrackNumber(g_current_track)
            var tr = document.getElementById(id)
            tr.cells[0].classList.remove("current-playing")
            tr.cells[0].classList.add("current-paused")
            
            
            var play = '' + getQueryStringParameter('play')
            var trackpadded = padTrackNumber(play)
            var trautoplay = document.getElementById('row-' + trackpadded)
            if (trautoplay) {
                var evt = { target: trautoplay.cells[0] }
                onClickPlay(evt)
            }
        }
    })
 
}



doInit()
