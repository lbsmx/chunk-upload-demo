# chunk-upload-demo

该demo实现如下几个功能：

1. 秒传校验
2. 断点续传
3. 错误重试
4. 并发上传
5. 上传过程中移除

## 从设计的角度考虑

首先支持点击/拖拽上传

上传后进行预处理：计算整个文件的MD5

根据md5触发秒传校验

上传后自动触发分片上传机制

依据分片大小对文件进行切分，分成若干片，分片的数量是预知的

对每片按照顺序执行上传操作

上传失败的分片要阻塞后续分片的上传，连续上传若干次仍失败后，整个文件上传失败

秒传校验要使用MD5进行判断

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
