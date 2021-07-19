console.clear(); // debug util

// GLOBALS

var _this = this;

const audioFileFormats = new Set(["mp3","opus","flac","vorbis","wma", "aac", "wav"]);
var playList = [];

var currentIndex = 0;
var isLoopActive = false;
var titleIsMoving = false;

// DOM Elements
var audioElement = new Audio();
audioElement.addEventListener("ended", nextSong);
audioElement.addEventListener("timeupdate", updateTimer);
audioElement.addEventListener("loadedmetadata", updatePlaylistStatus);

var inputElement = document.getElementById("input_picker");
var seekbar =  document.getElementById("seekbar");
seekbar.addEventListener("onchange", nextSong);


// DOM setup

var sidenavIsOpen = false;
document.addEventListener('click', function(event) {
  
  if (!(document.getElementById("sidenav").contains(event.target)) 
      && !(document.getElementById("menu_btn").contains(event.target)) 
      && sidenavIsOpen)
    closeNav();
});

// End of globals

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
function openDirectory() {
  inputElement.click();
}


function buildPlayList() {

  if (playListReady()) // erase pre existing playlist
    playList = [];
    
  for (var i = 0; i < inputElement.files.length; i++) {
    if (audioFileFormats.has(getFileExtension(inputElement.files[i].name)))
      playList.push(inputElement.files[i]);
  }

  if (playList.length === 0) {
    alert("No audio files found in this folder");
    return;
  }

  populatePlayListView(playList);
}

function getFileExtension(filename) {

  var extension = filename.substring(filename.lastIndexOf('.')+1, filename.length) || filename;
  return extension.toLowerCase();
}


function populatePlayListView(songsArray) {

  // hide default message
  document.getElementById('empty_message').style.display = "none";

  // then load songs...
  var list = document.getElementById('songsList');

  for (var i = 0; i < songsArray.length; i++) {
    var item = prepareSongItem(songsArray[i].name, i);
    list.appendChild(item);
  }

  openNav(); // show results in sidebar
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


// Search bar

function toggleDarkMode() {

}

function deleteSearch() {

  document.getElementById("search_bar").value = "";;
}

// Audio player controls

function playSong(index) {

  togglePlayPauseIcon("toPause");

  audioElement.src = URL.createObjectURL(playList[index]);
  audioElement.play();

  currentIndex = index;
}

function secondsToRegularTime(inputSeconds) { // format MM:SS

  var mins = Math.floor(inputSeconds / 60).toString();
  var secs =  Math.floor(inputSeconds - mins * 60).toString();

  if (mins.length == 1) // 0 padding needed
    mins = '0' + mins;

  if (secs.length == 1) // 0 padding needed
    secs = '0' + secs;

  return {
    minutes: mins,
    seconds: secs,
  };  
}

function updatePlaylistStatus() {

  // Title
  document.getElementById("song_header").innerHTML = "Now playing";
  document.getElementById("song_header").style.display = "block";
  
  document.getElementById("song_title").innerHTML = cleanSongName(playList[currentIndex].name);

  // Song time 
  seekbar.max = audioElement.duration;
  
  moveTitle();
}

function updateTimer() {

  var playtime = secondsToRegularTime(audioElement.currentTime);
  document.getElementById("left_time").innerHTML = playtime.minutes + ":" + playtime.seconds;

  var endtime = secondsToRegularTime(audioElement.duration);
  document.getElementById("right_time").innerHTML = endtime.minutes + ":" + endtime.seconds;

  seekbar.value = audioElement.currentTime;
}


function cleanSongName(filename) {
  return filename.replace(/\.[^/.]+$/, "");
}


function goToSelectedTime() {

  audioElement.currentTime = seekbar.value;
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

  if (!playListReady())
    return;

  if (!audioElement.paused) {
    audioElement.pause();
    togglePlayPauseIcon("toPlay");
  } 
  else if(audioElement.paused) {
    audioElement.play();
    togglePlayPauseIcon("toPause");
  }
  else
    return;
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

  if (!playListReady())
    return;

  audioElement.currentTime = 0;

  if (!isLoopActive)
    currentIndex = currentIndex - 1;

  if (currentIndex < 0)
    currentIndex = playList.length - 1;

  playSong(currentIndex);
}

function nextSong() {

  if (!playListReady())
    return;

  audioElement.currentTime = 0;

  if (!isLoopActive)
    currentIndex = currentIndex +1;
  
  if (currentIndex >= playList.length)
    currentIndex = 0;

  playSong(currentIndex);
}

function shuffleSong() {
  
  if (!playListReady())
    return;

  var randomIndex = Math.floor(Math.random() * playList.length);
  playSong(randomIndex);
}

function loop() {

  if (!playListReady())
    return;

  isLoopActive = !isLoopActive;
  
  if (isLoopActive)
    changeButtonColor('loop_btn', getComputedStyle(document.documentElement).getPropertyValue('--blue'));
  else
    changeButtonColor('loop_btn', getComputedStyle(document.documentElement).getPropertyValue('--black'));
}

// show if state button (e.g. loop) is active or not
function changeButtonColor(buttonID, color) {

    var el = document.getElementById(buttonID);
    el.style.color = color;
}

function playListReady() {

  return playList.length != 0;
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


// TEST FUNCTIONS

function playTest() {
  playSong(0);
}