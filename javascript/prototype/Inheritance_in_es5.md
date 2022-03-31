# es5中的继承
> 实现继承是ECMAScript唯一支持的继承方式，而这主要是通过原型链实现的。 ———— JavaScript高级程序设计

## 原型链继承
```js
function Parent () {
  this.parentA = true
}
Parent.prototype.getParentValue = function () {
  return this.parentA
}
function Child () {
  this.childA = false
}
/* 继承代码 */
Child.prototype = new Parent()
Child.prototype.getChildValue = function () {
  return this.childA
}
/* 继承代码 */
var instance = new Child()
console.log(instance.getParentValue()) // true
```
继承的原型链如下图
![原型链](https://raw.githubusercontent.com/jiulanrensan/picGoImages/main/images/20220331151625.png)

这种情况下，`Child`构造函数的原型是`Parent`构造函数的实例。

问题:
1. `Child.prototype`没有指向`Child`的构造函数，因为这是`Parent`的实例。`instance.constructor`实际上是`Parent.prototype.constructor`
2. `Parent`的**引用类型**属性会被子实例共享。由上图可知，每个子实例都可以拿到`Parent`实例的属性。那么一个子实例修改了`Parent`实例的属性，就会影响另外的子实例了。
```js
// 这样会修改父实例上的属性
instance1.arr.push(4)
```
那么非引用类型的属性呢，还是上面的例子，
```js
var instance1 = new Child()
var instance2 = new Child()
// 只设置instance1
instance1.parentA = 'parentA1'
// 通过打印发现，这行代码，直接在instance1对象上添加了parentA属性，所以没有修改父实例上的parentA
// 同理，下面这行代码也会再instance1上添加arr属性
instance1.arr = []
```

3. 子类型在实例化时不能给父类型的构造函数传参

## 盗用构造函数
```js
function Parent() { 
  this.colors = ["red", "blue", "green"]; 
} 
function Child() { 
  /* 继承代码 */
  // 继承 Parent 
  Parent.call(this); 
  /* 继承代码 */
} 
let instance1 = new Child(); 
instance1.colors.push("black"); 
console.log(instance1.colors); // "red,blue,green,black" 
let instance2 = new Child(); 
console.log(instance2.colors); // "red,blue,green"
```
通过打印结果可知，这种继承方式避免了子实例共享父实例引用类型属性的问题。并且`call`调用可以传参。

`Parent.call(this);`只是把`Parent`的this指向`Child`上下文环境，所以每次实例化时，`Parent`都会执行一次，生成每个子实例独有的属性。

问题是这里`Child`的原型链并没有发生变化。所以拿不到`Parent.prototype`上的属性和方法

## 组合继承
组合继承（有时候也叫伪经典继承）综合了原型链和盗用构造函数
```js
function Parent(name){ 
  this.name = name; 
  this.colors = ["red", "blue", "green"]; 
} 
Parent.prototype.sayName = function() { 
  console.log(this.name); 
}; 
function Child(name, age){ 
  // 继承属性
  Parent.call(this, name); 
  this.age = age; 
} 
// 继承方法
Child.prototype = new Parent(); 
Child.prototype.sayAge = function() { 
  console.log(this.age); 
};
let instance1 = new Child("a", 29);
let instance2 = new Child("b", 27);
```
![组合继承](https://raw.githubusercontent.com/jiulanrensan/picGoImages/main/images/20220331170645.png)

这种组合方式把上面两种优点都结合到一起。既能拿到`Parent.prototype`的方法，子类又不会共享父类的引用类型属性。

问题还是这个:`Child.prototype`没有指向`Child`的构造函数

## 原型式继承
```js
/* 继承代码 */
function object(o) {
  function F() { }
  F.prototype = o;
  return new F();
}
/* 继承代码 */
// 上面这个就是es6中 Object.create的模拟实现
let person = {
  name: "Nicholas",
  friends: ["Shelby", "Court", "Van"]
};
let child1 = object(person);
child1.name = "Greg"; // 与上面原型链继承一样，这里并不是改变person的name，而是给child1添加name属性
child1.friends.push("Rob");
let child2 = object(person);
child2.name = "Linda";
child2.friends.push("Barbie");
```
与原型链继承一样，引用类型的属性值始终都会被共享

## 寄生式继承
```js
function createAnother(original){ 
  let clone = Object.create(original); // 通过调用函数创建一个新对象
  clone.sayHi = function() { // 以某种方式增强这个对象
    console.log("hi"); 
  }; 
  return clone; // 返回这个对象
} 
```
同上

## 寄生组合式继承
```js
/* 继承代码 */
function inheritPrototype(Child, Parent) { 
  let prototype = Object.create(Parent.prototype); // 创建对象
  prototype.constructor = Child; // 增强对象 
  Child.prototype = prototype; // 赋值对象
}
/* 继承代码 */
function Parent(name) {
  this.name = name;
  this.colors = ["red", "blue", "green"];
}
Parent.prototype.sayName = function () {
  console.log(this.name);
};
function Child(name, age) {
  /* 继承代码 */
  Parent.call(this, name);
  /* 继承代码 */
  this.age = age;
}
inheritPrototype(Child, Parent);
Child.prototype.sayAge = function () {
  console.log(this.age);
};
let instance1 = new Child("a", 29);
let instance2 = new Child("b", 27);
```
![寄生组合式继承](https://raw.githubusercontent.com/jiulanrensan/picGoImages/main/images/20220331185402.png)

这里的`constructor`指向终于对了。并且避免了在 Child.prototype 上面创建多余的属性。