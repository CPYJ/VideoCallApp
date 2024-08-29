const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

let myStream;
let muted = false; // mute인지 아닌지 확인하는 변수
let cameraOff = false; // camera Off or not



async function getMedia(deviceId) {
    console.log("getMedia");
    const initialConstraints = {
        audio : true,
        video: {facingMode : "user"}, // 셀피 모드
    };
    const cameraConstaints = {
        audio : true,
        video : {deviceId : {exact : deviceId}}
    };

    try{
        // 카메라, 마이크에 접근하여 실시간으로 데이터를 받아옴
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstaints : initialConstraints
        );
        // 카메라 화면 띄우기
        myFace.srcObject = myStream; 
        // 카메라 목록은 딱 한번만 가져오기 위함
        if(!deviceId) await getCameras(); 

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
        const currentCamera = myStream.getVideoTracks()[0]; // 현재 사용하고 있는 카메라를 option selected 설정

        // 카메라를 option으로 만들어서 select에 넣어줌
        cameras.forEach(camera => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label == camera.label) {
                option.selected = true;
            }
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

// 선택된 카메라의 화면이 나오게끔 함
async function handleCameraChange() {
    console.log('handleCameraSelect');
    await getMedia(camerasSelect.value);
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange());

