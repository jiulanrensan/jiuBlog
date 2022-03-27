# Function.length
获取函数形参个数，但只包括第一个具有默认值之前的参数个数
```js
console.log(Function.length); /* 1 */

console.log((function()        {}).length); /* 0 */
console.log((function(a)       {}).length); /* 1 */
console.log((function(a, b)    {}).length); /* 2 etc. */

console.log((function(...args) {}).length);
// 0, rest parameter is not counted

console.log((function(a, b = 1, c) {}).length);
// 1, only parameters before the first one with
// a default value is counted
```

# 参考
- [1] [Function.length](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/length)