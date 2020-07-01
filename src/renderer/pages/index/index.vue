<template>
  <div id="wrapper">
    <main>
      <div>
        <MyHeader></MyHeader>
      </div>
      <div>
        <Input search enter-button="Search" v-model="inputValue" placeholder="输入instagram地址" @on-search="search()" />
      </div>
      <div>
        content
      </div>
    </main>
  </div>
</template>

<script>
  import MyHeader from '@/components/Header'
  const request = require('request')
  const Store = require('electron-store')
  const store = new Store();
  export default {
    name: 'index',
    data() {
      return {
        inputValue: ''
      }
    },
    components: { MyHeader },
    mounted() {
    },
    methods: {
      search() {
        let url = this.inputValue
        let reg
        if(/\/tv\//.test(url)){
          reg = /^(?:(.*)instagram.com(.*)\/tv\/)?([^/]+)/
        }else if(/\/p\//.test(url)){
          reg = /^(?:(.*)instagram.com(.*)\/p\/)?([^/]+)/
        }else{
          this.$layer.msg('链接格式不正确!')
          return
        }
        let result = url.match(reg)
        if(result) {
          url = result[0] + '/?__a=1'
          let id = result[3]
          if(id.length == 39) {
            this.$layer.msg('暂不支持获取私密用户素材!')
            return
          }
        }else{
          this.$layer.msg('链接错误!')
          return
        }
        this.$layer.closeAll()
        this.$Loading.destroy()
        let proxy = store.get('proxy')
        if (!proxy || !store.has('proxy')) {
          this.$layer.msg('请先设置代理!')
          return
        }
        let layerId = this.$layer.loading({content: '开始获取！', time: 2})
        this.$Loading.start()
        let cookie = 'ig_did=8834CBB0-F7E1-4BAA-91A0-CDF558F333B9; mid=XvgKAQALAAHuS46ocQbVa7IC9itp; csrftoken=qQqf4Y8OCTB2wFOuxkEI6RKgaXLlxi04; ds_user_id=18297499824; sessionid=18297499824%3AHKlAMiq155UwYC%3A0; shbid=36; shbts=1593313802.7085931; rur=ATN; urlgen="{\"8.210.146.11\": 45102\\054 \"42.3.53.67\": 4760}:1jqDYd:6hWSP5NcOE4TYZuI75xYm2b0OzE"'
        let options = {
          uri: url,
          // timeout: 2000,
          proxy: proxy,
          headers: {
            cookie: cookie
          }
        }
        let that = this
        request(options, function (err, res, body) {
          if (!err && res.statusCode === 200) {
            that.$Loading.finish()
            console.log(JSON.parse(body))
          }else{
            that.$Loading.error()
            that.$layer.msg('获取失败，请稍后再尝试!')
            console.log(err)
          }
        })
      },
      insLogin() {
        let proxy = store.get('proxy')
        if (!proxy || !store.has('proxy')) {
          this.$layer.msg('请先设置代理!')
          return
        }
        let url = 'https://www.instagram.com/accounts/login/ajax/'
        let ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36 Edg/83.0.478.56'
        let data = {
          username: 'whisper57124@gmail.com',
          password: 'leijie57124'
        }
        let options = {
          uri: url,
          proxy: proxy,
          method: 'POST',
          json: true,
          headers: {
            'User-Agent': ua,
            "content-type": "application/json",
            'Referer': 'https://www.instagram.com',
          },
          body: JSON.stringify(data)
        }
        request(options, function (err, res, body) {
          console.log(err, res, body)
          if (!err && res.statusCode === 200) {
            console.log(body)
          }else{
            console.log(err, res)
          }
        })
      }
    }
  }
</script>

<style>

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body { font-family: 'Source Sans Pro', sans-serif; }

  #wrapper {
    background:
      radial-gradient(
        ellipse at top left,
        rgba(255, 255, 255, 1) 40%,
        rgba(229, 229, 229, .9) 100%
      );
    height: 100vh;
    padding: 60px 80px;
    width: 100vw;
  }
</style>
