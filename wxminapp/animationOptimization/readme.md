# 小程序动画优化实践
   
> 
> 文章同步在掘金 https://juejin.cn/post/7044501164112478222/
> 

## 背景
项目小程序里，点击加购成功时，加购按钮向上抛出一个小球，掉落在左侧悬浮购物车上，轨迹为抛物线。看图

<center>
  <img style="border-radius: 0.3125em;
  box-shadow: 0 2px 4px 0 rgba(34,36,38,.12),0 2px 10px 0 rgba(34,36,38,.08);" 
  src="https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/790f4b01a00a46888d1a567ec44050e9~tplv-k3u1fbpfcp-watermark.image?">
  <br>
  <div style="color:orange; border-bottom: 1px solid #d9d9d9;
  display: inline-block;
  color: #999;
  padding: 2px;">抛物线gif</div>
</center>

gif图掉帧非常严重，不过在安卓真机上，掉帧确实很明显。


这个抛物线动画的原理是：通过起点坐标和重点坐标，计算贝塞尔曲线上每个点的坐标，再用`setInterval`遍历点坐标，然后动态设置点的样式，从而实现动画。
```html
<!-- 绝对定位 -->
<view class="cart-ball" style="top: {{movingBallInfo.posX}};left: {{movingBallInfo.posY}}"></view>
```
```js
const linePos = [/* 贝塞尔曲线坐标 */]
let index = linePos.length - 1
setInterval(() => {
  index--
  this.setData({
    'movingBallInfo.posX': linePos[index][0],
    'movingBallInfo.posY': linePos[index][1],
  })
  if (index < 1) {
    // 停止
  }
}, 30)

```
开始优化这段代码前，我们先补充一下javascript的基础知识

## 前置知识：Event Loop, Task, micro Task, UI Rendering
javascript是单线程语言，这就意味着所有任务都要进行排队。任务分为两种：一种是同步任务(synchronous)，另一种是异步任务(asynchronous)。同步任务指的是，在主线程上排队执行的任务，只有前一个任务执行完毕，才能执行后一个任务；异步任务指的是，不进入主线程、而进入"任务队列"(task queue)的任务，只有"任务队列"通知主线程，某个异步任务可以执行了，该任务才会进入主线程执行。

而异步任务又分为宏任务(Task)和微任务(micro Task)，同理任务队列也分为宏任务队列和微任务队列。

事件循环(Event Loop) 大致步骤：

1. 所有同步任务都在主线程上执行，形成一个执行栈(execution context stack)。

2. 只要异步任务有了运行结果，就在任务队列之中放置一个事件。

3. 执行栈中的宏任务执行完毕，引擎会先读取微任务，推入执行栈。执行完成之后，继续读取下一个微任务。如果执行过中产生新的微任务，就会把这个微任务推入微任务队列。如果主线程执行完所有微任务队列中的任务中时，就会去读取宏任务队列，推入执行栈。

4. 主线程不断重复上面的第三步。

常见的宏任务：
* setTimeout 
* setInterval
* postMessage
* ...
常见的微任务：
* Promise
* MutationObserver

而Event Loop和UI渲染的关系呢？其实是在执行完微任务队列里所有微任务的之后，由浏览器决定是否进行渲染更新。

通过一些demo做实验验证这个推论

```html
<div id="con">1</div>
```

```js
// demo1
// 渲染发生在微任务之后
const con = document.getElementById('con');
con.onclick = function () {
  Promise.resolve().then(function Promise1 () {
    con.textContext = 0;
  })
};
```
<center>
  <img style="border-radius: 0.3125em;
  box-shadow: 0 2px 4px 0 rgba(34,36,38,.12),0 2px 10px 0 rgba(34,36,38,.08);" 
  src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/466dad9417024896a7c689041ec4a437~tplv-k3u1fbpfcp-watermark.image?">
  <br>
  <div style="color:orange; border-bottom: 1px solid #d9d9d9;
  display: inline-block;
  color: #999;
  padding: 2px;">demo1.png，紫色方块表示渲染</div>
</center>

