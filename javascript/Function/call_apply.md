# Function.prototype.call
调用方式: `function.call(thisArg, arg1, arg2, ...)`

直接用例子解释
```js
function Product(name, price) {
  this.name = name;
  this.price = price;
}

function Food(name, price) {
  // 1. 执行Product函数
  // 2. Product.call 第一个参数传入了 Food 函数的 this
  // 3. Product 函数执行时，给this添加了两个属性，即给Food添加了两个属性
  Product.call(this, name, price);
  console.log('name:', this.name, 'price:', this.price) // name: cheese price: 5
  this.category = 'food';
}

console.log(new Food('cheese', 5).name);
// "cheese"
```


# Function.prototype.apply
调用方式: `func.apply(thisArg, [argsArray])`

与`Function.prototype.call`功能完全相同，仅参数方式不一样。

与`Function.prototype.call`一样，对于第一个参数，如果这个函数处于非严格模式下，则指定为 null 或 undefined 时会自动替换为指向全局对象。原始值会被包装。

第二个参数可以是一个数组或者类数组对象。

还是上面那个例子，看一下传参
```js
function Product(name, price) {
  console.log('Product', 'name:', name, 'price:', price)
  this.name = name;
  this.price = price;
}

function Food(name, price) {
  // 以数组形式传参
  Product.apply(this, [name, price]);
  this.category = 'food';
}

new Food('cheese', 5)
// 此时 Product.apply(this, ['cheese', 5]);
// Product name: cheese price: 5

new Food('cheese')
// 此时 Product.apply(this, ['cheese', undefined]);
// Product name: cheese price: undefined
```
调用`apply`时，数组里面每个元素对应`Product`的每个参数，可以理解为解构数组。

所以可以很巧妙地运用这个技巧。最常见的就是求数组的最大值。

```js
const numbers = [5, 6, 2, 3, 7];

const max = Math.max.apply(null, numbers);
// 等同于Math.max(...numbers)
```
这里用了null，表明会指向全局对象，但其实这里这样写也没关系
```js
let obj = {}
Math.max.apply(obj, numbers); // 7
```
因为只是为了给第一个参数占位。

同理，还有`Array.prototype.unshift`,`Array.prototype.push`
```js
var array = ['a', 'b'];
var elements = [0, 1, 2];
Array.prototype.push.apply(array, elements); // ["a", "b", 0, 1, 2]
// 因为push是为改变原数组的，所以this指向为array
// 当然直接用 array.push(...elements) 更方便
```

# 模拟实现`Function.prototype.call`
```js
Function.prototype.callFn = function () {
  var thisArg = arguments[0] || window
  // this指向的是当前调用的函数
  var fn = this
  // 给thisArg对象添加属性fn，这样thisArg.fn调用时，fn里面的this就会指向thisArg
  thisArg.fn = fn
  var args = []
  for (var i = 1; i < arguments.length; i++) {
    args.push(arguments[i])
  }
  var res = thisArg.fn(...args)
  // 执行完再删除这个属性
  delete thisArg.fn
  return res
}
```
很明显，添加`fn`属性这里有问题，要是原本就有一个`fn`属性，岂不是覆盖了吗。所以考虑用`Symbol`
```js
Function.prototype.callFn = function () {
  var thisArg = arguments[0] || window
  // 给thisArg对象添加属性fn，这样thisArg.fn调用时，fn里面的this就会指向thisArg
  var fn = Symbol()
  thisArg[fn] = this
  var args = []
  for (var i = 1; i < arguments.length; i++) {
    args.push(arguments[i])
  }
  var res = thisArg[fn](...args)
  // 执行完再删除这个属性
  delete thisArg[fn]
  return res
}
```

# 模拟实现`Function.prototype.apply`
```js
Function.prototype.applyFn = function (thisArgs, arr) {
  var thisArg = thisArgs || window
  var fn = Symbol()
  thisArg[fn] = this
  var res;
  if (!arr) {
    res = thisArg[fn]()
  } else {
    var args = []
    for (var i = 0; i < arr.length; i++) {
      args.push(arr[i])
    }
    thisArg[fn](...args)
  }
  delete thisArg[fn]
  return res
}
```