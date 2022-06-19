const title_default = "Filters Edit";
const idi = "fs";
var rewrite_flag = false;
var title_elm = document.querySelector("title");
const ul = document.querySelector("#editArea > ul");
var toast_elm = document.querySelector("#toast");

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
    (async () => {
        if (time === null) {
            toast_elm.style.setProperty("--toast-time", "");
        } else {
            toast_elm.style.setProperty("--toast-time", time);
        }
        toast_elm.innerHTML = `<span>${message}</span>`;
        toast_elm.classList.add("runToast");
    })();
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
function elemOlLi(obj_value = "") {
    var li = document.createElement("li");
    var lin = document.createElement("input");
    lin.value = obj_value;
    lin.classList.add("value");
    lin.onchange = (e) => {
        rewriteUpdate(true);
    };
    li.appendChild(lin);
    var minus = document.createElement("input");
    minus.type = "button";
    minus.classList.add("minus");
    minus.value = "－";
    minus.onclick = (e) => {
        rewriteUpdate(true);
        li.remove();
    };
    li.appendChild(minus);
    return li;
}
function elemUlLi(obj = {}) {
    var li = document.createElement("li");
    var close = document.createElement("div");
    close.classList.add("button", "close");
    close.innerText = "✕";
    close.onclick = (e) => {
        rewriteUpdate(true);
        li.remove();
    };
    li.appendChild(close);
    var moveUp = document.createElement("div");
    moveUp.classList.add("button", "move", "up");
    moveUp.onclick = (e) => {
        rewriteUpdate(true);
        var list = [].slice.call(li.parentElement.children);
        li.parentElement.insertBefore(li, list[list.indexOf(li) - 1]);
    };
    li.appendChild(moveUp);
    var moveDown = document.createElement("div");
    moveDown.classList.add("button", "move", "down");
    moveDown.onclick = (e) => {
        rewriteUpdate(true);
        var list = [].slice.call(li.parentElement.children);
        li.parentElement.insertBefore(
            li,
            list[list.indexOf(li) + 1].nextSibling
        );
    };
    li.appendChild(moveDown);
    ["channel", "title", "url", "effect"].forEach((key) => {
        var cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.key = key;
        var ctext = document.createElement("div");
        ctext.innerText = `${key.replace(/^\w/, ($0) => {
            return $0.toUpperCase();
        })}`;
        cell.appendChild(ctext);
        var ol = document.createElement("ol");
        var obj_list = obj[key] ? obj[key] : [];
        if (typeof obj_list !== "object") obj_list = [obj_list];
        obj_list.forEach((obj_value) => {
            ol.appendChild(elemOlLi(obj_value));
        });
        cell.appendChild(ol);
        var plus = document.createElement("input");
        plus.type = "button";
        plus.value = "＋";
        plus.onclick = (e) => {
            rewriteUpdate(true);
            ol.appendChild(elemOlLi());
        };
        cell.appendChild(plus);
        li.appendChild(cell);
    });
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
    ul.appendChild(elemUlLi());
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

document.querySelector("#save").addEventListener("click", funcSave);
document.querySelector("#export").addEventListener("click", funcExport);
document.querySelector("#import").addEventListener("click", funcImport);
document.querySelector("#delete").addEventListener("click", funcDelete);
document.querySelector("#sample").addEventListener("click", funcSample);
