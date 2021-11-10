const SERIALIZE_TYPE = "__SERIALIZE_TYPE__"
// types that need to use "new" to create
const CONS_TYPES = ["array", "set", "map", "object", "regexp", "bigint", "date"]
// types that using JSON.parse() directily
const BASE_TYPES = ["boolean", "string", "number"]

function getType(obj) {
    const str = Object.prototype.toString.call(obj)
    return str.slice(str.lastIndexOf(" ") + 1, -1).toLowerCase()
}

/**
 *  serialize functions
 * */
function serializeObj(obj, schema, schemaMap, res = {}) {
    const { properties: props } = schema
    for (let key of Object.keys(props)) {
        res[key] = transformElement(obj[key], props[key], schemaMap)
    }
    return res
}

// only support the same subType in Array
function serializeArray(arr, propVal, schemaMap) {
    const { subType } = propVal
    return arr.map((e) => transformElement(e, subType, schemaMap))
}

function serializeMap(val, propVal, schemaMap) {
    let { keyType, valueType } = propVal
    if (keyType.toLowerCase() !== "string") {
        throw Error("the keys of serializing Map only support String type") // Symbol
    }
    return [...val].map(([mKey, mVal]) => [
        transformElement(mKey, keyType, schemaMap),
        transformElement(mVal, valueType, schemaMap),
    ])
}

function serializeSet(set, propVal, schemaMap) {
    const { subType } = propVal
    return [...set].map((e) => transformElement(e, subType, schemaMap))
}

function transformElement(val, propVal, schemaMap) {
    if (val === undefined || val === null || propVal === undefined) return val
    if (typeof propVal === "string") {
        return transformStringType(val, propVal, schemaMap)
    } else {
        return transformObjectType(val, propVal, schemaMap)
    }
}

function transformStringType(val, typeStr, schemaMap) {
    if (BASE_TYPES.includes(typeStr) || typeStr === "json_object") {
        return val
    }

    if (typeStr === "regexp") {
        return { source: val.source, flags: val.flags }
    }

    if (typeStr === "bigint") {
        return val.toString()
    }

    if (typeStr === "date") {
        return val.getTime()
    }

    if (typeStr === "function") throw Error("Doesn't support Function yet")

    // Don't use typeStr.toLowerCase() beacause it may be an inheritance relationship
    let clsType = val.constructor.name.toLowerCase()

    const schema = schemaMap.get(clsType)
    if (schema === undefined) throw Error(`schema of "${clsType}" doesn't exist`)

    const res = serializeObj(val, schema, schemaMap)

    // Custom class: TODO: add type judgement between schema's 'type and val.constructor.name
    if (clsType !== "object" && clsType !== typeStr.toLowerCase() && !val[SERIALIZE_TYPE]) {
        res[SERIALIZE_TYPE] = clsType
    }

    return res
}

function transformObjectType(val, propVal, schemaMap) {
    const { type } = propVal
    const ltype = type.toLowerCase()
    const schema = schemaMap.get(ltype)

    if (schema !== undefined) {
        return serializeObj(val, schema, schemaMap)
    } else if (ltype === "object") {
        return serializeObj(val, propVal, schemaMap)
    } else if (ltype === "array") {
        return serializeArray(val, propVal, schemaMap)
    } else if (ltype === "map") {
        return serializeMap(val, propVal, schemaMap)
    } else if (ltype === "set") {
        return serializeSet(val, propVal, schemaMap)
    } else {
        throw Error(`Doesn't support schema ${type}`)
    }
}

function _serializeWithSchema(obj, objSchema, schemaMap) {
    const type = objSchema.type.toLowerCase()
    if (!schemaMap.has(objSchema) && !CONS_TYPES.includes(type) && !BASE_TYPES.includes(type)) {
        schemaMap.set(type, objSchema)
    }

    const res = transformElement(obj, objSchema, schemaMap)
    return JSON.stringify(res)
}

function serializeWithSchemas(obj, objSchema, schemaMap = new Map()) {
    if (objSchema === undefined) return JSON.stringify(obj)

    if (objSchema.type) {
        return _serializeWithSchema(obj, objSchema, schemaMap)
    }

    if (getType(objSchema) !== "map") throw Error("wrong argument objSchema")
    schemaMap = objSchema
    if (schemaMap.size === 0) return JSON.stringify(obj)

    for (let clsName of schemaMap.keys()) {
        if (CONS_TYPES.includes(clsName.toLowerCase()) || BASE_TYPES.includes(clsName.toLowerCase())) {
            throw Error(`Basic class ${clsName} can't put in map, may use serializeWithSchema API`)
        }
    }

    const clsName = obj.constructor.name
    const name = clsName.toLowerCase()
    const schema = schemaMap.get(name)

    if (schema === undefined) throw Error(`type of class ${clsName} doesn't match type of schema ${schema.type}`)
    return _serializeWithSchema(obj, schema, schemaMap)
}

