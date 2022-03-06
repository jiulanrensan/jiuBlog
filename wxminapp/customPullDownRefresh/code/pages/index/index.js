// index.js
// 获取应用实例
const app = getApp()

Page({
  data: {
    goodsList: Array.from({length: 20}, (item, index) => {
      return {
        key: `第${index+1}个`,
        name: `第${index+1}个`
      }
    })
  },
  onLoad() {
  },
})
