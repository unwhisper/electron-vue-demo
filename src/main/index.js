import { app, BrowserWindow, ipcMain } from 'electron'
import Config from '../../static/js/config'

if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

//MD5加密
const md5 = require('js-md5');
//文件处理
const fs = require('fs')
//nodejs中的path模块
const path = require('path')

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 550,
    width: 700,
    useContentSize: true,
    minWidth:700,
    minHeight:550,
    maxWidth:700,
    maxHeight:550,
    frame: false,
    show:false,
    webPreferences: {
      nodeIntegration: true
    }
  })
  new Config(mainWindow)

  var downloadItems = new Map();

  function getDownloadItem(downloadpath) {
    if(downloadItems.has(md5(downloadpath))){
      var item = downloadItems.get(md5(downloadpath));
      return item;
    }else{
      return false;
    }
  }

  //主进程代码
  let downloadUrl
  let command
  ipcMain.on('download', (evt, args) => {
      let url = JSON.parse(args);
      downloadUrl = url.downloadUrl
      command = url.command

      //开始下载
      if(command === 'startDownload') {
          mainWindow.webContents.downloadURL(downloadUrl);
          return ;
      }
  });

  mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
    //设置文件存放位置
    const fileName = item.getFilename();
    const downloadPath = store.get('downloadPath')
 
    let fileNum = 0;
    let savePath = path.join(downloadPath, fileName);
 
    // savePath基础信息
    const ext = path.extname(savePath);
    const name = path.basename(savePath, ext);
    const dir = path.dirname(savePath);
 
    // 文件名自增逻辑
    while (fs.existsSync(savePath)) {
      fileNum += 1;
      savePath = path.format({
        dir: dir,
        ext: ext,
        name: `${name}(${fileNum})`,
      });
    }
    downloadItems.set(md5(item.getURL()),item);
    //console.log(item.getURL())
    // 设置下载目录，阻止系统dialog的出现
    item.setSavePath(savePath);

    item.on('updated', (event, state) => {
        if (state === 'interrupted') {
        console.log('下载中断但可以恢复！')
        } else if (state === 'progressing') {
            if (item.isPaused()) {
              console.log('下载已暂停')
            } else {
              //下载进度
              let download_percent = ((item.getReceivedBytes()/item.getTotalBytes())*100).toFixed(2);
              console.log(download_percent+'%');
              mainWindow.webContents.send('tips',download_percent);
            }
        }
    })

    item.once('done', (event, state) => {
      if (state === 'completed') {
        console.log('下载完成！')
        downloadItems.delete(md5(item.getURL()))
        mainWindow.webContents.send('tips', '下载完成')
        mainWindow.webContents.send('file', item.getSavePath())
      } else {
        console.log(`下载失败: ${state}`)
        mainWindow.webContents.send('tips', 'fail')
      }
    })
  })

  mainWindow.loadURL(winURL)
  
  mainWindow.on('ready-to-show', function () {
    mainWindow.show() // 初始化后再显示
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)
app.allowRendererProcessReuse = true

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
