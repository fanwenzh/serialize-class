const chai = require("chai")
chai.should()

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

    describe("basicly serialize and deserialize", () => {
        it("shallow object with properties of boolean, string, number", () => {
            const obj = { a: true, b: "test", c: 123 }
            const schema = { type: "object", properties: { a: "boolean", b: "string", c: "number" } }
            const str = serializeWithSchemas(obj, schema)
            str.should.equal('{"a":true,"b":"test","c":123}')
            const newObj = deserialize(str, Object, schema)
            newObj.should.deep.equals(obj)
        })

        it("shallow object with properties of array, set, map, regexp, bigint, date", () => {
            const date = new Date(1636024591947)
            const obj = { a: [/set/g], b: new Set([1]), c: new Map([["123", 123]]), d: BigInt(10), e: date }
            const schema = {
                type: "object",
                properties: {
                    a: {
                        type: "array",
                        subType: "regexp",
                    },
                    b: {
                        type: "set",
                        subType: "number",
                    },
                    c: {
                        type: "map",
                        keyType: "string",
                        valueType: "number",
                    },
                    d: "bigint",
                    e: "date",
                },
            }
            const str = serializeWithSchemas(obj, schema)
            str.should.equal(
                '{"a":[{"source":"set","flags":"g"}],"b":[1],"c":[["123",123]],"d":"10","e":1636024591947}'
            )
            const newObj = deserialize(str, Object, schema)
            newObj.should.deep.equals(obj)
        })
    })

    describe("serializeWithSchemas, deserialize function", () => {
        it("build-in class serialize and deserialize: serializeWithSchema", () => {
            const ser = serializeWithSchemas(obj, objSchema)
            ser.should.equal('{"a":[{"source":"reg","flags":""}],"b":[[1],[1,2,3]],"c":"sasedasd","d":[["asd",{"dp":1}]],"e":{"ep1":"e property 1","ep2":"e property 2"}}')
            const deser = deserialize(ser, Object, objSchema)
            deser.should.deep.equals(obj)
        })

        it("build-in class serialize without schema: default use JSON.stringify() witch doesn't serialize properies of set and regexp", () => {
            const ser = serializeWithSchemas(obj)
            ser.should.equal(
                '{"a":[{}],"b":[{},{}],"c":"sasedasd","d":{},"e":{"ep1":"e property 1","ep2":"e property 2"}}'
            )
        })

        it("build-in class deserialize", () => {
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
            const deser = deserialize(ser, Object)
            deser.should.deep.equals(ins)
        })
    })

    describe("deserialize", () => {
        it("custom class deserialize without custom class properties", () => {
            const a = new A()
            const ser = serializeWithSchemas(a, ASchema)
            ser.should.equals(
                '{"a":[{"source":"reg","flags":""}],"b":[[1],[1,2,3]],"c":"sasedasd","d":[["asd",{"dp":1}]],"e":{"ep1":"e property 1","ep2":"e property 2"}}'
            )
            const deser = deserialize(ser, A, ASchema)
            deser.should.deep.equals(a)
        })
        it("custom class deserialize with other custom class properties", () => {
            const b = new B()
            const ser = serializeWithSchemas(b, schemas)
            ser.should.equals(
                '{"p1":{"a":[{"source":"reg","flags":""}],"b":[[1],[1,2,3]],"c":"sasedasd","d":[["asd",{"dp":1}]],"e":{"ep1":"e property 1","ep2":"e property 2"}},"p2":"test"}'
            )
            const deser = deserialize(ser, B, schemas, [A, B])
            deser.should.deep.equals(b)
        })
    })
})
