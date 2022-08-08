const { dialog, getCurrentWindow } = require('@electron/remote')
const currentWindow = getCurrentWindow();
const jsmt = require('jsmediatags');
const { basename } = require("path");
const { title } = require('process');

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

                    const artist = document.getElementById("artist");
                    if (tag.tags.artist) artist.innerHTML = tag.tags.artist;

                    const playPauseButton = document.getElementById("playPause");
                    playPauseButton.innerHTML = '<i class="fa-solid fa-circle-pause"></i>';

                    const recordIcon = document.getElementById("albumCover");
                    if (tag.tags.picture) {
                        const { data, format } = tag.tags.picture;
                        let base64String = "";
                        for (let i = 0; i < data.length; i++) {
                            base64String += String.fromCharCode(data[i]);
                        }
                        recordIcon.src = `data:${data.format};base64,${window.btoa(base64String)}`;
                    } else {
                        recordIcon.src = "https://dbdzm869oupei.cloudfront.net/img/vinylrugs/preview/18784.png";
                    }

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
        playPauseButton.innerHTML = '<i class="fa-solid fa-circle-pause"></i>';
    }

    else if (!player.paused) {
        player.pause();
        playPauseButton.innerHTML = '<i class="fa-solid fa-circle-play"></i>';
    }
}

function stopPlaying() {
    if (!player) return;

    player.pause();
    player = null;
    queue = [];
    const titleText = document.getElementById("song");
    titleText.innerHTML = "";
    const artist = document.getElementById("artist");
    artist.innerHTML = "";
    const progressBar = document.getElementById("progress-bar");
    progressBar.value = 0;
    const point = document.getElementById("current");
    const total = document.getElementById("total");
    point.innerHTML = "0:00";
    total.innerHTML = "0:00";
    const recordIcon = document.getElementById("albumCover");
    recordIcon.src = "https://dbdzm869oupei.cloudfront.net/img/vinylrugs/preview/18784.png"
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

    const point = document.getElementById("current");
    const total = document.getElementById("total");

    point.innerHTML = `${currentDate.getHours() !== 1 ? `${currentDate.getHours() - 1}:` : ""}${currentDate.getMinutes().toLocaleString('en-US', {
        minimumIntegerDigits: 2,
        useGrouping: false
    })}:${currentDate.getSeconds().toLocaleString('en-US', {
        minimumIntegerDigits: 2,
        useGrouping: false
    })}`;

    total.innerHTML = `${durationDate.getHours() !== 1 ? `${durationDate.getHours() - 1}:` : ""}${durationDate.getMinutes().toLocaleString('en-US', {
        minimumIntegerDigits: 2,
        useGrouping: false
    })}:${durationDate.getSeconds().toLocaleString('en-US', {
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
            repeatButton.style.color = 'rgb(19, 89, 58)';
            break;

        case "song":
            repeatMode = "off";
            repeatButton.style.color = 'black';
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
                    titleText.innerHTML = basename(queue[0]);

                    const artist = document.getElementById("artist");
                    if (tag.tags.artist) artist.innerHTML = tag.tags.artist;

                    const playPauseButton = document.getElementById("playPause");
                    playPauseButton.innerHTML = '<i class="fa-solid fa-circle-pause"></i>';

                    setInterval(updatePoint, 1000);
                    setInterval(checkRepeat, 1000);

                    const recordIcon = document.getElementById("albumCover");
                    if (tag.tags.picture) {
                        const { data, format } = tag.tags.picture;
                        let base64String = "";
                        for (let i = 0; i < data.length; i++) {
                            base64String += String.fromCharCode(data[i]);
                        }
                        recordIcon.src = `data:${data.format};base64,${window.btoa(base64String)}`;
                    } else {
                        recordIcon.src = "https://dbdzm869oupei.cloudfront.net/img/vinylrugs/preview/18784.png";
                    }

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
    if (!queue[0]) return;
    player.pause();

    if (queue[0]) {
        const audioFile = new Audio(queue[0]);
        if (player) { player.pause(); }
        player = audioFile;
        player.play();
        console.log(queue[0])

        jsmt.read(queue[0], {
            onSuccess: function (tag) {

                const titleText = document.getElementById("song");
                titleText.innerHTML = basename(queue[0]);

                const artist = document.getElementById("artist");
                if (tag.tags.artist) artist.innerHTML = tag.tags.artist;
                if (!tag.tags.artist) artist.innerHTML = "";

                const playPauseButton = document.getElementById("playPause");
                playPauseButton.innerHTML = '<i class="fa-solid fa-circle-pause"></i>';

                setInterval(updatePoint, 1000);
                setInterval(checkRepeat, 1000);

                queue.shift();

                const recordIcon = document.getElementById("albumCover");
                if (tag.tags.picture) {
                    const { data, format } = tag.tags.picture;
                    let base64String = "";
                    for (let i = 0; i < data.length; i++) {
                        base64String += String.fromCharCode(data[i]);
                    }
                    recordIcon.src = `data:${data.format};base64,${window.btoa(base64String)}`;
                } else {
                    recordIcon.src = "https://dbdzm869oupei.cloudfront.net/img/vinylrugs/preview/18784.png";
                }

            },
            onerror: function (err) {
                console.log("There was an error reading the media tags!")
            }
        });

    } else {
        return;
    }
}

function toggleVolume() {
    const volume = document.getElementById("volume");

    volume.classList.toggle("show")
}