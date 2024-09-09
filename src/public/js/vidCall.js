const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const call = document.getElementById("call");

// 대화방 화면 일단 숨기기
call.hidden = true;

let myStream; // 영상, 소리 실시간 데이터
let muted = false; // mute인지 아닌지 확인하는 변수
let cameraOff = false; // camera Off or not



// 실제 영상 화면과 오디오를 가져오기
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
        // 카메라 화면 띄우기. 미디어 스트림 연결
        myFace.srcObject = myStream; 
        // 카메라 목록은 딱 한번만 가져오기 위함
        if(!deviceId) await getCameras(); 

    } catch(e) {
        console.log(e);
    }
}


// 카메라 객체를 전부 가져오기
async function getCameras() {
    try{ // 유저의 input, output 디바이스에 접근
        const devices = navigator.mediaDevices.enumerateDevices();

        // 카메라만 가져옴
        const cameras = (await devices).filter(device => device.kind === "videoinput");

        // 현재 사용하고 있는 카메라를 가져옴
        const currentCamera = myStream.getVideoTracks()[0]; 

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



// mute unmute 버튼 클릭시
function handleMuteClick () {
    // 오디오 기능 끄고 켜기
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



// camera on off 버튼 클릭시
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



// 선택된 카메라의 화면이 나오게끔 + 전송되게끔 함
async function handleCameraChange() {
    console.log('handleCameraSelect');
    await getMedia(camerasSelect.value);

    // video track을 전송하는 객체 찾기
    if(myPeerConnection) {
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection.getSenders().find(sender => sender.track.kind === "video");

        // 기존 미디어 스트림에서 비디오 트랙만 교체
        videoSender.replaceTrack(videoTrack);
    }

}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);





// WelcomeForm ------------------ 
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");
let roomName;

// 방에 입장하는 버튼을 클릭했을 때
async function handleWelcomeSubmit(event) {
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    roomName = input.value;

    // 이벤트 보내기 전에 대화방 + p2p 세팅 기다리기
    await startMedia(); 
    // 방에 입장했을 때 서버에 이벤트 보내기
    socket.emit("joinRoom", roomName);
    input.value = "";
}


// 대화방 띄우기 + 카메라 마이크 불러오기 + p2p 연결 만듦
async function startMedia() {
    welcome.hidden = true;
    call.hidden = false;
    // 카메라, 마이크 불러오기
    await getMedia(); 
    // p2p 연결 초기화
    makeConnection(); 
}


welcomeForm.addEventListener("submit", handleWelcomeSubmit);






// Socket -----------

// 방 안에 누가 참여시  본인의 offer를 보내줌
socket.on("welcome", async () => {
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);

    console.log('sent an offer');
    socket.emit("offer", offer, roomName);
    
});


// 누군가의 offer를 받음
socket.on("offer", async (offer) => {

    console.log('received an offer');
    myPeerConnection.setRemoteDescription(offer);
    // offer에 대한 응답 생성
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer",answer, roomName);
    console.log('sent the answer');
});


// 본인이 보낸 offer에 대한 answer를 받음
socket.on("answer", answer => {
    console.log('received an answer');
    // 받은 answer를 내 p2p 객체에 저장
    myPeerConnection.setRemoteDescription(answer);
});


// 상대의 ice candidate을 받음
socket.on("ice", (ice) => {
    console.log('received candidate');
    // 상대의 네트워크 경로를 내 p2p 커넥션에 추가하여 연결을 시도할 수 있는 경로로 등록
    myPeerConnection.addIceCandidate(ice);
});


// RTC -------------
let myPeerConnection;

// P2P 커넥션이 초기화 됨
function makeConnection() {
    myPeerConnection = new RTCPeerConnection();

    // ice candidate라는 이벤트는 offer와 answer가 오간 후 자동으로 일어남
    myPeerConnection.addEventListener("icecandidate",handleIce);

    // signaling 후 상대 피어의 미디어 스트림이 추가될 때 실행됨
    myPeerConnection.addEventListener("addstream", handleAddStream);

    // p2p 커넥션에 미디어 스트림을 추가. signaling 후 자동으로 상대에게 전송됨
    myStream.getTracks().forEach(track => myPeerConnection.addTrack(track,myStream));
}


// 서버에 ice candidate 전달
function handleIce(data) {
    console.log('sent candidate');
    socket.emit("ice", data.candidate, roomName);
}


// 상대 피어의 미디어 스트림을 받음
function handleAddStream(data) {
    const peerFace = document.getElementById("peerFace");
    peerFace.srcObject = data.stream;
}
