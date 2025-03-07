<script setup>
import { onBeforeMount, ref } from 'vue'
import { FILE_SIZE_UNIT } from '@/constants/upload'
import { ElMessage } from 'element-plus'
import ConcurrentPool from '@/utils/concurrent'
import fileSlice from '@/utils/file-slice'
import logger from '@/utils/logger'

/**
 * props
 */
const props = defineProps({
  // 分片大小
  chunkSize: {
    type: Number,
    default: FILE_SIZE_UNIT * FILE_SIZE_UNIT, // 1M
  },
  // 并发上传文件数量
  simultaneousUploads: {
    type: Number,
    default: 3,
  },
  retryTimes: {
    type: Number,
    default: 3,
  },
})

const fileList = ref([])
const uploadUrl = 'fakeUrl'
let worker = null
const concurrentpool = new ConcurrentPool(props.simultaneousUploads)
const logOutput = ref(null)

onBeforeMount(() => {
  initWorker()
})

function initWorker() {
  // 为了在work脚本中可以使用模块化，这里要声明模块化的加载方式
  worker = new Worker(new URL('@/utils/calc-md5.js', import.meta.url), { type: 'module' })
  worker.onmessage = (e) => {
    const {
      message: { file, md5 },
      type,
    } = e.data
    switch (type) {
      case 'success':
        file.md5 = md5
        checkUploaded(file)
        break
      case 'error':
        ElMessage({
          type: 'error',
          message: e.data.message,
        })
        break
      default:
        break
    }
  }

  worker.onerror = (e) => {
    ElMessage({
      type: 'error',
      message: e.data.message,
    })
  }
}
/**
 * 检测是否已上传
 * 已上传则直接添加文件
 * 未上传则触发分片上传
 * @param file
 */
function checkUploaded(file) {
  // MD5存在本地 模拟服务端存储
  const fileMd5List = JSON.parse(localStorage.getItem('fileMd5List'))
  if (Array.isArray(fileMd5List) && fileMd5List.indexOf(file.md5) > -1) {
    // 已经上传过的逻辑
    fileList.value.push({
      ...file,
      status: 'success',
    })
    logger.log(`文件<span class="highlight">${file.name}</span>上传成功`)
  } else {
    fileList.value.push({
      ...file,
      status: 'waiting',
    })
    concurrentpool
      .add(() => fileSlice(file, props.chunkSize, chunkUpload, props.retryTimes, updateFile))
      .then((res) => {
        logger.log(`文件<span class="highlight">${res.name}</span>上传成功`)
      })
      .catch((error) => {
        logger.error(`文件<span class="highlight">${error.name}</span>上传失败`)
      })
  }
}

function updateFile(file) {
  // uid是文件上传时自动生成的，对应当时时间戳，可以保证唯一
  let curFile = fileList.value.find((item) => item.uid === file.uid)
  if (!curFile) return // 可能被删除或者其他情况
  // curFile是一个proxy，不支持直接赋值 通过修改属性修改对象
  for (const key in file) {
    curFile[key] = file[key]
  }
}

/**
 * 模拟分片异步上传
 * @param chunk
 * @param md5
 */
function chunkUpload(chunk, md5) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const random = Math.ceil(Math.random() * 10)
      // console.log('模拟分片上传成功概率', random, random > 11 ? '成功' : '失败')
      if (random > 5) {
        resolve({ chunk, md5 })
      } else {
        reject('分片上传失败')
      }
    }, 1000)
  })
}

/**
 * 这里对上传文件进行预处理
 * 计算md5
 * @param file
 */
const onUpload = (file) => {
  // console.log(file)
  getMD5(file)
}

const fakeUpload = () => {
  return false
}

const getMD5 = (file) => {
  worker.postMessage(file)
}

const remove = () => {
  // console.log(file)
}

const handleExceed = () => {
  ElMessage({
    type: 'error',
    message: '超出最大上传数量',
  })
}
/**
 * 该函数恒定返回为false，保证文件不会被上传，也即不会被添加到fileList中
 * 而后在计算完md5后手动添加到列表中
 */
