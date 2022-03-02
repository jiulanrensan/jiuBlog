# 小程序上的列表懒加载
长列表我们经常接触到，长列表为什么需要懒加载呢，因为一旦渲染内容多了，渲染引擎就需要更多的时间去渲染画面，这时可能会出现页面白屏、卡顿等。而用户其实只需要看到视窗内的内容就可以了，不用一次性把全部内容渲染完，所以可以通过懒加载实现。


## 分页加载
常见的列表懒加载是和后端一起实现，也就是分页加载。前端请求第几页的数据，后端就返回第几页的数据。前端要实现的交互就是当用户滑动到页面底部时，就要请求下一页的数据。

### 用scroll事件监听
<center>
  <img style="border-radius: 0.3125em;
  box-shadow: 0 2px 4px 0 rgba(34,36,38,.12),0 2px 10px 0 rgba(34,36,38,.08);" 
  src="https://gitee.com/jlrszxc/pic-go-images/raw/master/images/20220228110622.png">
  <br>
  <div style="color:orange; border-bottom: 1px solid #d9d9d9;
  display: inline-block;
  color: #999;
  padding: 2px;">高度示意图</div>
</center>

监听`scroll`事件，事件回调会有当前元素的滚动距离`scrollTop`，当`scrollTop`+`screenHeight`等于滚动高度`scrollHeight`时，表示已经滑动到底部。

在小程序中，`Page`对象提供`onReachBottom`api
```js
onReachBottom: function() {
  // 页面触底时执行
},
```

### 用`IntersectionObserver`监听
用滚动监听会非常耗性能，滚动时频繁触发回调的，所以会不断去计算判断。比较好的优化方案是`IntersectionObserver`API，当`IntersectionObserver`监听的元素与可视区有相交状态时，就会产生回调，这样就减少了触发的频率
```js
Page({
  onLoad: function(){
    wx.createIntersectionObserver().relativeToViewport({bottom: 100}).observe('.target-class', (res) => {
      res.intersectionRatio // 相交区域占目标节点的布局区域的比例，不等于0时表示有相交
      res.intersectionRect // 相交区域
      res.intersectionRect.left // 相交区域的左边界坐标
      res.intersectionRect.top // 相交区域的上边界坐标
      res.intersectionRect.width // 相交区域的宽度
      res.intersectionRect.height // 相交区域的高度
    })
  }
})
```

## 前端分页渲染
上面说的都是前端结合接口的分页加载。假如说接口没有分页，直接就返回了庞大的数据列表。前端如果直接就`setData`所有数据，会渲染很久，其实复杂的列表渲染20条的时候就已经很慢了。这个时候需要对已经获取到的数据进行分页，分批进行渲染。

<center>
  <img style="border-radius: 0.3125em;
  box-shadow: 0 2px 4px 0 rgba(34,36,38,.12),0 2px 10px 0 rgba(34,36,38,.08);" 
  src="https://gitee.com/jlrszxc/pic-go-images/raw/master/images/列表懒加载.gif">
  <br>
  <div style="color:orange; border-bottom: 1px solid #d9d9d9;
  display: inline-block;
  color: #999;
  padding: 2px;">列表分页渲染示意图</div>
</center>

通过右侧面板可以看到，一开始没有渲染所有节点，在滑动页面过程中节点再不断增加。

直接上代码
```html
<!-- pages/first/index.wxml -->
<view class="container">
  <block wx:for="{{goodsList}}" wx:key="index" wx:for-item="subItemList">
    <block wx:for="{{subItemList}}" wx:key="name">
      <view class="item">{{item.name}}</view>
    </block>
  </block>
</view>
```
`goodsList`是一个二维数组，用`wx:for`双重遍历
```js
// pages/first/index.js
const list = Array.from({length: 5}, (item, index) => {
  return Array.from({length: Math.ceil(Math.random()*10 + 5)}, (subItem, subIndex) => {
    return {name: `第${index+1}屏, 第${subIndex+1}个`}
  })
})
/**
生成的list是一个二维数组
[
  [{}, {}],
  [{}, {}],
  [{}, {}],
  ...
]
**/

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
  // 滑动到底部时往goodsList添加数据
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
```
每次只`setData`一屏数据，既减少了`setData`数据量，又减少渲染时间

### 用`IntersectionObserver`代替`onReachBottom`
有很多场景用不了`onReachBottom`，那我们只能用`IntersectionObserver`代替。优化一下上面的代码
```diff
# pages/second/index.wxml
<view class="container">
  <block wx:for="{{goodsList}}" wx:key="index" wx:for-item="subItemList">
    <block wx:for="{{subItemList}}" wx:key="name">
      <view class="item">{{item.name}}</view>
    </block>
  </block>
+  <view id="observer" class="bottom"></view>
</view>
```
增加节点用来监听
```js
//  pages/second/index.js
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
      // 触发回调时加载下一屏
      if (res.intersectionRatio) this.lazyloadNext()
    })
  },
  disconnenct() {
    lazyloadOb.disconnenct()
  }
})
```

