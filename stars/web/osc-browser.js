/*! osc.js 2.3.0, Copyright 2019 Colin Clark | github.com/colinbdclark/osc.js */


var osc = osc || {};

!function() {
    "use strict";
    osc.SECS_70YRS = 2208988800, osc.TWO_32 = 4294967296, osc.defaults = {
        metadata: !1,
        unpackSingleArgs: !0
    }, osc.isCommonJS = !("undefined" == typeof module || !module.exports), osc.isNode = osc.isCommonJS && "undefined" == typeof window, 
    osc.isElectron = !("undefined" == typeof process || !process.versions || !process.versions.electron), 
    osc.isBufferEnv = osc.isNode || osc.isElectron, osc.isArray = function(e) {
        return e && "[object Array]" === Object.prototype.toString.call(e);
    }, osc.isTypedArrayView = function(e) {
        return e.buffer && e.buffer instanceof ArrayBuffer;
    }, osc.isBuffer = function(e) {
        return osc.isBufferEnv && e instanceof Buffer;
    }, osc.Long = "undefined" != typeof Long ? Long : osc.isNode ? require("long") : void 0, 
    osc.TextDecoder = "undefined" != typeof TextDecoder ? TextDecoder : "undefined" != typeof util && (util.TextDecoder, 
    1) ? util.TextDecoder : void 0, osc.dataView = function(e, t, r) {
        return e.buffer ? new DataView(e.buffer, t, r) : e instanceof ArrayBuffer ? new DataView(e, t, r) : new DataView(new Uint8Array(e), t, r);
    }, osc.byteArray = function(e) {
        if (e instanceof Uint8Array) return e;
        var t = e.buffer ? e.buffer : e;
        if (!(t instanceof ArrayBuffer || void 0 !== t.length && "string" != typeof t)) throw new Error("Can't wrap a non-array-like object as Uint8Array. Object was: " + JSON.stringify(e, null, 2));
        return new Uint8Array(t);
    }, osc.nativeBuffer = function(e) {
        return osc.isBufferEnv ? osc.isBuffer(e) ? e : Buffer.from(e.buffer ? e : new Uint8Array(e)) : osc.isTypedArrayView(e) ? e : new Uint8Array(e);
    }, osc.copyByteArray = function(e, t, r) {
        if (osc.isTypedArrayView(e) && osc.isTypedArrayView(t)) t.set(e, r); else for (var n = void 0 === r ? 0 : r, i = Math.min(t.length - r, e.length), s = 0, o = n; s < i; s++, 
        o++) t[o] = e[s];
        return t;
    }, osc.readString = function(e, t) {
        for (var r = [], n = t.idx; n < e.byteLength; n++) {
            var i = e.getUint8(n);
            if (0 === i) {
                n++;
                break;
            }
            r.push(i);
        }
        return n = n + 3 & -4, t.idx = n, (osc.isBufferEnv ? osc.readString.withBuffer : osc.TextDecoder ? osc.readString.withTextDecoder : osc.readString.raw)(r);
    }, osc.readString.raw = function(e) {
        for (var t = "", r = 0; r < e.length; r += 1e4) t += String.fromCharCode.apply(null, e.slice(r, r + 1e4));
        return t;
    }, osc.readString.withTextDecoder = function(e) {
        var t = new Int8Array(e);
        return new osc.TextDecoder("utf-8").decode(t);
    }, osc.readString.withBuffer = function(e) {
        return Buffer.from(e).toString("utf-8");
    }, osc.writeString = function(e) {
        for (var t = e + "\0", r = t.length, n = new Uint8Array(r + 3 & -4), i = 0; i < t.length; i++) {
            var s = t.charCodeAt(i);
            n[i] = s;
        }
        return n;
    }, osc.readPrimitive = function(e, t, r, n) {
        var i = e[t](n.idx, !1);
        return n.idx += r, i;
    }, osc.writePrimitive = function(e, t, r, n, i) {
        var s;
        return i = void 0 === i ? 0 : i, t ? s = new Uint8Array(t.buffer) : (s = new Uint8Array(n), 
        t = new DataView(s.buffer)), t[r](i, e, !1), s;
    }, osc.readInt32 = function(e, t) {
        return osc.readPrimitive(e, "getInt32", 4, t);
    }, osc.writeInt32 = function(e, t, r) {
        return osc.writePrimitive(e, t, "setInt32", 4, r);
    }, osc.readInt64 = function(e, t) {
        var r = osc.readPrimitive(e, "getInt32", 4, t), n = osc.readPrimitive(e, "getInt32", 4, t);
        return osc.Long ? new osc.Long(n, r) : {
            high: r,
            low: n,
            unsigned: !1
        };
    }, osc.writeInt64 = function(e, t, r) {
        var n = new Uint8Array(8);
        return n.set(osc.writePrimitive(e.high, t, "setInt32", 4, r), 0), n.set(osc.writePrimitive(e.low, t, "setInt32", 4, r + 4), 4), 
        n;
    }, osc.readFloat32 = function(e, t) {
        return osc.readPrimitive(e, "getFloat32", 4, t);
    }, osc.writeFloat32 = function(e, t, r) {
        return osc.writePrimitive(e, t, "setFloat32", 4, r);
    }, osc.readFloat64 = function(e, t) {
        return osc.readPrimitive(e, "getFloat64", 8, t);
    }, osc.writeFloat64 = function(e, t, r) {
        return osc.writePrimitive(e, t, "setFloat64", 8, r);
    }, osc.readChar32 = function(e, t) {
        var r = osc.readPrimitive(e, "getUint32", 4, t);
        return String.fromCharCode(r);
    }, osc.writeChar32 = function(e, t, r) {
        var n = e.charCodeAt(0);
        if (!(void 0 === n || n < -1)) return osc.writePrimitive(n, t, "setUint32", 4, r);
    }, osc.readBlob = function(e, t) {
        var r = osc.readInt32(e, t), n = r + 3 & -4, i = new Uint8Array(e.buffer, t.idx, r);
        return t.idx += n, i;
    }, osc.writeBlob = function(e) {
        var t = (e = osc.byteArray(e)).byteLength, r = new Uint8Array(4 + (t + 3 & -4)), n = new DataView(r.buffer);
        return osc.writeInt32(t, n), r.set(e, 4), r;
    }, osc.readMIDIBytes = function(e, t) {
        var r = new Uint8Array(e.buffer, t.idx, 4);
        return t.idx += 4, r;
    }, osc.writeMIDIBytes = function(e) {
        e = osc.byteArray(e);
        var t = new Uint8Array(4);
        return t.set(e), t;
    }, osc.readColor = function(e, t) {
        var r = new Uint8Array(e.buffer, t.idx, 4), n = r[3] / 255;
        return t.idx += 4, {
            r: r[0],
            g: r[1],
            b: r[2],
            a: n
        };
    }, osc.writeColor = function(e) {
        var t = Math.round(255 * e.a);
        return new Uint8Array([ e.r, e.g, e.b, t ]);
    }, osc.readTrue = function() {
        return !0;
    }, osc.readFalse = function() {
        return !1;
    }, osc.readNull = function() {
        return null;
    }, osc.readImpulse = function() {
        return 1;
    }, osc.readTimeTag = function(e, t) {
        var r = osc.readPrimitive(e, "getUint32", 4, t), n = osc.readPrimitive(e, "getUint32", 4, t);
        return {
            raw: [ r, n ],
            native: 0 === r && 1 === n ? Date.now() : osc.ntpToJSTime(r, n)
        };
    }, osc.writeTimeTag = function(e) {
        var t = e.raw ? e.raw : osc.jsToNTPTime(e.native), r = new Uint8Array(8), n = new DataView(r.buffer);
        return osc.writeInt32(t[0], n, 0), osc.writeInt32(t[1], n, 4), r;
    }, osc.timeTag = function(e, t) {
        e = e || 0;
        var r = (t = t || Date.now()) / 1e3, n = Math.floor(r), i = r - n, s = Math.floor(e), o = i + (e - s);
        if (1 < o) {
            var a = Math.floor(o);
            s += a, o = o - a;
        }
        return {
            raw: [ n + s + osc.SECS_70YRS, Math.round(osc.TWO_32 * o) ]
        };
    }, osc.ntpToJSTime = function(e, t) {
        return 1e3 * (e - osc.SECS_70YRS + t / osc.TWO_32);
    }, osc.jsToNTPTime = function(e) {
        var t = e / 1e3, r = Math.floor(t), n = t - r;
        return [ r + osc.SECS_70YRS, Math.round(osc.TWO_32 * n) ];
    }, osc.readArguments = function(e, t, r) {
        var n = osc.readString(e, r);
        if (0 !== n.indexOf(",")) throw new Error("A malformed type tag string was found while reading the arguments of an OSC message. String was: " + n, " at offset: " + r.idx);
        var i = n.substring(1).split(""), s = [];
        return osc.readArgumentsIntoArray(s, i, n, e, t, r), s;
    }, osc.readArgument = function(e, t, r, n, i) {
        var s = osc.argumentTypes[e];
        if (!s) throw new Error("'" + e + "' is not a valid OSC type tag. Type tag string was: " + t);
        var o = s.reader, a = osc[o](r, i);
        return n.metadata && (a = {
            type: e,
            value: a
        }), a;
    }, osc.readArgumentsIntoArray = function(e, t, r, n, i, s) {
        for (var o = 0; o < t.length; ) {
            var a, u = t[o];
            if ("[" === u) {
                var c = t.slice(o + 1), h = c.indexOf("]");
                if (h < 0) throw new Error("Invalid argument type tag: an open array type tag ('[') was found without a matching close array tag ('[]'). Type tag was: " + r);
                var f = c.slice(0, h);
                a = osc.readArgumentsIntoArray([], f, r, n, i, s), o += h + 2;
            } else a = osc.readArgument(u, r, n, i, s), o++;
            e.push(a);
        }
        return e;
    }, osc.writeArguments = function(e, t) {
        var r = osc.collectArguments(e, t);
        return osc.joinParts(r);
    }, osc.joinParts = function(e) {
        for (var t = new Uint8Array(e.byteLength), r = e.parts, n = 0, i = 0; i < r.length; i++) {
            var s = r[i];
            osc.copyByteArray(s, t, n), n += s.length;
        }
        return t;
    }, osc.addDataPart = function(e, t) {
        t.parts.push(e), t.byteLength += e.length;
    }, osc.writeArrayArguments = function(e, t) {
        for (var r = "[", n = 0; n < e.length; n++) {
            var i = e[n];
            r += osc.writeArgument(i, t);
        }
        return r += "]";
    }, osc.writeArgument = function(e, t) {
        if (osc.isArray(e)) return osc.writeArrayArguments(e, t);
        var r = e.type, n = osc.argumentTypes[r].writer;
        if (n) {
            var i = osc[n](e.value);
            osc.addDataPart(i, t);
        }
        return e.type;
    }, osc.collectArguments = function(e, t, r) {
        osc.isArray(e) || (e = void 0 === e ? [] : [ e ]), r = r || {
            byteLength: 0,
            parts: []
        }, t.metadata || (e = osc.annotateArguments(e));
        for (var n = ",", i = r.parts.length, s = 0; s < e.length; s++) {
            var o = e[s];
            n += osc.writeArgument(o, r);
        }
        var a = osc.writeString(n);
        return r.byteLength += a.byteLength, r.parts.splice(i, 0, a), r;
    }, osc.readMessage = function(e, t, r) {
        t = t || osc.defaults;
        var n = osc.dataView(e, e.byteOffset, e.byteLength);
        r = r || {
            idx: 0
        };
        var i = osc.readString(n, r);
        return osc.readMessageContents(i, n, t, r);
    }, osc.readMessageContents = function(e, t, r, n) {
        if (0 !== e.indexOf("/")) throw new Error("A malformed OSC address was found while reading an OSC message. String was: " + e);
        var i = osc.readArguments(t, r, n);
        return {
            address: e,
            args: 1 === i.length && r.unpackSingleArgs ? i[0] : i
        };
    }, osc.collectMessageParts = function(e, t, r) {
        return r = r || {
            byteLength: 0,
            parts: []
        }, osc.addDataPart(osc.writeString(e.address), r), osc.collectArguments(e.args, t, r);
    }, osc.writeMessage = function(e, t) {
        if (t = t || osc.defaults, !osc.isValidMessage(e)) throw new Error("An OSC message must contain a valid address. Message was: " + JSON.stringify(e, null, 2));
        var r = osc.collectMessageParts(e, t);
        return osc.joinParts(r);
    }, osc.isValidMessage = function(e) {
        return e.address && 0 === e.address.indexOf("/");
    }, osc.readBundle = function(e, t, r) {
        return osc.readPacket(e, t, r);
    }, osc.collectBundlePackets = function(e, t, r) {
        r = r || {
            byteLength: 0,
            parts: []
        }, osc.addDataPart(osc.writeString("#bundle"), r), osc.addDataPart(osc.writeTimeTag(e.timeTag), r);
        for (var n = 0; n < e.packets.length; n++) {
            var i = e.packets[n], s = (i.address ? osc.collectMessageParts : osc.collectBundlePackets)(i, t);
            r.byteLength += s.byteLength, osc.addDataPart(osc.writeInt32(s.byteLength), r), 
            r.parts = r.parts.concat(s.parts);
        }
        return r;
    }, osc.writeBundle = function(e, t) {
        if (!osc.isValidBundle(e)) throw new Error("An OSC bundle must contain 'timeTag' and 'packets' properties. Bundle was: " + JSON.stringify(e, null, 2));
        t = t || osc.defaults;
        var r = osc.collectBundlePackets(e, t);
        return osc.joinParts(r);
    }, osc.isValidBundle = function(e) {
        return void 0 !== e.timeTag && void 0 !== e.packets;
    }, osc.readBundleContents = function(e, t, r, n) {
        for (var i = osc.readTimeTag(e, r), s = []; r.idx < n; ) {
            var o = osc.readInt32(e, r), a = r.idx + o, u = osc.readPacket(e, t, r, a);
            s.push(u);
        }
        return {
            timeTag: i,
            packets: s
        };
    }, osc.readPacket = function(e, t, r, n) {
        var i = osc.dataView(e, e.byteOffset, e.byteLength);
        n = void 0 === n ? i.byteLength : n, r = r || {
            idx: 0
        };
        var s = osc.readString(i, r), o = s[0];
        if ("#" === o) return osc.readBundleContents(i, t, r, n);
        if ("/" === o) return osc.readMessageContents(s, i, t, r);
        throw new Error("The header of an OSC packet didn't contain an OSC address or a #bundle string. Header was: " + s);
    }, osc.writePacket = function(e, t) {
        if (osc.isValidMessage(e)) return osc.writeMessage(e, t);
        if (osc.isValidBundle(e)) return osc.writeBundle(e, t);
        throw new Error("The specified packet was not recognized as a valid OSC message or bundle. Packet was: " + JSON.stringify(e, null, 2));
    }, osc.argumentTypes = {
        i: {
            reader: "readInt32",
            writer: "writeInt32"
        },
        h: {
            reader: "readInt64",
            writer: "writeInt64"
        },
        f: {
            reader: "readFloat32",
            writer: "writeFloat32"
        },
        s: {
            reader: "readString",
            writer: "writeString"
        },
        S: {
            reader: "readString",
            writer: "writeString"
        },
        b: {
            reader: "readBlob",
            writer: "writeBlob"
        },
        t: {
            reader: "readTimeTag",
            writer: "writeTimeTag"
        },
        T: {
            reader: "readTrue"
        },
        F: {
            reader: "readFalse"
        },
        N: {
            reader: "readNull"
        },
        I: {
            reader: "readImpulse"
        },
        d: {
            reader: "readFloat64",
            writer: "writeFloat64"
        },
        c: {
            reader: "readChar32",
            writer: "writeChar32"
        },
        r: {
            reader: "readColor",
            writer: "writeColor"
        },
        m: {
            reader: "readMIDIBytes",
            writer: "writeMIDIBytes"
        }
    }, osc.inferTypeForArgument = function(e) {
        switch (typeof e) {
          case "boolean":
            return e ? "T" : "F";

          case "string":
            return "s";

          case "number":
            return "f";

          case "undefined":
            return "N";

          case "object":
            if (null === e) return "N";
            if (e instanceof Uint8Array || e instanceof ArrayBuffer) return "b";
            if ("number" == typeof e.high && "number" == typeof e.low) return "h";
        }
        throw new Error("Can't infer OSC argument type for value: " + JSON.stringify(e, null, 2));
    }, osc.annotateArguments = function(e) {
        for (var t = [], r = 0; r < e.length; r++) {
            var n, i = e[r];
            if ("object" == typeof i && i.type && void 0 !== i.value) n = i; else if (osc.isArray(i)) n = osc.annotateArguments(i); else {
                n = {
                    type: osc.inferTypeForArgument(i),
                    value: i
                };
            }
            t.push(n);
        }
        return t;
    }, osc.isCommonJS && (module.exports = osc);
}(), function(e, t) {
    "object" == typeof exports && "object" == typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define([], t) : "object" == typeof exports ? exports.Long = t() : e.Long = t();
}("undefined" != typeof self ? self : this, function() {
    return i = {}, n.m = r = [ function(e, t) {
        function n(e, t, r) {
            this.low = 0 | e, this.high = 0 | t, this.unsigned = !!r;
        }
        function g(e) {
            return !0 === (e && e.__isLong__);
        }
        function r(e, t) {
            var r, n, i;
            return t ? (i = 0 <= (e >>>= 0) && e < 256) && (n = o[e]) ? n : (r = p(e, (0 | e) < 0 ? -1 : 0, !0), 
            i && (o[e] = r), r) : (i = -128 <= (e |= 0) && e < 128) && (n = s[e]) ? n : (r = p(e, e < 0 ? -1 : 0, !1), 
            i && (s[e] = r), r);
        }
        function l(e, t) {
            if (isNaN(e)) return t ? c : m;
            if (t) {
                if (e < 0) return c;
                if (a <= e) return A;
            } else {
                if (e <= -u) return P;
                if (u <= e + 1) return E;
            }
            return e < 0 ? l(-e, t).neg() : p(e % i | 0, e / i | 0, t);
        }
        function p(e, t, r) {
            return new n(e, t, r);
        }
        function h(e, t, r) {
            if (0 === e.length) throw Error("empty string");
            if ("NaN" === e || "Infinity" === e || "+Infinity" === e || "-Infinity" === e) return m;
            if (t = "number" == typeof t ? (r = t, !1) : !!t, (r = r || 10) < 2 || 36 < r) throw RangeError("radix");
            var n;
            if (0 < (n = e.indexOf("-"))) throw Error("interior hyphen");
            if (0 === n) return h(e.substring(1), t, r).neg();
            for (var i = l(f(r, 8)), s = m, o = 0; o < e.length; o += 8) {
                var a = Math.min(8, e.length - o), u = parseInt(e.substring(o, o + a), r);
                if (a < 8) {
                    var c = l(f(r, a));
                    s = s.mul(c).add(l(u));
                } else s = (s = s.mul(i)).add(l(u));
            }
            return s.unsigned = t, s;
        }
        function v(e, t) {
            return "number" == typeof e ? l(e, t) : "string" == typeof e ? h(e, t) : p(e.low, e.high, "boolean" == typeof t ? t : e.unsigned);
        }
        e.exports = n;
        var y = null;
        try {
            y = new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([ 0, 97, 115, 109, 1, 0, 0, 0, 1, 13, 2, 96, 0, 1, 127, 96, 4, 127, 127, 127, 127, 1, 127, 3, 7, 6, 0, 1, 1, 1, 1, 1, 6, 6, 1, 127, 1, 65, 0, 11, 7, 50, 6, 3, 109, 117, 108, 0, 1, 5, 100, 105, 118, 95, 115, 0, 2, 5, 100, 105, 118, 95, 117, 0, 3, 5, 114, 101, 109, 95, 115, 0, 4, 5, 114, 101, 109, 95, 117, 0, 5, 8, 103, 101, 116, 95, 104, 105, 103, 104, 0, 0, 10, 191, 1, 6, 4, 0, 35, 0, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 126, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 127, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 128, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 129, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 130, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11 ])), {}).exports;
        } catch (e) {}
        Object.defineProperty(n.prototype, "__isLong__", {
            value: !0
        }), n.isLong = g;
        var s = {}, o = {};
        n.fromInt = r, n.fromNumber = l, n.fromBits = p;
        var f = Math.pow;
        n.fromString = h, n.fromValue = v;
        var i = 4294967296, a = i * i, u = a / 2, w = r(1 << 24), m = r(0);
        n.ZERO = m;
        var c = r(0, !0);
        n.UZERO = c;
        var d = r(1);
        n.ONE = d;
        var b = r(1, !0);
        n.UONE = b;
        var S = r(-1);
        n.NEG_ONE = S;
        var E = p(-1, 2147483647, !1);
        n.MAX_VALUE = E;
        var A = p(-1, -1, !0);
        n.MAX_UNSIGNED_VALUE = A;
        var P = p(0, -2147483648, !1);
        n.MIN_VALUE = P;
        var B = n.prototype;
        B.toInt = function() {
            return this.unsigned ? this.low >>> 0 : this.low;
        }, B.toNumber = function() {
            return this.unsigned ? (this.high >>> 0) * i + (this.low >>> 0) : this.high * i + (this.low >>> 0);
        }, B.toString = function(e) {
            if ((e = e || 10) < 2 || 36 < e) throw RangeError("radix");
            if (this.isZero()) return "0";
            if (this.isNegative()) {
                if (this.eq(P)) {
                    var t = l(e), r = this.div(t), n = r.mul(t).sub(this);
                    return r.toString(e) + n.toInt().toString(e);
                }
                return "-" + this.neg().toString(e);
            }
            for (var i = l(f(e, 6), this.unsigned), s = this, o = ""; ;) {
                var a = s.div(i), u = (s.sub(a.mul(i)).toInt() >>> 0).toString(e);
                if ((s = a).isZero()) return u + o;
                for (;u.length < 6; ) u = "0" + u;
                o = "" + u + o;
            }
        }, B.getHighBits = function() {
            return this.high;
        }, B.getHighBitsUnsigned = function() {
            return this.high >>> 0;
        }, B.getLowBits = function() {
            return this.low;
        }, B.getLowBitsUnsigned = function() {
            return this.low >>> 0;
        }, B.getNumBitsAbs = function() {
            if (this.isNegative()) return this.eq(P) ? 64 : this.neg().getNumBitsAbs();
            for (var e = 0 != this.high ? this.high : this.low, t = 31; 0 < t && 0 == (e & 1 << t); t--) ;
            return 0 != this.high ? t + 33 : t + 1;
        }, B.isZero = function() {
            return 0 === this.high && 0 === this.low;
        }, B.eqz = B.isZero, B.isNegative = function() {
            return !this.unsigned && this.high < 0;
        }, B.isPositive = function() {
            return this.unsigned || 0 <= this.high;
        }, B.isOdd = function() {
            return 1 == (1 & this.low);
        }, B.isEven = function() {
            return 0 == (1 & this.low);
        }, B.equals = function(e) {
            return g(e) || (e = v(e)), (this.unsigned === e.unsigned || this.high >>> 31 != 1 || e.high >>> 31 != 1) && this.high === e.high && this.low === e.low;
        }, B.eq = B.equals, B.notEquals = function(e) {
            return !this.eq(e);
        }, B.neq = B.notEquals, B.ne = B.notEquals, B.lessThan = function(e) {
            return this.comp(e) < 0;
        }, B.lt = B.lessThan, B.lessThanOrEqual = function(e) {
            return this.comp(e) <= 0;
        }, B.lte = B.lessThanOrEqual, B.le = B.lessThanOrEqual, B.greaterThan = function(e) {
            return 0 < this.comp(e);
        }, B.gt = B.greaterThan, B.greaterThanOrEqual = function(e) {
            return 0 <= this.comp(e);
        }, B.gte = B.greaterThanOrEqual, B.ge = B.greaterThanOrEqual, B.compare = function(e) {
            if (g(e) || (e = v(e)), this.eq(e)) return 0;
            var t = this.isNegative(), r = e.isNegative();
            return t && !r ? -1 : !t && r ? 1 : this.unsigned ? e.high >>> 0 > this.high >>> 0 || e.high === this.high && e.low >>> 0 > this.low >>> 0 ? -1 : 1 : this.sub(e).isNegative() ? -1 : 1;
        }, B.comp = B.compare, B.negate = function() {
            return !this.unsigned && this.eq(P) ? P : this.not().add(d);
        }, B.neg = B.negate, B.add = function(e) {
            g(e) || (e = v(e));
            var t = this.high >>> 16, r = 65535 & this.high, n = this.low >>> 16, i = 65535 & this.low, s = e.high >>> 16, o = 65535 & e.high, a = e.low >>> 16, u = 0, c = 0, h = 0, f = 0;
            return h += (f += i + (65535 & e.low)) >>> 16, c += (h += n + a) >>> 16, u += (c += r + o) >>> 16, 
            u += t + s, p((h &= 65535) << 16 | (f &= 65535), (u &= 65535) << 16 | (c &= 65535), this.unsigned);
        }, B.subtract = function(e) {
            return g(e) || (e = v(e)), this.add(e.neg());
        }, B.sub = B.subtract, B.multiply = function(e) {
            if (this.isZero()) return m;
            if (g(e) || (e = v(e)), y) return p(y.mul(this.low, this.high, e.low, e.high), y.get_high(), this.unsigned);
            if (e.isZero()) return m;
            if (this.eq(P)) return e.isOdd() ? P : m;
            if (e.eq(P)) return this.isOdd() ? P : m;
            if (this.isNegative()) return e.isNegative() ? this.neg().mul(e.neg()) : this.neg().mul(e).neg();
            if (e.isNegative()) return this.mul(e.neg()).neg();
            if (this.lt(w) && e.lt(w)) return l(this.toNumber() * e.toNumber(), this.unsigned);
            var t = this.high >>> 16, r = 65535 & this.high, n = this.low >>> 16, i = 65535 & this.low, s = e.high >>> 16, o = 65535 & e.high, a = e.low >>> 16, u = 65535 & e.low, c = 0, h = 0, f = 0, d = 0;
            return f += (d += i * u) >>> 16, h += (f += n * u) >>> 16, f &= 65535, h += (f += i * a) >>> 16, 
            c += (h += r * u) >>> 16, h &= 65535, c += (h += n * a) >>> 16, h &= 65535, c += (h += i * o) >>> 16, 
            c += t * u + r * a + n * o + i * s, p((f &= 65535) << 16 | (d &= 65535), (c &= 65535) << 16 | (h &= 65535), this.unsigned);
        }, B.mul = B.multiply, B.divide = function(e) {
            if (g(e) || (e = v(e)), e.isZero()) throw Error("division by zero");
            if (y) return this.unsigned || -2147483648 !== this.high || -1 !== e.low || -1 !== e.high ? p((this.unsigned ? y.div_u : y.div_s)(this.low, this.high, e.low, e.high), y.get_high(), this.unsigned) : this;
            if (this.isZero()) return this.unsigned ? c : m;
            var t, r, n;
            if (this.unsigned) {
                if (e.unsigned || (e = e.toUnsigned()), e.gt(this)) return c;
                if (e.gt(this.shru(1))) return b;
                n = c;
            } else {
                if (this.eq(P)) return e.eq(d) || e.eq(S) ? P : e.eq(P) ? d : (t = this.shr(1).div(e).shl(1)).eq(m) ? e.isNegative() ? d : S : (r = this.sub(e.mul(t)), 
                n = t.add(r.div(e)));
                if (e.eq(P)) return this.unsigned ? c : m;
                if (this.isNegative()) return e.isNegative() ? this.neg().div(e.neg()) : this.neg().div(e).neg();
                if (e.isNegative()) return this.div(e.neg()).neg();
                n = m;
            }
            for (r = this; r.gte(e); ) {
                t = Math.max(1, Math.floor(r.toNumber() / e.toNumber()));
                for (var i = Math.ceil(Math.log(t) / Math.LN2), s = i <= 48 ? 1 : f(2, i - 48), o = l(t), a = o.mul(e); a.isNegative() || a.gt(r); ) a = (o = l(t -= s, this.unsigned)).mul(e);
                o.isZero() && (o = d), n = n.add(o), r = r.sub(a);
            }
            return n;
        }, B.div = B.divide, B.modulo = function(e) {
            return g(e) || (e = v(e)), y ? p((this.unsigned ? y.rem_u : y.rem_s)(this.low, this.high, e.low, e.high), y.get_high(), this.unsigned) : this.sub(this.div(e).mul(e));
        }, B.mod = B.modulo, B.rem = B.modulo, B.not = function() {
            return p(~this.low, ~this.high, this.unsigned);
        }, B.and = function(e) {
            return g(e) || (e = v(e)), p(this.low & e.low, this.high & e.high, this.unsigned);
        }, B.or = function(e) {
            return g(e) || (e = v(e)), p(this.low | e.low, this.high | e.high, this.unsigned);
        }, B.xor = function(e) {
            return g(e) || (e = v(e)), p(this.low ^ e.low, this.high ^ e.high, this.unsigned);
        }, B.shiftLeft = function(e) {
            return g(e) && (e = e.toInt()), 0 == (e &= 63) ? this : e < 32 ? p(this.low << e, this.high << e | this.low >>> 32 - e, this.unsigned) : p(0, this.low << e - 32, this.unsigned);
        }, B.shl = B.shiftLeft, B.shiftRight = function(e) {
            return g(e) && (e = e.toInt()), 0 == (e &= 63) ? this : e < 32 ? p(this.low >>> e | this.high << 32 - e, this.high >> e, this.unsigned) : p(this.high >> e - 32, 0 <= this.high ? 0 : -1, this.unsigned);
        }, B.shr = B.shiftRight, B.shiftRightUnsigned = function(e) {
            if (g(e) && (e = e.toInt()), 0 == (e &= 63)) return this;
            var t = this.high;
            return e < 32 ? p(this.low >>> e | t << 32 - e, t >>> e, this.unsigned) : p(32 === e ? t : t >>> e - 32, 0, this.unsigned);
        }, B.shru = B.shiftRightUnsigned, B.shr_u = B.shiftRightUnsigned, B.toSigned = function() {
            return this.unsigned ? p(this.low, this.high, !1) : this;
        }, B.toUnsigned = function() {
            return this.unsigned ? this : p(this.low, this.high, !0);
        }, B.toBytes = function(e) {
            return e ? this.toBytesLE() : this.toBytesBE();
        }, B.toBytesLE = function() {
            var e = this.high, t = this.low;
            return [ 255 & t, t >>> 8 & 255, t >>> 16 & 255, t >>> 24, 255 & e, e >>> 8 & 255, e >>> 16 & 255, e >>> 24 ];
        }, B.toBytesBE = function() {
            var e = this.high, t = this.low;
            return [ e >>> 24, e >>> 16 & 255, e >>> 8 & 255, 255 & e, t >>> 24, t >>> 16 & 255, t >>> 8 & 255, 255 & t ];
        }, n.fromBytes = function(e, t, r) {
            return r ? n.fromBytesLE(e, t) : n.fromBytesBE(e, t);
        }, n.fromBytesLE = function(e, t) {
            return new n(e[0] | e[1] << 8 | e[2] << 16 | e[3] << 24, e[4] | e[5] << 8 | e[6] << 16 | e[7] << 24, t);
        }, n.fromBytesBE = function(e, t) {
            return new n(e[4] << 24 | e[5] << 16 | e[6] << 8 | e[7], e[0] << 24 | e[1] << 16 | e[2] << 8 | e[3], t);
        };
    } ], n.c = i, n.d = function(e, t, r) {
        n.o(e, t) || Object.defineProperty(e, t, {
            configurable: !1,
            enumerable: !0,
            get: r
        });
    }, n.n = function(e) {
        var t = e && e.__esModule ? function() {
            return e.default;
        } : function() {
            return e;
        };
        return n.d(t, "a", t), t;
    }, n.o = function(e, t) {
        return Object.prototype.hasOwnProperty.call(e, t);
    }, n.p = "", n(n.s = 0);
    function n(e) {
        if (i[e]) return i[e].exports;
        var t = i[e] = {
            i: e,
            l: !1,
            exports: {}
        };
        return r[e].call(t.exports, t, t.exports, n), t.l = !0, t.exports;
    }
    var r, i;
}), function(t, r) {
    "use strict";
    "object" == typeof exports ? (t.slip = exports, r(exports)) : "function" == typeof define && define.amd ? define([ "exports" ], function(e) {
        return t.slip = e, t.slip, r(e);
    }) : (t.slip = {}, r(t.slip));
}(this, function(e) {
    "use strict";
    var a = e;
    a.END = 192, a.ESC = 219, a.ESC_END = 220, a.ESC_ESC = 221, a.byteArray = function(e, t, r) {
        return e instanceof ArrayBuffer ? new Uint8Array(e, t, r) : e;
    }, a.expandByteArray = function(e) {
        var t = new Uint8Array(2 * e.length);
        return t.set(e), t;
    }, a.sliceByteArray = function(e, t, r) {
        var n = e.buffer.slice ? e.buffer.slice(t, r) : e.subarray(t, r);
        return new Uint8Array(n);
    }, a.encode = function(e, t) {
        (t = t || {}).bufferPadding = t.bufferPadding || 4;
        var r = (e = a.byteArray(e, t.offset, t.byteLength)).length + t.bufferPadding + 3 & -4, n = new Uint8Array(r), i = 1;
        n[0] = a.END;
        for (var s = 0; s < e.length; s++) {
            i > n.length - 3 && (n = a.expandByteArray(n));
            var o = e[s];
            o === a.END ? (n[i++] = a.ESC, o = a.ESC_END) : o === a.ESC && (n[i++] = a.ESC, 
            o = a.ESC_ESC), n[i++] = o;
        }
        return n[i] = a.END, a.sliceByteArray(n, 0, i + 1);
    }, a.Decoder = function(e) {
        e = "function" != typeof e ? e || {} : {
            onMessage: e
        }, this.maxMessageSize = e.maxMessageSize || 10485760, this.bufferSize = e.bufferSize || 1024, 
        this.msgBuffer = new Uint8Array(this.bufferSize), this.msgBufferIdx = 0, this.onMessage = e.onMessage, 
        this.onError = e.onError, this.escape = !1;
    };
    var t = a.Decoder.prototype;
    return t.decode = function(e) {
        var t;
        e = a.byteArray(e);
        for (var r = 0; r < e.length; r++) {
            var n = e[r];
            if (this.escape) n === a.ESC_ESC ? n = a.ESC : n === a.ESC_END && (n = a.END); else {
                if (n === a.ESC) {
                    this.escape = !0;
                    continue;
                }
                if (n === a.END) {
                    t = this.handleEnd();
                    continue;
                }
            }
            this.addByte(n) || this.handleMessageMaxError();
        }
        return t;
    }, t.handleMessageMaxError = function() {
        this.onError && this.onError(this.msgBuffer.subarray(0), "The message is too large; the maximum message size is " + this.maxMessageSize / 1024 + "KB. Use a larger maxMessageSize if necessary."), 
        this.msgBufferIdx = 0, this.escape = !1;
    }, t.addByte = function(e) {
        return this.msgBufferIdx > this.msgBuffer.length - 1 && (this.msgBuffer = a.expandByteArray(this.msgBuffer)), 
        this.msgBuffer[this.msgBufferIdx++] = e, this.escape = !1, this.msgBuffer.length < this.maxMessageSize;
    }, t.handleEnd = function() {
        if (0 !== this.msgBufferIdx) {
            var e = a.sliceByteArray(this.msgBuffer, 0, this.msgBufferIdx);
            return this.onMessage && this.onMessage(e), this.msgBufferIdx = 0, e;
        }
    }, a;
}), function(e) {
    "use strict";
    function t() {}
    var r = t.prototype, n = e.EventEmitter;
    function s(e, t) {
        for (var r = e.length; r--; ) if (e[r].listener === t) return r;
        return -1;
    }
    function i(e) {
        return function() {
            return this[e].apply(this, arguments);
        };
    }
    r.getListeners = function(e) {
        var t, r, n = this._getEvents();
        if (e instanceof RegExp) for (r in t = {}, n) n.hasOwnProperty(r) && e.test(r) && (t[r] = n[r]); else t = n[e] || (n[e] = []);
        return t;
    }, r.flattenListeners = function(e) {
        var t, r = [];
        for (t = 0; t < e.length; t += 1) r.push(e[t].listener);
        return r;
    }, r.getListenersAsObject = function(e) {
        var t, r = this.getListeners(e);
        return r instanceof Array && ((t = {})[e] = r), t || r;
    }, r.addListener = function(e, t) {
        if (!function e(t) {
            return "function" == typeof t || t instanceof RegExp || !(!t || "object" != typeof t) && e(t.listener);
        }(t)) throw new TypeError("listener must be a function");
        var r, n = this.getListenersAsObject(e), i = "object" == typeof t;
        for (r in n) n.hasOwnProperty(r) && -1 === s(n[r], t) && n[r].push(i ? t : {
            listener: t,
            once: !1
        });
        return this;
    }, r.on = i("addListener"), r.addOnceListener = function(e, t) {
        return this.addListener(e, {
            listener: t,
            once: !0
        });
    }, r.once = i("addOnceListener"), r.defineEvent = function(e) {
        return this.getListeners(e), this;
    }, r.defineEvents = function(e) {
        for (var t = 0; t < e.length; t += 1) this.defineEvent(e[t]);
        return this;
    }, r.removeListener = function(e, t) {
        var r, n, i = this.getListenersAsObject(e);
        for (n in i) i.hasOwnProperty(n) && -1 !== (r = s(i[n], t)) && i[n].splice(r, 1);
        return this;
    }, r.off = i("removeListener"), r.addListeners = function(e, t) {
        return this.manipulateListeners(!1, e, t);
    }, r.removeListeners = function(e, t) {
        return this.manipulateListeners(!0, e, t);
    }, r.manipulateListeners = function(e, t, r) {
        var n, i, s = e ? this.removeListener : this.addListener, o = e ? this.removeListeners : this.addListeners;
        if ("object" != typeof t || t instanceof RegExp) for (n = r.length; n--; ) s.call(this, t, r[n]); else for (n in t) t.hasOwnProperty(n) && (i = t[n]) && ("function" == typeof i ? s.call(this, n, i) : o.call(this, n, i));
        return this;
    }, r.removeEvent = function(e) {
        var t, r = typeof e, n = this._getEvents();
        if ("string" == r) delete n[e]; else if (e instanceof RegExp) for (t in n) n.hasOwnProperty(t) && e.test(t) && delete n[t]; else delete this._events;
        return this;
    }, r.removeAllListeners = i("removeEvent"), r.emitEvent = function(e, t) {
        var r, n, i, s, o = this.getListenersAsObject(e);
        for (s in o) if (o.hasOwnProperty(s)) for (r = o[s].slice(0), i = 0; i < r.length; i++) !0 === (n = r[i]).once && this.removeListener(e, n.listener), 
        n.listener.apply(this, t || []) === this._getOnceReturnValue() && this.removeListener(e, n.listener);
        return this;
    }, r.trigger = i("emitEvent"), r.emit = function(e) {
        var t = Array.prototype.slice.call(arguments, 1);
        return this.emitEvent(e, t);
    }, r.setOnceReturnValue = function(e) {
        return this._onceReturnValue = e, this;
    }, r._getOnceReturnValue = function() {
        return !this.hasOwnProperty("_onceReturnValue") || this._onceReturnValue;
    }, r._getEvents = function() {
        return this._events || (this._events = {});
    }, t.noConflict = function() {
        return e.EventEmitter = n, t;
    }, "function" == typeof define && define.amd ? define(function() {
        return t;
    }) : "object" == typeof module && module.exports ? module.exports = t : e.EventEmitter = t;
}("undefined" != typeof window ? window : this || {});

