# 原型，原型链

## 定义
> JavaScript 常被描述为一种基于原型的语言 (prototype-based language)——每个对象拥有一个原型对象，对象以其原型为模板、从原型继承方法和属性。原型对象也可能拥有原型，并从中继承方法和属性，一层一层、以此类推。这种关系常被称为原型链 (prototype chain)，它解释了为何一个对象会拥有定义在其他对象中的属性和方法
>
> ———— MDN

## `__proto__`与`prototype`
`__proto__`是每个实例上都有的属性，`prototype`是构造函数的属性。

举个例子
```js
// 定义一个简单的构造函数
function aFn () {}
```
然后我们研究这个构造函数的`prototype`属性，在控制台输出下面的代码
```js
Object.prototype.toString.call(aFn.prototype) 
// '[object Object]'

aFn.prototype
// {
//   constructor: ƒ aFn()
//   [[Prototype]]: Object
// }

aFn.prototype.constructor === aFn
// true
```
可以得知，构造函数`aFn`的`prototype`属性是一个对象类型，准确地说，构造函数`aFn`的`prototype`属性指向了该构造函数的原型对象。
原型对象有一个`constructor`属性，又指回了构造函数`aFn`。(但在后面的作图中，我们都用`aFn.prototype`来表示`aFn`构造函数的原型对象。)

画图简单表示
<center>
  <img style="border-radius: 0.3125em;
  box-shadow: 0 2px 4px 0 rgba(34,36,38,.12),0 2px 10px 0 rgba(34,36,38,.08);" 
  src="https://github.com/jiulanrensan/picGoImages/blob/main/images/proto1.png">
  <br>
  <div style="color:orange; border-bottom: 1px solid #d9d9d9;
  display: inline-block;
  color: #999;
  padding: 2px;">原型与构造函数</div>
</center>

继续对`aFn`进行操作
```js
// 给原型对象添加name属性
aFn.prototype.name = 'aFn'
// 并new一个实例
const a1 = new aFn();
```
new运算符会生成一个新的空对象`a1`，然后为`a1`添加一个`__proto__`属性，指向构造函数的原型对象`aFn.prototype`，可以验证：
```js
a1.__proto__ === aFn.prototype
// true
```
<center>
  <img style="border-radius: 0.3125em;
  box-shadow: 0 2px 4px 0 rgba(34,36,38,.12),0 2px 10px 0 rgba(34,36,38,.08);" 
  src="https://github.com/jiulanrensan/picGoImages/blob/main/images/proto2.png">
  <br>
  <div style="color:orange; border-bottom: 1px solid #d9d9d9;
  display: inline-block;
  color: #999;
  padding: 2px;">__proto__与原型对象</div>
</center>

对象通过`__proto__`属性访问构造函数的原型对象。比如`a1`是一个空对象，但是`a1.name`输出了`aFn`，是因为`a1`先在自身属性中查找`name`属性，如果没有，则通过`__proto__`访问原型对象，在原型对象上查找`name`属性，如果再没有，就继续往原型对象的`__proto__`上找，如果都没有，就返回`undefined`。`__proto__`将原型对象连接在一起，就形成了原型链。