/**
 *  serialize functions
 * */
function deserializeObj(jsonObj, obj, schema, schemaMap, classMap) {
    const { properties: props } = schema
    for (let key of Object.keys(props)) {
        obj[key] = detransformElement(jsonObj[key], props[key], schemaMap, classMap)
    }
    return obj
}

// only support the same subType in Array
function deserializeArray(arr, schema, schemaMap, classMap) {
    const { subType } = schema
    return arr.map((e) => detransformElement(e, subType, schemaMap, classMap))
}

function deserializeMap(arr, schema, schemaMap, classMap) {
    let { keyType, valueType } = schema
    if (keyType.toLowerCase() !== "string") {
        throw Error("the key of Map must be String type") // Symbol
    }
    const map = new Map()
    arr.forEach(([mKey, mVal]) => {
        map.set(mKey, detransformElement(mVal, valueType, schemaMap, classMap))
    })
    return map
}

function deserializeSet(arr, schema, schemaMap, classMap) {
    const { subType } = schema
    const set = new Set()
    arr.forEach((e) => set.add(detransformElement(e, subType, schemaMap, classMap)))
    return set
}

function detransformElement(jsonObj, schema, schemaMap, classMap) {
    if (jsonObj === undefined || jsonObj === null) return jsonObj
    if (typeof schema === "string") {
        return detransformStringType(jsonObj, schema, schemaMap, classMap)
    } else {
        return detransformObjectType(jsonObj, schema, schemaMap, classMap)
    }
}

function detransformStringType(val, typeStr, schemaMap, classMap) {
    if (BASE_TYPES.includes(typeStr) || typeStr === "json_object") {
        return val
    }

    if (typeStr === "regexp") {
        return new RegExp(val.source, val.flags)
    }

    if (typeStr === "bigint") {
        return BigInt(val)
    }

    if (typeStr === "date") {
        return new Date(val)
    }

    if (typeStr === "function") throw Error("Doesn't support Function yet")

    const clsName = val[SERIALIZE_TYPE] ? val[SERIALIZE_TYPE] : typeStr
    const name = clsName.toLowerCase()

    const cls = classMap.get(name)
    if (cls === undefined) throw Error(`the class of "${clsName}" doesn't exist in classMap`)

    const schema = schemaMap.get(name)
    if (schema === undefined) throw Error(`the schema of ${clsName} doesn't exist in schemaMap`)

    return deserializeObj(val, new cls(), schema, schemaMap, classMap)
}

function detransformObjectType(jsonObj, schema, schemaMap, classMap) {
    const type = schema.type.toLowerCase()
    const cls = classMap.get(type)

    if (cls !== undefined) {
        return deserializeObj(jsonObj, new cls(), schema, schemaMap, classMap)
    } else if (type === "object") {
        return deserializeObj(jsonObj, Object.create(null), schema, schemaMap, classMap)
    } else if (type === "array") {
        return deserializeArray(jsonObj, schema, schemaMap, classMap)
    } else if (type === "map") {
        return deserializeMap(jsonObj, schema, schemaMap, classMap)
    } else if (type === "set") {
        return deserializeSet(jsonObj, schema, schemaMap, classMap)
    } else {
        throw Error(`need to subply class ${type}`)
    }
}

function deserialize(str, cls = Object, schemaMap, classMap = new Map()) {
    let jsonObj = JSON.parse(str)
    if (!schemaMap) {
        return jsonObj
    }

    if (typeof cls !== "function") {
        throw Error(`cls argument must be a class function`)
    }

    if (getType(classMap) === "array") {
        const map = new Map()
        classMap.forEach((c) => map.set(c.name.toLowerCase(), c))
        classMap = map
    }

    // schemaMap is a schema
    if (getType(schemaMap) !== "map") {
        if (!schemaMap.type) throw Error("argument schemaMap must be a map or schema with property type")
        const name = cls.name.toLowerCase()
        schemaMap = new Map([[name, schemaMap]])
        classMap.set(name, cls)
    }

    const schema = schemaMap.get(cls.name.toLowerCase())
    if (schema === undefined) {
        throw Error(`The _schema property of class "${cls.name}" doesn't exist`)
    }

    return deserializeObj(jsonObj, new cls(), schema, schemaMap, classMap)
}

module.exports = {
    deserialize,
    serializeWithSchemas,
}
