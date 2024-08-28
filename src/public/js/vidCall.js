const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

let myStream;
let muted = false; // mute인지 아닌지 확인하는 변수
let cameraOff = false; // camera Off or not



async function getMedia() {
    try{
        // 카메라, 마이크에 접근하여 실시간으로 데이터를 받아옴
        myStream = await navigator.mediaDevices.getUserMedia({ // 오디오와 비디오를 모두 요청함
            audio : true,
            video : true
        })
        myFace.srcObject = myStream; // 카메라 화면 띄우기
        await getCameras();
    } catch(e) {
        console.log(e);
    }
}
getMedia();


async function getCameras() {
    try{ // 유저의 input, output 디바이스에 접근
        const devices = navigator.mediaDevices.enumerateDevices();
        // 카메라만 가져옴
        const cameras = (await devices).filter(device => device.kind === "videoinput");

        // 카메라를 option으로 만들어서 select에 넣어줌
        cameras.forEach(camera => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            camerasSelect.appendChild(option);
        })
    }catch(e) {
        console.log(e)
    }
    
}


function handleMuteClick () {
    myStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
    if(!muted) {
        muteBtn.innerText = "UnMute";
        muted = true;
    }
    else {
        muteBtn.innerText = "Mute";
        muted = false;
    }
}
function handleCameraClick () { 
    myStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
    if(cameraOff) {
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    } else {
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);

