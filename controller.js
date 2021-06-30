
// Side navigation menu

function openNav() {
    document.getElementById("sidenav").style.width = "60vw";
}
  
function closeNav() {
    document.getElementById("sidenav").style.width = "0";
}

// End side navigation menu


// File browsing

async function openDirectory() {
// Destructure the one-element array.
  [fileHandle] = await window.showOpenFilePicker();
  // Do something with the file handle.
}