<template>
  <div class="container">
    <h1>Hello Electron + Vite + Vue!</h1>
    <video ref="videoElement" autoplay></video>
    <div class="button-container">
      <button id="startBtn" @click="startRecord" :class="startButtonClass">{{ startButtonText }}</button>
      <button id="stopBtn" @click="stopRecord" class="button is-warning">Stop</button>
    </div>

    <hr />

    <button id="videoSelectBtn" @click="getVideoSources" class="button is-dark">{{ buttonText }}</button>
  </div>

</template>

<script setup>
import { ref, onMounted } from "vue";


const buttonText = ref('Choose a Video Source')
const videoElement = ref(null);  // 用来引用 video 元素
const startButtonClass = ref('button is-primary')
const startButtonText = ref('Start')

let mediaRecorder; // MediaRecorder instance to capture footage
const recordedChunks = [];

// 当菜单项被选择时，更新按钮的文本
onMounted(() => {
  window.electronAPI.onMenuItemSelected(selectSource);
});

const getVideoSources = async () => {
  // 调用 Electron API 获取视频源
  const inputSources = await window.electronAPI.getVideoSources();

  // 创建菜单模板（不使用 MenuItem，使用模板数据）
  const template = inputSources.map((source, index) => ({
    label: source.name,  // 显示屏幕名称
    id: source.id,
  }));
  // 使用生成的 MenuItem 对象数组显示菜单
  window.electronAPI.showMenu(template);
};

function startRecord(e) {
  mediaRecorder.start()
  startButtonClass.value = 'button is-danger'
  startButtonText.value = 'Recording'
}
function stopRecord(e) {
  mediaRecorder.stop()
  startButtonText.value = 'button is-primary'
  startButtonText.value = 'Start'
}
// Captures all recorded chunks
function handleDataAvailable(e) {
  recordedChunks.push(e.data);
}
// Saves the video file on stop
async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: 'video/webm; codecs=vp9'
  });

  //const buffer = Buffer.from(await blob.arrayBuffer());
  // 转换 Blob 为 ArrayBuffer
  const arrayBuffer = await blob.arrayBuffer();

  // 使用 Electron 暴露的 Buffer API
  const buffer = window.electronAPI.bufferFromArrayBuffer(arrayBuffer);

  // 通过 Electron 调用保存对话框
  const filePath = await window.electronAPI.showSaveDialog();

  if (filePath) {
    // 调用 Electron API 保存文件
    const result = await window.electronAPI.saveFile(filePath, buffer);
    console.log('Video saved successfully!');

  }

}


async function selectSource({ id, label }) {
  buttonText.value = label;
  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: id
      }
    }
  }
  // Create a Stream
  const stream = await navigator.mediaDevices
    .getUserMedia(constraints);
  videoElement.value.srcObject = stream
  // 在视频的 metadata 加载完成后再调用 play
  videoElement.value.onloadedmetadata = () => {
      videoElement.value.play().catch(error => {
        console.error('Error playing the video:', error);
      });
    }



  //创建录制对象
  const options = { mimeType: 'video/webm; codecs=vp9' };
  mediaRecorder = new MediaRecorder(stream, options);

  // Register Event Handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
}


</script>

<style>
video {
  width: 100%;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.button-container {
  display: flex;
  gap: 10px;
  /* 按钮之间的间距 */
  justify-content: center;
  width: 100%;
}

h1 {
  text-align: center;
}
</style>
