# new 运算符
new 进行的操作
1. 创建一个空的简单JavaScript对象（即{}）
2. 为步骤1新创建的对象添加属性__proto__，将该属性链接至构造函数的原型对象
3. 将步骤1新创建的对象作为this的上下文(这样新对象就可以访问到构造函数里面定义的属性)
4. 如果该函数没有返回对象，则返回this

# 模拟实现
实现`newFn`方法模拟`new`，第一个参数为构造函数，其余参数为传进构造函数的参数
`newFn(Car, 1, 2)`等同于`new Car(1,2)`

```js
function newFn () {
  // 拿到构造函数
  var func = arguments[0]
  // 创建一个新对象，其__proto__指向构造函数原型链
  var obj = Object.create(func.prototype)
  // 拿到剩余参数
  var restArgs = Array.prototype.slice.call(arguments, 1)
  // 执行构造函数，this要指向新对象
  var res = func.apply(obj, restArgs)
  // 如果返回的不是对象类型，就要返回this
  return typeof res === 'object' ? res : obj
}
```

# 判断是否实例化
判断一个函数在执行时是否被实例化
## instanceof
```js
function Foo() {
  console.log(this instanceof Foo)
}
Foo() // false
new Foo() // true
```

## new.target
属性允许你检测函数或构造方法是否是通过new运算符被调用的
```js
function Foo() {
  // 普通函数调用中，new.target 返回undefined
  if (!new.target) throw "Foo() must be called with new";
  // new时返回一个指向构造方法或函数的引用
  console.log("Foo instantiated with new");
}

Foo(); // throws "Foo() must be called with new"
new Foo(); // logs "Foo instantiated with new"
```
箭头函数是没有自己的`new.target`
```js
// 这段代码会报错
var foo = () => {console.log(new.target)} // Uncaught SyntaxError: new.target expression is not allowed here
```
但是嵌套在普通函数中
```js
// 这样是不报错的，new.target返回Foo
function Foo () {
  var Goo = () => {console.log(new.target)}
  Goo()
}
```

# 参考
- [1] [new 运算符](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/new)
- [2] [new.target](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/new.target)
