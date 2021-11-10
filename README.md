# serialize-class 
Serialize JavaScript to a _superset_ of JSON that includes regular expressions, dates, array and custom class.

![](https://img.shields.io/badge/license-MIT-green)
![](https://img.shields.io/badge/npm-v6.0.0-blue)
![](https://img.shields.io/badge/coverage-95%25-green)
![Test](https://github.com/fanwenzh/serialize-class/workflows/Test/badge.svg)
<!-- ![](https://img.shields.io/github/stars/fanwenzh/serialize-class.svg) -->

## Installation

Install using npm:
```shell
$ npm install serialize-class
```

Usage by extend Serialize class
```javascript
// an example in test/class.test.js
const Bschema = {
    type: "b",
    properties: {
        strs: {
            type: "object",
            properties: {
                arr: {
                    type: "array",
                    subType: "regexp"
                }
            }
        }
    }
}

class B extends Serialize {
    static _schema = Bschema
    constructor(options) {
        super()
        Object.assign(this, options)
    }
}

const Aschema = {
    type: "a",
    properties: {
        a : {
            type: "array",
            subType: "number"
        },
        b : "B"
    }
}

class A extends Serialize {
    static _schema = Aschema 
    static _classes = [B]
    constructor(options) {
        super()
        Object.assign(this, options)
    }
}

const objB = {
    strs: {
        arr: [/test1/g, /test2/i]
    }
}
const objA = {
    a : [1,2,3],
    b : new B(objB)
}

const ins = new A(objA)
// {"a":[1,2,3],"b":{"strs":{"arr":[{"source":"test1","flags":"g"},{"source":"test2","flags":"i"}]}}}
const str = ins.stringify()
const newIns = A.toInstance(str)
newIns.b instanceof B // true
```

## TODO
1. suport "or" relation: |
2. suport type validate
3. suport default value in serializing or deserializing
4. add schema merge function to suport inherit relations between class   

 ## Detailed introduction
 [JavaScript序列化和反序列化接口设计与实现](https://juejin.cn/post/7026967314637520926#heading-10)
