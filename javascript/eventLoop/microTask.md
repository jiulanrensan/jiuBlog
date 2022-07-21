# 微任务的执行顺序总结

## 1. await
最新的规范中
```js
async function fn1(){
  await async2()
}
```
等同于
```js
async function fn1() {
  // 这里可以为await是要拿到fn2返回值，然后再执行后面的代码
  // 如果Promise.resolve(1)，那拿到的就是1
  Promise.resolve(fn2()).then(() => {
  })
}
```
如果`fn2`返回的是`promise`，又可以转成如下
```js
// 3. 详细展开
async function fn1() {
  fn2().then(() => {
  })
}
```
[参考](https://segmentfault.com/q/1010000016147496)

## 2. async
```js
async function foo() {
  return Promise.resolve()
}
// 第一步，会转成如下
function foo() {
  const p = Promise.resolve()
  return new Promise(function (resolve, reject) {
    resolve(p)
  })
}
// 第二步。涉及到 NewPromiseResolveThenableJob 3.详细展开
function foo() {
  const p = Promise.resolve()
  return new Promise(function (resolve, reject) {
    Promise.resolve().then(() => {
      p.then(resolve)
    })
  })
}
```
[参考](https://segmentfault.com/a/1190000040207311)


## 3.1 什么是`thenable`对象
即包含`then`属性的对象，或者原型上有`then`属性，例如
```js
const thenable = {
  then: () => {}
}
```
`promise`对象也是一个`thenable`对象


## 3.2 `Promise.resolve(v)` 和 `new Promise((resolve) => resolve(v))`
两者大部分情况下是相同的，但如果`v`是一个`thenable`对象(下面代码v都为thenable对象)，两者处理会不同

根据[规范 Promise.resolve ( x )](https://tc39.es/ecma262/#sec-promise.resolve)

> The resolve function returns either a new promise resolved with the passed argument, or the argument itself if the argument is a promise produced by this constructor.

所以
```js
function fn1 () {
  Promise.resolve(v).then(() => {})
}
```
就可以等同于
```js
function fn1 () {
  v.then(() => {})
}
```

而如果是`new Promise((resolve) => resolve(v))`，这里会产生[`NewPromiseResolveThenableJob`](https://tc39.es/ecma262/#sec-newpromiseresolvethenablejob)

规范具体描述在[27.2.1.3.2 Promise Resolve Functions](https://tc39.es/ecma262/#sec-promise-resolve-functions)

举个例子：
```js
let v = new Promise(resolve => {
  console.log("begin");
  resolve("then");
});
new Promise(resolve => {
  resolve(v);
}).then((v) => {
  console.log(v)
});
new Promise(resolve => {
  console.log(1);
  resolve();
})
  .then(() => {
    console.log(2);
  })
  .then(() => {
    console.log(3);
  })
  .then(() => {
    console.log(4);
  });
// output
// begin
// 1
// 2
// 3
// then
// 4
```
打印`then`这一步没有在`1`后面，而是推迟了两次eventloop。

因为浏览器会创建一个 `NewPromiseResolveThenableJob` 去处理这个 Promise 实例，这是一个微任务。
等到下次循环到来这个微任务会执行，也就是`NewPromiseResolveThenableJob`执行中的时候，因为这个Promise 实例是fulfilled状态，所以又会注册一个它的`then`回调。
又等一次循环到这个Promise 实例它的`then`回调执行，所以被推迟了两个时序

例子修改一下：
```js
let v = new Promise(resolve => {
  console.log("begin");
  resolve("then");
});
// 改用Promise.resolve
Promise.resolve(v).then((v)=>{
  console.log(v)
});
new Promise(resolve => {
  console.log(1);
  resolve();
})
  .then(() => {
    console.log(2);
  })
  .then(() => {
    console.log(3);
  })
  .then(() => {
    console.log(4);
  });
// output
// begin
// 1
// then
// 2
// 3
// 4
```
这里的顺序就正常了

总结一下会产生`NewPromiseResolveThenableJob`的场景:

```js
// THENABLE 指的是 thenable 对象
// 场景1
new Promise(resolve => {
  resolve(THENABLE);
})

// 场景2
Promise.resolve().then(() => {
  return Promise.resolve(THENABLE)
})
```

## 几个demo
1. demo1
```js
async function async1() {
  return await async2()
}
function async2 () {
  console.log(1);
  // 无论返回哪个，打印顺序是一样的
  return 1
  // return Promise.resolve(1)
}

async1().then(res => {
  console.log('async then');
})

console.log('---');

Promise.resolve().then(() => {
  console.log(2);
}).then(() => {
  console.log(3);
})
// output
// 1
// ---
// 2
// async then
// 3
```
`await`会对后面的表达式做`Promise.resolve`转换，
`return await async2()`应该理解为：
通过`Promise.resolve`拿到`async2()`的值，然后在下一个循环`return 1`，所以`console.log(2);`在`console.log('async then');`前打印

如果`async2`返回`Promise.resolve(1)`，会转成
```js
Promise.resolve(Promise.resolve(1))
```
等同于
```js
Promise.resolve(1)
```

2. demo2
```js
async function async1() {
  return await async2()
}
// 改为async
async function async2 () {
  console.log(1);
  return 1
}

async1().then(res => {
  console.log('async then');
})

console.log('---');

Promise.resolve().then(() => {
  console.log(2);
}).then(() => {
  console.log(3);
})
// output
// 1
// ---
// 2
// async then
// 3
```

```js
async function async2 () {
  return 1
}
```
会转为
```js
function async2 () {
  return new Promise((resolve, reject) => {
    resolve(1)
  })
}
```
然后在`async1`中，`return await async2()`可以理解为:
```js
Promise.resolve(
  new Promise((resolve, reject) => {
    resolve(1)
  })
)
```
等同于`Promsie.resolve(1)`，然后下一个循环`return 1`，所以`console.log(2);`在`console.log('async then');`前打印

3. demo3
```js
async function async1() {
  return await async2()
}
// 改为async方法返回Promise
async function async2 () {
  console.log(1);
  return Promise.resolve(1)
}

async1().then(res => {
  console.log('async then');
})

console.log('---');

Promise.resolve().then(() => {
  console.log(2);
}).then(() => {
  console.log(3);
}).then(() => {
  console.log(4);
}).then(() => {
  console.log(5);
})
// output
// 1
// ---
// 2
// 3
// 4
// async then
// 5
```

重点在于`async`方法里返回了`promise`，根据上面的结论
```js
async function async2 () {
  console.log(1);
  return Promise.resolve(1)
}
```
可以转为
```js
function async2() {
  console.log(1);
  const p = Promise.resolve(1)
  return new Promise(function (resolve, reject) {
    Promise.resolve().then(() => {
      p.then(resolve)
    })
  })
}
```
这里产生了`NewPromiseResolveThenableJob`，可以看到有两个`then`。
我们从头梳理：
```
1. async2执行，打印 1，return一个promise对象
2. async1 里 await async2()等同于直接 async2().then...
3. 注册async2里第一个then
4. 打印 ---
5. 注册console.log(2)所属的then
6. async2里第一个then执行，然后再注册async2里第二个then
7. 打印2，注册console.log(3)所属then
8. async2里第二个then执行，得到值1，回到第2步，await 拿到1，然后再注册一个then
9. 打印3，注册console.log(4)所属then
10. 第8步的then回调执行，注册console.log('async then')所属then
11. 打印4，注册console.log(5)所属then
12. 打印 async then
13. 打印5
```