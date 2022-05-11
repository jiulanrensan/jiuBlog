# npm中你要知道的

## npm包的版本管理
所有的版本都有 3 个数字：`x.y.z`
* 第一个数字是主版本 (major)。
* 第二个数字是次版本 (minor)。
* 第三个数字是补丁版本 (patch)

并且使用一些符号来表示版本范围
* `^`: 只会执行不更改最左边非零数字的更新。 如果写入的是 ^0.13.0，则当运行 npm update 时，可以更新到 0.13.1、0.13.2 等，但不能更新到 0.14.0 或更高版本。 如果写入的是 ^1.13.0，则当运行 npm update 时，可以更新到 1.13.1、1.14.0 等，但不能更新到 2.0.0 或更高版本。
* `~`: 如果写入的是 ~0.13.0，则当运行 npm update 时，会更新到补丁版本：即 0.13.1 可以，但 0.14.0 不可以。
* `>`: 接受高于指定版本的任何版本。
* `>=`: 接受等于或高于指定版本的任何版本。
* `<=`: 接受等于或低于指定版本的任何版本。
* `<`: 接受低于指定版本的任何版本。
* `=`: 接受确切的版本。
* `-`: 接受一定范围的版本。例如：2.1.0 - 2.6.2。
* `||`: 组合集合。例如 < 2.1 || > 2.6

可以用这个网站[https://semver.npmjs.com/](https://semver.npmjs.com/) 去尝试上面的符号规则

## [node_modules原理](http://www.conardli.top/blog/article/%E5%89%8D%E7%AB%AF%E5%B7%A5%E7%A8%8B%E5%8C%96/%E5%89%8D%E7%AB%AF%E5%B7%A5%E7%A8%8B%E5%8C%96%EF%BC%88%E4%B8%89%EF%BC%89npminstall%E5%8E%9F%E7%90%86%E5%88%86%E6%9E%90.html)

* 为什么需要package-lock.json
* node_modules如何解决依赖黑洞
* npm install流程

## dependencies vs devDependencies vs peerDependencies
* dependencies 正式环境要用的依赖
* devDependencies 开发时需要用的依赖，例如babel,eslint
* peerDependencies

[参考这篇文章](https://www.cnblogs.com/h2zZhou/p/12923053.html)，有一个很好的例子：
1. 假设开发基于webpack3的插件`webpack-plugin@1`，此时可以设置`peerDependencies`的webpack版本为3
2. 现在webpack升级到了4，但是`webpack-plugin@1`并不兼容webpack4,
3. 所以安装依赖的时候会抛出`UNMET PEER DEPENDENCY`警告，让用户手动解决