```js
aFn.prototype
// {
//   constructor: ƒ aFn()
//   [[Prototype]]: Object
// }
```
上面我们打印的构造函数`aFn`的原型对象，里面有一个`[[Prototype]]`，在控制台上将其展开，可以看到一个构造函数属性`constructor: ƒ Object()`，是不是和`aFn`的原型对象很像？其实`[[Prototype]]`等同于`__proto__`[<sup>[1]</sup>](#refer-anchor-1)
<center>
  <img style="border-radius: 0.3125em;
  box-shadow: 0 2px 4px 0 rgba(34,36,38,.12),0 2px 10px 0 rgba(34,36,38,.08);" 
  src="https://github.com/jiulanrensan/picGoImages/blob/main/images/proto3.png">
  <br>
  <div style="color:orange; border-bottom: 1px solid #d9d9d9;
  display: inline-block;
  color: #999;
  padding: 2px;">Object.prototype</div>
</center>

这里的`[[Prototype]]`指向的就是`Object.prototype`，如图所示，我们绘制出`aFn`在内的所有原型链

<center>
  <img style="border-radius: 0.3125em;
  box-shadow: 0 2px 4px 0 rgba(34,36,38,.12),0 2px 10px 0 rgba(34,36,38,.08);" 
  src="https://github.com/jiulanrensan/picGoImages/blob/main/images/proto5.png">
  <br>
  <div style="color:orange; border-bottom: 1px solid #d9d9d9;
  display: inline-block;
  color: #999;
  padding: 2px;">原型链</div>
</center>

`Object.prototype`的`constructor`属性指向`Object`构造函数，这是js的内置方法，`Object.prototype`作为对象，其`__proto__`指向的是`null`，这是所有原型链的尽头。

> 在JavaScript中，几乎所有的对象都是Object类型的实例，它们都会从Object.prototype继承属性和方法，虽然大部分属性都会被覆盖（shadowed）或者说被重写了（overridden）[<sup>[2]</sup>](#refer-anchor-2)

`Object`构造函数我们似乎很少用，平时我们新建一个对象都是用字面量语法:
```js
var obj = {} // 字面量语法
obj.__proto__ === Object.prototype // true

// 其实等同于
var o = new Object()
o.__proto__ === Object.prototype // true
```


## 内置对象中的原型与原型链
JavaScript 有一个[内置对象的标准库](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects)，JavaScript标准内置对象中有我们常见的类型：`Object`类型、`Number`类型，`Array`类型、`String`类型、`Function`类型等等。

通过实验得知：
```js
Symbol.prototype.__proto__ === Object.prototype // true
Number.prototype.__proto__ === Object.prototype // true
String.prototype.__proto__ === Object.prototype // true
Array.prototype.__proto__ === Object.prototype  // true
Date.prototype.__proto__ === Object.prototype   // true
RegExp.prototype.__proto__ === Object.prototype // true
Map.prototype.__proto__ === Object.prototype    // true
Set.prototype.__proto__ === Object.prototype    // true
Promsie.prototype.__proto__ === Object.prototype // true
Function.prototype.__proto__ === Object.prototype // true
```
其实可以理解，`prototype`是对象类型，对象都是`Object.prototype`的实例。
<center>
  <img style="border-radius: 0.3125em;
  box-shadow: 0 2px 4px 0 rgba(34,36,38,.12),0 2px 10px 0 rgba(34,36,38,.08);" 
  src="https://github.com/jiulanrensan/picGoImages/blob/main/images/内置函数原型.jpg">
  <br>
  <div style="color:orange; border-bottom: 1px solid #d9d9d9;
  display: inline-block;
  color: #999;
  padding: 2px;">内置对象的原型</div>
</center>

我们再看`Function`类型[<sup>[3]</sup>](#refer-anchor-3)


比如，我们用`Function`构造函数生成一个函数
```js
var bFn = new Function('console.log(1234)');
bFn() // 1234
Object.prototype.toString.call(bFn) // [object Function]
bFn.prototype.__proto__ === Object.prototype // true
```
`new`运算符会生成一个对象，所以这个`bFn`也是一个对象类型。所以
```js
bFn.__proto__ === Function.prototype // true
```
而通过函数声明、函数表达式等也同理
```js
functoin a() {}
a.__proto__ === Function.prototype // true

var b= function () {}
b.__proto__ === Function.prototype // true

var c = () => {}
c.__proto__ === Function.prototype // true
```
那么内置对象对应的构造函数也同理：
```js
Array.__proto__ === Function.prototype // true
String.__proto__ === Function.prototype // true
Number.__proto__ === Function.prototype // true
Date.__proto__ === Function.prototype   // true
Symbol.__proto__ === Function.prototype // true
// Object 构造函数同理
Object.__proto__ === Function.prototype // true
```

> 每个 `JavaScript` 函数实际上都是一个 `Function` 对象[<sup>[3]</sup>](#refer-anchor-3)

内置函数都可以理解为是`Function`构造函数的实例对象，但有一个特殊的
```js
Function.__proto__ === Function.prototype // true
```
`Function` 的 `__proto__` 也指向`Function.prototype`，而`Function`构造函数的`prototype`属性也指向`Function.prototype`

<center>
  <img style="border-radius: 0.3125em;
  box-shadow: 0 2px 4px 0 rgba(34,36,38,.12),0 2px 10px 0 rgba(34,36,38,.08);" 
  src="https://github.com/jiulanrensan/picGoImages/blob/main/images/原型链.jpg">
  <br>
  <div style="color:orange; border-bottom: 1px solid #d9d9d9;
  display: inline-block;
  color: #999;
  padding: 2px;">这里用红线标注指向Function.prototype</div>
</center>



# 参考
<div id="refer-anchor-1"></div>

- [1] [[[Prototype]]](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Inheritance_and_the_prototype_chain#%E7%BB%A7%E6%89%BF%E5%B1%9E%E6%80%A7)

<div id="refer-anchor-1"></div>

- [2] [Object](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object)

<div id="refer-anchor-3"></div>

- [3] [Function](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function)

