# es5中的继承
> 实现继承是ECMAScript唯一支持的继承方式，而这主要是通过原型链实现的。 ———— JavaScript高级程序设计

## 原型链继承
```js
function Parent () {
  this.property = true
}
Parent.prototype.getParentValue = function () {
  return this.property
}
function Child () {
  this.childProperty = false
}
Child.prototype = new Parent()
Child.prototype.getChildValue = function () {
  return this.childProperty
}
var instance = new Child()
console.log(instance.getParentValue())
```