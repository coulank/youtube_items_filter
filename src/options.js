const title_default = "Filters Edit";
const idi = "fs";
var rewrite_flag = false;
const css_check_elm = document.getElementById("css-check");
function toHex(v, dig = 0) {
    v = parseInt(Number(v)).toString(16);
    return dig > 0 ? ("0".repeat(dig) + v).slice(-dig) : v;
}
function colorToObject(args) {
    var color =
        args.color || args.alpha || (typeof args === "object" ? "" : args);
    if (isNaN(color) || Number(color) > 1) {
        if (args.alpha) {
            color =
                colorToObject(color).rgb +
                (args.alpha < 1 ? toHex(Number(args.alpha) * 256, 2) : "");
        }
        css_check_elm.style.color = "";
        css_check_elm.style.color = color;
        var propColor =
            getComputedStyle(css_check_elm).getPropertyValue("color");
        var m = propColor.match(/^\D+(\d+)\D+(\d+)\D+(\d+)\D+([\d.]+|)(\D+|)$/);
        var hex = `#${toHex(m[1], 2)}${toHex(m[2], 2)}${toHex(m[3], 2)}`;
        var unique =
            !color.match(/^(#|rgb)/) &&
            (hex !== "#ffffff" || (hex === "#ffffff" && color === "white"))
                ? color
                : "";
        return {
            type: "color",
            color: propColor,
            alpha: m[4],
            rgb: hex,
            rgba: hex + (m[4] === "" ? "ff" : toHex(Number(m[4]) * 256, 2)),
            unique: unique,
        };
    } else {
        return {
            type: "alpha",
            color: `rgba(0, 0, 0, ${color})`,
            alpha: color,
            rgb: "#000000",
            rgba: `#000000${toHex(Number(color) * 256, 2)}`,
            unique: "",
        };
    }
}
var title_elm = document.querySelector("title");
const ul = document.querySelector("#editArea > ul");
var toast_elm = document.getElementById("toast");
var ytb_preview_elm = document.getElementById("ytb_preview");
var undo = null;
const ef_menu_elm = document.getElementById("effect-menu");
const ef_menu_form = ef_menu_elm.querySelector("form");
function syncColor(args = {}) {
    var color_obj = {};
    var lins =
        args.lins ||
        document.querySelectorAll(`[data-key="effect"] li.target input.value`);
    if (lins.length > 0) {
        var color_args = {};
        if (ef_menu_form.enable_color.checked)
            color_args.color = ef_menu_form.color_text.value;
        if (ef_menu_form.enable_alpha.checked)
            color_args.alpha = ef_menu_form.alpha.value;
        color_obj = colorToObject(color_args);
        var result;
        switch (color_obj.type) {
            case "color":
                result =
                    color_obj.alpha != ""
                        ? color_obj.rgba
                        : color_obj.unique || color_obj.rgb;
                break;
            case "alpha":
                result = color_obj.alpha;
                break;
        }
        lins.forEach((lin) => {
            lin.value = result;
            lin.onchange();
        });
    }
    return color_obj;
}
ef_menu_form.effect_type.onchange = (e, linSync = true) => {
    var lins = document.querySelectorAll(
        `[data-key="effect"] li.target input.value`
    );
    var value = ef_menu_form.effect_type.value;
    var result = value;
    var alpha_color = document.getElementById("alpha-color");
    switch (value) {
        case "color":
            if (lins.length > 0) {
                var lin = lins[0];
                switch (lin.value) {
                    case "hidden":
                    case "hidden_title":
                    case "hidden_channel":
                        break;
                    default:
                        var color_obj = colorToObject(lin.value);
                        if (color_obj.type !== "alpha") {
                            ef_menu_form.color_text.value =
                                color_obj.unique || color_obj.rgb;
                            ef_menu_form.color.value = color_obj.rgb;
                        }
                        ef_menu_form.alpha.value = color_obj.alpha;
                        ef_menu_form.alpha_range.value = color_obj.alpha;
                        ef_menu_form.enable_color.checked =
                            color_obj.type !== "alpha";
                        ef_menu_form.enable_color.onchange();
                        ef_menu_form.enable_alpha.checked =
                            color_obj.type !== "color" || color_obj.alpha != "";
                        ef_menu_form.enable_alpha.onchange();
                        break;
                }
            }
            if (linSync) syncColor({ lins: lins });
            linSync = false;
            alpha_color.classList.remove("disable");
            break;
        default:
            alpha_color.classList.add("disable");
            break;
    }
    if (linSync) {
        lins.forEach((lin) => {
            lin.value = result;
            lin.onchange();
        });
    }
};
ef_menu_form.enable_color.onchange = () => {
    var color_form = document.getElementById("color-form");
    if (ef_menu_form.enable_color.checked) {
        color_form.classList.remove("disable");
    } else {
        color_form.classList.add("disable");
    }
    syncColor();
};
ef_menu_form.enable_alpha.onchange = () => {
    var alpha_form = document.getElementById("alpha-form");
    if (ef_menu_form.enable_alpha.checked) {
        alpha_form.classList.remove("disable");
    } else {
        alpha_form.classList.add("disable");
    }
    syncColor();
};
ef_menu_form.color_text.onchange = () => {
    var color_obj = syncColor();
    if (color_obj.rgb) {
        ef_menu_form.color.value = color_obj.rgb;
    }
};
ef_menu_form.color.onchange = () => {
    ef_menu_form.color_text.value = ef_menu_form.color.value;
    ef_menu_form.color_text.onchange();
};
ef_menu_form.alpha_range.onchange = () => {
    ef_menu_form.alpha.value = ef_menu_form.alpha_range.value;
    ef_menu_form.alpha.onchange();
};
ef_menu_form.alpha.onchange = () => {
    syncColor();
    ef_menu_form.alpha_range.value = ef_menu_form.alpha.value;
};
function efmExit() {
    document.querySelectorAll(`[data-key="effect"] li.target`).forEach((li) => {
        li.querySelectorAll(".pulldown").forEach((pulldown) => {
            pulldown.value = "▽";
        });
        li.classList.remove("target");
    });
    if (ef_menu_elm.classList.contains("show")) {
        ef_menu_elm.classList.remove("show");
        return true;
    } else {
        return false;
    }
}
ef_menu_elm.querySelector(".blur").onclick = () => {
    efmExit();
};

const yif_json = "yif_json";
function csGet(key, func, notfunc = () => {}) {
    chrome.storage.sync.get(key, (e) => {
        if (typeof e[key] === "string") {
            func(e[key], key);
        } else {
            notfunc();
        }
    });
}

function UlLiToList() {
    var list = [];
    document.querySelectorAll("#editArea > ul > li").forEach((li) => {
        var a_obj = {};
        li.querySelectorAll("div.cell[data-key]").forEach((cell) => {
            var a_list = [];
            cell.querySelectorAll("ol li input.value").forEach((lin) => {
                if (lin.value != "") {
                    a_list.push(lin.value);
                }
            });
            if (a_list.length > 0) {
                a_obj[cell.dataset.key] = a_list;
            }
        });
        if (Object.keys(a_obj).length > 0) {
            list.push(a_obj);
        }
    });
    return list;
}
function setToast(message = "", time = null) {
    toast_elm.classList.remove("runToast");
    toast_elm.innerHTML = `<div>${message}</div>`;
    setTimeout(() => {
        if (time === null) {
            toast_elm.style.setProperty("--toast-time", "");
        } else {
            toast_elm.style.setProperty("--toast-time", time);
        }
        toast_elm.classList.add("runToast");
    });
    return toast_elm;
}
function _funcSave(obj) {
    if (obj.length > 0) {
        chrome.storage.sync.set({ [yif_json]: JSON.stringify(obj) });
    } else {
        chrome.storage.sync.remove(yif_json);
    }
    setToast("Saved!");
    rewriteUpdate(false);
}
function funcSave() {
    _funcSave(UlLiToList());
}
function funcImport() {
    if (BeforeCloseEvent()) {
        var f = document.getElementById(idi);
        if (f !== null) {
            f.remove();
        }
        f = document.createElement("input");
        f.id = idi;
        f.type = "file";
        f.accept = ".json";
        f.addEventListener("change", (e) => {
            var file = e.target.files[0];
            var rd = new FileReader();
            var ec = "UTF-8";
            rd.readAsText(file, ec);
            rd.onload = (e) => {
                funcEditUpdate(JSON.parse(rd.result));
            };
        });
        document.head.appendChild(f);
        f.click();
    }
}
function funcExport() {
    var sn = "filters.json";
    var text = JSON.stringify(UlLiToList(), null, 4);
    var b = new Blob([text], { type: "text/plane" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = sn;
    a.click();
}
function updatePreview(ulLi) {
    if (ulLi === null) return;
    var preview_plm = ulLi.querySelector(".preview");
    preview_plm.innerHTML = ytb_preview_elm.innerHTML;
    var preview = preview_plm.querySelector("svg");
    var effects = ulLi.querySelectorAll(
        `[data-key="effect"] ol li input.value`
    );
    effects.forEach((e) => {
        var value = e.value;
        if (value.match(/^hidden/i)) {
            switch (value.toLowerCase()) {
                case "hidden":
                    preview.style.display = "none";
                    break;
                case "hidden_title":
                    preview.querySelector(".title").style.visibility = "hidden";
                    break;
                case "hidden_channel":
                    preview.querySelector(".channel").style.visibility =
                        "hidden";
                    break;
            }
        } else if (value.match(/^show$/i)) {
            preview.style.display = "";
        } else if (value.match(/^[\d.]*\.?[\d.]$/)) {
            preview.style.opacity = value;
        } else {
            preview.style.backgroundColor = value;
        }
    });
}
function getNum(str) {
    var m = str.match(/([\d.]+|)/);
    if (m) {
        return Number(str.match(/[\d.]+/)[0]);
    } else {
        return 0;
    }
}
function getCssMilSec(elem, prop) {
    return Number(
        window
            .getComputedStyle(elem)
            .getPropertyValue(prop)
            .replace(/([\d.]+)(\w+)/, ($0, $1, $2) => {
                return Number($1) * ($2 === "s" ? 1000 : 1);
            })
    );
}
function elemOlLi(args = {}) {
    var li = document.createElement("li");
    var lin = document.createElement("input");
    var key = args.key || "";
    var ulLi = args.ulLi || null;
    lin.value = args.value || "";
    lin.classList.add("value");
    lin.onchange = () => {
        rewriteUpdate(true);
        if (key === "effect") {
            updatePreview(ulLi);
        }
    };
    li.appendChild(lin);
    if (key === "effect") {
        var pulldown = document.createElement("input");
        pulldown.type = "button";
        pulldown.classList.add("pulldown");
        pulldown.value = "▽";
        pulldown.onclick = (e) => {
            if (li.classList.contains("target")) {
                efmExit();
            } else {
                li.appendChild(ef_menu_elm);
                pulldown.value = "△";
                li.classList.add("target");
                switch (lin.value.toLowerCase()) {
                    case "hidden":
                    case "hidden_title":
                    case "hidden_channel":
                        ef_menu_form.effect_type.value = lin.value;
                        break;
                    default:
                        ef_menu_form.effect_type.value = "color";
                        break;
                }
                ef_menu_form.effect_type.onchange({}, false);
                ef_menu_elm.classList.add("show");
            }
        };
        li.appendChild(pulldown);
    }
    var minus = document.createElement("input");
    minus.type = "button";
    minus.classList.add("minus");
    minus.value = "－";
    minus.onclick = (e) => {
        rewriteUpdate(true);
        li.remove();
        if (key === "effect") {
            updatePreview(ulLi);
        }
    };
    li.appendChild(minus);
    return li;
}
function elemUlLi(obj = {}) {
    var li = document.createElement("li");
    var close = document.createElement("div");
    close.classList.add("absolute", "button", "close");
    close.innerText = "✕";
    close.onclick = (e) => {
        undo = UlLiToList();
        setToast(`<div>Deleted.</div><a href="">Undo</a>`, "5s");
        toast_elm.querySelector("a").onclick = () => {
            funcEditUpdate(undo);
            toast_elm.classList.remove("runToast");
            return false;
        };
        rewriteUpdate(true);
        li.classList.add("remove");
        setTimeout(() => {
            li.remove();
        }, getCssMilSec(li, "--remove-time"));
    };
    li.appendChild(close);
    var moveUp = document.createElement("div");
    moveUp.classList.add("absolute", "button", "move", "up");
    moveUp.onclick = (e) => {
        rewriteUpdate(true);
        var y = scrollY;
        var list = [].slice.call(li.parentElement.children);
        var li_before = list[list.indexOf(li) - 1];
        li.classList.add("swap");
        li_before.classList.add("swap");
        var li_ofs_y = li.offsetTop;
        var li_before_ofs_y = li_before.offsetTop;
        li.after(li_before);
        var dammy_li = li.cloneNode(true);
        var dammy_li_before = li_before.cloneNode(true);
        dammy_li.classList.add("dammy");
        dammy_li_before.classList.add("dammy");
        li.before(dammy_li);
        dammy_li.before(dammy_li_before);
        dammy_li.style.transform = `translateY(${
            li_ofs_y - li_before_ofs_y
        }px)`;
        scrollTo({ top: y });
        setTimeout(() => {
            dammy_li.style.transform = `translateY(0px)`;
            dammy_li_before.style.transform = `translateY(${
                li_before.offsetTop - li_before_ofs_y
            }px)`;
            setTimeout(() => {
                li.classList.remove("swap");
                li_before.classList.remove("swap");
                dammy_li.remove();
                dammy_li_before.remove();
            }, getCssMilSec(dammy_li, "--swap-time"));
        });
    };
    li.appendChild(moveUp);
    var moveDown = document.createElement("div");
    moveDown.classList.add("absolute", "button", "move", "down");
    moveDown.onclick = (e) => {
        rewriteUpdate(true);
        var y = scrollY;
        var list = [].slice.call(li.parentElement.children);
        var li_after = list[list.indexOf(li) + 1];
        li.classList.add("swap");
        li_after.classList.add("swap");
        var li_ofs_y = li.offsetTop;
        var li_after_ofs_y = li_after.offsetTop;
        li.before(li_after);
        var dammy_li = li.cloneNode(true);
        var dammy_li_after = li_after.cloneNode(true);
        dammy_li.classList.add("dammy");
        dammy_li_after.classList.add("dammy");
        li_after.before(dammy_li);
        dammy_li.after(dammy_li_after);
        dammy_li_after.style.transform = `translateY(${
            li_after_ofs_y - li_ofs_y
        }px)`;
        scrollTo({ top: y });
        setTimeout(() => {
            dammy_li_after.style.transform = `translateY(0px)`;
            dammy_li.style.transform = `translateY(${
                li.offsetTop - li_ofs_y
            }px)`;
            setTimeout(() => {
                li.classList.remove("swap");
                li_after.classList.remove("swap");
                dammy_li.remove();
                dammy_li_after.remove();
            }, getCssMilSec(dammy_li, "--swap-time"));
        });
    };
    li.appendChild(moveDown);
    var preview = document.createElement("div");
    preview.classList.add("absolute", "preview");
    preview.innerHTML = ytb_preview_elm.innerHTML;
    li.appendChild(preview);
    ["channel", "title", "url", "effect"].forEach((key) => {
        var cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.key = key;
        var ctext = document.createElement("div");
        switch (key) {
            case "url":
                ctext.innerText = key.toUpperCase();
                break;
            default:
                ctext.innerText = `${key.replace(/^\w/, ($0) => {
                    return $0.toUpperCase();
                })}`;
                break;
        }
        cell.appendChild(ctext);
        var ol = document.createElement("ol");
        var obj_list = obj[key] ? obj[key] : [];
        if (typeof obj_list !== "object") obj_list = [obj_list];
        obj_list.forEach((obj_value) => {
            ol.appendChild(elemOlLi({ value: obj_value, key: key, ulLi: li }));
        });
        cell.appendChild(ol);
        var plus = document.createElement("input");
        plus.type = "button";
        plus.value = "＋";
        plus.onclick = (e) => {
            rewriteUpdate(true);
            ol.appendChild(elemOlLi({ key: key, ulLi: li }));
        };
        cell.appendChild(plus);
        li.appendChild(cell);
    });
    updatePreview(li);
    return li;
}
function funcEditUpdate(json = null) {
    ul.innerHTML = "";
    if (json === null) {
        rewriteUpdate(false);
        csGet(yif_json, (v) => {
            JSON.parse(v).forEach((obj) => {
                ul.appendChild(elemUlLi(obj));
            });
        });
    } else {
        rewriteUpdate(true);
        json.forEach((obj) => {
            ul.appendChild(elemUlLi(obj));
        });
    }
}
var plus_ul = document.createElement("input");
plus_ul.type = "button";
plus_ul.value = "＋";
plus_ul.classList.add("ulLiAdd");
plus_ul.onclick = (e) => {
    rewriteUpdate(true);
    var li = elemUlLi();
    var li_style = getComputedStyle(li);
    ul.appendChild(li);
    smoothScroll({
        type: "scrollBy",
        top:
            li.scrollHeight +
            getNum(li_style.marginTop) +
            getNum(li_style.marginBottom),
    });
};
ul.parentElement.appendChild(plus_ul);
funcEditUpdate();

function titleUpdate(ast = true) {
    title_elm.innerText = `${ast ? "*" : ""}${title_default}`;
}
function rewriteUpdate(ast = true) {
    rewrite_flag = ast;
    titleUpdate(ast);
}
function BeforeCloseEvent() {
    if (!rewrite_flag || confirm("Don't save, continue?")) {
        return true;
    }
    return false;
}
window.onbeforeunload = (e) => {
    if (rewrite_flag) return true;
};
function funcDelete() {
    if (confirm("Run delete, really?")) {
        funcEditUpdate([]);
    }
}
function funcSample() {
    if (confirm("Run load sample, really?")) {
        fetch("resources/filters-sample.json")
            .then((r) => r.json())
            .then((data) => {
                funcEditUpdate(data);
            });
    }
}
document.body.onkeydown = (e) => {
    if (e.ctrlKey && !e.altKey && !e.shiftKey) {
        switch (e.code) {
            case "KeyS":
                funcSave();
                return false;
            case "KeyO":
                funcImport();
                return false;
        }
    } else if (e.code === "Escape" && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        return !efmExit();
    }
};

document.getElementById("save").addEventListener("click", funcSave);
document.getElementById("save-button").addEventListener("click", funcSave);
document.getElementById("export").addEventListener("click", funcExport);
document.getElementById("import").addEventListener("click", funcImport);
document.getElementById("delete").addEventListener("click", funcDelete);
document.getElementById("sample").addEventListener("click", funcSample);
function smoothScroll(scroll) {
    document.firstChild.classList.add("smooth");
    setTimeout(() => {
        switch ((scroll.type || "").toLowerCase()) {
            case "scrollby":
                window.scrollBy(scroll);
                break;
            default:
                window.scrollTo(scroll);
                break;
        }
        setTimeout(() => {
            document.firstChild.classList.remove("smooth");
        });
    });
}
const to_top = document.getElementById("to-top");
to_top.addEventListener("click", function (evt) {
    smoothScroll({ top: 0 });
});
document.addEventListener("scroll", () => {
    if (scrollY > 500) {
        to_top.classList.add("show");
    } else {
        to_top.classList.remove("show");
    }
});
