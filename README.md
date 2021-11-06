# serialize-class 
Serialize JavaScript to a _superset_ of JSON that includes regular expressions, dates, array and custom class.

## Installation

Install using npm:
```shell
$ npm install serialize-class
```

Usage by extend Serialize class
```javascript
// 1. 继承Serialize 类
class A extends Serialize {
  // 1.1 添加序列化和反序列化的 _schema 和 属性类型集合 _classes
  // 其中_classess内的类方法是递归读取超类的
  static _schema = Aschema
  static _classes = [property_a_Class, property_b_Class, property_c_Class]
  constructor() {
      // 1.2 增加super调用
      super()
  }
}

// 2. 使用Serialize方法
const obj = new A()
// 2.1 序列化stringify
const str = obj.stringify()
// 2.2 反序列化toInstance(str)
const newObj = A.toInscance(str)
```

## TODO
1. suport "or" relation: |
2. suport type validate
3. suport default value in serializing or deserializing
4. add schema merge function to suport inherit relations between class   

 ## Detailed introduction
 [JavaScript序列化和反序列化接口设计与实现](https://juejin.cn/post/7026967314637520926#heading-10)
