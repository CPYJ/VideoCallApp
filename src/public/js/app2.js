// socket io 사용
const socket = io(); // 자동으로 socket.io를 실행하는 서버를 찾아서 연결

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");


room.hidden = true; // 채팅방 숨기기

let roomName; // 프론트에서는 전역변수 사용가능!

// 메시지 보낸 후 본인이 보낸 메시지 채팅창에 출력
function handleMessageSubmit(event) {
    event.preventDefault();
    const input = room.querySelector("input");
    socket.emit("new_message", input.value, roomName, ()=> {
        addMessage(`You : ${input.value}`);
    });
    input.value = '';
}

function showRoom() { // 채팅방 보여주고 닉네임 폼 숨기기
    room.hidden = false;
    welcome.hidden = true;
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName}`;

    // 아래 두 줄의 코드는 밖으로 빼도 무방함
    const form = room.querySelector("form");
    form.addEventListener("submit", handleMessageSubmit);
}


function handleRoomSubmit(event) {
    event.preventDefault();
    const input = form.querySelector("input");
    // send 대신 emit을 씀. event의 이름을 정할 수 있음, string 말고 object도 보낼 수 있음, 서버에서 원격으로 실행시킬 front 함수도 보낼 수 있음
    socket.emit("enter_room", {payload : input.value}, showRoom); 
    roomName = input.value;
    input.value = "";
}
form.addEventListener("submit", handleRoomSubmit);

// 메시지 추가
function addMessage(message) {
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}

// 서버로부터 받은 이벤트. 누군가 방에 들어왔을 때
socket.on("welcome", ()=> { 
    // 프론트에 적절한 메시지 출력
    addMessage("Someone Joined!"); 
});

// 누군가 방을 나갔을 때
socket.on("bye", ()=> {
    console.log("bye workd");
    addMessage("someone left ㅠㅠ");
});


socket.on("new_message", (msg) => {addMessage(msg)});