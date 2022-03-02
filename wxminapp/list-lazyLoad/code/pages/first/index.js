// index.js
// 获取应用实例
const app = getApp()

const list = Array.from({length: 5}, (item, index) => {
  return Array.from({length: Math.ceil(Math.random()*10 + 5)}, (subItem, subIndex) => {
    return {name: `第${index+1}屏, 第${subIndex+1}个`}
  })
})

console.log('list', list);

Page({
  data: {
    goodsList: [],
    lazyloadIdx: 0
  },
  onLoad() {
    this.setData({
      goodsList: [list[0]],
      lazyloadIdx: 1
    })
  },
  onReachBottom () {
    console.log('onReachBottom');
    let { lazyloadIdx } = this.data
    if (lazyloadIdx >= list.length) return
    this.setData({
      [`goodsList[${lazyloadIdx}]`]: list[lazyloadIdx],
      lazyloadIdx: lazyloadIdx+1
    })
  }
})
