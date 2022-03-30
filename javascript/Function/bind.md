# `Function.prototype.bind`
调用方法：`function.bind(thisArg[, arg1[, arg2[, ...]]])`

```js
const module = {
  x: 42,
  getX: function() {
    return this.x;
  }
};

const unboundGetX = module.getX;
// 此时this为window
console.log(unboundGetX()); // undefined

// 返回一个新函数，新函数的this指向bind第一个参数
const boundGetX = unboundGetX.bind(module);
// 此时this为module
console.log(boundGetX()); // 42
```
`bind`还能预设参数
```js
const module = {
  x: 42,
  getX: function(a,b) {
    console.log(a,b, this.x)
  }
};
const unboundGetX = module.getX;
const boundGetX = unboundGetX.bind(module, 1, 2);
// 这里 boundGetX 调用时是没有入参的
boundGetX() // 1,2,42
```

`unboundGetX.bind(module)`可以简单理解成：返回一个函数，函数里面是调用apply
```js
return function() {
  unboundGetX.apply(module)
}
```

mdn上有一个特别的用法
```js
var slice = Array.prototype.slice;
slice.apply(arguments);
```
等同于
```js
var unboundSlice = Array.prototype.slice;
var slice = Function.prototype.apply.bind(unboundSlice);
slice(arguments);
```
可以这样理解：`apply`是`Function.prototype`上的方法，而`Array.prototype.slice`方法是`Function`构造函数的实例，所以`Array.prototype.slice.apply`是往原型链上找`apply`方法，此时调用`apply`方法的是`slice`，谁调用，this就指向谁。

因此`Function.prototype.apply.bind(Array.prototype.slice)`，`apply`的this被`bind`指定了`Array.prototype.slice`，所以就是`Array.prototype.slice.apply`，因为`bind`返回新方法：
```js
return function() {
  return Array.prototype.slice.apply(arguments)
}
```


# 模拟实现
1. 创建一个新的函数，在 `bind()` 被调用时，这个新函数的 `this` 被指定为 `bind()` 的第一个参数
2. bind() 可以使一个函数拥有预设的初始参数
3. 可以使用`new`，提供的 this 值会被忽略，但前置参数仍会提供给模拟函数
```js
// 第一、二步
Function.prototype.bindFn = function() {
  var thisArg = arguments[0]
  // 剩余参数
  var args = Array.prototype.slice.call(arguments, 1)
  var that = this
  return function () {
    // 新函数的参数与上面的剩余参数拼接在一起
    var fnArgs = args.concat(Array.prototype.slice.call(arguments))
    // 原函数可能有返回值
    return that.apply(thisArg, args)
  }
}
```
第三步，看个例子
```js
var value = 2;

var foo = {
    value: 1
};

function bar(name, age) {
    this.habit = 'shopping';
    console.log(this.value);
    console.log(name);
    console.log(age);
}

bar.prototype.friend = 'kevin';

// bar绑定foo，并传入一个参数
var bindFoo = bar.bind(foo, 'daisy');

// 使用new时，新对象的this就指向bar了
var obj = new bindFoo('18');
// undefined  // this.value bar构造函数以及原型上都没有
// daisy      // name
// 18         // age
console.log(obj.habit);
console.log(obj.friend);
// shopping
// kevin
console.log(obj.__proto__ === bar.prototype) // true
// 说明效果等同于 new bar()
```
模拟第三步
```js
Function.prototype.bindFn = function() {
  var thisArg = arguments[0]
  // 剩余参数
  var args = Array.prototype.slice.call(arguments, 1)
  var that = this
  var boundFn = function () {
    var fnArgs = args.concat(Array.prototype.slice.call(arguments))
    // 把boundFn返回出去，如果是使用new，则创建的对象的this就会指向boundFn
    return that.apply(this instanceof boundFn ? this : that, args)
  }
  // 构造函数的__proto__ 要指向 that.prototype， that指向bindFn被调用的方法
  boundFn.prototype = Object.create(that.prototype)
  return boundFn
}
```

# 参考
- [1] [JavaScript深入之bind的模拟实现](https://github.com/mqyqingfeng/Blog/issues/12)