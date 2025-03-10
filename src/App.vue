<script setup>
import UploadDemo from '@/components/upload-demo.vue'
import 'element-plus/dist/index.css'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'

const chunkSize = ref(1024 * 1024)
const simultaneousUploads = ref(3)
const retryTimes = ref(3)

function clearLocalStorage() {
  localStorage.removeItem('fileMd5List')
  ElMessage({
    type: 'success',
    message: '清除成功',
  })
}
</script>

<template>
  <div id="app">
    <div class="controls-wrapper">
      <el-tooltip effect="dark" content="如果想避免秒传校验的影响，点击该按钮" placement="top">
        <el-button size="small" type="danger" @click="clearLocalStorage"
          >清除 LocalStorage</el-button
        >
      </el-tooltip>
      <div class="control-box">
        <span class="label">分块大小（单位bit）</span>
        <el-input v-model="chunkSize" size="small" type="number"></el-input>
      </div>
      <div class="control-box">
        <span class="label">文件并发上传数</span>
        <el-input v-model="simultaneousUploads" size="small" type="number"></el-input>
      </div>
      <div class="control-box">
        <span class="label">重试次数</span>
        <el-input v-model="retryTimes" size="small" type="number"></el-input>
      </div>
    </div>
    <upload-demo
      :chunk-size="chunkSize"
      :simultaneous-uploads="simultaneousUploads"
      :retry-times="retryTimes"
    ></upload-demo>
  </div>
</template>

<style>
* {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  font-family:
    'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', 'Helvetica Neue', Helvetica,
    Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

html,
body {
  width: 100%;
  height: 100%;
}

#app {
  display: flex;
  flex-direction: column;
  padding: 24px;
  width: 100%;
  height: 100%;
}

.controls-wrapper {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 24px;
  gap: 12px;
}

.control-box {
  display: flex;
  align-items: center;
}

.label {
  white-space: nowrap;
  margin-right: 6px;
}
</style>