### 加需求！
后端返回的商品列表只是一个一维数组，需要前端转为二维数组，现在需要每屏的列表长度为5。

假设商品列表个数为21，那么会生成二维数组对应的子项长度：
```md
// 伪代码
[5, 5, 5, 5, 1]
```
我们可以设定分页大小`pageSize`为5，当前分页`pageNum`，然后`list.slice(pageNum, pageSize)`就能截取对应的数据，再加入到二维数组中。

但是产品来加需求了，商品列表默认只展示非售罄商品+一个售罄商品，其余售罄商品要点击【查看更多】按钮才展示

假设非售罄商品有16个，售罄11个，每屏的列表长度还是5，那么：
```js
[
  5, 5, 5,    // 非售罄
  2,          // 非售罄+售罄
  5, 5        // 售罄
]
```
只有两个的长度不大适合再分一屏，所以小于5时，直接跟前面的合并
```js
[
  5, 5, 7, // 非售罄+一个售罄
  5, 5     // 售罄
]
```
这个时候设定`pageSize`就没法满足了，所以要根据售罄个数，非售罄个数以及一屏长度，算出长度数组，再算出对应的二维数组

```js
/**
  * @desc 生成商品列表的子项长度
  * 展示列表包含售罄的，在非售罄列表最后拼接一个售罄商品，点击展开再加载售罄
  * 
  * @param {number} onSaleLen 非售罄长度
  * @param {number} soldOutLen 售罄长度
  * @returns { { subSize: Array<number>; soldOutLen: number } }
  */
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
}
/**
  * eg: onSaleLen = 25; soldOutLen = 9; size = 5
  * return [5, 5, 5, 5, 6, 8]
  * eg: onSaleLen = 15; soldOutLen = 9; size = 5
  * return [5, 5, 6, 8]
  * eg: onSaleLen = 10; soldOutLen = 10; size = 5
  * return [5, 6, 9]
  * eg: onSaleLen = 14; soldOutLen = 10; size = 5
  * return [5, 5, 5, 9]
  * eg: onSaleLen = 8; soldOutLen = 9; size = 5
  * return [9, 8]
  * eg: onSaleLen = 2; soldOutLen = 10; size = 7 像这种小于非售罄小于size的，只能取到3了
  * return [3, 9]
**/
```
现在取列表长度为20，12个非售罄，8个售罄，一屏5个
```js
// pages/third/index
const goodsList = Array.from({length: 20}, (item, index) => {
  return {name: `第${index+1}个`, soldOut: index < 12 ? false : true}
})
Page({
  // ...
  onLoad() {
    this.initObserver()
    this.handleGoodsList()
  },
  handleGoodsList () {
    const { onSaleLen, soldOutLen } = this.countSaleLen()
    console.log('onSaleLen', onSaleLen, 'soldOutLen', soldOutLen);
    const {
      subSize,
      soldOutLen: soldOutLength,
      soldOutIndex
    } = this.genSubListSize(onSaleLen, soldOutLen)
    const renderList = this.genRenderList(subSize)
    console.log('renderList', renderList);
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
  // 根据分组数组生成渲染列表
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
```
打印一下`renderList`，得到了动态切分的数据了
<center>
  <img style="border-radius: 0.3125em;
  box-shadow: 0 2px 4px 0 rgba(34,36,38,.12),0 2px 10px 0 rgba(34,36,38,.08);" 
  src="https://gitee.com/jlrszxc/pic-go-images/raw/master/images/20220302142205.png">
  <br>
  <div style="color:orange; border-bottom: 1px solid #d9d9d9;
  display: inline-block;
  color: #999;
  padding: 2px;">列表分组</div>
</center>

跑一下demo
<center>
  <img style="border-radius: 0.3125em;
  box-shadow: 0 2px 4px 0 rgba(34,36,38,.12),0 2px 10px 0 rgba(34,36,38,.08);" 
  src="https://gitee.com/jlrszxc/pic-go-images/raw/master/images/列表动态懒加载动图.gif">
  <br>
  <div style="color:orange; border-bottom: 1px solid #d9d9d9;
  display: inline-block;
  color: #999;
  padding: 2px;">列表动态分组懒加载</div>
</center>

当然需求是不断变化的，下次就不一定是售罄非售罄了，但是万变不离其宗，再怎么分，把每一项的数组长度定好之后，再生成渲染的`renderList`就可以了。所以可以把懒加载的这块逻辑抽离出来封装。

# demo源码
[以上三个demo的完整代码](https://github.com/jiulanrensan/jiuBlog/tree/main/wxminapp/list-lazyLoad/code)

# 参考
- [1] [小程序IntersectionObserver文档](https://developers.weixin.qq.com/miniprogram/dev/api/wxml/IntersectionObserver.html)

