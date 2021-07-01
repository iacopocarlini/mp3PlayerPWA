// Class definitions

class Song {

  constructor(name, filepath) {
    this.name = name;
    //this.artist = artist;
    this.filepath = filepath;
  }

  // Getters
  get name() {
    return this.name;
  }

  get filepath() {
    return this.filepath;
  }


  // Methods

}


// End of class definitions


// Window controller

// Globals

var _this = this;
const audioFileFormats = new Set(["mp3","opus","flac","vorbis","wma", "aac", "wav"]);
var dirHandle;
var fileList;
const ctx = new window.AudioContext();

window.addEventListener('click', () => {
  ctx.resume().then(() => {
    console.log('AudioContext started');
  });
}, {
  once: true,
  capture: true,
  passive: true,
});

// End of globals

// Side navigation menu

function openNav() {
    document.getElementById("sidenav").style.width = "70vw";
}
  
function closeNav() {
    document.getElementById("sidenav").style.width = "0";
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

    fileList = await buildFileList(dirHandle);

    if (fileList.length === 0) {
      alert("No audio files found in this folder");
      return;
    }

    populateSongList(fileList);
  }
  catch (error) {
    //alert("Error during playlist loading, try again");
    alert(error);
  }

}


async function buildFileList(dirHandle) {

  let files = [];

  for await (const entry of dirHandle.values()) {
    //console.log(entry.kind, entry.name);
    //console.log(entry);
    if (audioFileFormats.has(getFileExtension(entry.name)))
    { 
      files.push(entry);
    }
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


function populateSongList(songsArray) {

  // hide default message
  document.getElementById('empty_message').style.display = "none";

  // then load songs...
  var list = document.getElementById('songsList');

  for (var i = 0; i < songsArray.length; i++) {

    var item = prepareSongItem(songsArray[i].name);
    list.appendChild(item);
  }

  // ...

  openNav(); // show results
}


function prepareSongItem(songName) {

  var item = document.createElement('li');

  item.appendChild(document.createTextNode(songName));
  item.setAttribute("class", "song_element");
  item.addEventListener('click', function(){
    playSong(songName);
});

  return item;
}

function playTest() {

  /*var audioPlayer = document.getElementById('audio_player');

  audioPlayer.src = "C:\\Users\\cariac\\Music\\brani\\1.mp3"; 
  audioPlayer.play();*/

  playAudio(fileList[0]);
}

// Audio player controls

function playSong(songName) {

  var audioPlayer = document.getElementById('audio_player');

  var source = document.getElementById('audio_source');
  //source.src = songName;

  //audioPlayer.load();
  audioPlayer.play();
}

async function playAudio (fileHandle) {

  debugger;
  const file = await fileHandle.getFile();
  const arrayBuffer = await file.arrayBuffer();
  const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);

  // Create source node
  const source = ctx.createBufferSource();
  source.buffer = decodedBuffer;
  source.connect(ctx.destination);
  source.start(); 
}

function pauseSong() {

}

function previousSong() {

}

function nextSong() {

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