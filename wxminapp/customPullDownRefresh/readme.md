# 自定义下拉刷新
微信小程序提供下拉刷新的api 
> [onPullDownRefresh](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html#onPullDownRefresh)
> * 需要在app.json的window选项中或页面配置中开启enablePullDownRefresh。
> * 可以通过wx.startPullDownRefresh触发下拉刷新，调用后触发下拉刷新动画，效果与用户手动下拉刷新一致。
> * 当处理完数据刷新后，wx.stopPullDownRefresh可以停止当前页面的下拉刷新。

诚然，这个api也有自身的限制，比如只能在`Page()`下调用，比如刷新动画，比如下拉距离。所以我们可以实现一个自定义下拉刷新组件

# 实现自定义下拉刷新组件
定义`customPullDown`组件
```html
<!-- component/customPullDown/index.wxml -->
<!-- 设置两个插槽 -->
<view class="pull-down">
  <!-- 放置刷新动画 -->
  <slot name="refresh-animation"></slot>
  <!-- 放置内容 -->
  <slot name="content"></slot>
</view>
```
```js
// component/customPullDown/index.js
Component({
	// 声明可以多个slot
	options: {
		multipleSlots: true
	},
})
```
页面使用
```html
<!-- page/index.wxml -->
<view class="container">
  <custom-pull-down class="custom-pull-down">
    <view name="refresh-animation"></view>
    <view slot="content">
      <block wx:for="{{goodsList}}" wx:key="key">
        <view class="goods-item">
          <view >{{item.name}}</view>
        </view>
      </block>
    </view>
  </custom-pull-down>
</view>
```
```js
// page/index.js
Page({
  data: {
    goodsList: Array.from({length: 10}, (item, index) => {
      return {
        key: `第${index+1}个`,
        name: `第${index+1}个`
      }
    })
  },
  onLoad() {
  },
})
```
<center>
  <img style="border-radius: 0.3125em;
  box-shadow: 0 2px 4px 0 rgba(34,36,38,.12),0 2px 10px 0 rgba(34,36,38,.08);" 
  src="https://gitee.com/jlrszxc/pic-go-images/raw/master/images/20220305194510.png">
  <br>
  <div style="color:orange; border-bottom: 1px solid #d9d9d9;
  display: inline-block;
  color: #999;
  padding: 2px;">初始化组件</div>
</center>

## 利用scroll-view的特点
> [scroll-view](https://developers.weixin.qq.com/miniprogram/dev/component/scroll-view.html) 自定义下拉刷新可以结合 WXS 事件响应 开发交互动画

`scroll-view`提供的几个api
|属性|类型|默认值|说明|
|--|--|--|--|
|`refresher-enabled`|boolean|false|开启自定义下拉刷新|
|`refresher-threshold`|number|45|设置自定义下拉刷新阈值|
|`refresher-default-style`|string|"black"|设置自定义下拉刷新默认样式，支持设置 black | white | none， none 表示不使用默认样式|
|`refresher-background`|string|"#FFF"|设置自定义下拉刷新区域背景颜色|
|`refresher-triggered`|boolean|false|设置当前下拉刷新状态，true 表示下拉刷新已经被触发，false 表示下拉刷新未被触发|
|`bindrefresherpulling`|eventhandle||自定义下拉刷新控件被下拉|
|`bindrefresherrefresh`|eventhandle||自定义下拉刷新被触发	|
|`bindrefresherrestore`|eventhandle||自定义下拉刷新被复位	|
|`bindrefresherabort`|eventhandle||自定义下拉刷新被中止	|

修改组件
```diff
# component/customPullDown/index.wxml
<view class="pull-down">
  <slot name="refresh-animation"></slot>
-  <slot name="content"></slot>
+  <scroll-view
+    refresher-enabled
+    scroll-y="{{true}}"
+    scroll-with-animation
+    refresher-default-style="black"
+    class="scroll-box"
+  >
+    <slot name="content"></slot>
+  </scroll-view>
</view>
```
看下效果
<center>
  <img style="border-radius: 0.3125em;
  box-shadow: 0 2px 4px 0 rgba(34,36,38,.12),0 2px 10px 0 rgba(34,36,38,.08);" 
  src="https://gitee.com/jlrszxc/pic-go-images/raw/master/images/第一版下拉刷新.gif">
  <br>
  <div style="color:orange; border-bottom: 1px solid #d9d9d9;
  display: inline-block;
  color: #999;
  padding: 2px;">初始化组件</div>
</center>
现在只是简单配置，所以刷新动画是默认的，并且会一直处于下拉刷新中的状态。

```diff
<view class="pull-down">
  <slot name="refresh-animation"></slot>
  <scroll-view
    refresher-enabled
    scroll-y="{{true}}"
    scroll-with-animation
    refresher-default-style="none"
+    refresher-threshold="{{refresherThreshold}}"
+    refresher-triggered="{{refresherTriggered}}"
    class="scroll-box"
  >
+    <!-- 自定义下拉刷新动画 -->
+    <view slot="refresher" class="custom-refresh-zone">
+      <view class="custom-refresh-zone-tips-loading">加载中</view>
+    </view>
    <slot name="content"></slot>
  </scroll-view>
</view>
```
通过`slot="refresher"`给`scroll-view`插入一个插槽，可以实现自定义刷新样式

<center>
  <img style="border-radius: 0.3125em;
  box-shadow: 0 2px 4px 0 rgba(34,36,38,.12),0 2px 10px 0 rgba(34,36,38,.08);" 
  src="https://gitee.com/jlrszxc/pic-go-images/raw/master/images/刷新样式自定义.gif">
  <br>
  <div style="color:orange; border-bottom: 1px solid #d9d9d9;
  display: inline-block;
  color: #999;
  padding: 2px;">刷新样式自定义</div>
</center>

## 结合WXS实现交互效果
刷新动画分为三个阶段：继续下拉刷新->释放刷新->加载中。

下拉过程：
1. 用户开始下拉的时候，自定义刷新区域展示【继续下拉刷新】
2. 当下拉到一定距离`changeBoundary`时，变为【释放刷新】
3. 此时松开手，变为【加载中】，触发`bindrefresherrefresh`。
4. 手动设置`refresher-triggered`为true，表示开始刷新状态，自定义刷新区域会一直停留
5. 等到`refresher-triggered`设置为false时，表示结束刷新状态，自定义刷新区域会收起
```html
<!-- component/customPullDown/index.wxml -->
<wxs module="pullDown" src="./pullDown.wxs"></wxs>
<view class="pull-down">
  <scroll-view
    refresher-enabled
    scroll-y
    scroll-with-animation
    refresher-default-style="none"
    refresher-triggered="{{refresherTriggered}}"
    bindrefresherpulling="{{pullDown.onContentPull}}"
    bindrefresherrestore="{{pullDown.onRestore}}"
    bindrefresherabort="{{pullDown.onAbort}}"
    bindrefresherrefresh="{{pullDown.onRefresh}}"
    bindscrolltolower="onReachBottom"
    class="scroll-box"
  >
    <!-- 自定义下拉刷新动画 -->
    <view slot="refresher" class="custom-refresh-zone" data-threshold="{{changeBoundary}}">
      <!-- 继续下拉刷新 -->
      <view class="refresh-before-trigger">
        <slot name="refresh-before-trigger"></slot>
      </view>
      <!-- 释放刷新 -->
      <view class="refresh-after-trigger">
        <slot name="refresh-after-trigger"></slot>
      </view>
      <!-- 加载中 -->
      <view class="refresh-loading">
        <slot name="refresh-loading"></slot>
      </view>
    </view>
    <!-- 内容插槽 -->
    <slot name="content"></slot>
  </scroll-view>
</view>
```
```js
// component/customPullDown/pullDown.wxs
var refresherBefore = 'refresher-before'
var refresherAfter = 'refresher-after'

// 获取组件对象
function getComponent(name, selector) {
  return function(instance) {
    var state = instance.getState()
    return state[name] || (state[name] = instance.selectComponent(selector))
  }
}
var getCustomRefresher = getComponent('customRefresher', '.custom-refresh-zone')

module.exports = {
  onContentPull: function (event, ownerInstance) {
    var scrollY = event.detail.dy // 滚动距离

    // 根据滚动距离切换状态
    var customRefresher = getCustomRefresher(ownerInstance)
    var threshold = customRefresher.getDataset().threshold
    var isLargerThanTriggerThreshold = scrollY > threshold
    // 通过css类名控制展示
    customRefresher
      .addClass(isLargerThanTriggerThreshold ? refresherAfter : refresherBefore)
      .removeClass(isLargerThanTriggerThreshold ? refresherBefore : refresherAfter)
  },
  onRestore: function (event, ownerInstance) {
    console.log('onRestore 自定义下拉刷新被复位');
    ownerInstance.callMethod('onRefresherRestore', event)
  },
  onAbort: function (event, ownerInstance) {
    console.log('onRestore 自定义下拉刷新被中止');
    ownerInstance.callMethod('onRefresherAbort', event)
  },
  onRefresh: function (event, ownerInstance) {
    console.log('自定义下拉刷新被触发');
    var customRefresher = getCustomRefresher(ownerInstance)
    // 移除添加的类名，此时会展示加载中
    customRefresher.removeClass(refresherAfter, refresherBefore)
    ownerInstance.callMethod('onPullDownRefresh', event)
  },
}
```
```css
/* component/customPullDown/index.wxs */
.custom-refresh-zone{
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
.refresh-loading{
  width: 100%;
}

.custom-refresh-zone .refresh-before-trigger,
.custom-refresh-zone .refresh-after-trigger{
  display: none;
}
.custom-refresh-zone.refresher-before .refresh-before-trigger,
.custom-refresh-zone.refresher-after .refresh-after-trigger{
  width: 100%;
  display: block;
}
.custom-refresh-zone.refresher-before .refresh-loading,
.custom-refresh-zone.refresher-after .refresh-loading{
  display: none;
}
```
```js
// component/customPullDown/index.js
// ...
// 手动控制
onPullDownRefresh (event) {
  this.setData({
    refresherTriggered: true
  })
  setTimeout(() => {
    this.setData({
      refresherTriggered: false
    })
  }, 1000)
},
```

<center>
  <img style="border-radius: 0.3125em;
  box-shadow: 0 2px 4px 0 rgba(34,36,38,.12),0 2px 10px 0 rgba(34,36,38,.08);" 
  src="https://gitee.com/jlrszxc/pic-go-images/raw/master/images/完整demo.gif">
  <br>
  <div style="color:orange; border-bottom: 1px solid #d9d9d9;
  display: inline-block;
  color: #999;
  padding: 2px;">完整demo</div>
</center>

大功告成！

# 参考
- [1] [小程序插槽](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/wxml-wxss.html)
- [2] [scroll-view](https://developers.weixin.qq.com/miniprogram/dev/component/scroll-view.html)