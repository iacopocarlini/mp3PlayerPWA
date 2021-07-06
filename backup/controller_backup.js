console.clear();

// GLOBALS

var _this = this;

const audioFileFormats = new Set(["mp3","opus","flac","vorbis","wma", "aac", "wav"]);
var dirHandle;
var playList;

var currentIndex = 0;

var isPlaying = false;
var titleIsMoving = false;

// audio context and source
const AudioContext = window.AudioContext || window.webkitAudioContext;
const ctx = new window.AudioContext();
var currentSource;
var currentSourceDuration = 0;


// DOM setup

window.addEventListener('click', () => {
  ctx.resume().then(() => {
    console.log('AudioContext started');
  });
}, {
  once: true,
  capture: true,
  passive: true,
});

var sidenavIsOpen = false;
document.addEventListener('click', function(event) {
  
  if (!(document.getElementById("sidenav").contains(event.target)) 
      && !(document.getElementById("menu_btn").contains(event.target)) 
      && sidenavIsOpen)
    closeNav();
});

// End of globals


// WINDOW MANAGEMENT


// Side navigation menu

function openNav() {
    document.getElementById("sidenav").style.width = "70vw";
    sidenavIsOpen = true;
}
  
function closeNav() {
    document.getElementById("sidenav").style.width = "0";
    sidenavIsOpen = false;
}

// End side navigation menu


// File browsing
async function openDirectory() {

  try {

    dirHandle = await window.showDirectoryPicker({ startIn: 'music' });

    var permissionGranted = await verifyPermission(dirHandle, true);
    if (!permissionGranted) {
      alert("Permission needed");
      return;
    }

    playList = await buildPlayList(dirHandle);

    if (playList.length === 0) {
      alert("No audio files found in this folder");
      return;
    }

    populatePlayList(playList);
  }
  catch (error) {
    //alert("Error during playlist loading, try again");
    alert(error);
  }

}


async function buildPlayList(dirHandle) {

  let files = [];

  for await (const entry of dirHandle.values()) {
    //console.log(entry.kind, entry.name); console.log(entry);
    if (audioFileFormats.has(getFileExtension(entry.name)))
      files.push(entry);
  }

  return files;
}

function getFileExtension(filename) {

  var extension = filename.substring(filename.lastIndexOf('.')+1, filename.length) || filename;
  return extension.toLowerCase();
}

function getSongName(filepath) {

  var songName = filepath;

  // ...

  return songName;
}


function populatePlayList(songsArray) {

  // hide default message
  document.getElementById('empty_message').style.display = "none";

  // then load songs...
  var list = document.getElementById('songsList');

  for (var i = 0; i < songsArray.length; i++) {

    var item = prepareSongItem(songsArray[i].name, i);
    list.appendChild(item);
  }

  // ...

  openNav(); // show results
}


function prepareSongItem(songName, index) {

  var item = document.createElement('li');

  item.appendChild(document.createTextNode(songName));
  item.setAttribute("class", "song_element");
  item.addEventListener('click', function(){
    playSong(index);
    closeNav();
});

  return item;
}

function playTest() {

  /*var audioPlayer = document.getElementById('audio_player');

  audioPlayer.src = "C:\\Users\\cariac\\Music\\brani\\1.mp3"; 
  audioPlayer.play();*/

  playSong(0);
}

// Audio player controls

async function playSong(index) {

  togglePlayPauseIcon("toPause");

  if (isPlaying) // stop pre-existing song
    currentSource.stop();

  const fileHandle = playList[index];

  const file = await fileHandle.getFile();
  const arrayBuffer = await file.arrayBuffer();
  const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);

  audioSourceSetup(decodedBuffer);
  updatePlaylistStatus(index);
}

function audioSourceSetup(decodedBuffer) {

  currentSource = ctx.createBufferSource();
  /*currentSource.onended = function() {
    console.log("ciao");
    currentSource.stop();
    nextSong(); // TODO: implementare passaggio automatico a canzone successiva
  }*/
  currentSource.buffer = decodedBuffer;
  currentSourceDuration = decodedBuffer.duration;
  currentSource.connect(ctx.destination);
  currentSource.start();

}

function secondsToRegularTime(inputSeconds) {

  var mins = Math.floor(inputSeconds / 60);

  return {
    minutes: mins,
    seconds: inputSeconds - mins * 60,
  };  
}

function updatePlaylistStatus(index) {

  currentIndex = index;
  
  document.getElementById("song_header").innerHTML = "Now playing";
  document.getElementById("song_header").style.display = "block";
  
  document.getElementById("song_title").innerHTML = cleanSongName(playList[index].name);

  updateSongDuration();
  
  moveTitle();

  isPlaying = true;
}

function updateSongDuration() {

  var time = secondsToRegularTime(currentSourceDuration);
  document.getElementById("right_time").innerHTML = time.minutes + ":" + time.seconds;
}

function cleanSongName(filename) {

  return filename.replace(/\.[^/.]+$/, "");
}

function moveTitle() {

  if (!titleIsMoving) {
    var el = document.getElementById("song_title");
    el.classList.add('moving');
    titleIsMoving = true;
  }
  else
    return;
}

function playPauseClick() {

  if (!playList)
    return

  if(ctx.state === 'running') {
    ctx.suspend().then(function() {
      isPlaying = false;
      togglePlayPauseIcon("toPlay");
    });
  } else if(ctx.state === 'suspended') {
    ctx.resume().then(function() {
      isPlaying = true;
      togglePlayPauseIcon("toPause");
    });  
  }
}


function togglePlayPauseIcon(mode) {

    var el = document.getElementById("play_pause_icon");

    if (mode == "toPause") {
      el.classList.remove('fa-play');
      el.classList.add('fa-pause');
    }
    else if (mode == "toPlay") {
      el.classList.remove('fa-pause');
      el.classList.add('fa-play');
    }
    else 
      return;
}

function previousSong() {

  if (!playList)
    return

  currentIndex = currentIndex - 1;

  if (currentIndex < 0)
    currentIndex = playList.length -1;

  playSong(currentIndex);
}

function nextSong() {

  if (!playList)
    return

  currentIndex = currentIndex +1;
  
  if (currentIndex >= playList.length)
    currentIndex = 0;

  playSong(currentIndex);
}

function shuffleSong() {
  
  if (!playList)
    return;

  playSong(Math.floor(Math.random() * playList.length));
}

function loop() {

  if (!playList)
    return;

  playSong(currentIndex);
}

// Request permiissions
async function verifyPermission(dirHandle, readWrite) {

  const options = {};

  if (readWrite) {
    options.mode = "readwrite";
  }
  // Check if permission was already granted
  if ((await dirHandle.queryPermission(options)) === 'granted') {
    return true;
  }
  // Request permission. If the user grants permission
  if ((await dirHandle.requestPermission(options)) === 'granted') {
    return true;
  }
  // The user didn't grant permission
  return false;
}