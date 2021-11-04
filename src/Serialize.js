const { serializeWithSchemas, deserialize } = require("./serializeFunction")

class Serialize {
    static _schema = undefined
    static _classes = undefined // classes of properties
    static _SerializeAlreadyTraverse = false
    static _classesMap = new Map()
    static _schemasMap = new Map()
    // TODO: expand
    static _exclude = undefined

    // store the class before serialize or deserialize
    static register(classes, flushClasses = false) {
        if (!Array.isArray(classes)) classes = [classes]
        for (let cls of classes) {
            Serialize.setClassesToMap(cls, flushClasses)
        }
    }

    /**
     * class cls extends Serialize {}
     * @param {string} str seralized string of object
     * @param {class} cls class function of seralized object
     * @param {boolean} flushClasses flush properties of class and schema map
     * */
    static toInstance(str, cls = this, flushClasses = false) {
        if (typeof cls !== "function") {
            throw Error(`${cls} isn't class function`)
        }

        if (!cls._schema) {
            return Object.assign(new cls(), JSON.parse(str))
        }

        Serialize.setClassesToMap(cls, flushClasses)
        return deserialize(str, cls, Serialize._schemasMap, Serialize._classesMap)
    }

    static getPropClasses(cls, clsMap, flushClasses = false) {
        if (cls === undefined || cls === Object || cls === Function || /native code/.test(cls.toString()))
            return undefined

        if (clsMap.has(cls) && !flushClasses) return undefined

        clsMap.set(cls.name.toLowerCase(), cls)
        if (Array.isArray(cls._classes)) {
            for (let clsItem of cls._classes) {
                const claName = clsItem.name.toLowerCase()
                if (!clsMap.has(claName)) Serialize.getPropClasses(clsItem, clsMap, flushClasses)
            }
        }

        Serialize.getPropClasses(Object.getPrototypeOf(cls), clsMap, flushClasses)
    }

    static setSchemasToMap(flushClasses) {
        for (let [key, cls] of Serialize._classesMap.entries()) {
            if (!cls._schema) {
                console.warn(`The _schema property of class "${cls.name}" doesn't exist, is it json_object?`)
            } else {
                if (!Serialize._schemasMap.has(key) || flushClasses) {
                    Serialize._schemasMap.set(key, cls._schema)
                }
            }
        }
    }

    static setClassesToMap(cls, flushClasses = false) {
        if (!cls._SerializeAlreadyTraverse || flushClasses) {
            Serialize.getPropClasses(cls, Serialize._classesMap, flushClasses)
            Serialize.setSchemasToMap(flushClasses)
            cls.setTraverseFlag(true)
        }
    }

    /** had already set the properties of _classes and _schemas */
    setTraverseFlag(flag = true) {
        this.constructor._SerializeAlreadyTraverse = flag
    }

    stringify(flushClasses = false) {
        const cls = this.constructor
        if (!cls._schema && !Array.isArray(cls._schemas) && !Array.isArray(cls._classes)) {
            return JSON.stringify(this)
        }

        Serialize.setClassesToMap(cls, flushClasses)
        return serializeWithSchemas(this, Serialize._schemasMap)
    }
}

module.exports = Serialize
