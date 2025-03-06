<script setup>
import { onBeforeMount, ref } from 'vue'
import { FILE_SIZE_UNIT } from '@/constants/upload'
import { ElMessage } from 'element-plus'
import ConcurrentPool from '@/utils/concurrent'
import fileSlice from '@/utils/file-slice'

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
  } else {
    fileList.value.push({
      ...file,
      status: 'waiting',
    })
    concurrentpool
      .add(() => fileSlice(file, props.chunkSize, chunkUpload, props.retryTimes))
      .then((res) => {
        console.log('文件上传成功', res)
      })
      .catch((error) => {
        console.log('文件上传失败', error)
      })
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
      if (random > 11) {
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
  console.log(file)
  getMD5(file)
}

const fakeUpload = () => {
  return false
}

const getMD5 = (file) => {
  worker.postMessage(file)
}

const remove = (file) => {
  console.log(file)
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
</script>

<template>
  <div class="upload-demo">
    <el-upload
      name="file"
      multiple
      v-model:file-list="fileList"
      :action="uploadUrl"
      :http-request="fakeUpload"
      drag
      :on-change="onUpload"
      :onRemove="remove"
      :onExceed="handleExceed"
      :before-upload="beforeUpload"
      :beforeRemove="beforeRemove"
      :limit="3"
    >
      <template #trigger>
        <el-button size="small" type="primary">点击上传</el-button>
      </template>
    </el-upload>
  </div>
</template>
<style lang=""></style>
