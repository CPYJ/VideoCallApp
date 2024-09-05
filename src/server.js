import express from "express";
import http from "http";
import WebSocket from "ws";
import {Server} from "socket.io";
import { instrument } from "@socket.io/admin-ui";

/* BACK */

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
// 정적 파일 제공 라우팅
app.use("/public", express.static(__dirname + "/public"));

// get 요청 처리하는 라우트 핸들러
app.get("/", (req,res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));


const httpServer = http.createServer(app); // http 서버를 띄움
const wsServer =new Server(httpServer);


wsServer.on("connection", socket => {

    // 방에 참여
    socket.on("joinRoom", (roomName) => {
        // socket을 대화방에 참여시키기
        socket.join(roomName);
        // 누군가 참여시 welcome 이벤트 발생시킴
        socket.to(roomName).emit("welcome");
    });


    // offer를 받아서 방 안의 멤버들에게 보내줌
    socket.on("offer", (offer, roomName)=> {
        socket.to(roomName).emit("offer", offer);
    });

    // offer에 대한 answer를 받아서 방 안의 클라이언트들에게 보내줌
    socket.on("answer", (answer, roomName) => {
        socket.to(roomName).emit("answer", answer);
    });


    // ice candidate 과 roomname을 보냄
    socket.on("ice", (iceCandidate, roomName) => {
        socket.to(roomName).emit("ice", iceCandidate);
    });
});

 

const handleListen = () => console.log("listening on port 3020");
httpServer.listen(3020, handleListen);

