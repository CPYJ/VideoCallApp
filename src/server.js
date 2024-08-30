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
    socket.on("joinRoom", (roomName, done) => {
        socket.join(roomName);
        done();

        socket.to(roomName).emit("welcome");
    })
});

 

const handleListen = () => console.log("listening on port 3020");
httpServer.listen(3020, handleListen);

