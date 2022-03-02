// index.js
// 获取应用实例
const app = getApp()

const list = Array.from({length: 5}, (item, index) => {
  return Array.from({length: Math.ceil(Math.random()*10 + 5)}, (subItem, subIndex) => {
    return {name: `第${index+1}屏, 第${subIndex+1}个`}
  })
})

console.log('list', list);

let lazyloadOb = null
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
    this.initObserver()
  },
  onunload () {
    this.disconnenct()
  },
  lazyloadNext () {
    console.log('lazyloadNext');
    let { lazyloadIdx } = this.data
    if (lazyloadIdx >= list.length) return
    this.setData({
      [`goodsList[${lazyloadIdx}]`]: list[lazyloadIdx],
      lazyloadIdx: lazyloadIdx+1
    })
  },
  initObserver () {
    lazyloadOb = wx.createIntersectionObserver().relativeToViewport({ bottom: 50 }).observe('#observer', (res) => {
      console.log('res.intersectionRatio', res.intersectionRatio);
      if (res.intersectionRatio) this.lazyloadNext()
    })
  },
  disconnenct() {
    lazyloadOb.disconnenct()
  }
})
