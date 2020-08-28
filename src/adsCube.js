(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else if (typeof module === "object" && module.exports) {
        module.exports = factory();
    } else {
        root.adsCube = factory();
    }
}(typeof self !== "undefined" ? self : this, function () {
    return (opts, locale) => {
        opts = {
            ...{
                ads: [],
                dir: 0,
                popup: false,
                fullscreen: false,
                responsive: false,
                autoClose: false,
                autoRotate: true,
                popupWait: 10,
                counter: 0,
            },
            ...opts
        };
        locale = {
            ...{
                waitingMessage: "Please wait %s seconds to close...",
                closeMessage: "Click here to close"
            },
            ...locale
        }

        if (!Array.isArray(opts.ads)) {
            opts.ads = []
        }
        opts.ads = opts.ads.filter(v => !!v.src);
        if (opts.ads.length == 0) {
            console.error("[ads-cube] No valid ads defined");
            return;
        }

        let backdrop = document.createElement("div"),
            container = document.createElement("div"),
            cube = document.createElement("div"),
            axis = opts.dir < 2 ? "Y" : "X",
            rDeg = 0,
            ratio = opts.responsive && opts.fullscreen ? 1 : 0.8,
            width = Math.floor(document.body.clientWidth * ratio),
            height = Math.floor(document.body.clientHeight * ratio),
            isDomElem = (x) => {
                return x instanceof Element || x instanceof HTMLElement
            };

        if (opts.responsive && opts.width && opts.height) {
            let min = Math.min(width / opts.width, height / opts.height);
            width = Math.floor(opts.width * min);
            height = Math.floor(opts.height * min);
        } else if (opts.width && opts.height) {
            width = opts.width;
            height = opts.height;
        }

        let distance = (axis == "Y" ? width : height) / 2,
            rotate = (dir) => {
                if (document.hasFocus()) {
                    dir = dir || (opts.dir % 2 == 1 ? 1 : -1);
                    rDeg += 90 * dir;
                    cube.style.transform = `translateZ(-${distance}px) rotate${axis}(${rDeg}deg)`
                }
            },
            getLocale = (...args) => {
                let str = "";
                if (args.length > 0 && args[0] in locale) {
                    str = locale[args[0]];
                    for (let i = 1; i < args.length; i++) {
                        str = str.replace("%s", args[i]);
                    }
                }
                return str;
            };
        backdrop.className = `ads-cube-backdrop ${opts.popup ? "popup" : ""}`;
        container.className = "ads-cube-container";
        container.style.width = width;
        container.style.height = height;
        cube.className = "ads-cube";
        cube.style.transform = `translateZ(-${distance}px)`;

        if (opts.autoRotate) {
            setInterval(rotate, typeof opts.autoRotate === "number" ? opts.autoRotate : 10000);
        }

        if (axis == "Y") {
            cube.rotateLeft = () => rotate(-1);
            cube.rotateRight = () => rotate(1);
        } else {
            cube.rotateUp = () => rotate(1);
            cube.rotateDown = () => rotate(-1);
        }

        while (opts.ads.length < 4) {
            opts.ads = opts.ads.concat(opts.ads).slice(0, 4);
        }
        opts.ads = opts.ads.slice(0, 4);
        opts.ads.map((ad, i) => {
            let side = document.createElement("div");
            side.className = "ads-cube-side";
            if (isDomElem(ad.src)) {
                side.appendChild(ad.src);
            } else {
                side.style.backgroundImage = `url("${ad.src}")`;
            }
            side.style.transform =
                `translate${i % 2 == 0 ? "Z" : axis == "Y" ? "X" : "Y"}(${distance * (i > 1 ? -1 : 1)}px)${i == 0 ? "" : ` rotate${axis}(${i % 2 == 1 ? 90 : -180}deg)`}${(axis == "Y" && i == 3) || (axis == "X" && i == 1) ? ` scale${axis == "Y" ? "X" : "Y"}(-1)` : ""}`;

            if (ad.link) side.onclick = () => window.open(ad.link);
            cube.appendChild(side)
        })

        container.appendChild(cube);
        backdrop.appendChild(container);

        if (opts.popup) {
            let link = document.createElement("a"),
                counter = document.createElement("div"),
                timeout = opts.popupWait || 0,
                interval = 10,
                countdown = (time) => {
                    setTimeout(() => {
                        let rounded = Math.round(time);
                        if (opts.counter) {
                            let ratio = 1 - time / timeout,
                                pts = [
                                    "50% 50%",
                                    "200% 50%",
                                ];
                            if (opts.counter == 3) {
                                counter.querySelector(".bar").style.width = document.body.clientWidth * ratio;
                            } else {
                                if (ratio < 7 / 8) pts.push("100% 0");
                                if (ratio < 5 / 8) pts.push("0 0");
                                if (ratio < 3 / 8) pts.push("0 100%");
                                if (ratio < 1 / 8) pts.push("100% 100%");
                                let x = Math.cos(ratio * 2 * Math.PI) * 150 + 50,
                                    y = Math.sin(ratio * 2 * Math.PI) * 150 + 50;
                                pts.push(`${x}% ${y}%`);
                                counter.querySelector(".ring").style.clipPath = `polygon(${pts.join(",")})`;
                                if (opts.counter == 2) {
                                    counter.querySelector(".display").innerHTML = rounded;
                                }
                            }
                        } else {
                            link.innerHTML = getLocale("waitingMessage", rounded);
                        }
                        if (time >= 0) {
                            countdown(time - interval / 1000);
                        } else {
                            link.innerHTML = getLocale("closeMessage");
                            counter.remove();
                            cube.canClose = true;
                            link.onclick = () => cube.closePopup();
                            if (opts.autoClose) link.click();
                        }
                    }, interval)
                };

            cube.closePopup = () => {
                if (cube.canClose) backdrop.remove()
            };
            link.className = "close";
            link.href = "javascript:void(0)";
            if (opts.counter) {
                let elem = document.createElement("div");
                if (opts.counter == 3) {
                    elem.className = "bar"
                } else {
                    elem.className = "ring";
                    if (opts.counter == 2) {
                        let display = document.createElement("div");
                        display.className = "display";
                        counter.appendChild(display);
                    }
                }
                counter.className = "ads-countdown";
                counter.appendChild(elem);
                backdrop.appendChild(counter);
            }
            countdown(timeout)

            cube.canClose = false;
            backdrop.appendChild(link);
            document.body.appendChild(backdrop);
        } else if (opts.container) {
            let elem;
            if (isDomElem(opts.container)) elem = opts.container;
            else if (typeof opts.container === "string") elem = document.querySelector(opts.container);
            if (elem) elem.appendChild(backdrop);
        }
        return cube;
    };
}));