function beforeUpload() {
  return false
}

function clearLocalStorage() {
  localStorage.removeItem('fileMd5List')
  ElMessage({
    type: 'success',
    message: '清除成功',
  })
}

function formatSize(size) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(2)} ${units[i]}`
}

function getStatusLabel(status) {
  const statusLabels = {
    success: '成功',
    waiting: '等待',
    error: '错误',
    uploading: '上传中',
  }
  return statusLabels[status] || '未知'
}
</script>

<template>
  <div class="upload-demo">
    <div class="upload-section">
      <button class="clear-button" @click="clearLocalStorage">清除 LocalStorage</button>
      <el-upload
        class="el-upload-demo"
        name="file"
        multiple
        v-model:file-list="fileList"
        :action="uploadUrl"
        :http-request="fakeUpload"
        :show-file-list="false"
        drag
        :on-change="onUpload"
        :on-remove="remove"
        :on-exceed="handleExceed"
        :before-upload="beforeUpload"
        :before-remove="beforeRemove"
        :limit="20"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">Drop file here or <em>click to upload</em></div>
      </el-upload>
      <div class="file-list">
        <div v-for="(file, index) in fileList" :key="index" class="file-item" :class="file.status">
          <div class="file-info">
            <span class="file-name">{{ file.name }}</span>
            <span class="file-size">{{ formatSize(file.size) }}</span>
            <span class="file-status">{{ getStatusLabel(file.status) }}</span>
          </div>
          <div
            v-if="file.status === 'uploading'"
            class="progress-bar"
            :style="{ width: file.progress * 100 + '%' }"
          ></div>
        </div>
      </div>
    </div>
    <div class="log-section">
      <h2>日志输出</h2>
      <div id="logOutput" class="log-output" ref="logOutput"></div>
    </div>
  </div>
</template>

<style scoped>
.upload-demo {
  display: flex;
  width: 100%;
  height: 100%;
  background-color: #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.el-upload-demo {
  width: 100%;
  height: 400px;
}

.upload-section {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #ddd;
}

.log-section {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.log-section h2 {
  margin-bottom: 10px;
}

.log-output {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  overflow-y: auto;
  background-color: #f9f9f9;
}

.clear-button {
  margin-bottom: 20px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  background-color: #dc3545;
  color: #fff;
  transition: background-color 0.3s;
}

.clear-button:hover {
  background-color: #c82333;
}

:deep(.el-upload) {
  width: 100%;
  height: 100%;
  background-color: #f0f9eb; /* 浅灰色背景色 */
}

:deep(.el-upload-dragger) {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

:deep(.el-upload-dragger .el-icon-upload) {
  font-size: 60px;
  color: #409eff;
}

:deep(.el-upload-dragger .el-upload__text) {
  font-size: 16px;
  color: #606266;
}

.file-list {
  width: 100%;
  margin-top: 20px;
}

.file-info {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.file-item {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
  overflow: hidden;
}

.file-item.success {
  background-color: #f0f9eb;
  border-color: #e1f3d8;
}

.file-item.waiting {
  background-color: #fdf6ec;
  border-color: #faecd8;
}

.file-item.error {
  background-color: #fef0f0;
  border-color: #fde2e2;
}

.file-item.uploading {
  background-color: #ecf5ff;
  border-color: #e6f7ff;
}

.file-name {
  font-weight: bold;
}

.file-size {
  color: #909399;
}

.file-status {
  font-weight: bold;
  color: #606266;
}

.file-item.success .file-status {
  color: #67c23a;
}

.file-item.waiting .file-status {
  color: #e6a23c;
}

.file-item.error .file-status {
  color: #f56c6c;
}

.file-item.uploading .file-status {
  color: #409eff;
}

.progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: rgba(64, 158, 255, 0.5); /* 半透明蓝色 */
  border-radius: 4px;
  transition: width 0.3s;
  z-index: 0;
}
</style>

<style>
.highlight {
  color: #1876ff;
}

p {
  line-height: 2;
}
</style>
