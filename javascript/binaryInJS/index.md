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

再说一下`Int8Array`，表示范围是`-128`-`127`，因为是用8位二进制有符号整数描述，要预留最左边一位表示符号，所以剩余7位表示数据，即`parseInt('01111111',2)` 的得到127。

`TypedArray`有一个很特殊的`Uint8ClampedArray`(8 位无符号整型固定数组)，它和`Uint8Array`最大的差别在于，`Uint8ClampedArray`数组里每一项只能在0-255之间。如果你指定一个在 `[0,255]` 区间外的值，它将被替换为 0 或 255。rgb颜色值的范围也是在这个范围内，所以`Uint8ClampedArray`经常用于canvas或者图片处理上，用来表示图片的像素信息


其余构造函数的详细内容可以查看[TypedArray 对象](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/TypedArray#typedarray_%E5%AF%B9%E8%B1%A1)

## [DataView](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/DataView)
DataView相比TypedArray 优点在哪 ？字节序问题是什么？

DataView提供了很多方法，这里挑两对作为例子：`setUint8`和`getUint8`，`setUint16`和`getUint16`

### `setUint8`和`getUint8`
```js
// 创建ArrayBuffer，长度为4个字节
const buffer = new ArrayBuffer(4);

const dataView = new DataView(buffer);

// 将DataView中第一个字节设置为1(这里的1为十进制)
dataView.setUint8(0, 1);

// 将DataView中第二个字节设置为2(这里的2为十进制)
dataView.setUint8(1, 2);
```

![](https://github.com/jiulanrensan/picGoImages/blob/main/images/dataView%E7%A4%BA%E6%84%8F%E5%9B%BE1.png?raw=true)

```js
// 同理，取第一个字节，返回十进制结果1
dataView.getUint8(0);
```

### `setUint16`和`getUint16`
还是用上面已经设置好的ArrayBuffer数组，此时：
```js
dataView.getUint16(0); // output: 258
```
这是因为这里是16位即两个字节作为一项

![](https://github.com/jiulanrensan/picGoImages/blob/main/images/dataView%E7%A4%BA%E6%84%8F%E5%9B%BE2.png?raw=true)

等同于
```js
parseInt('0000000100000010', 2) // 258
```


## [Blob](https://developer.mozilla.org/zh-CN/docs/Web/API/Blob)
> Blob 对象表示一个不可变、原始数据的类文件对象(Binary large object)

概念似懂非懂，那blob和ArrayBuffer都是表示二进制数据，那有什么区别呢？

### 区别
在 [stackoverflow](https://stackoverflow.com/questions/11821096/what-is-the-difference-between-an-arraybuffer-and-a-blob) 上找到一个不错的解释：

除非你需要写/编辑的能力(使用ArrayBuffer)，那么Blob格式会是最好的选择。

* 是否可变
  * `ArrayBuffer`可以改变(通过DataView/TypedArray)
  * `Blob`是不可变的

* 在内存(Memory)中的来源/可用性
  * `ArrayBuffer`是在内存中的，可以手动操作
  * `Blob`可以在磁盘上，可以缓存在内存中(in the cache memory)，和其他不容易读取的地方

* 获取
  * `ArrayBuffer`可以通过`TypedArrays`获取
  * `Blob`可以通过`window.URL.createObjectURL`获取，或者`FileReader`

* 转换
  * `ArrayBuffer` => `Blob`: `new Blob([new Uint8Array(data)])`
  * `Blob` => `ArrayBuffer`: `await blob.arrayBuffer()`

* 通讯协议中
  * websocket: [webSocket.binaryType](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/binaryType)
  * xhr: `responseType`: 告诉服务器期望拿到什么类型的响应，有: "arraybuffer", "blob", 其他的有"document", "json", "text"

### Blob api
`Blob.slice`: 返回一个新的 Blob 对象，包含了源 Blob 对象中指定范围内的数据


## [File](https://developer.mozilla.org/zh-CN/docs/Web/API/File)
`File`是特殊类型的`Blob`，来源于`input`标签选择文件后返回的对象，继承了`Blob.slice`方法


# 参考
- [1] [What is the difference between an ArrayBuffer and a Blob?](https://stackoverflow.com/questions/11821096/what-is-the-difference-between-an-arraybuffer-and-a-blob)
- [2] [JS 中的 typedArray, ArrayBuffer 和 DataView怎么分清楚？](https://www.zhihu.com/question/489316776/answer/2470498688)
- [3] [](https://zhuanlan.zhihu.com/p/97768916)