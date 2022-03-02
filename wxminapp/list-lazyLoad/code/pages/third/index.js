// index.js
// 获取应用实例
const app = getApp()

const goodsList = Array.from({length: 20}, (item, index) => {
  return {name: `第${index+1}个`, soldOut: index < 12 ? false : true}
})

let resList = []

let lazyloadOb = null
Page({
  data: {
    renderList: [],
    lazyloadIdx: 0
  },
  onLoad() {
    this.initObserver()
    this.handleGoodsList()
  },
  onunload () {
    this.disconnenct()
  },
  lazyloadNext () {
    console.log('lazyloadNext');
    let { lazyloadIdx } = this.data
    if (lazyloadIdx >= resList.length) return
    this.setData({
      [`renderList[${lazyloadIdx}]`]: resList[lazyloadIdx],
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
  },
  handleGoodsList () {
    const { onSaleLen, soldOutLen } = this.countSaleLen()
    console.log('onSaleLen', onSaleLen, 'soldOutLen', soldOutLen);
    const {
      subSize,
      soldOutLen: soldOutLength,
      soldOutIndex
    } = this.genSubListSize(onSaleLen, soldOutLen)
    resList = this.genRenderList(subSize)
    console.log('resList', resList);
    this.setData({
      [`renderList${0}`]: resList[0]
    })
  },
  countSaleLen () {
    const soldOutIndex = goodsList.findIndex(good => good.soldOut)
    if (soldOutIndex === -1) {
      return {
        onSaleLen: goodsList.length,
        soldOutLen: 0
      }
    }
    return {
      onSaleLen: soldOutIndex,
      soldOutLen: goodsList.length - soldOutIndex
    }
  },
  genSubListSize (onSaleLen, soldOutLen) {
    // 有售罄的时候，放一项售罄到非售罄那边去
    if (soldOutLen) {
      soldOutLen-= 1
      onSaleLen+=1
    }
    const arr = []
    const lazyloadListPartLength = 5 // 一屏5个
    let firstSize = 0
    if (onSaleLen < lazyloadListPartLength*2) {
      firstSize = onSaleLen
      onSaleLen = 0
    } else {
      firstSize = lazyloadListPartLength
      onSaleLen -= lazyloadListPartLength
    }
    arr.push(firstSize)
    
    // 子项长度
    const size = lazyloadListPartLength
    const remainder = onSaleLen % size
    arr.push(
      ...Array.from({length: Math.floor(onSaleLen/size) - 1}, () => size),
    )
    if (onSaleLen) {
      arr.push(onSaleLen <= size ? onSaleLen : size + remainder)
    }
    // 记录此时售罄项的索引，因为要点击展开才能加载售罄列表
    const soldOutIndex = arr.length
    if (soldOutLen) {
      const remainder = soldOutLen % size
      arr.push(
        ...Array.from({length: Math.floor(soldOutLen/size) - 1}, () => size), 
        soldOutLen <= size ? soldOutLen : size + remainder
      )
    }
  
    console.log('genSubListSize', arr)
    
    return {
      subSize: arr,
      soldOutLen,
      soldOutIndex
    }
  },
  genRenderList (subSize) {
    const before = goodsList
    const after = []
    let subList = [] // 二维数组子项
    let subLen = 0 // 子项长度
    let splitSizeArrIdx = 0 // 长度数组索引
    for (let i = 0; i < before.length; i++) {
      if (subLen === subSize[splitSizeArrIdx]) {
        splitSizeArrIdx++
        after.push(subList)
        subList = []
        subLen = 0
      }
      before[i]['part'] = `第${splitSizeArrIdx+1}屏`
      subList.push(before[i])
      subLen++
    }
    // 最后一个子项添加进去
    after.push(subList)
    return after
  }
})
