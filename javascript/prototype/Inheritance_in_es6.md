# es6中的继承
```js
class Parent { 
  constructor() { 
    this.parentA = true; 
  } 
  sayName () {
    return this.parentA
  }
} 
class Child extends Parent { 
  constructor() { 
    super(); // 相当于 super.constructor() 
    console.log(this instanceof Parent); // true 
    console.log(this); // Child { parentA: true } 
    this.childA = false
  } 
  sayAge() {
    return this.childA
  }
} 
var child1 = new Child();
```
es6中虽然可以用`class`关键字来描述类和类的继承，但实际上还是通过原型链来继承。

通过[babel转译](https://babeljs.io/repl/#?browsers=&build=&builtIns=false&corejs=3.21&spec=false&loose=false&code_lz=Q&debug=false&forceAllTransforms=false&shippedProposals=false&circleciRepo=&evaluate=true&fileSize=false&timeTravel=false&sourceType=module&lineWrap=false&presets=es2015%2Creact%2Cstage-2&prettier=false&targets=&version=7.17.8&externalPlugins=&assumptions=%7B%7D)成es5:


```js
// 省略了部分兼容代码
// 继承
function _inherits(ChildClass, ParentClass) { 
  // 1. Object.create新建一个对象
  // 2. ChildClass.prototype.__proto__ 指向 ParentClass.prototype
  // 3. 并给新对象添加constructor属性，指向ChildClass
  ChildClass.prototype = Object.create(ParentClass && ParentClass.prototype, { 
    constructor: { value: ChildClass, writable: true, configurable: true } 
  }); 
  // 让 ChildClass.prototype 属性不可写
  Object.defineProperty(ChildClass, "prototype", { writable: false }); 
  
  // 改变构造函数的__proto__
  // ChildClass.__proto__ = ParentClass
  // 这在es5中是没有的
  if (ParentClass) Object.setPrototypeOf(ChildClass, ParentClass); 
}
// 入参为子构造函数
// 父构造函数执行
function _createSuper(Derived) { 
  return function _createSuperInternal() { 
    // 获取子构造函数的__proto__
    // 这里指向了父构造函数
    var Super = _getPrototypeOf(Derived)
    var result;
    result = Super.apply(this, arguments); 
    return _possibleConstructorReturn(this, result); 
  }; 
}
// 如果构造函数有返回值，则返回这个返回值，如果没有则返回this
function _possibleConstructorReturn(self, call) {
  if (call && (typeof(call) === "object" || typeof call === "function")) { return call; } 
  else if (call !== void 0) { 
    throw new TypeError("Derived constructors may only return object or undefined"); 
  } 
  return _assertThisInitialized(self); 
}

// 要先调用super(),才能使用this，检验完成之后返回 self
function _assertThisInitialized(self) { 
  if (self === void 0) { 
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); 
  } 
  return self; 
}

// 获取对象的 __proto__
function _getPrototypeOf(o) { 
  _getPrototypeOf = Object.setPrototypeOf ? 
    Object.getPrototypeOf : 
    function _getPrototypeOf(o) { 
      return o.__proto__ || Object.getPrototypeOf(o); 
    }; 
    return _getPrototypeOf(o); 
}

// 遍历props，给target添加属性
function _defineProperties(target, props) { 
  for (var i = 0; i < props.length; i++) { 
    var descriptor = props[i]; 
    descriptor.enumerable = descriptor.enumerable || false; 
    descriptor.configurable = true; 
    if ("value" in descriptor) descriptor.writable = true; 
    Object.defineProperty(target, descriptor.key, descriptor); 
  } 
}

// 在原型链上添加属性
function _createClass(Constructor, protoProps, staticProps) { 
  if (protoProps) _defineProperties(Constructor.prototype, protoProps); 
  // 静态属性
  if (staticProps) _defineProperties(Constructor, staticProps); 
  Object.defineProperty(Constructor, "prototype", { writable: false }); 
  return Constructor; 
}

var Parent = /*#__PURE__*/function () {
  function Parent() {
    this.parentA = true;
  }

  // 给原型链添加sayName方法
  _createClass(Parent, [{
    key: "sayName",
    value: function sayName() {
      return this.parentA;
    }
  }]);

  return Parent;
}();

var Child = /*#__PURE__*/function (_Parent) {
  // 继承父类
  _inherits(Child, _Parent);

  // _super 为 function类型
  var _super = _createSuper(Child);

  function Child() {
    var _this;

    // 相当于执行了Parent.call(this)，继承了父类
    // 父类无返回值时，为this；有返回值时，为返回值
    _this = _super.call(this); // 相当于 super.constructor() 

    console.log(_assertThisInitialized(_this) instanceof Parent); // true 

    console.log(_assertThisInitialized(_this)); // Child { parentA: true } 

    _this.childA = false;
    return _this;
  }

  // 给Child.prototype添加属性
  _createClass(Child, [{
    key: "sayAge",
    value: function sayAge() {
      return this.childA;
    }
  }]);

  return Child;
}(Parent);

var child1 = new Child();
```

对比原型链，与es5不同的地方在于:
在es6继承中`Child.__proto__`指向了`Parent`，这样子类就可以拿到父类函数上的属性。
es5中的继承，无论子类父类，函数都是继承于`Function`



# 思考：为什么es5中不能完美继承内置方法
> 之所以会发生这种情况，是因为子类无法获得原生构造函数的内部属性，通过Array.apply()或者分配给原型对象都不行。原生构造函数会忽略apply方法传入的this，也就是说，原生构造函数的this无法绑定，导致拿不到内部属性。