osc = osc || require("./osc.js");

var slip = slip || require("slip"), EventEmitter = EventEmitter || require("events").EventEmitter;

!function() {
    "use strict";
    osc.supportsSerial = !1, osc.firePacketEvents = function(e, t, r, n) {
        t.address ? e.emit("message", t, r, n) : osc.fireBundleEvents(e, t, r, n);
    }, osc.fireBundleEvents = function(e, t, r, n) {
        e.emit("bundle", t, r, n);
        for (var i = 0; i < t.packets.length; i++) {
            var s = t.packets[i];
            osc.firePacketEvents(e, s, t.timeTag, n);
        }
    }, osc.fireClosedPortSendError = function(e, t) {
        t = t || "Can't send packets on a closed osc.Port object. Please open (or reopen) this Port by calling open().", 
        e.emit("error", t);
    }, osc.Port = function(e) {
        this.options = e || {}, this.on("data", this.decodeOSC.bind(this));
    };
    var e = osc.Port.prototype = Object.create(EventEmitter.prototype);
    e.constructor = osc.Port, e.send = function(e) {
        var t = Array.prototype.slice.call(arguments), r = this.encodeOSC(e), n = osc.nativeBuffer(r);
        t[0] = n, this.sendRaw.apply(this, t);
    }, e.encodeOSC = function(e) {
        var t;
        e = e.buffer ? e.buffer : e;
        try {
            t = osc.writePacket(e, this.options);
        } catch (e) {
            this.emit("error", e);
        }
        return t;
    }, e.decodeOSC = function(e, t) {
        e = osc.byteArray(e), this.emit("raw", e, t);
        try {
            var r = osc.readPacket(e, this.options);
            this.emit("osc", r, t), osc.firePacketEvents(this, r, void 0, t);
        } catch (e) {
            this.emit("error", e);
        }
    }, osc.SLIPPort = function(e) {
        var t = this, r = this.options = e || {};
        r.useSLIP = void 0 === r.useSLIP || r.useSLIP, this.decoder = new slip.Decoder({
            onMessage: this.decodeOSC.bind(this),
            onError: function(e) {
                t.emit("error", e);
            }
        });
        var n = r.useSLIP ? this.decodeSLIPData : this.decodeOSC;
        this.on("data", n.bind(this));
    }, (e = osc.SLIPPort.prototype = Object.create(osc.Port.prototype)).constructor = osc.SLIPPort, 
    e.encodeOSC = function(e) {
        var t;
        e = e.buffer ? e.buffer : e;
        try {
            var r = osc.writePacket(e, this.options);
            t = slip.encode(r);
        } catch (e) {
            this.emit("error", e);
        }
        return t;
    }, e.decodeSLIPData = function(e, t) {
        this.decoder.decode(e, t);
    }, osc.relay = function(e, t, r, n, i, s) {
        r = r || "message", n = n || "send", i = i || function() {}, s = s ? [ null ].concat(s) : [];
        function o(e) {
            s[0] = e, e = i(e), t[n].apply(t, s);
        }
        return e.on(r, o), {
            eventName: r,
            listener: o
        };
    }, osc.relayPorts = function(e, t, r) {
        var n = r.raw ? "raw" : "osc", i = r.raw ? "sendRaw" : "send";
        return osc.relay(e, t, n, i, r.transform);
    }, osc.stopRelaying = function(e, t) {
        e.removeListener(t.eventName, t.listener);
    }, osc.Relay = function(e, t, r) {
        (this.options = r || {}).raw = !1, this.port1 = e, this.port2 = t, this.listen();
    }, (e = osc.Relay.prototype = Object.create(EventEmitter.prototype)).constructor = osc.Relay, 
    e.open = function() {
        this.port1.open(), this.port2.open();
    }, e.listen = function() {
        this.port1Spec && this.port2Spec && this.close(), this.port1Spec = osc.relayPorts(this.port1, this.port2, this.options), 
        this.port2Spec = osc.relayPorts(this.port2, this.port1, this.options);
        var e = this.close.bind(this);
        this.port1.on("close", e), this.port2.on("close", e);
    }, e.close = function() {
        osc.stopRelaying(this.port1, this.port1Spec), osc.stopRelaying(this.port2, this.port2Spec), 
        this.emit("close", this.port1, this.port2);
    }, "undefined" != typeof module && module.exports && (module.exports = osc);
}();

