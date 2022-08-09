const { dialog, getCurrentWindow } = require('@electron/remote')
const currentWindow = getCurrentWindow();
const jsmt = require('jsmediatags');
const { basename } = require("path");

let player;
let repeatMode = "off";
let queue = [];
let queuePos = 0;
let volumeCount = 1;
let queueOpen = false;

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
            player.volume = volumeCount;
            queuePos = 0;
            queue.push(item)

            jsmt.read(item, {
                onSuccess: function (tag) {

                    const titleText = document.getElementById("song");
                    const fileText = document.getElementById("filename");
                    if (tag.tags.title) titleText.innerHTML = tag.tags.title;
                    fileText.innerHTML = basename(item).toUpperCase();
                    if (!tag.tags.title) titleText.innerHTML = basename(item, '.mp3' || '.wav');

                    const artist = document.getElementById("artistAlbum");
                    artist.innerHTML = "No artist/album found.";
                    if (tag.tags.artist) artist.innerHTML = `${tag.tags.artist}`;
                    if (tag.tags.album) artist.innerHTML = `${tag.tags.album}`;
                    if (tag.tags.album && tag.tags.artist) artist.innerHTML = `${tag.tags.artist} - ${tag.tags.album}`;

                    const playPauseButton = document.getElementById("playPause");
                    playPauseButton.innerHTML = '<i class="fa-solid fa-circle-pause fa-fw"></i>';

                    const recordIcon = document.getElementById("albumCover");
                    if (tag.tags.picture) {
                        const { data, format } = tag.tags.picture;
                        let base64String = "";
                        for (let i = 0; i < data.length; i++) {
                            base64String += String.fromCharCode(data[i]);
                        }
                        recordIcon.src = `data:${data.format};base64,${window.btoa(base64String)}`;
                    } else {
                        recordIcon.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Vinyl_record.svg/2048px-Vinyl_record.svg.png";
                    }

                    setInterval(updatePoint, 1000);
                    setInterval(checkRepeat, 1000);

                    updateQueue()

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
        playPauseButton.innerHTML = '<i class="fa-solid fa-circle-pause fa-fw"></i>';
    }

    else if (!player.paused) {
        player.pause();
        playPauseButton.innerHTML = '<i class="fa-solid fa-circle-play fa-fw"></i>';
    }
}

function volume() {
    if (!player) return;

    const volumeInput = document.getElementById("volumeRange");
    const volumeText = document.getElementById("volumeText");

    volumeText.innerHTML = `${volumeInput.value}%`;

    player.volume = volumeInput.value / 100;
    volumeCount = Math.round(volumeInput.value / 100);
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
    console.log(repeatMode)
    switch (repeatMode) {
        case "off":
            repeatMode = "queue";
            repeatButton.style.color = 'rgb(129, 255, 139)';
            break;
        case "queue":
            repeatMode = "song";
            repeatButton.style.color = 'rgb(255, 255, 139)';
            break;
        case "song":
            repeatMode = "off";
            repeatButton.style.color = 'white';
            break;
    }
}

function checkRepeat() {
    if (!player) return;

    const duration = player.duration;
    const currentPoint = player.currentTime;

    if (currentPoint === duration && repeatMode === "song") player.play();
    if (currentPoint === duration && repeatMode === "off") {
        if (queue[queuePos + 1]) {
            queuePos = queuePos + 1;
            setQueuePosition(queuePos);
        } else stopPlaying();

    } else if (currentPoint === duration && repeatMode === "queue") {
        if (queue[queuePos + 1]) {
            queuePos = queuePos + 1;

            setQueuePosition(queuePos);
        } else {
            queuePos = 0;
            setQueuePosition(queuePos);
        }
    }
}

function skipSong() {
    if (!player) return;
    if (queue[queuePos + 1]) return setQueuePosition(queuePos + 1);
    if (!queue[queuePos + 1] && repeatMode === "queue") return setQueuePosition(0);
}

function backSong() {
    if (!player) return;
    if (queue[queuePos - 1]) setQueuePosition(queuePos - 1);
}

function seek() {
    const seekBar = document.getElementById("progress-bar");
    const value = seekBar.value;
    const newSeconds = Math.round((value / 100) * player.duration);
    if (!player) seekBar.value = 0;

    player.currentTime = newSeconds;
}

async function shuffle() {
    function shuffleArray(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }
    queuePos = 0;
    queue = await shuffleArray(queue);
    updateQueue();
}

function setQueuePosition(position) {
    queuePos = position;
    if (player) { player.pause(); }

    const audioFile = new Audio(queue[position]);
    player = audioFile;
    player.play();
    player.volume = volumeCount;

    jsmt.read(queue[position], {
        onSuccess: function (tag) {

            const titleText = document.getElementById("song");
            const fileText = document.getElementById("filename");
            if (tag.tags.title) titleText.innerHTML = tag.tags.title;
            fileText.innerHTML = basename(queue[position]).toUpperCase();
            if (!tag.tags.title) titleText.innerHTML = basename(queue[position], '.mp3' || '.wav');

            const artist = document.getElementById("artistAlbum");
            artist.innerHTML = "No artist/album found.";
            if (tag.tags.artist) artist.innerHTML = `${tag.tags.artist}`;
            if (tag.tags.album) artist.innerHTML = `${tag.tags.album}`;
            if (tag.tags.album && tag.tags.artist) artist.innerHTML = `${tag.tags.artist} - ${tag.tags.album}`;

            const playPauseButton = document.getElementById("playPause");
            playPauseButton.innerHTML = '<i class="fa-solid fa-circle-pause fa-fw"></i>';

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
                recordIcon.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Vinyl_record.svg/2048px-Vinyl_record.svg.png";
            }

            updateQueue();
        },
        onerror: function (err) {
            console.log("There was an error reading the media tags!")
        }
    });
}

function stopPlaying() {
    if (!player) return;

    player.pause();
    player = null;
    queue = [];
    queuePos = 0;
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

function openQueue() {
    const main = document.getElementById("mainContent");
    const queue = document.getElementById("mainQueue");

    if (queueOpen === true) { main.classList.toggle("visible"); queue.classList.toggle("hidden"); queueOpen = false; }
    if (queueOpen === false) { main.classList.toggle("hidden"); queue.classList.toggle("visible"); queueOpen = false; }
}

function updateQueue() {
    if (!player) return;

    const queueList = document.getElementById("queueList");
    queueList.innerHTML = "<h2>Queue:</h2>";

    let array = queue.slice(queuePos);

    for (let i = 0; i < array.length; i++) {
        const song = array[i];

        jsmt.read(song, {
            onSuccess: function (tag) {

                let artistAlbum;
                artistAlbum = "No artist/album found.";
                if (tag.tags.artist) artistAlbum = `${tag.tags.artist}`;
                if (tag.tags.album) artistAlbum = `${tag.tags.album}`;
                if (tag.tags.album && tag.tags.artist) artistAlbum = `${tag.tags.artist} - ${tag.tags.album}`;

                $('#queueList').append(`
                <div class="queueItem">
                    <p class="filename">${basename(song)}</p>
                    <h3 style="margin: 10px; overflow: hidden;" class="title">${tag.tags.title ? tag.tags.title : basename(song, '.mp3' || '.wav')}</h3>
                    <p class="artist-album">${artistAlbum}</p>
                </div>`)
            },
            onerror: function (err) {
                console.log("There was an error reading the media tags!")
            }
        });

    }

    if (array.length === 0) {
        $('#queueList').append(`
        <div class="queueItem">
            <h3 style="margin: 10px;" class="title">No Songs Playing</h3>
        </div>`)
    }
}