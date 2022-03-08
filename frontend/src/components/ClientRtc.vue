<template>
  <div class="hello">
    <section class="select">
      <label for="audioSource">Audio source: </label>

      <select id="audioSource" v-if="updateDevice">
        <template v-for="audio in audios" v-bind:key="audio.deviceId">
          <option>
            {{ audio.label || `Microphone ${audio.deviceid}`}}
          </option>
        </template>
      </select>
    </section>
    
    <section class="select">
      <label for="videoSource">Video source: </label>
      <select id="videoSource" v-if="updateDevice">
        <template v-for="video in videos" v-bind:key="video.deviceId">
          <option>
            {{ video.label || `Camera ${video.deviceId}`}}
          </option>
        </template>
      </select>
    </section>
    <section>
      <button @click="eventPub" id="eventPub">broadcast</button>
      <button @click="eventSub" id="eventSub">watch</button>
    </section>

    <router-link to="/"> to main </router-link>
    <router-view></router-view>
    <video playsinline autoplay muted></video>
  </div>
</template>

<script>
import { inject } from 'vue'

export default {
  name: 'ClientRtc',
  props: {
  },
  computed: {
  },
  data() {
    return {
      socketId: "",
      peerConnections: {},
      peerConn: null,
      config: {
          iceServers: [
            {
              "urls": "stun:stun.1.google.com:19302",
            }
          ]
      },
      socket: inject('socket'),
      stream: null,
      deviceInfos: null,
      audios: [],
      videos: [],
      updateDevice: false,
    }
  },
  methods: {
    getStream(){
      if(window.stream) {
        window.stream.getTracks().forEach(track => {
          track.stop();
        });
      }
      if('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices){
        console.log("Your browser supports mediaDevices API");
      }
      const constraints = {
        audio: true,
        video: true
      };
      return navigator.mediaDevices
      .getUserMedia(constraints)
      .then(stream => {
        const videoElement = document.querySelector("video");
        window.stream = stream;
        videoElement.srcObject = stream;
        this.socket.emit("broadcaster");
      })
      .catch(error => {
        console.error("Error: ", error);
      });
    },
    eventSub(){
      // offer는 방에 참여할지 말지에 대한 제안
      this.socket.on("offer", (id, description) => {
        const video = document.querySelector("video");
        this.peerConn = new RTCPeerConnection(this.config);
        this.peerConn
        .setRemoteDescription(description)
        .then(sdp => this.peerConn.setLocalDescription(sdp))
        .then(() => {
          this.socket.emit("answer", id, this.peerConn.localDescription);
        });
        this.peerConn.ontrack = event => {
          video.srcObject = event.streams[0];
        };
        this.peerConn.onicecandidate = event => {
          if (event.candidate) {
            this.socket.emit("candidate", id, event.candidate);
          }
        };
      });

      this.socket.on("candidate", (id, candidate) => {
        this.peerConn
        .addIceCandidate(new RTCIceCandidate(candidate))
        .catch(e => console.error(e));
      });

      this.socket.on("broadcaster", () => {
        this.socket.emit("watcher");
      });

      window.onunload = window.onbeforeunload = () => {
        this.socket.close();
        this.peerConn.close();
      }
    },
    eventPub(){
      // 영상을 보내는 사람의 소켓에 추가되는 이벤트
      this.socket.on("answer", (id, description) => {
        this.peerConnections[id].setRemoteDescription(description);
      });

      this.socket.on("watcher", id => {
        const peerConnection = new RTCPeerConnection(this.config);
        this.peerConnections[id] = peerConnection;

        const videoElement = document.querySelector("video");
        let stream = videoElement.srcObject;
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

        // icecandidate이벤트 발생시 호출되는 함수를 정의해준다
        // icecandidate이벤트는 local ICE agent가 다른 peer에게 signaling server를 통해
        // 메시지를 전달해야 할때마다 발생한다
        // Signaling  Server는 사용자 간의 WebRTC를 위한 P2P 통신을 할 때 모르는 사용자를 엮어주는 역할을 한다.
        peerConnection.onicecandidate = (event) => {
          if (event.candidate){
            this.socket.emit("candidate", id, event.candidate);
          }
        }

        peerConnection
        .createOffer()
        .then(sdp => peerConnection.setLocalDescription(sdp))
        .then(() => {
          this.socket.emit("offer", id, peerConnection.localDescription);
        });
      });
      
      this.socket.on("candidate", (id, candidate) => {
        this.peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
      });

      this.socket.on("disconnectPeer", id => {
        this.peerConnections[id].close();
        delete this.peerConnections[id];
      });

      this.getStream();
    }
  },
  mounted() {
    this.socket.removeAllListeners();
    //video, audio장치 가져오기
    navigator.mediaDevices.enumerateDevices().then(
        devices => {
          window.deviceInfos = devices;
          devices.forEach(device => {
            if(device.kind === "audioinput"){
              this.audios.push(device);
            }
            else if(device.kind === "videoinput"){
              this.videos.push(device);
            }
          });
          //장치 가져오기 완료시
          this.updateDevice = true;
        }
      );
    console.log("mounted");
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
