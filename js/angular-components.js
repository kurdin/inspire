angular.module("w69b.analytics", []).provider("analytics", [
    function () {
        var a;
        this.setTrackingId = function (b) {
            a = b
        }, this.$get = ["$document", "$window",
            function (b, c) {
                var d = {};
                return d.trackPageView = function (a) {
                    d.callInternal(["send", "pageview", a])
                }, d.setEnabled = function (b) {
                    c["ga-disable-" + a] = !b
                }, d.loadLib = function () {
                    ! function (a, b, c, d, e) {
                        a.GoogleAnalyticsObject = e, a[e] = a[e] || function () {
                            (a[e].q = a[e].q || []).push(arguments)
                        }, a[e].l = 1 * new Date
                    }(c, b[0], "script", "https://www.google-analytics.com/analytics.js", "ga"), d.callInternal(["create", a, "auto"]), d.callInternal(["set", "forceSSL", !0])
                }, d.trackEvent = function () {
                    var a = Array.prototype.slice.call(arguments);
                    d.callInternal(["send", "event"].concat(a))
                }, d.sendTiming = function () {
                    var a = Array.prototype.slice.call(arguments);
                    d.callInternal(["send", "timing"].concat(a))
                }, d.callInternal = function (a) {
                    c.ga && c.ga.apply(null, a)
                }, d.trackTimer = function (a, b, c) {
                    var e, f = {};
                    return f.start = function () {
                        return e = (new Date).getTime(), f
                    }, f.send = function (g, h, i) {
                        var j = (new Date).getTime();
                        return d.sendTiming(g || a, h || b, j - e, i || c), f
                    }, f.start(), f
                }, d
            }
        ]
    }
]).directive("analyticsEvent", ["analytics",
    function (a) {
        return {
            restrict: "A",
            link: function (b, c, d) {
                var e = d.analyticsEvent;
                if (!e) throw new Error;
                var f = e.split(",");
                c.bind("click", function () {
                    a.trackEvent.apply(a, f)
                })
            }
        }
    }
]), angular.module("w69b.ngUpload", []).service("$upload", ["$http", "$q",
    function (a, b) {
        function c(c) {
            c.headers = c.headers || {}, c.method = c.method || "POST";
            var d, e = b.defer();
            c.headers.__setXHR_ = function () {
                return function (a) {
                    d = a, d.upload.addEventListener("progress", function (a) {
                        e.notify(a)
                    }, !1), d.upload.addEventListener("load", function (a) {
                        a.lengthComputable && e.notify(a)
                    }, !1)
                }
            }, a(c).then(e.resolve.bind(e), e.reject.bind(e), e.notify.bind(e));
            var f = e.promise;
            return f.abort = function () {
                return d && d.abort(), f
            }, f
        }
        return c
    }
]).config(function () {
    window.XMLHttpRequest = function (a) {
        return function () {
            var b = new a;
            return b.setRequestHeader = function (a) {
                return function (c, d) {
                    "__setXHR_" === c ? d(b) : a.apply(b, arguments)
                }
            }(b.setRequestHeader), b
        }
    }(window.XMLHttpRequest)
}), angular.module("w69b.googleUploader", ["w69b.ngUpload", "w69b.chromeIdentity"]).factory("googleUploader", ["$upload", "$http", "chromeIdentity", "$q", "$timeout", "$log",
    function (a, b, c, d, e) {
        function f(a, b) {
            var c = a.headers("Retry-After");
            if (c) c = Math.min(j, 1e3 * Number(c));
            else {
                if (!b) return d.when(a);
                c = b
            }
            return e(angular.noop, c).then(function () {
                return a
            })
        }

        function g(a, b, c) {
            return b && (404 == c.status || c.status >= 500 && c.status <= 599) ? f(c, 2e3).then(k.resumeUpload.bind(null, a, b)) : d.reject(c)
        }
        var h = "https://www.googleapis.com/upload/youtube/v3/videos",
            i = "https://www.googleapis.com/upload/drive/v2/files?uploadType=resumable",
            j = 6e4,
            k = {};
        return k.getAuthToken = function () {
            return c.getAuthToken({
                interactive: !0
            })
        }, k.resumeUpload = function (c, e) {
            return b.put(e, "", {
                headers: {
                    "Content-Range": "bytes */" + c.size
                },
                googleAuth: !0
            }).then(f, f).then(function (b) {
                if (308 == b.status) {
                    var f, g = b.headers("Range");
                    f = g ? Number(g.match(/bytes=0-(\d+)/)[1]) + 1 : 0;
                    var h = "bytes " + f + "-" + (c.size - 1) + "/" + c.size;
                    return a({
                        url: e,
                        method: "PUT",
                        transformRequest: null,
                        headers: {
                            "Content-Type": "video/*",
                            "Content-Range": h
                        },
                        data: c.slice(f),
                        googleAuth: !0
                    }).then(null, null, function (a) {
                        return {
                            loaded: a.loaded + f,
                            total: c.size
                        }
                    })
                }
                return 200 == b.status ? b : d.reject(b)
            }).
            catch (g.bind(null, c, e))
        }, k.youtubeUpload = function (a, b) {
            b = b || {}, b.privacy || (b.privacy = "public");
            var c = {
                snippet: {
                    title: b.title || a.name,
                    description: b.description || ""
                },
                status: {
                    privacyStatus: b.privacy
                }
            }, d = {
                    params: {
                        part: Object.keys(c).join(","),
                        uploadType: "resumable"
                    }
                };
            return k.upload(h, a, c, d)
        }, k.driveUpload = function (a, b) {
            return k.upload(i, a, b)
        }, k.upload = function (c, e, f, h) {
            var i = null;
            h = angular.copy(h || {}), angular.extend(h.headers || {}, {
                "X-Upload-Content-Length": e.size,
                "X-Upload-Content-Type": "video/*"
            }), h.googleAuth = !0;
            var j = d.defer();
            return b.post(c, f, h).then(function (b) {
                return i = b.headers("Location"), j.notify({
                    uploadUrl: i
                }), a({
                    url: i,
                    method: "PUT",
                    data: e,
                    headers: {
                        "Content-Type": "video/*"
                    },
                    googleAuth: !0
                })
            }).
            catch (function (a) {
                return g(e, i, a)
            }).then(j.resolve.bind(j), j.reject.bind(j), j.notify.bind(j)), j.promise
        }, k
    }
]).config(["$httpProvider",
    function (a) {
        a.interceptors.push("googleHttpAuthInterceptor")
    }
]), angular.module("w69b.pnaclModule", []).factory("pnaclModule", ["$q", "$log",
    function (a, b) {
        function c(c, d) {
            function e() {
                j.addEventListener("crash", g, !0), j.addEventListener("message", h, !0)
            }

            function f() {
                j.removeEventListener("message", h, !0), j.removeEventListener("crash", g, !0)
            }

            function g() {
                b.error("pnacl module crashed", l.lastError), k.onCrash && k.onCrash(l.lastError)
            }

            function h(a) {
                k.onMessage && k.onMessage(a)
            }
            var i = ["<embed ", "width=0 height=0 ", 'src="' + c + '" ', 'ps_tty_prefix="ps:" ps_stdout="/dev/tty" ps_stderr="/dev/tty" type="application/x-nacl" />'].join("");
            d || (d = document.body);
            var j = document.createElement("div"),
                k = {
                    isLoaded: !1
                };
            k.onMessage = void 0, k.onCrash = void 0;
            var l;
            return k.load = function () {
                function b() {
                    j.removeEventListener("load", c, !0), j.removeEventListener("error", f, !0)
                }

                function c() {
                    b(), g.resolve()
                }

                function f() {
                    b(), g.reject(l.lastError)
                }
                if (l) return a.when();
                var g = a.defer();
                return j.addEventListener("load", c, !0), j.addEventListener("error", f, !0), j.addEventListener("message", h, !0), e(), j.innerHTML = i, l = j.children[0], d.appendChild(j), g.promise
            }, k.unload = function () {
                k.isLoaded = !1, f(), j.innerHTML = "", d.removeChild(j), l = null
            }, k.getElement = function () {
                return l
            }, k.postMessage = function (a) {
                if (!l) throw new Error("not loaded");
                l.postMessage(a)
            }, k
        }
        return c
    }
]), angular.module("w69b.streamSampler", ["w69b.pnaclModule", "w69b.streamedVideo"]).factory("streamSampler", ["$q", "$log", "streamedVideo",
    function (a, b, c) {
        return function () {
            function a() {
                o.onFrame && o.onFrame()
            }

            function d(a, b) {
                var c = Math.min(b.height / a.height, b.width / a.width);
                return {
                    width: Math.floor(a.width * c),
                    height: Math.floor(a.height * c)
                }
            }

            function e(a, b) {
                /*if (m.isLoaded()) {
                    var c = m.getVideoElement();
                    a.globalAlpha = .9;
                    var e = .3,
                        f = d({
                            width: c.videoWidth,
                            height: c.videoHeight
                        }, {
                            width: b.width * e,
                            height: b.height * e
                        });
                    a.drawImage(c, b.width - f.width, b.height - f.height, f.width, f.height)
                }*/
            }

            function f() {
                var a = l.getVideoElement();
                if (l.isLoaded()) {
                    var b = a.videoWidth,
                        c = a.videoHeight;
                    (j.width != b || j.height != c) && (j.width = b, j.height = c), k.clearRect(0, 0, b, c), k.globalAlpha = 1, k.drawImage(a, 0, 0, b, c)
                }
                e(k, j)
            }
            var g, h, i, j = document.createElement("canvas"),
                k = j.getContext("2d"),
                l = c(),
                m = c(),
                n = 40,
                o = {};
            return o.onFrame = void 0, o.onStreamEnded = void 0, o.getFrameInterval = function () {
                return n
            }, o.setFrameInterval = function (a) {
                n = a
            }, o.getTargetFPS = function () {
                return 1e3 / n
            }, o.start = function () {
                g = window.setInterval(a, n)
            }, o.loadStream = function (a, b) {
                l.stop();
                var c = l.load(a);
                return l.getVideoElement().volume = b ? 1 : 0, l.onEnded = o.onStreamEnded, c
            }, o.loadCamStream = function (a) {
                return m.stop(), m.load(a)
            }, o.pause = function () {
                window.clearInterval(g)
            }, o.stop = function () {
                window.clearInterval(g), l.stop(), m.stop(), b.info("stopped stream")
            }, o.getWidth = function () {
                return l.getVideoElement().videoWidth
            }, o.getHeight = function () {
                return l.getVideoElement().videoHeight
            }, o.renderPreview = function () {
                if (h) {
                    var a = l.getVideoElement(),
                        b = d({
                            width: a.videoWidth,
                            height: a.videoHeight
                        }, h),
                        c = Math.floor((h.width - b.width) / 2),
                        f = Math.floor((h.height - b.height) / 2);
                    i.save(), i.globalAlpha = 1, i.translate(c, f), i.clearRect(0, 0, h.width, h.height), i.drawImage(a, 0, 0, b.width, b.height), e(i, b), i.restore()
                }
            }, o.setPreviewCanvas = function (a) {
                h = a, i = a ? a.getContext("2d") : null
            }, o.getImageData = function () {
                return f(), k.getImageData(0, 0, j.width, j.height)
            }, o
        }
    }
]), angular.module("w69b.pnaclVideoEncoder", ["w69b.pnaclModule"]).factory("pnaclVideoEncoder", ["pnaclModule", "$q", "$log",
    function (a, b, c) {
        function d() {
            function d(a, b) {
                f.postMessage({
                    type: a,
                    data: b || {}
                })
            }
            var e, f = a("pnacl/manifest.nmf"),
                g = 0,
                h = 2,
                i = 15,
                j = null,
                k = !1,
                l = {};
            return f.onMessage = function (a) {
                if (a = a.data, "processedFrame" == a.type) {
                    var b = a.data;
                    g = e - b
                } else "closed" == a.type ? j && (j.resolve(), j = null) : c.debug(a.trim())
            }, l.onCrash = void 0, f.onCrash = function () {
                l.onCrash && l.onCrash.apply(null, arguments)
            }, l.isOpened = function () {
                return k
            }, l.close = function () {
                return j = b.defer(), d("close"), k = !1, j.promise
            }, l.canProcessFrames = function () {
                return h > g
            }, l.canProcessSlowFrames = function () {
                return i > g
            }, l.addFrame = function (a, b) {
                d("addFrame", {
                    data: a.data.buffer,
                    id: ++e,
                    timestamp: b
                })
            }, l.addAudio = function (a, b) {
                d("addAudio", {
                    dataLeft: a,
                    dataRight: b
                })
            }, l.load = function () {
                return f.load()
            }, l.open = function (a, b, c, f) {
                e = 0, d("open", {
                    filename: "/html5fs/" + a,
                    codec: "libvpx",
                    width: b,
                    height: c,
                    audioSampleRate: f
                }), k = !0
            }, l
        }
        return d
    }
]), angular.module("w69b.streamRecorder", ["w69b.pnaclVideoEncoder", "w69b.streamSampler"]).factory("streamRecorder", ["pnaclVideoEncoder", "streamSampler", "$log", "$timeout", "$q",
    function (a, b, c, d, e) {
        function f() {
            return Math.max(L, u.getFrameInterval() * M)
        }

        function g(a) {
            function b() {
                return null !== d ? d : a() - c
            }
            var c = 0,
                d = null;
            return b.pause = function () {
                d = b()
            }, b.resume = function () {
                if (null === d) throw new Error;
                c = a() - d, d = null
            }, b.isPaused = function () {
                return null !== d
            }, b
        }

        function h() {
            var a = window.performance.now();
            y = g(function () {
                var b = window.performance.now();
                return (b - a) / 1e3
            })
        }

        function i() {
            N.onLowFrameRate && d(function () {
                N.onLowFrameRate && N.onLowFrameRate()
            }, 0, !1)
        }

        function j() {
            N.onAudioDropped && d(function () {
                N.onAudioDropped && N.onAudioDropped(G)
            }, 0, !1)
        }

        function k() {
            q || (q = new webkitAudioContext)
        }

        function l(a) {
            for (c.info("padding with audio silence " + a), G += a * C / q.sampleRate, H || (H = new Float32Array(C)); a--;) t.addAudio(H.buffer, H.buffer), F += C;
            j()
        }

        function m() {
            return Math.ceil(y() * q.sampleRate / C) * C
        }

        function n() {
            y.isPaused() || (c.debug("pauseReal()"), y.pause(), K || u.pause(), J.resolve(), J = null)
        }

        function o(a) {
            k();
            var b = q.currentTime,
                c = q.createMediaStreamSource(a),
                d = q.createScriptProcessor(C, 2, 1);
            window.__webkitIssue82795Hack = d, d.onaudioprocess = function (a) {
                if (F >= D) return p(), void 0;
                if (F >= E) return n(), void 0;
                var b = a.inputBuffer.getChannelData(0).buffer,
                    c = a.inputBuffer.getChannelData(1).buffer;
                F += C;
                var d = y() * q.sampleRate,
                    e = Math.floor((d - F) / C);
                e >= 1 && l(e), t.addAudio(b, c), F >= D && p(), F >= E && n()
            }, c.connect(d), d.connect(q.destination), v.input = c, v.capture = d, y = g(function () {
                return q.currentTime - b
            })
        }

        function p() {
            c.info("closing encoder"), angular.forEach(v, function (a) {
                a.disconnect()
            }), v = {}, D = Number.MAX_VALUE, E = Number.MAX_VALUE, y = null, t.close().then(s.resolve.bind(s), s.reject.bind(s))
        }
        var q, r, s, t = a(),
            u = b(),
            v = {}, w = !1,
            x = !1,
            y = null,
            z = null,
            A = null,
            B = .99,
            C = 16384,
            D = Number.MAX_VALUE,
            E = Number.MAX_VALUE,
            F = 0,
            G = 0,
            H = null,
            I = .6,
            J = null,
            K = !1,
            L = 1e3,
            M = 3,
            N = {};
        return N.onAudioDropped = null, N.onLowFrameRate = null, N.onStreamEnded = null, N.onCrash = null, u.onFrame = function () {
            if (y) {
                if (!y.isPaused()) {
                    var a = 0,
                        b = y();
                    if (null !== A && (a = b - A), !t.canProcessFrames()) {
                        if (1e3 * a < f()) return c.debug("dropping frame"), void 0;
                        if (!t.canProcessSlowFrames()) return c.debug("dropping slow frame"), void 0;
                        c.debug("adding slow frame")
                    }
                    if (a) {
                        var d = 1 / a;
                        if (null === z || 1e-5 > a) z = u.getTargetFPS();
                        else {
                            var e = 1e3 * a / u.getFrameInterval(),
                                g = Math.pow(B, e);
                            z = g * z + (1 - g) * d, z < I * u.getTargetFPS() && i()
                        }
                    }
                    A = b;
                    var h = u.getImageData(),
                        j = Math.round(1e3 * b);
                    t.addFrame(h, j)
                }
                u.renderPreview()
            }
        }, u.onStreamEnded = function () {
            N.onStreamEnded && N.onStreamEnded()
        }, t.onCrash = function () {
            N.onCrash && N.onCrash.apply(null, arguments)
        }, N.getFPS = function () {
            return z
        }, N.setFrameInterval = function (a) {
            u.setFrameInterval(a)
        }, N.setPreviewCanvas = function (a) {
            return K = !! a, N.isPaused() && (K ? u.start() : u.pause()), u.setPreviewCanvas(a)
        }, N.isStarted = function () {
            return w
        }, N.isRecording = function () {
            return x
        }, N.getCurrentTime = function () {
            return x ? y() : 0
        }, N.load = function () {
            return t.load()
        }, N.start = function (a, b, c, d) {
            return w = !0, F = 0, G = 0, r = !! b, u.loadStream(a, d).then(function () {
                var a;
                r ? (k(), a = q.sampleRate) : a = 0, t.open(c, u.getWidth(), u.getHeight(), a)
            }).then(function () {
                r ? o(b) : h(), x = !0, u.start()
            })
        }, N.loadCamStream = function (a) {
            return u.loadCamStream(a)
        }, N.replaceVideoStream = function (a, b) {
            u.loadStream(a, b).then(function () {}).
            catch (function (a) {
                c.error("error replacing video stream"), c.error(a)
            })
        }, N.replaceAudioStream = function (a) {
            v.input.disconnect(), v.input = q.createMediaStreamSource(a), v.input.connect(v.capture)
        }, N.pause = function () {
            var a = e.defer();
            return J = a, r ? (E = m(), c.info("scheduling pausing at " + E)) : n(), a.promise
        }, N.isPaused = function () {
            return y && y.isPaused()
        }, N.resume = function () {
            E = Number.MAX_VALUE, y.resume(), K || u.start()
        }, N.stop = function () {
            if (!w || !x) {
                var a = "recorder not started";
                return c.warn(a), e.reject(a)
            }
            return w = !1, s = e.defer(), x = !1, u.stop(), z = null, A = null, r ? (D = N.isPaused() ? E : m(), c.info("scheduling encoder closing at sample " + D)) : p(), s.promise
        }, N
    }
]), angular.module("w69b.chromeIdentity", ["w69b.promiseTool"]).factory("chromeIdentity", ["promiseTool",
    function (a) {
        var b = {};
        return b.getAuthToken = a.wrapChromeError(chrome.identity.getAuthToken, chrome.identity), b
    }
]).factory("googleHttpAuthInterceptor", ["$q", "chromeIdentity",
    function (a, b) {
        function c(a) {
            return b.getAuthToken({
                interactive: !! a
            })
        }

        function d(a) {
            return {
                Authorization: "Bearer " + a
            }
        }
        return {
            request: function (a) {
                return a.googleAuth ? c().then(function (b) {
                    return a.headers = angular.extend(a.headers || {}, d(b)), a
                }) : a
            }
        }
    }
]), angular.module("w69b.chromeStorage", ["w69b.promiseTool"]).factory("chromeStorage", ["promiseTool",
    function (a) {
        var b = chrome.storage,
            c = {
                local: {},
                sync: {}
            };
        return ["set", "get", "remove", "clear"].forEach(function (d) {
            c.local[d] = a.wrapChromeError(b.local[d], b.local), c.sync[d] = a.wrapChromeError(b.sync[d], b.sync)
        }), ["local", "sync"].forEach(function (a) {
            c[a].setSingle = function (b, d) {
                var e = {};
                return e[b] = d, c[a].set(e)
            }, c[a].getSingle = function (b) {
                return c[a].get(b).then(function (a) {
                    return a[b]
                })
            }
        }), c.addChangeListener = function (a) {
            b.onChanged.addListener(a)
        }, c
    }
]), angular.module("w69b.filesHelper", ["w69b.promiseTool"]).factory("filesHelper", ["$window", "promiseTool", "$q",
    function (a, b, c) {
        a.requestFileSystem = a.requestFileSystem || a.webkitRequestFileSystem;
        var d = {}, e = ["readEntries", "remove", "getFile", "getMetadata", "moveTo", "file"];
        return e.forEach(function (a) {
            d[a] = function (c) {
                var d = [].slice.call(arguments, 1);
                return b.wrapCallbacks(c[a], c).apply(null, d)
            }
        }), d.getFileSystem = function (c, d) {
            return angular.isUndefined(c) && (c = window.PERSISTENT), d = d || 104857600, b.wrapCallbacks(a.requestFileSystem, a)(c, d)
        }, d.getPersistentQuota = function () {
            var b = c.defer();
            return a.navigator.webkitPersistentStorage.queryUsageAndQuota(function (a, c) {
                b.resolve({
                    usage: a,
                    quota: c
                })
            }, function (a) {
                b.reject(a)
            }), b.promise
        }, d
    }
]), angular.module("w69b.chromeRuntime", ["w69b.promiseTool"]).factory("chromeRuntime", ["promiseTool",
    function (a) {
        var b = {};
        return b.sendMessage = a.wrapChromeError(chrome.runtime.sendMessage, chrome.runtime), b.connect = a.wrapChromeError(chrome.runtime.connect, chrome.runtime), b.onMessage = {
            addListener: function (a) {
                chrome.runtime.onMessage.addListener(a)
            },
            removeListener: function (a) {
                chrome.runtime.onMessage.removeListener(a)
            }
        }, b.onConnect = {
            addListener: function (a) {
                chrome.runtime.onConnect.addListener(a)
            },
            removeListener: function (a) {
                chrome.runtime.onConnect.removeListener(a)
            }
        }, b
    }
]), angular.module("w69b.promiseTool", []).factory("promiseTool", ["$q",
    function (a) {
        var b = {};
        return b.wrapChromeError = function (b, c) {
            return function () {
                var d = Array.prototype.slice.call(arguments, 0),
                    e = a.defer();
                return d.push(function (a) {
                    chrome.runtime.lastError ? e.reject(chrome.runtime.lastError) : e.resolve(a)
                }), b.apply(c, d), e.promise
            }
        }, b.wrapCallbacks = function (b, c) {
            return function () {
                var d = Array.prototype.slice.call(arguments, 0),
                    e = a.defer();
                return d.push(e.resolve.bind(e)), d.push(e.reject.bind(e)), b.apply(c, d), e.promise
            }
        }, b
    }
]), angular.module("w69b.chromeCapture", ["w69b.promiseTool", "w69b.webrtc"]).factory("chromeCapture", ["promiseTool", "webrtc",
    function (a, b) {
        var c = {};
        return chrome.tabCapture && (c.tabCapture = a.wrapChromeError(chrome.tabCapture.capture, chrome.tabCapture)), chrome.desktopCapture && (c.chooseDesktopMedia = a.wrapChromeError(chrome.desktopCapture.chooseDesktopMedia, chrome.desktopCapture)), c.desktopCapture = function (a) {
            var c = {
                audio: !1,
                video: {
                    mandatory: {
                        chromeMediaSource: "desktop",
                        chromeMediaSourceId: a,
                        maxWidth: 1920,
                        maxHeight: 1200
                    }
                }
            };
            return b.getUserMedia(c)
        }, c
    }
]), angular.module("w69b.webrtc", ["w69b.promiseTool"]).factory("webrtc", ["promiseTool", "$window",
    function (a, b) {
        var c = {}, d = b.navigator;
        return c.getUserMedia = a.wrapCallbacks(d.getUserMedia || d.webkitGetUserMedia || d.mozGetUserMedia || d.msGetUserMedia, d), c
    }
]), angular.module("w69b.chromeCommands", ["w69b.promiseTool"]).factory("chromeCommands", ["promiseTool",
    function (a) {
        var b = {};
        return; //b.getAll = a.wrapChromeError(chrome.commands.getAll, chrome.commands), b.onCommand = chrome.commands.onCommand, b
    }
]), angular.module("w69b.chromeTabs", ["w69b.promiseTool"]).factory("chromeTabs", ["$window", "promiseTool", "$q",
    function (a, b, c) {
        if (!a.chrome || !a.chrome.tabs) return null;
        var d = a.chrome,
            e = {};
        return e.query = b.wrapChromeError(d.tabs.query, d.tabs), e.getActiveTab = function () {
            return e.query({
                active: !0,
                windowId: d.windows.WINDOW_ID_CURRENT
            }).then(function (a) {
                return a.length ? a[0] : c.reject()
            })
        }, e.create = b.wrapChromeError(d.tabs.create, d.tabs), e.connect = d.tabs.connect.bind(d.tabs), e.executeScript = b.wrapChromeError(d.tabs.executeScript, d.tabs), e.insertCSS = b.wrapChromeError(d.tabs.insertCSS, d.tabs), e.sendMessage = b.wrapChromeError(d.tabs.sendMessage, d.tabs), e.onUpdated = d.tabs.onUpdated, e.onActivated = d.tabs.onActivated, e.sendMessageActive = function (a, b) {
            return e.getActiveTab().then(function (c) {
                return e.sendMessage(c.id, a, b)
            })
        }, e
    }
]).directive("newTab", ["chromeTabs",
    function (a) {
        return {
            restrict: "A",
            link: function (b, c, d) {
                c.bind("click", function (b) {
                    b.preventDefault(), a.create({
                        url: d.href
                    })
                })
            }
        }
    }
]), angular.module("w69b.logging", []).provider("$log", function () {
    var a = !0,
        b = this,
        c = !1;
    this.debugEnabled = function (b) {
        return angular.isDefined(b) ? (a = b, this) : a
    }, this.setCustomHook = function (a) {
        c = a
    }, this.$get = ["$window",
        function (d) {
            function e(a) {
                return a instanceof Error && (a.stack ? a = a.message && -1 === a.stack.indexOf(a.message) ? "Error: " + a.message + "\n" + a.stack : a.stack : a.sourceURL && (a = a.message + "\n" + a.sourceURL + ":" + a.line)), a
            }

            function f(a) {
                var b = d.console || {}, f = b[a] || b.log || angular.noop,
                    g = !1;
                try {
                    g = !! f.apply
                } catch (h) {}
                return g ? function () {
                    var d = [];
                    return angular.forEach(arguments, function (a) {
                        d.push(e(a))
                    }), c && c(a, d) ? f.apply(b, d) : void 0
                } : function (b, d) {
                    c && c(a, [b, d]) && f(b, null === d ? "" : d)
                }
            }
            return {
                log: f("log"),
                info: f("info"),
                warn: f("warn"),
                error: f("error"),
                debug: function () {
                    var c = f("debug");
                    return function () {
                        a && c.apply(b, arguments)
                    }
                }()
            }
        }
    ]
}), angular.module("w69b.streamedVideo", []).factory("streamedVideo", ["$q",
    function (a) {
        return function () {
            function b() {
                g.onEnded && g.onEnded()
            }
            var c, d, e, f = document.createElement("video"),
                g = {
                    onEnded: null
                };
            return g.stop = function () {
                d && (f.pause(), f.src = "", window.URL.revokeObjectURL(c), d.removeEventListener("ended", b), d.stop(), d = null, e = !1)
            }, g.load = function (h) {
                if (d) throw new Error;
                d = h;
                var i = a.defer();
                return h.addEventListener("ended", b), c = window.URL.createObjectURL(h), f.addEventListener("canplay", function j() {
                    f.removeEventListener("canplay", j), f.play(), 0 === f.videoHeight || 0 === f.videoWidth ? (g.stop(), i.reject("loading video failed")) : (e = !0, i.resolve())
                }), f.addEventListener("error", function k() {
                    f.removeEventListener("error", k), g.stop(), i.reject(f.error)
                }), f.src = c, f.volume = 0, i.promise
            }, g.isLoaded = function () {
                return e
            }, g.getVideoElement = function () {
                return f
            }, g
        }
    }
]), angular.module("w69b.chromePersistentLogger", ["w69b.chromeStorage", "w69b.logging", "w69b.structs.CircularBuffer", "w69b.throttle"]).provider("chromePersistentLogger", ["$logProvider",
    function (a) {
        function b(a, b) {
            var d = {
                level: a,
                args: b,
                timestamp: (new Date).getTime()
            };
            return c ? c.add(d) : e.push(d), k(), !0
        }
        var c, d = "logs",
            e = [],
            f = !1,
            g = 1e4,
            h = "logs_",
            i = !1,
            j = !0,
            k = angular.noop;
        this.setStorageKey = function (a) {
            d = a
        }, this.setMaxNumLogs = function (a) {
            g = a
        }, this.enableAutoLoad = function (a) {
            f = a
        }, this.enableAutoSave = function (a) {
            j = a
        }, this.enableGlobalHandler = function (a) {
            i = a
        }, this.install = function () {
            this.enableAutoLoad(!0), a.setCustomHook(b)
        }, this.$get = ["$window", "$q", "chromeStorage", "CircularBuffer", "$log", "throttle",
            function (a, l, m, n, o, p) {
                function q(a) {
                    var b = a.args.map(function (a) {
                        if (!angular.isObject(a)) return a;
                        try {
                            return angular.toJson(a)
                        } catch (b) {
                            return a
                        }
                    });
                    return [new Date(a.timestamp).toISOString(), a.level.toUpperCase(), b.join(", ")].join(" ")
                }

                function r(a) {
                    var b = new n(g);
                    return a.forEach(function (a) {
                        b.add(a)
                    }), b
                }
                var s = {};
                return s.load = function () {
                    return m.local.getSingle(h + d).then(function (a) {
                        a && a.length && (c = r(a.concat(s.getEntries())))
                    })
                }, s.save = function (a) {
                    return m.local.setSingle(h + (a || d), s.getEntries())
                }, s.clear = function () {
                    c.clear()
                }, s.getEntries = function () {
                    return c.getValues()
                }, s.getLogs = function () {
                    return s.getEntries().map(q)
                }, s.getMergedLogs = function (a) {
                    return a = a.map(function (a) {
                        return h + a
                    }), l.all(m.local.get(a)).then(function (a) {
                        var b = [];
                        return angular.forEach(a, function (a, c) {
                            a && a.length && a.forEach(function (a) {
                                a.storageKey = c.substr(h.length), b.push(a)
                            })
                        }), b.sort(function (a, b) {
                            return a.timestamp - b.timestamp
                        }), b.map(function (a) {
                            return "[" + a.storageKey + "] " + q(a)
                        })
                    })
                }, s.hookFn = b, c = r(e), e = null, f && s.load(), i && (a.onerror = function (a, b, c) {
                    o.error("global error", a, b, c)
                }), j && (k = p(s.save, 1e3)), s
            }
        ]
    }
]), angular.module("w69b.structs.CircularBuffer", []).factory("CircularBuffer", function () {
    var a = function (a) {
        this.maxSize_ = a || 100, this.buff_ = []
    }, b = a.prototype;
    return b.nextPtr_ = 0, b.add = function (a) {
        this.buff_[this.nextPtr_] = a, this.nextPtr_ = (this.nextPtr_ + 1) % this.maxSize_
    }, b.get = function (a) {
        return a = this.normalizeIndex_(a), this.buff_[a]
    }, b.set = function (a, b) {
        a = this.normalizeIndex_(a), this.buff_[a] = b
    }, b.getCount = function () {
        return this.buff_.length
    }, b.isEmpty = function () {
        return 0 === this.buff_.length
    }, b.clear = function () {
        this.buff_.length = 0, this.nextPtr_ = 0
    }, b.getValues = function () {
        return this.getNewestValues(this.getCount())
    }, b.getNewestValues = function (a) {
        for (var b = this.getCount(), c = this.getCount() - a, d = [], e = c; b > e; e++) d.push(this.get(e));
        return d
    }, b.getKeys = function () {
        for (var a = [], b = this.getCount(), c = 0; b > c; c++) a[c] = c;
        return a
    }, b.containsKey = function (a) {
        return a < this.getCount()
    }, b.containsValue = function (a) {
        for (var b = this.getCount(), c = 0; b > c; c++)
            if (this.get(c) == a) return !0;
        return !1
    }, b.getLast = function () {
        return 0 === this.getCount() ? null : this.get(this.getCount() - 1)
    }, b.normalizeIndex_ = function (a) {
        if (a >= this.buff_.length) throw Error("Out of bounds exception");
        return this.buff_.length < this.maxSize_ ? a : (this.nextPtr_ + Number(a)) % this.maxSize_
    }, a
}), angular.module("w69b.throttle", []).factory("throttle", ["$timeout",
    function (a) {
        function b(b, c) {
            var d, e, f = function () {
                    var f = angular.copy(arguments, []);
                    e = function () {
                        return d = null, e = null, b.apply(null, f)
                    }, d && a.cancel(d), d = a(e, c)
                };
            return f.flush = function () {
                d && (a.cancel(d), e())
            }, f
        }
        return b
    }
]), angular.module("castly.bgUpload", ["w69b.googleUploader", "w69b.filesHelper", "castly.fileDb", "w69b.chromeStorage", "w69b.chromeRuntime", "w69b.analytics"]).factory("bgUploadService", ["googleUploader", "filesHelper", "fileDb", "chromeStorage", "chromeRuntime", "$log", "analytics", "$q",
    function (a, b, c, d, e, f, g, h) {
        function i(a, b) {
            s[a] = {
                filename: a,
                uploadUrl: b
            }, d.local.setSingle(r, s)
        }

        function j(a) {
            delete s[a], d.local.setSingle(r, s)
        }

        function k(a) {
            return c.getFileEntry(a).then(function (a) {
                return b.file(a)
            })
        }

        function l() {
            angular.forEach(s, function (b) {
                var c = k(b.filename).then(function (c) {
                    return a.resumeUpload(c, b.uploadUrl)
                });
                n(b.filename, c)
            })
        }

        function m(a) {
            if (a && a.data) {
                var b, c = a.data;
                if (c.error && c.error.errors && c.error.errors.length && (b = c.error.errors[0]), b) return b.reason
            }
            return "unknown"
        }

        function n(a, b) {
            function d(b) {
                c.updateInfo(a, {
                    upload: b
                })
            }
            return b.then(function (b) {
                j(a), f.debug(b);
                var d = {
                    upload: {
                        state: "complete"
                    }
                }, e = b.data;
                e.alternateLink ? d.driveInfo = e : d.youtubeInfo = e, c.updateInfo(a, d), g.trackEvent("uploader", "complete")
            }, function (b) {
                j(a), f.error(b);
                var c = m(b);
                d({
                    state: "failed",
                    error: c
                }), g.trackEvent("uploader", "failed", c)
            }, function (b) {
                b.uploadUrl ? i(a, b.uploadUrl) : d({
                    state: "uploading",
                    progress: b.loaded / b.total
                })
            })
        }

        function o(b, c) {
            return "youtube" == c.target ? a.youtubeUpload(b, {
                title: c.title,
                privacy: c.privacy,
                tags: u,
                description: t
            }) : "drive" == c.target ? a.driveUpload(b, c.metadata) : h.reject("unknown upload target " + c.target)
        }

        function p(b) {
            if ("uploader" == b.name) {
                q++, b.onDisconnect.addListener(function () {
                    q--
                });
                var c = {};
                c.upload = function (b) {
                    var c = b.filename;
                    return s[c] ? (f.info("upload already pending " + c), void 0) : (g.trackEvent("uploader", "start", b.target), a.getAuthToken().then(function () {
                            var a = k(c).then(function (a) {
                                return o(a, b)
                            });
                            n(c, a)
                        }).
                        catch (function (a) {
                            f.error("upload error", a);
                            var b = a.message ? a.message : String(a);
                            g.trackEvent("uploader", "error", b)
                        }), void 0)
                }, b.onMessage.addListener(function (a) {
                    c.hasOwnProperty(a.type) && c[a.type](a.data)
                })
            }
        }
        var q, r = "uploadsPending",
            s = null,
            t = "Recorded with ScreenCastify (http://www.screencastify.com), the screen video recorder for Chrome",
            u = ["Screencast", "ScreenCastify"],
            v = {};
        return v.start = function () {
            d.local.getSingle(r).then(function (a) {
                s = a || {}, l(), e.onConnect.addListener(p)
            })
        }, v.stop = function () {
            e.onConnect.removeListener(p)
        }, v.isBusy = function () {
            return q > 0 || Object.keys(s).length > 0
        }, v.STORAGE_KEY = r, v
    }
]), angular.module("castly.bgRecord", ["w69b.streamRecorder", "w69b.webrtc", "w69b.chromeCapture", "w69b.chromeTabs", "castly.tabMouse", "castly.fileDb", "w69b.analytics", "castly.appOptions", "castly.recordTool", "castly.fileNameGenerator", "w69b.chromeCommands", "w69b.chromeStorage"]).factory("bgRecordService", ["streamRecorder", "$rootScope", "webrtc", "$timeout", "chromeCapture", "$q", "$log", "chromeRuntime", "chromeTabs", "$window", "createTabMouse", "analytics", "appOptions", "recordTool", "fileNameGenerator", "$location", "chromeCommands", "fileDb", "chromeStorage",
    function (a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s) {
        function t(a) {
            return {
                path: {
                    19: "img/" + a + "19.png",
                    38: "img/" + a + "38.png"
                }
            }
        }

        function u(a) {
            function b() {
                var a = {
                    audio: !1,
                    video: {
                        mandatory: {
                            chromeMediaSource: "screen",
                            maxWidth: d.width,
                            maxHeight: d.height
                        }
                    }
                };
                return g && (a.audio = {
                    mandatory: {
                        chromeMediaSource: "system"
                    }
                }), c.getUserMedia(a).
                catch (function () {
                    return f.reject("webrtcScreenRejected")
                })
            }
            var d = a.resolution,
                g = "tab" == a.audio;
            if ("desktop" == a.captureSource) return e.chooseDesktopMedia ? e.chooseDesktopMedia(["screen", "window"]).then(function (a) {
                var b = {
                    audio: !1,
                    video: {
                        mandatory: {
                            chromeMediaSource: "desktop",
                            chromeMediaSourceId: a,
                            maxWidth: d.width,
                            maxHeight: d.height,
                            maxFrameRate: 25
                        }
                    }
                };
                return g && (b.audio = {
                    mandatory: {
                        chromeMediaSource: "system"
                    }
                }), c.getUserMedia(b)
            }).
            catch (function (a) {
                return a && angular.isString(a.message) && a.message.indexOf("not yet implemented") >= 0 ? b() : f.reject(a)
            }): b();
            var h = {
                video: !0,
                videoConstraints: {
                    mandatory: {
                        maxWidth: d.width,
                        maxHeight: d.height,
                        maxFrameRate: 25
                    }
                },
                audio: g
            };
            return e.tabCapture(h)
        }

        function v(a, b) {
            P && P.postMessage({
                type: a,
                data: b
            })
        }

        function w() {
            var b;
            b = a.isPaused() ? "icon_paused" : a.isStarted() ? "icon_recording" : "icon", chrome.browserAction.setIcon(t(b))
        }

        function x() {
            if (P || R) {
                var b = {};
                if (a.isStarted()) {
                    for (var c in M) M.hasOwnProperty(c) && (b[c] = M[c]);
                    b.state = a.isRecording() ? "recording" : "initializing", b.isPaused = a.isPaused(), b.fps = a.getFPS(), b.currentTime = a.getCurrentTime(), b.previewShown = !! R
                } else b.state = S ? "closing" : "idle";
                P && v("stateUpdate", b), R && R.clUpdateState && R.clUpdateState(b)
            }
        }

        function y() {
            a.isRecording() && (g.debug("stopping recording"), J(), S = !0, a.stop().
                finally(function () {
                    S = !1, x(), w(), r.updateInfo(M.filename, {
                        isRecording: !1
                    })
                }), N && (N.dispose(), N = null), E(), x(), w(), O.send(), l.trackEvent("recorder", "control", "stop"))
        }

        function z() {
            a.isStarted() && (g.debug("pausing"), a.pause().then(function () {
                x(), w()
            }), l.trackEvent("recorder", "control", "pause"))
        }

        function A() {
            a.isPaused() && (g.debug("resuming"), a.resume(), x(), w(), l.trackEvent("recorder", "control", "resume"))
        }

        function B(b) {
            function c() {
                return b.filename ? f.when() : o().then(function (a) {
                    b.filename = a
                })
            }
            g.debug("start recording", b), b.mouse = b.mouse || {
                enable: !0
            }, b.targetFPS = b.targetFPS || 25, M = b;
            var d, e = "tab" == b.audio;
            l.trackEvent("recorder", "control", "start"), l.trackEvent("recorder", "resolution", b.resolution.width + "x" + b.resolution.height), l.trackEvent("recorder", "audio", b.audio), l.trackEvent("recorder", "captureSource", b.captureSource), l.trackEvent("recorder", "targetFPS", b.targetFPS), O = l.trackTimer("recorder", "duration"), F(), a.setFrameInterval(1e3 / b.targetFPS);
            var h = null;
            f.all([T, c()]).then(function () {
                return g.debug("getting video stream"), u(b)
            }).then(function (a) {
                d = a
            }, function (a) {
                return g.warn("could not get video stream"), f.reject(a)
            }).then(function () {
                return "mic" == b.audio ? L(b.embedWebcam) : null
            }).then(function (c) {
                return c ? h = c : e && (h = d), c && b.embedWebcam ? a.loadCamStream(c) : f.when()
            }).then(function () {
                var c = a.start(d, h, b.filename, e && "tab" == b.captureSource);
                return "tab" == b.captureSource && b.mouse.enable && (N = k(b.tabId), N.setMouse(b.mouse)), x(), c
            }).then(function () {
                g.debug("recording started"), r.updateInfo(b.filename, {
                    isRecording: !0
                }), s.local.setSingle("dirtyFile", b.filename), x(), w()
            }).
            catch (function (a) {
                g.error(a), d && (d.stop(), d = null), "webrtcScreenRejected" === a ? v("streamRejected", a) : (v("startRecordingError", a), l.trackEvent("recorder", "startRecordingError", a))
            })
        }

        function C(b) {
            if (g.debug("replacing stream", b), !a.isStarted()) return g.error("cannot replace tab while not recording"), void 0;
            chrome.notifications.clear("activeTab", angular.noop), l.trackEvent("recorder", "control", "replaceStream");
            var c = angular.extend({}, M, b),
                d = "tab" == c.audio;
            u(c).then(function (b) {
                M = c, N && (N.dispose(), N = k(c.tabId), N.setMouse(c.mouse)), d && a.replaceAudioStream(b), a.replaceVideoStream(b, d)
            }, function (a) {
                g.warn("could not get replacement stream"), g.warn(a)
            })
        }

        function D(a) {
            if ("recorder" == a.name) {
                P = a, a.onDisconnect.addListener(function () {
                    P === a && (P = null)
                });
                var c = {
                    getState: x,
                    startRecording: B,
                    stopRecording: y,
                    replaceStream: C,
                    pause: z,
                    resume: A,
                    showPreview: function (a) {
                        a ? K() : J(), x()
                    }
                };
                a.onMessage.addListener(function (a) {
                    c.hasOwnProperty(a.type) && c[a.type](a.data), b.$$phase || b.$digest()
                })
            }
        }

        function E() {
            chrome.notifications.clear("audioDropped", angular.noop), chrome.notifications.clear("lowFrameRate", angular.noop), chrome.notifications.clear("activeTab", angular.noop)
        }

        function F() {
            a.onLowFrameRate = function () {
                if (l.trackEvent("recorder", "notify", "framerate"), m.values.notifyFramerate) {
                    var b = {
                        type: "basic",
                        priority: 1,
                        title: "Dropping Video Frames",
                        message: "The recording frame rate dropped below " + M.targetFPS + " FPS. Reducing the frame rate or recording resolution setting can help to improvereliablity.",
                        iconUrl: "images/icon128.png"
                    };
                    chrome.notifications.create("lowFrameRate", b, angular.noop)
                }
                a.onLowFrameRate = null
            }, a.onAudioDropped = function (b) {
                if (!(1 > b)) {
                    if (l.trackEvent("recorder", "notify", "audio"), m.values.notifyAudio) {
                        var c = {
                            type: "basic",
                            priority: 2,
                            title: "Dropping Audio Frames",
                            message: "Your system is too busy to record audio reliably. Audio of your recording will be choppy. Try to restart recording with a lower resolution or frame rate. If you don't care about audio, you can ignore this warning.",
                            iconUrl: "images/icon128.png"
                        };
                        chrome.notifications.create("audioDropped", c, angular.noop)
                    }
                    a.onAudioDropped = null
                }
            }
        }

        function G(b) {
            if ("toggle-recording" == b) {
                if (S) return;
                a.isStarted() ? y() : f.all({
                    tab: i.getActiveTab(),
                    config: n.getRecordConfig()
                }).then(function (a) {
                    var b = a.config;
                    b.tabId = a.tab.id, b.windowId = a.tab.windowId, b.tabTitle = a.tab.title, b.resolution = "tab" == b.captureSource ? n.scaleResolution(a.tab, b.maxResolution) : b.maxResolution, B(b)
                })
            } else if ("toggle-pause" == b) {
                if (!a.isStarted()) return;
                a.isPaused() ? A() : z()
            } else if ("focus-tab" == b) {
                if (!a.isStarted() || !M || "tab" !== M.captureSource) return;
                i.getActiveTab().then(function (a) {
                    M.tabId != a.id && C({
                        tabId: a.id,
                        windowId: a.windowId,
                        tabTitle: a.title
                    })
                })
            }
        }

        function H(b) {
            a.isRecording() && !a.isPaused() && m.values.notifyTabFocus && "tab" == M.captureSource && b.windowId == M.windowId && (b.tabId != M.tabId ? (g.debug("recording tab lost focus"), q.getAll().then(function (a) {
                for (var b = 0; b < a.length; ++b)
                    if ("focus-tab" == a[b].name) return a[b];
                return null
            }).then(function (a) {
                var b = "Screencastify is recording a tab in the background. Use the extension icon to switch the record focus to your current tab.";
                a && a.shortcut && (b += " You can also use the keyboard shortcut " + a.shortcut + ".");
                var c = {
                    type: "basic",
                    priority: 2,
                    title: "Recording a background tab",
                    message: b,
                    iconUrl: "images/icon128.png"
                };
                chrome.notifications.create("activeTab", c, angular.noop)
            })) : (g.debug("recording tab got focus"), chrome.notifications.clear("activeTab", angular.noop)))
        }

        function I() {
            s.local.getSingle("dirtyFile").then(function (a) {
                a && (g.info("cleaning up dirty file info"), r.updateInfo(a, {
                    isRecording: !1
                }), s.local.remove("dirtyFile"))
            })
        }

        function J() {
            R = null, Q && chrome.windows.remove(Q), x()
        }

        function K() {
            if (!R) {
                g.debug("opening preview window");
                var b = j.open("app.html#livepreview", "preview", "width=426,height=240");
                if (!b) return g.debug("could not open preview window"), void 0;
                R = b, b.clSetPreviewCanvas = function (b) {
                    a.setPreviewCanvas(b)
                }, b.clSetWindowId = function (a) {
                    Q = a
                }, b.clRecorderDirectApi = {
                    pause: z,
                    resume: A,
                    getState: x
                }, chrome.windows.onRemoved.addListener(function c(b) {
                    Q == b && (chrome.windows.onRemoved.removeListener(c), g.debug("closed preview window"), a.setPreviewCanvas(null), Q = null, R = null, x())
                })
            }
        }

        function L(a) {
            function b() {
                return c.getUserMedia({
                    audio: !0,
                    video: a
                })
            }
            return b().
            catch (function () {
                var a = f.defer(),
                    c = j.open("mic.html", "mic", "");
                return c.clGotStream = function () {
                    a.resolve(b())
                }, a.promise
            })
        }
        var M, N, O, P, Q, R, S = !1;
        a.onCrash = function () {
            l.trackEvent("recorder", "notify", "crash");
            var a = {
                type: "basic",
                priority: 1,
                title: "Encoder crashed",
                message: "Oups, the video encoder crashed. This should not have happened. Please submit a bug report.",
                iconUrl: "images/icon128.png"
            };
            chrome.notifications.create("crash", a, angular.noop), g.debug("force unloading extension..."), j.loadEventPage()
        };
        var T = a.load();
        a.onStreamEnded = function () {
            l.trackEvent("recorder", "notify", "streamEnded");
            var a = {
                type: "basic",
                priority: 1,
                title: "Your recording has stopped forcefully",
                message: "If it was your intention to stop recording, you can safely ignore this warning.",
                iconUrl: "images/icon128.png"
            };
            chrome.notifications.create("", a, angular.noop), y()
        }, T.
        catch (function () {
            g.warn("failed to load encoder module"), l.trackEvent("recorder", "notify", "crash");
            var a = {
                type: "basic",
                priority: 1,
                title: "Could not load encoder module",
                message: "This should not have happened. Please submit a bug report and describe your system configuration.",
                iconUrl: "images/icon128.png"
            };
            chrome.notifications.create("nacl", a, angular.noop), l.trackEvent("recorder", "notify", "nacl")
        });
        var U = {};
        return U.start = function () {
            w(), I(), /*h.onConnect.addListener(D)*/D(), /*chrome.commands.onCommand.addListener(G),*/ i.onActivated.addListener(H);
            var a = p.search();
            a.cmd && (G(a.cmd), p.search("cmd"))
        }, U.stop = function () {
            /*h.onConnect.removeListener(D),*/ /*chrome.commands.onCommand.removeListener(G),*/ i.onActivated.addListener(H)
        }, U.isBusy = function () {
            return S || a.isStarted() || P
        }, U
    }
]), angular.module("castly.fileDb", ["w69b.chromeStorage", "w69b.filesHelper"]).factory("fileDb", ["$rootScope", "chromeStorage", "$q", "filesHelper", "$log",
    function (a, b, c, d, e) {
        function f(a) {
            return n + a
        }

        function g(a) {
            return 0 === a.lastIndexOf(n, 0) ? a.substr(n.length) : null
        }

        function h() {
            d.getFileSystem().then(function (a) {
                var b = a.root.createReader();
                return d.readEntries(b)
            }).then(function (a) {
                var b = {};
                return a.forEach(function (a) {
                    b[a.name] = k.getFileDescriptor(a)
                }), c.all(b)
            }).then(function (a) {
                j = a
            }).
            catch (function (a) {
                e.warn(a)
            })
        }

        function i(a, b) {
            if (b || (b = {}), !b.title) {
                var c = a.lastIndexOf("."),
                    d = a;
                c > 0 && (d = a.substring(0, c)), b.title = "Screencast " + d
            }
            return b
        }
        var j, k = {}, l = b.local,
            m = d.getFileSystem(),
            n = "filedb_";
        return a.$watch("[recorder.currentTime, recorder.state]", function () {
            var b = a.recorder;
            if (j && b) {
                var c = j[b.filename];
                c ? k.getFileEntry(c.name).then(function (a) {
                    d.getMetadata(a).then(function (a) {
                        c.metadata = a
                    })
                }) : h()
            }
        }, !0), k.getFileEntry = function (a) {
            return m.then(function (b) {
                return d.getFile(b.root, a, {})
            }).
            catch (function (a) {
                return e.warn(a), c.reject(a)
            })
        }, k.listFiles = function () {
            return j || (j = {}, h()), j
        }, k.getFileDescriptor = function (a) {
            return c.all({
                name: a.name,
                url: a.toURL(),
                metadata: d.getMetadata(a),
                info: k.getInfo(a.name)
            })
        }, k.rename = function (a, b) {
            return k.updateInfo(a, {
                title: b
            })
        }, k.remove = function (a) {
            return k.getFileEntry(a).then(function (a) {
                return d.remove(a)
            }).then(function () {
                return j && delete j[a], l.remove(f(a))
            })
        }, k.getInfo = function (a) {
            var b = f(a);
            return l.getSingle(b).then(function (b) {
                return i(a, b)
            })
        }, k.updateInfo = function (a, b, d) {
            var e, g = f(a);
            return e = d ? c.when(b) : l.get(g).then(function (a) {
                return angular.extend(a[g] || {}, b)
            }), e.then(function (a) {
                var b = {};
                return b[g] = a, l.set(b), a
            })
        }, b.addChangeListener(function (a, b) {
            "local" == b && j && angular.forEach(a, function (a, b) {
                var c = g(b);
                c && j.hasOwnProperty(c) && (j[c].info = i(c, a.newValue))
            })
        }), k
    }
]), angular.module("castly.tabMouse", ["w69b.chromeTabs"]).factory("createTabMouse", ["chromeTabs", "$q", "$log",
    function (a, b, c) {
        function d(d) {
            function e() {
                return b.all([a.insertCSS(d, {
                    file: "styles/contentScript.css",
                    allFrames: !0
                }), a.executeScript(d, {
                    file: "scripts/contentScript.js",
                    allFrames: !0
                })])
            }

            function f() {
                return k || (k = e().then(function () {
                        return j = a.connect(d, {
                            name: "content"
                        }), j.onDisconnect.addListener(function () {
                            k = null
                        }), j.onMessage.addListener(function (a) {
                            o.hasOwnProperty(a.type) && o[a.type](j, a.data)
                        }), j
                    }), k.
                    catch (function (a) {
                        c.error(a)
                    })), k
            }

            function g(a) {
                a.tabId == d && l && (j && j.disconnect(), k = null, i("setMouse", l))
            }

            function h() {
                f(), chrome.webNavigation.onDOMContentLoaded.addListener(g)
            }

            function i(a, b) {
                f().then(function (c) {
                    c.postMessage({
                        type: a,
                        data: b
                    })
                })
            }
            var j, k, l, m, n = {}, o = {};
            return o.mousePosition = function (a, b) {
                if (m !== b.frameId) {
                    m = b.frameId;
                    try {
                        a.postMessage({
                            type: "frameGotMouse",
                            data: b.frameId
                        })
                    } catch (c) {}
                }
            }, n.setMouse = function (a) {
                l = a, i("setMouse", a)
            }, n.dispose = function () {
                i("dispose"), l = null, chrome.webNavigation.onDOMContentLoaded.removeListener(g)
            }, h(), n
        }
        return d
    }
]), angular.module("castly.appOptions", ["w69b.chromeStorage"]).factory("appOptions", ["chromeStorage", "$rootScope",
    function (a, b) {
        var c = {
            notifyAudio: !0,
            notifyFramerate: !1,
            notifyTabFocus: !0,
            youtubePrivate: !1
        }, d = !1,
            e = {};
        return e.values = angular.copy(c), a.sync.getSingle("options").then(function (a) {
            angular.extend(e.values, a), d = !0
        }), e.save = function () {
            return a.sync.setSingle("options", e.values)
        }, e.isLoaded = function () {
            return d
        }, a.addChangeListener(function (a, c) {
            "sync" == c && a.options && (angular.extend(e.values, a.options.newValue), b.$$phase || b.$digest())
        }), e
    }
]), angular.module("castly.recordTool", []).factory("recordTool", ["chromeStorage", "$window",
    function (a, b) {
        function c() {
            return b.navigator.userAgent
        }

        function d() {
            return c().indexOf("CrOS arm") >= 0
        }

        function e() {
            return c().indexOf("CrOS x86_64") >= 0
        }

        function f() {
            return d() ? 1 : e() ? 10 : 10
        }

        function g() {
            return d() ? {
                width: 854,
                height: 480
            } : {
                width: 1280,
                height: 720
            }
        }
        var h = {};
        return h.scaleResolution = function (a, b) {
            var c = Math.min(b.height / a.height, b.width / a.width, 1);
            return {
                width: Math.floor(a.width * c),
                height: Math.floor(a.height * c)
            }
        }, h.getRecordConfig = function () {
            return a.local.getSingle("recordConfig").then(function (a) {
                return a = a || {}, a.maxResolution = a.maxResolution || g(), a.audio = a.audio || "mic", a.mouse = a.mouse || {
                    enable: !0
                }, a.embedWebcam = a.embedWebcam || !1, a.captureSource = a.captureSource || "tab", a.targetFPS = a.targetFPS || f(), a
            })
        }, h
    }
]), angular.module("castly.fileNameGenerator", ["w69b.filesHelper"]).factory("fileNameGenerator", ["localStore", "filesHelper",
    function (a, b) {
        function c() {
            var b = Number(a.recordingsCount || 0) + 1;
            return a.recordingsCount = b, b
        }

        function d() {
            return f + c() + ".webm"
        }

        function e(a) {
            var c = d();
            return b.getFile(a, c, {}).then(function () {
                return e(a)
            }, function () {
                return c
            })
        }
        var f = "";
        return function () {
            return b.getFileSystem().then(function (a) {
                return e(a.root)
            })
        }
    }
]).factory("localStore", ["$window",
    function (a) {
        return a.localStorage
    }
]), angular.module("castly.bgApp", ["castly.bgRecord", "castly.bgUpload", "w69b.chromePersistentLogger"]).config(["analyticsProvider", "$locationProvider", "chromePersistentLoggerProvider",
    function (a, b, c) {
        a.setTrackingId("UA-23874345-14"), b.html5Mode(!0), c.setStorageKey("background"), c.enableGlobalHandler(!0), c.enableAutoSave(!1), c.install()
    }
]).run(["bgRecordService", "bgUploadService", "analytics", "$log", "chromePersistentLogger",
    function (a, b, c, d, e) {
        function f() {
            d.debug("loading event page"), e.save().then(function () {
                window.location.href = "eventpage.html"
            })
        }

        function g() {
            a.isBusy() || b.isBusy() ? h = 0 : ++h > 1 && f()
        }
        var h = 0;
        window.loadEventPage = f, a.start(), b.start(), chrome.runtime.sendMessage("backgroundLoaded"), window.setInterval(g, 1e4), chrome.runtime.onMessage.addListener(function (a, b, c) {
            if ("loadBackground" === a) chrome.runtime.sendMessage("backgroundLoaded");
            else {
                if ("flushLogs" === a) return e.save().then(function () {
                    c(!0)
                }), !0;
                if (angular.isObject(a) && "download" === a.type) {
                    var d = a.data,
                        f = angular.element("<a></a>"),
                        g = d.info.title.replace(/[\/,\\]/g, "");
                    /\.webm$/i.test(g) || (g += ".webm"), f.attr("href", d.url), f.attr("download", g), f[0].dispatchEvent(new MouseEvent("click")), c(!0)
                }
            }
            return !1
        }), c.loadLib(), c.trackPageView("/background")
    }
]);