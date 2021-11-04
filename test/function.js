const chai = require("chai")
chai.should()
const expect = chai.expect

const { deserialize, serializeWithSchemas } = require("../src/serializeFunction.js")

describe("serialize and deserialize", () => {
    const obj = {
        a: [/reg/],
        b: [new Set([1]), new Set([1, 2, 3])],
        c: "sasedasd",
        d: new Map().set("asd", { dp: 1 }),
        e: {
            ep1: "e property 1",
            ep2: "e property 2",
        },
    }

    const objSchema = {
        type: "object",
        properties: {
            a: {
                type: "array",
                subType: "regexp",
            },
            b: {
                type: "array",
                subType: {
                    type: "set",
                    subType: "number",
                },
            },
            c: "string",
            d: {
                type: "map",
                keyType: "string",
                valueType: {
                    type: "object",
                    properties: {
                        dp: "number",
                    },
                },
            },
            e: {
                type: "object",
                properties: {
                    ep1: "string",
                    ep2: "string",
                },
            },
        },
    }

    const ASchema = Object.assign({}, objSchema, { type: "A" })
    class A {
        constructor() {
            Object.assign(this, obj)
        }
    }

    const BSchema = {
        type: "B",
        properties: {
            p1: ASchema,
            p2: "string",
        },
    }
    class B {
        constructor() {
            this.p1 = new A()
            this.p2 = "test"
        }
    }

    const schemas = new Map([
        ["a", ASchema],
        ["b", BSchema],
    ])

    describe("serializeWithSchemas, deserialize", () => {
        it("非class序列化: serializeWithSchema", () => {
            const res = serializeWithSchemas(obj, objSchema)
            res.should.equal(
                '{"a":[{"source":"reg","flags":""}],"b":[[1],[1,2,3]],"c":"sasedasd","d":[["asd",{"dp":1}]],"e":{"ep1":"e property 1","ep2":"e property 2"}}'
            )
        })

        it("非class序列化: serializeWithSchema, 默认JSON.stringify()", () => {
            // 直接JSON.stringify(): 转换Object, Array, Number, String
            const res = serializeWithSchemas(obj)
            res.should.equal(
                '{"a":[{}],"b":[{},{}],"c":"sasedasd","d":{},"e":{"ep1":"e property 1","ep2":"e property 2"}}'
            )
        })
    })

    describe("serializeWithSchemas", () => {
        it("class序列化: 不包含其他class属性", () => {
            const a = new A()
            const res = serializeWithSchemas(a, schemas)
            res.should.equals(
                '{"a":[{"source":"reg","flags":""}],"b":[[1],[1,2,3]],"c":"sasedasd","d":[["asd",{"dp":1}]],"e":{"ep1":"e property 1","ep2":"e property 2"}}'
            )
        })
    })

    describe("deserialize", () => {
        it("class序列化: 含其他class属性", () => {
            const b = new B()
            const res = serializeWithSchemas(b, schemas)
            res.should.equals(
                '{"p1":{"a":[{"source":"reg","flags":""}],"b":[[1],[1,2,3]],"c":"sasedasd","d":[["asd",{"dp":1}]],"e":{"ep1":"e property 1","ep2":"e property 2"}},"p2":"test"}'
            )
        })

        it("class反序列化: 不含其他class属性", () => {
            const a = new A()
            const ser = serializeWithSchemas(a, ASchema)
            ser.should.equals(
                '{"a":[{"source":"reg","flags":""}],"b":[[1],[1,2,3]],"c":"sasedasd","d":[["asd",{"dp":1}]],"e":{"ep1":"e property 1","ep2":"e property 2"}}'
            )
            const deser = deserialize(ser, A, ASchema)
            deser.should.deep.equals(a)
        })
        it("class反序列化: 含其他class属性", () => {
            const b = new B()
            const ser = serializeWithSchemas(b, schemas)
            ser.should.equals(
                '{"p1":{"a":[{"source":"reg","flags":""}],"b":[[1],[1,2,3]],"c":"sasedasd","d":[["asd",{"dp":1}]],"e":{"ep1":"e property 1","ep2":"e property 2"}},"p2":"test"}'
            )
            const deser = deserialize(ser, B, schemas, [A, B])
            deser.should.deep.equals(b)
        })

        it("非class反序列化: 支持boolean", () => {
            const schema = {
                type: "object",
                properties: {
                    a: { type: "object", properties: { b: "boolean" } },
                    c: "string",
                },
            }
            const ins = {
                a: {
                    b: false,
                },
                c: "hello boolean",
            }
            const ser = serializeWithSchemas(ins, schema)
            ser.should.equals('{"a":{"b":false},"c":"hello boolean"}')
            const deser = deserialize(ser)
            deser.should.deep.equals(ins)
        })
    })
})