```js
// demo2
// 两次EventLoop中间没有渲染
const con = document.getElementById('con');
con.onclick = function () {
  setTimeout(function setTimeout1() {
      con.textContent = 0;
      Promise.resolve().then(function Promise1 () {
          console.log('Promise1')
    })
  }, 0)
  setTimeout(function setTimeout2() {
    con.textContent = 1;
    Promise.resolve().then(function Promise2 () {
        console.log('Promise2')
    })
  }, 0)
};
```
<center>
  <img style="border-radius: 0.3125em;
  box-shadow: 0 2px 4px 0 rgba(34,36,38,.12),0 2px 10px 0 rgba(34,36,38,.08);" 
  src="https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a698a6753af34257b0fbba2264a0fcd2~tplv-k3u1fbpfcp-watermark.image?">
  <br>
  <div style="color:orange; border-bottom: 1px solid #d9d9d9;
  display: inline-block;
  color: #999;
  padding: 2px;">demo2.png</div>
</center>

两个灰色的Task中间没有渲染，只有在第二次后面才有。

我们知道浏览器正常情况下的帧率是60fps，即一帧的时间大约为16.66ms。如果在一帧里对Dom进行了多次修改，那么浏览器只会取最后一次的修改值去渲染。demo2验证了这个说法。那如果把修改dom操作间隔加大呢，如demo3
```js
// demo3
// 两次eventloop中有渲染
const con = document.getElementById('con');
con.onclick = function () {
  setTimeout(function  setTimeout1() {
    con.textContent = 0;
  }, 0);
  setTimeout(function  setTimeout2() {
    con.textContent = 1;
  }, 16.7);
};
```
<center>
  <img style="border-radius: 0.3125em;
  box-shadow: 0 2px 4px 0 rgba(34,36,38,.12),0 2px 10px 0 rgba(34,36,38,.08);" 
  src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5d8066b872f74101a5694bedf7a800c6~tplv-k3u1fbpfcp-watermark.image?">
  <br>
  <div style="color:orange; border-bottom: 1px solid #d9d9d9;
  display: inline-block;
  color: #999;
  padding: 2px;">demo3.png</div>
</center>

## 尽量不要使用setInterval
由上文可知setInterval是宏任务，而setInterval是每隔定义的时间间隔就会往宏任务队列推入回调函数，然后主线程会读取宏任务队列里的setInterval回调函数并执行。但是如果主线程有长任务(long task)执行时，会阻塞读取，直到主线程里的任务执行完才会继续读取，但setInterval往宏任务队列添加回调函数的操作是不会停止的，这种情况下就会造成：函数执行的时间间隔远大于我们定义的时间间隔。

下面是一个例子，每次setInterval回调都需要进行大量的计算，这样阻塞主线程
```js
// demo4
const btn = document.getElementById('btn')
btn.addEventListener('click', setIntervalFn)
let sum = 0
function setIntervalFn() {
  let last
  let countIdx = 0
  const timer = setInterval(function timeFn() {
    countIdx++
    const newTime = new Date().getTime()
    const gap = newTime - last
    last = newTime
    console.log('setInterval', gap, countIdx)
    if (countIdx > 5) clearInterval(timer)
    // 10000000
    // 100000
    for (let i = 0; i < 100000; i++) {
      sum+= i
    }
  }, 100)
  last = new Date().getTime()
}
```
<center>
  <img style="border-radius: 0.3125em;
  box-shadow: 0 2px 4px 0 rgba(34,36,38,.12),0 2px 10px 0 rgba(34,36,38,.08);" 
  src="https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/70b479a3867a426885869b8a46d43524~tplv-k3u1fbpfcp-watermark.image?">
  <br>
  <div style="color:orange; border-bottom: 1px solid #d9d9d9;
  display: inline-block;
  color: #999;
  padding: 2px;">demo4.png</div>
</center>
setInterval的缺点：
* 当主线程有代码执行时，宏任务队列会一直按照一定的时间间隔推入事件回调函数。只有当主线程空闲时，才会把回调函数执行，但是这些回调函数大多都是过时的。
* 如果setInterval的回调间隔比浏览器渲染一帧的时间要短，那么回调函数执行了多次，但只会用到最后一次的结果，这样也会造成浪费，甚至有可能会阻塞主线程。

所以尽量要用setTimeout去代替setInterval，达到轮询的效果。

## 使用requestAnimationFrame
但在渲染的场景中，setTimeout并不是最优解，浏览器的帧率不是一成不变的，假如在一帧内多次操作dom就会造成性能浪费，所以还是用官方推荐的requestAnimationFrame，而不是setTimeout。
> `window.requestAnimationFrame()` 告诉浏览器——你希望执行一个动画，并且要求浏览器在下次重绘之前调用指定的回调函数更新动画

由上面的例子可知，两个宏任务之间不一定会触发浏览器渲染，这个由浏览器自己决定。

