const chai = require("chai")
chai.should()
const expect = chai.expect

const Serialize = require('../../index.js')

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

    it("using Serialize interface", () => {
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
        const str = ins.stringify()
        str.should.equal('{"a":[1,2,3],"b":{"strs":{"arr":[{"source":"test1","flags":"g"},{"source":"test2","flags":"i"}]}}}')
        const newIns = A.toInstance(str)
        newIns.should.deep.equals(ins)
        expect(newIns.b instanceof B).to.be.ok
    })
})