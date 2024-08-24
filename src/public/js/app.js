/* FRONT */

const msgList = document.querySelector("ul");
const msgForm = document.querySelector("#message");
const nickForm = document.querySelector("#nickname");

// 서버로의 연결
const socket = new WebSocket(`ws://${window.location.host}`);


// 닉네임과 메시지를 분리하기 위해 텍스트 대신 Json을 string화 시켜서 보냄 <= socket.send는 string만 되기 떄문
// 또한 백엔드 서버는 다른 언어를 사용할 수도 있으므로 Js Object 인 Json을 그대로 보내면 안된다
function makeMessage(type, payload) {
    const msg = {type, payload}
    return JSON.stringify(msg);
}


// 연결완료 시 
socket.addEventListener("open", ()=> {
    console.log("Connected to Server");
});



// 메시지 받았을 때
socket.addEventListener("message", (message)=> {
    const li = document.createElement("li");
    li.innerText = message.data;
    msgList.append(li);

});

// 연결 끊길 때
socket.addEventListener("close", () => {
    console.log("Disconnected from Server");
});



function handleSubmit(event) {
    event.preventDefault(); // form 제출시 페이지 이동 없애고 원하는 동작 대신 구현할 때 사용
    const input = msgForm.querySelector("input"); // 값 가져오기
    socket.send(makeMessage("new_message", input.value));
    input.value = "";

    // 내가 보낸 메시지 채팅창에 띄우기
    const li = document.createElement("li");
    li.innerText = `You : ${input.value}`;
    msgList.append(li);
}
// 메시지 send 시
msgForm.addEventListener("submit", handleSubmit);




function handleNickSubmit(event) {
    event.preventDefault();
    const input = nickForm.querySelector("input");
    socket.send(makeMessage("nickname",  input.value));
    input.value = "";
}
// 닉네임 send 시
nickForm.addEventListener("submit", handleNickSubmit);