osc = osc || require("./osc.js");

!function() {
    "use strict";
    osc.WebSocket = "undefined" != typeof WebSocket ? WebSocket : require("ws"), osc.WebSocketPort = function(e) {
        osc.Port.call(this, e), this.on("open", this.listen.bind(this)), this.socket = e.socket, 
        this.socket && (1 === this.socket.readyState ? (osc.WebSocketPort.setupSocketForBinary(this.socket), 
        this.emit("open", this.socket)) : this.open());
    };
    var e = osc.WebSocketPort.prototype = Object.create(osc.Port.prototype);
    e.constructor = osc.WebSocketPort, e.open = function() {
        (!this.socket || 1 < this.socket.readyState) && (this.socket = new osc.WebSocket(this.options.url)), 
        osc.WebSocketPort.setupSocketForBinary(this.socket);
        var t = this;
        this.socket.onopen = function() {
            t.emit("open", t.socket);
        }, this.socket.onerror = function(e) {
            t.emit("error", e);
        };
    }, e.listen = function() {
        var t = this;
        this.socket.onmessage = function(e) {
            t.emit("data", e.data, e);
        }, this.socket.onclose = function(e) {
            t.emit("close", e);
        }, t.emit("ready");
    }, e.sendRaw = function(e) {
        this.socket && 1 === this.socket.readyState ? this.socket.send(e) : osc.fireClosedPortSendError(this);
    }, e.close = function(e, t) {
        this.socket.close(e, t);
    }, osc.WebSocketPort.setupSocketForBinary = function(e) {
        e.binaryType = osc.isNode ? "nodebuffer" : "arraybuffer";
    };
}();
