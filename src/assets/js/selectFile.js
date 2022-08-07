const { dialog, getCurrentWindow } = require('@electron/remote')
const currentWindow = getCurrentWindow();
const jsmt = require('jsmediatags');
const { basename } = require("path");

let player;
let repeatMode = "off";
let queue = [];

async function openFile() {
    const file = await dialog.showOpenDialog(currentWindow, {
        filters: [
            {
                name: 'Music files',
                extensions: ['mp3', 'wav'],
            }
        ],
        properties: [
            "multiSelections",
        ]
    });

    if (!file) return;

    file.filePaths.forEach(item => {
        if (!player) {
            const audioFile = new Audio(item);
            if (player) { player.pause(); }
            player = audioFile;
            player.play();

            jsmt.read(item, {
                onSuccess: function (tag) {

                    const titleText = document.getElementById("song");
                    if (tag.tags.title) titleText.innerHTML = tag.tags.title;
                    if (!tag.tags.title) titleText.innerHTML = basename(item);

                    const playPauseButton = document.getElementById("playPause");
                    playPauseButton.innerHTML = "pause song";

                    setInterval(updatePoint, 1000);
                    setInterval(checkRepeat, 1000);

                },
                onerror: function (err) {
                    console.log("There was an error reading the media tags!")
                }
            });
        } else {
            queue.push(item);
        }
    });

}

function playPause() {
    if (!player) return;

    const playPauseButton = document.getElementById("playPause");

    if (player.paused) {
        player.play();
        playPauseButton.innerHTML = "Pause";
    }

    else if (!player.paused) {
        player.pause();
        playPauseButton.innerHTML = "Play";
    }
}

function stopPlaying() {
    if (!player) return;

    player.pause();
    player = null;
    queue = [];
}

function volume() {
    if (!player) return;

    const volumeInput = document.getElementById("volumeRange");
    const volumeText = document.getElementById("volumeText");

    volumeText.innerHTML = volumeInput.value;

    player.volume = volumeInput.value / 100;
}

function updatePoint() {
    if (!player) return;

    const duration = player.duration;
    const currentPoint = player.currentTime;

    const durationDate = new Date(null);
    const currentDate = new Date(null);

    durationDate.setSeconds(duration);
    currentDate.setSeconds(currentPoint);

    const point = document.getElementById("point");
    point.innerHTML = `${currentDate.getMinutes()}:${currentDate.getSeconds().toLocaleString('en-US', {
        minimumIntegerDigits: 2,
        useGrouping: false
    })} / ${durationDate.getMinutes()}:${durationDate.getSeconds().toLocaleString('en-US', {
        minimumIntegerDigits: 2,
        useGrouping: false
    })}`;

    const progressBar = document.getElementById("progress-bar");
    progressBar.value = Math.round(currentPoint / duration * 100);
}

function setRepeat() {
    if (!player) return;

    const repeatButton = document.getElementById("repeat");
    switch (repeatMode) {
        case "off":
            repeatMode = "song";
            repeatButton.innerHTML = "Repeat Song";
            break;

        case "song":
            repeatMode = "off";
            repeatButton.innerHTML = "Repeat Off";
            break;
    }
}

function checkRepeat() {
    if (!player) return;

    const duration = player.duration;
    const currentPoint = player.currentTime;

    if (currentPoint === duration && repeatMode === "song") player.play();
    if (currentPoint === duration && repeatMode === "off") {
        if (queue[0]) {
            const audioFile = new Audio(queue[0]);
            if (player) { player.pause(); }
            player = audioFile;
            player.play();
    
            jsmt.read(queue[0], {
                onSuccess: function (tag) {
    
                    const titleText = document.getElementById("song");
                    if (tag.tags.title) titleText.innerHTML = tag.tags.title;
                    if (!tag.tags.title) titleText.innerHTML = basename(queue[0]);
    
                    const playPauseButton = document.getElementById("playPause");
                    playPauseButton.innerHTML = "pause song";
    
                    setInterval(updatePoint, 1000);
                    setInterval(checkRepeat, 1000);
    
                },
                onerror: function (err) {
                    console.log("There was an error reading the media tags!")
                }
            });

            queue.shift();
        } else {
            player.pause();
            player = null;
        }  
    }
}

function skipSong() {
    if (!player) return;
    player.pause();

    if (queue[0]) {
        const audioFile = new Audio(queue[0]);
        if (player) { player.pause(); }
        player = audioFile;
        player.play();

        jsmt.read(queue[0], {
            onSuccess: function (tag) {

                const titleText = document.getElementById("song");
                if (tag.tags.title) titleText.innerHTML = tag.tags.title;
                if (!tag.tags.title) titleText.innerHTML = basename(queue[0]);

                const playPauseButton = document.getElementById("playPause");
                playPauseButton.innerHTML = "pause song";

                setInterval(updatePoint, 1000);
                setInterval(checkRepeat, 1000);

                queue.shift();

            },
            onerror: function (err) {
                console.log("There was an error reading the media tags!")
            }
        });

    } else {
        player.pause();
        player = null;
    } 
}