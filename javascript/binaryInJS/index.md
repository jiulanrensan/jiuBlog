# JS中的二进制
## 从一个小需求讲起
小明接到一个需求，在管理台要加一个上传图片的功能，只能指定格式(`jpg`,`png`,`gif`)。小明默念：这不很简单吗? `<input/>`按钮加个`change`事件，每次都获取一下文件后缀名就好了。很快啊，就把代码提交然后提测了。但是测试大佬没过一会就来找小明，说：我把`webp`图片的后缀名改成`png`，就可以上传了，你这不符合需求啊。小明一慌：这个大佬不讲武德啊，还有这种刁钻的场景。没办法，小明只能又去找解决办法了。一番折腾，终于在西洋搜索引擎里找到一个关于[魔数(magic number)](https://gist.github.com/leommoore/f9e57ba2aa4bf197ebc5)的知识点。

简单来说，计算机中的任何东西都是字节组成的，图片文件同理。每种类型的图片转成字节，开头那几个字节都是一样的。举例，这里用十六进制来表示，`jpg`是`ff d8 ff e0`，`png`是`89 50 4e 47`，`gif`是`47 49 46 38`。那要怎么快速查看呢，在vscode下载一款插件`hexdump`，直接把图片拖进去就可以了。

OK，那知道怎么去识别了，那现在的任务就只剩要怎么获取图片的二进制数据了。小明又是一番搜索，找到了一个api
> `FileReader.readAsArrayBuffer()`
> 开始读取指定的`Blob`中的内容, 一旦完成, `result`属性中保存的将是被读取文件的 `ArrayBuffer` 数据对象

等等，这一句话里面，`Blob`是什么，`ArrayBuffer`又是什么，从这块开始讲我们的文章内容

## Blob,File,ArrayBuffer,TypedArray,DataView的关系
我们先从大体上厘清接下来要认识的概念之间的关系

![](https://raw.githubusercontent.com/jiulanrensan/picGoImages/main/images/%E4%BA%8C%E8%BF%9B%E5%88%B6%E6%8E%A5%E5%8F%A3%E5%85%B3%E7%B3%BB%E5%9B%BE.png)

## [ArrayBuffer](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer)
> ArrayBuffer 对象用来表示通用的、固定长度的原始二进制数据缓冲区。
>
> 它是一个字节数组，通常在其他语言中称为“byte array”。
>
> **你不能直接操作 ArrayBuffer 的内容，而是要通过类型数组对象(TypedArray)或 DataView 对象来操作**，它们会将缓冲区中的数据表示为特定的格式，并通过这些格式来读写缓冲区的内容

你不能直接操作ArrayBuffer里的内容，但是可以新建
```js
// length 表示要创建的 ArrayBuffer 的大小，单位为字节
var a = new ArrayBuffer(length)
// 这样就生成了一个指定大小的 ArrayBuffer 对象，其内容被初始化为 0
// 生成之后要用 a.byteLength 来字节长度
```
举个例子
```js
var b = new ArrayBuffer(2)
```
生成了两个字节长度的二进制数组，但是这个数组和普通的Array是不一样的，不能进行修改
![](https://github.com/jiulanrensan/picGoImages/blob/main/images/ArrayBuffer%E7%A4%BA%E6%84%8F%E5%9B%BE.png?raw=true)

图中一个方块表示1bit

我们知道8bit等于1byte，所以这里生成了两个字节长度的arrayBuffer，即16bit。

还有通过`fr.readAsArrayBuffer`方式生成ArrayBuffer:
```js
const fr = new FileReader()
const input = document.getElementById('input')
input.addEventListener('change', (ev) => {
  fr.readAsArrayBuffer(ev.target.files[0])
})
console.log('file',fr.result)
```
![](https://github.com/jiulanrensan/picGoImages/blob/main/images/arrayBuffer%E7%A4%BA%E6%84%8F%E5%9B%BE2.png?raw=true)

可以看到打印出了`ArrayBuffer`类型，展开能看到`Int8Array`，`Uint8Array`，这两个就是`TypedArray`

## [TypedArray](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/TypedArray)
并不是有`TypedArray`这个全局变量或者构造函数，mdn上的定义为

> 一个类型化数组（TypedArray）对象描述了一个底层的二进制数据缓冲区（binary data buffer）的一个类数组视图（view）。

概念就不是让人能听懂的，我的理解是，把`TypedArray`作为以下几个构造函数的统称，这些构造函数都有共同的属性和方法
```js
Int8Array();
Uint8Array();
Uint8ClampedArray();
Int16Array();
Uint16Array();
Int32Array();
Uint32Array();
Float32Array();
Float64Array();
```
以`Uint8Array`为例
```js
a = new Uint8Array(2) 
```
生成的数组，包含的是二进制数据，以 8 位二进制无符号整数表示，长度为2，所以一共长16位，每个字节默认值为0(这里用的是十进制)，8位二进制表示就是 0000 0000
![](https://github.com/jiulanrensan/picGoImages/blob/main/images/ArrayBuffer%E7%A4%BA%E6%84%8F%E5%9B%BE.png?raw=true)

每个字节能表示的数值范围 `0`-`255`，即二进制`1111 1111`转十进制`parseInt('11111111', 2)`得到255

可以任意修改`Uint8Array`某个位置上的值
```js
a[0] = 2 // 修改第一个字节为2，即 0000 0010
```

再以`Uint16Array`为例
```js
b = new Uint16Array(1)
```
生成的数组，以16位二进制无符号整数表示，长度为1，故共16位，所以与 new Uint8Array(2) 是一样的。只不过这里是用两个字节作为单个元素大小

![](https://github.com/jiulanrensan/picGoImages/blob/main/images/TypedArray%E7%A4%BA%E6%84%8F%E5%9B%BE3.png?raw=true)

再说一下`Int8Array`，表示范围是`-128`-`127`，因为是用8位二进制有符号整数描述，要预留最左边一位表示符号，所以剩余7位表示数据，即`parseInt('01111111',2)` 的得到127


其余构造函数的详细内容可以查看[TypedArray 对象](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/TypedArray#typedarray_%E5%AF%B9%E8%B1%A1)

# 参考
- [1] [What is the difference between an ArrayBuffer and a Blob?](https://stackoverflow.com/questions/11821096/what-is-the-difference-between-an-arraybuffer-and-a-blob)
- [2] [JS 中的 typedArray, ArrayBuffer 和 DataView怎么分清楚？](https://www.zhihu.com/question/489316776/answer/2470498688)
- [3] [](https://zhuanlan.zhihu.com/p/97768916)