<template>
  <div class="hello">
    <h2>Client Id: {{ getUserId }}</h2>
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
      <button @click="getStream" id="getStream">getStream</button>
      <button @click="connect" id="connect">connect</button>
    </section>

    <router-link to="/"> to main </router-link>
    <router-view></router-view>
    <video playsinline autoplay muted></video>
  </div>
</template>

<script>
export default {
  name: 'ClientRtc',
  props: {
  },
  computed: {
    getUserId(){
      return this.$route.params.userId;
    }
  },
  data() {
    return {
      socketId: "",
      peerConnections: {},
      peerConn: null,
      config: {
          iceServer: [
            {
              "urls": "stun:stun.1.google.com:19302",
            }
          ]
      },
      socketPub: null,
      socketSub: null,
      stream: null,
      deviceInfos: null,
      audios: [],
      videos: [],
      updateDevice: false,
    }
  },
  methods: {
    connect(){
      if(this.socketPub === null){
        this.socketPub = io.connect('http://localhost:3000');
      }
      console.log(this.socketPub);
    },
    eventSub(){
      const config = {
        iceServers: [
            { 
              "urls": "stun:stun.l.google.com:19302",
            },
        ]
      };
      // offer는 방에 참여할지 말지에 대한 제안
      this.socketSub.on("offer", (id, description) => {
        const video = document.querySelector("video");
        this.peerConn = new RTCPeerConnection(config);
        this.peerConn
        .setRemoteDescription(description)
        .then(sdp => this.peerConn.setLocalDescription(sdp))
        .then(() => {
          this.socketSub.emit("answer", id, this.peerConn.localDescription);
        });
        this.peerConn.ontrack = event => {
          video.srcObject = event.streams[0];
        };
        this.peerConn.onicecandidate = event => {
          if (event.candidate) {
            this.socketSub.emit("candidate", id, event.candidate);
          }
        };
      });

      this.socketSub.on("candidate", (id, candidate) => {
        this.peerConn
        .addIceCandidate(new RTCIceCandidate(candidate))
        .catch(e => console.error(e));
      });

      this.socketSub.on("broadcaster", () => {
        this.socketSub.emit("watcher");
      });

      window.onunload = window.onbeforeunload = () => {
        this.socketSub.close();
        this.peerConn.close();
      }
    },
    eventPub(){
      // 영상을 보내는 사람의 소켓에 추가되는 이벤트
      this.socketPub.on("answer", (id, description) => {
        this.peerConnections[id].setRemoteDescription(description);
      });

      this.socketPub.on("watcher", id => {
        const peerConnection = new RTCPeerConnection(this.config);
        this.peerConnections[id] = peerConnection;

        const videoElement = document.querySelector("video");
        let stream = videoElement.srcObject;
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

        // RTCPeerConnection 속성의 onicecandidate 는 RTCPeerConnection 인스턴스에서 icecandidate 이벤트 발생시에 호출 하려는 함수를 지정
        // icecandidate event는 새로운 candidate가 생겼을때 발생하는 이벤트
        peerConnection.onicecandidate = (event) => {
          if (event.candidate){
            this.socketPub.emit("candidate", id, event.candidate);
          }
        }

        peerConnection
        .createOffer()
        .then(sdp => peerConnection.setLocalDescription(sdp))
        .then(() => {
          this.socketPub.emit("offer", id, peerConnection.localDescription);
        });
      });
      
      this.socketPub.on("candidate", (id, candidate) => {
        this.peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
      });

      this.socketPub.on("disconnectPeer", id => {
        this.peerConnections[id].close();
        delete this.peerConnections[id];
      })
    },
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
        this.socketPub.emit("broadcaster");
      })
      .catch(error => {
        console.error("Error: ", error);
      });
    }
  },
  mounted() {
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