```js
// demo5
const con = document.getElementById('con');
let i = 0;
function rAF(){
  requestAnimationFrame(function aaaa() {
    con.textContent = i;
    Promise.resolve().then(function bbbb(){
      if(i < 5) {rAF(); i++;}
    });
  });
}
con.onclick = function () {
  rAF();
};
```
<center>
  <img style="border-radius: 0.3125em;
  box-shadow: 0 2px 4px 0 rgba(34,36,38,.12),0 2px 10px 0 rgba(34,36,38,.08);" 
  src="https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/598115a2cbc14bada7d4e3c98e4fb5cf~tplv-k3u1fbpfcp-watermark.image?">
  <br>
  <div style="color:orange; border-bottom: 1px solid #d9d9d9;
  display: inline-block;
  color: #999;
  padding: 2px;">demo5.png</div>
</center>

可以看到渲染了5次（五条竖直虚线）

## 小程序上的动画优化
跟浏览器不大一样，小程序是双线程架构

<center>
  <img style="border-radius: 0.3125em;
  box-shadow: 0 2px 4px 0 rgba(34,36,38,.12),0 2px 10px 0 rgba(34,36,38,.08);" 
  src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/311ff3baf9d144e693e4b56e64c54927~tplv-k3u1fbpfcp-zoom-1.image">
  <br>
  <div style="color:orange; border-bottom: 1px solid #d9d9d9;
  display: inline-block;
  color: #999;
  padding: 2px;">双线程架构</div>
</center>


好处是：ui渲染和js主线程是分开的，我们知道在浏览器中这两者是互斥的，所以当主线程有阻塞时，页面交互就会失去响应，而小程序中不会出现这样的情况。

坏处是：逻辑层、渲染层有通信延时，大量的通信也会造成性能瓶颈。

但小程序提供了wxs用来处理渲染层的逻辑。

### 用wxs作动画优化
wxs提供一个[requestAnimationFrame](https://developers.weixin.qq.com/miniprogram/dev/framework/view/interactive-animation.html)API，与浏览器上的一致。
所以我们修改成，当点击加购时，把点击坐标与目标坐标传入`wxs`，然后计算运行轨迹点的坐标计算，接着用`requestAnimationFrame`执行动画帧
```html
<!-- wxml -->
<wxs module="cartAnimation" src="./cartAnimation.wxs"></wxs>
<!-- cartAndClickCoord: 包含两个坐标：点击坐标即起点坐标，还有购物车坐标即终点坐标 -->
<view class="cart-animation" change:prop="{{cartAnimation.cartObserver}}" prop="{{cartAndClickCoord}}">
  <image class="cart-animation-image" src="{{cartPic}}"></image>
</view>
```
```js
// cartAnimation.wxs
var ins
var curCoordIdx
var coordArr

/**
 * @desc 根据传入的起始点坐标计算生成贝塞尔曲线
 * @param {Object} cartCoord 购物车坐标 {cartX, cartY, cartW}
 * @param {Object} clickCoord 点击坐标 {clientX, clientY}
 */
function genBezierCurve(cartCoord, clickCoord) {
  // 省略生成贝塞尔曲线代码
  // return bezierList
}

function executeCartAnimation () {
  curCoordIdx = coordArr.length - 1
  // 使用requestAnimationFrame
  ins.requestAnimationFrame(setStyleByFrame)
}

function setStyleByFrame() {
  if (curCoordIdx >= 0) {
    ins.selectComponent('.cart-animation').setStyle({
      display: 'block',
      left: coordArr[curCoordIdx].x + 'px', 
      top: coordArr[curCoordIdx].y + 'px'
    })
    curCoordIdx -= 1
    ins.requestAnimationFrame(setStyleByFrame)
  } else {
    ins.selectComponent('.cart-animation').setStyle({
      display: 'none'
    })
  }
}
// 每次监听到变化时，执行动画
function cartObserver (newV, oldV, ownerInstance, instance) {
  if (!newV) return
  ins = ownerInstance
  var cartCoordData = newV.cartCoordData
  var clickCoordData = newV.clickCoordData
  // 根据起始坐标和重点坐标生成贝塞尔曲线数据
  coordArr = genBezierCurve(cartCoordData, clickCoordData)
  executeCartAnimation()
}

module.exports = {
  cartObserver: cartObserver
}
```
在真机上效果非常明显，低端安卓机上的动画也非常丝滑。
