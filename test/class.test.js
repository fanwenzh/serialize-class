const chai = require("chai")
chai.should()
const expect = chai.expect

const Serialize = require('../index.js')

describe("class serialize and deserialize", () => {
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
            },
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

    const insB = new B(objB)

    const objA = {
        a : [1,2,3],
        b : insB
    }

    const insA = new A(objA)

    // TODO: add options to descide how to deserialize undefined properties
    it("instance didn't have schema property", () => {
        const str = insB.stringify()
        str.should.equal('{"strs":{"arr":[{"source":"test1","flags":"g"},{"source":"test2","flags":"i"}]}}')
        Bschema.basic = "string"
        const newIns = B.toInstance(str)
        expect('basic' in newIns).should.be.ok
        delete newIns.basic
        newIns.should.deep.equals(insB)
    })

    it("Serialize interface with _classes property", () => {
        const str = insA.stringify()
        str.should.equal('{"a":[1,2,3],"b":{"strs":{"arr":[{"source":"test1","flags":"g"},{"source":"test2","flags":"i"}]}}}')
        const newIns = A.toInstance(str)
        newIns.should.deep.equals(insA)
        expect(newIns.b instanceof B).to.be.ok
    })

    it("Serialize interface with register API (1)", () => {
        Serialize.register(A)
        Serialize.register(B)

        const str = '{"a":[1,2,3],"b":{"strs":{"arr":[{"source":"test1","flags":"g"},{"source":"test2","flags":"i"}]}}}'
        const newIns = A.toInstance(str)
        newIns.should.deep.equals(insA)
    })

    it("Serialize interface with register API (2)", () => {
        Serialize.register([A, B])

        const str = '{"a":[1,2,3],"b":{"strs":{"arr":[{"source":"test1","flags":"g"},{"source":"test2","flags":"i"}]}}}'
        const newIns = A.toInstance(str)
        newIns.should.deep.equals(insA)
    })

    it("Serialize interface without _schema properties using JSON.stringfy directly", () => {
        class C extends Serialize{
            constructor() { super() }
        }
        const insC = Object.assign(new C(), {a:'123', b:"hello world"})
        const str = insC.stringify()
        str.should.equal('{"a":"123","b":"hello world"}')
        const newIns = C.toInstance(str)
        newIns.should.deep.equals(insC)
    })
})