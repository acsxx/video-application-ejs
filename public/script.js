const socket = io()
const videoGrid = document.getElementById("video-grid");
const logs = document.getElementById("logs")
const myVideo = document.createElement("video");
const peers = {}
let myVideoStream;
var conn;
var peer_id;
const peer = new Peer(undefined, {
    host: '/',
    port: '5001'
  })

navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    }).then(stream => {
      myVideoStream = stream;
      addVideoStream(myVideo, stream)
    })

peer.on("call", call =>{
    call.answer(myVideoStream)
    const video = document.createElement("video")
    call.on("stream", userVideoStream =>{
        addVideoStream(video, userVideoStream)
    })
})

socket.on("user-connected", (userId,user) =>{
    peer_id = userId
    //console.log("User Connected "+ userId)
    auditLogs(`<strong>User Connected</strong><br>${user} (${userId})<br>`);
})

socket.on('user-disconnected', (userId,userSent) => {
    //console.log("User disconnected " + userId);
    auditLogs(`<strong>User disconnected</strong><br>${userSent} (${userId})<br>`);
    //console.log(peers);
    //if (peers[userId]) peers[userId].close()
})

peer.on("open", id =>{
    socket.emit("join-room", ROOM_ID,id,user);
    //console.log(peer);
    auditLogs(`<strong>My user id</strong><br>${id}<br>`);
    auditLogs(`<strong>Room id</strong><br>${ROOM_ID}<br>`);
    auditLogs(`<strong>User Connected(me)</strong><br>${user}<br>`);
})

peer.on("connection", connection =>{
    conn = connection;
    peer_id = connection.peer
    //console.log("connected to = "+ conn.peer);
    //console.log("peer_id = "+ peer_id);
    auditLogs(`<strong>Connected to</strong><br>${peer_id}<br>`);
    //document.getElementById("guestId").innerHTML = "Guest id = "+peer_id;
})

peer.on("error", err =>{
  console.log(err);
})

function callNewRoom(){
    conn = peer.connect(peer_id)
    //auditLogs(`<strong>Calling a user</strong><br>${peer_id}<br>`);
    var call = peer.call(peer_id, myVideoStream)
    var videoRemote = document.createElement('video')
    call.on("stream", stream =>{
      //window.peer_stream = stream
      addVideoStream(videoRemote,stream)
    })
    call.on("close", () =>{
        videoRemote.remove()
    })
    //peers[userId] = call
}

function addVideoStream(video, stream){
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () =>{
        video.play();
    })
    videoGrid.append(video);
}


let text = $("input");
$("html").keydown((e) =>{
    if(e.which == 13 && text.val().length !== 0) {
        //console.log(text.val())
        socket.emit("message", text.val(),user)
        text.val("");
    }
})

socket.on("createMessage", (message,user) =>{
    //console.log("this is coming from server", message);
    let div = document.createElement("div")
    div.classList.add("message")
    div.innerHTML = `<strong>${user}</strong><br>${message}<hr>`
    document.querySelector(".messages").appendChild(div);
    scrollToBottom()
})

function scrollToBottom(){
    let d = $(".mainChatWindow")
    d.scrollTop(d.prop("scrollHeight"))
}

function muteUnmute(){
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if(enabled){
        myVideoStream.getAudioTracks()[0].enabled = false;
        setUnmuteButton();
    }
    else{
        setMuteButton();
        myVideoStream.getAudioTracks()[0].enabled = true;
    }
}

function setMuteButton(){
    const html = `<i class="fas fa-microphone"></i>
    <span>Mute</span>`
    document.querySelector(".mainMuteButton").innerHTML =  html;
}

function setUnmuteButton(){
    const html = `<i class="unMute fas fa-microphone-slash"></i>
    <span>Unmute</span>`
    document.querySelector(".mainMuteButton").innerHTML =  html;
}

function playStop(){
    let enabled = myVideoStream.getVideoTracks()[0].enabled
    if(enabled){
        myVideoStream.getVideoTracks()[0].enabled = false
        setPlayVideo()
    }
    else{
        setStopVideo()
        myVideoStream.getVideoTracks()[0].enabled = true
    }

}

function setPlayVideo(){
    const html = `
    <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
    `
    document.querySelector(".mainVideoButton").innerHTML = html
}

function setStopVideo(){
    const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
    `
    document.querySelector(".mainVideoButton").innerHTML = html
}

function auditLogs(text){
    let p = document.createElement("p")
    p.classList.add("logs")
    p.innerHTML = text
    document.querySelector("#auditLogs").appendChild(p);
}
