var filters = [];
const observe_option_childList = {
    childList: true,
};
const observe_option_subtreeChild = {
    childList: true,
    subtree: true,
};
const observe_option_attributes = {
    attributes: true,
};
const effect_video_list = [];
const observer_items_list = [];
const observer_contents_list = [];
const observer_contents_child_list = [];
const observer_contents_contents_list = [];
const innerTextBlank = { innerText: "" };
const viewed_regexp = /^(viewed)$/i;
const verified_regexp = /^(verified)$/i;
var main_browse = null;
var hidden_continue = 0;
var live_regexp = {
    live: /live|ライブ/i,
    live_now: /live[_\s]?now|ライブ中/i,
    premiere: /premiere|プレミア/i,
    scheduled: /scheduled|公開予定/i,
    streamed: /streamed|配信済み/i,
    premieres: /premieres|プレミア公開/i,
};

function video_filter(video_renderer) {
    var channel_header = document.querySelector(
        `[role="main"] #channel-header-container`
    );
    var channel_name = (
        (channel_header || video_renderer).querySelector("#channel-name") ||
        innerTextBlank
    ).innerText;
    var verified = Boolean(
        (channel_header || video_renderer).querySelector(
            ".badge-style-type-verified"
        )
    );
    var viewed = Boolean(video_renderer.querySelector(`#progress`));
    var title_elm = video_renderer.querySelector("#video-title");
    var title_name = title_elm ? title_elm.innerText : "";
    var meta_elm = video_renderer.querySelector(`#metadata-line`);
    var effect_add = false;
    var hidden = false;

    (filters || []).some((filter) => {
        var fromnot = null;
        var fromnot_and = false;
        var filter_result = (filter.channel || ["all"]).some((a_channel) => {
            if (a_channel.match(/^all$/i)) {
                return true;
            } else {
                return a_channel.split(/\s+/).every((a_channel, i) => {
                    var not = false;
                    a_channel = a_channel.replace(/^[!\-]/, () => {
                        not = true;
                        return "";
                    });
                    var result = false;
                    if (a_channel.match(verified_regexp)) {
                        result = verified;
                    } else {
                        var match_key = a_channel.match(/^\/.+\/\w*$/i)
                            ? eval(a_channel)
                            : a_channel;
                        result = Boolean(channel_name.match(match_key));
                    }
                    if (not) {
                        if (fromnot === null) fromnot = true;
                        fromnot &= !result;
                    } else {
                        if (!fromnot_and) fromnot_and = true;
                        return result;
                    }
                });
            }
        });
        if (fromnot !== null) {
            if (fromnot_and) {
                filter_result = filter_result && Boolean(fromnot);
            } else {
                filter_result = Boolean(fromnot);
            }
        }
        if (filter_result && filter.verified !== undefined) {
            filter_result = verified;
        }
        if (filter_result) {
            fromnot = null;
            fromnot_and = false;
            filter_result = (filter.title || ["all"]).some((a_title) => {
                if (a_title.match(/^all$/i)) {
                    return true;
                } else {
                    return a_title.split(/\s+/).every((a_title) => {
                        var not = false,
                            a_title = a_title.replace(/^[!\-]/, () => {
                                not = true;
                                return "";
                            });
                        var result = false;
                        if (
                            a_title.match(
                                /^(live[_now]*|premieres?|scheduled|streamed)$/i
                            )
                        ) {
                            var value = a_title.toLowerCase();
                            var live_f = value === "live";
                            if (meta_elm) {
                                if (live_f || value === "scheduled") {
                                    result = meta_elm.innerText.match(
                                        live_regexp.scheduled
                                    );
                                }
                                if (
                                    !result &&
                                    (live_f || value === "streamed")
                                ) {
                                    result = meta_elm.innerText.match(
                                        live_regexp.streamed
                                    );
                                }
                                if (!result && value === "premieres") {
                                    result = meta_elm.innerText.match(
                                        live_regexp.premieres
                                    );
                                }
                            }
                            if (!result) {
                                var live_hf = Boolean(value.match(/^live/));
                                if (live_hf || value.match(/^premiere/)) {
                                    var live_now_re = live_hf
                                        ? live_regexp.live
                                        : live_regexp.premiere;
                                    var live_elm = video_renderer.querySelector(
                                        `.badge-style-type-live-now`
                                    );
                                    if (live_elm) {
                                        result = Boolean(
                                            live_elm.innerText.match(
                                                live_now_re
                                            )
                                        );
                                    }
                                }
                            }
                        } else if (a_title.match(viewed_regexp)) {
                            result = viewed;
                        } else {
                            var match_key = a_title.match(/^\/.+\/\w*$/i)
                                ? eval(a_title)
                                : a_title;
                            result = Boolean(title_name.match(match_key));
                        }
                        if (not) {
                            if (fromnot === null) fromnot = true;
                            fromnot &= !result;
                        } else {
                            if (!fromnot_and) fromnot_and = true;
                            return result;
                        }
                    });
                }
            });
            if (fromnot !== null) {
                if (fromnot_and) {
                    filter_result = filter_result && Boolean(fromnot);
                } else {
                    filter_result = Boolean(fromnot);
                }
            }
        }
        if (filter_result && filter.viewed !== undefined) {
            filter_result = viewed;
        }
        if (filter_result) {
            fromnot = null;
            fromnot_and = false;
            filter_result = (filter.url || ["all"]).some((a_url) => {
                if (a_url.match(/^all$/i)) {
                    return true;
                } else {
                    var not = false;
                    a_url = a_url.replace(/^[!\-]/, () => {
                        not = true;
                        return "";
                    });
                    if (a_url.length === 1) {
                        var result = location.pathname === a_url;
                    } else {
                        var result = Boolean(location.pathname.match(a_url));
                    }
                    if (not) {
                        if (fromnot === null) fromnot = true;
                        fromnot &= !result;
                    } else {
                        if (!fromnot_and) fromnot_and = true;
                        return result;
                    }
                }
            });
            if (fromnot !== null) {
                if (fromnot_and) {
                    filter_result = filter_result && Boolean(fromnot);
                } else {
                    filter_result = Boolean(fromnot);
                }
            }
        }
        if (filter_result) {
            (filter.effect || []).some((a_effect) => {
                var a_effect_add = true;
                if (a_effect.match(/^hidden$/i)) {
                    if (hidden_continue++ < 14) {
                        video_renderer.style.display = "none";
                    } else {
                        video_renderer.style.opacity = "0.01";
                        video_renderer.style.pointerEvents = "none";
                    }
                    hidden = true;
                    effect_add = true;
                    return true;
                } else if (hidden && a_effect.match(/^show$/i)) {
                    video_renderer.style.display = "";
                } else if (!hidden) {
                    // 数字だけは透明度、英数字は背景色になる
                    if (a_effect.match(/^[.\d]+/i)) {
                        if (a_effect === ".") {
                            video_renderer.style.opacity = "";
                        } else {
                            video_renderer.style.opacity = a_effect;
                        }
                    } else if (a_effect.match(/^#?\w+/i)) {
                        video_renderer.style.backgroundColor = a_effect;
                    } else if (a_effect === "#") {
                        video_renderer.style.backgroundColor = "";
                    } else {
                        a_effect_add = false;
                    }
                    if (a_effect_add) effect_add = true;
                }
            });
        }
        if (hidden) return true;
    });
    if (effect_add) {
        if (!hidden) hidden_continue = 0;
        effect_video_list.push(video_renderer);
    }
}
const video_check = (video) => {
    if (video.hidden || video.tagName.match(/continuation/i)) return;
    var overlays = video.querySelector(`#overlays`);
    if (overlays && overlays.childElementCount === 0) {
        const observer_items = new MutationObserver((records) => {
            video_filter(video);
            observer_items.disconnect();
        });
        observer_items.observe(overlays, observe_option_childList);
    } else {
        video_filter(video);
    }
};
const add_contents_check = (ytb_contents, hidden_pass = true) => {
    if (hidden_pass && ytb_contents.hidden) return;
    const items =
        ytb_contents.querySelector("#items") ||
        ytb_contents.querySelector("ytd-item-section-renderer > #contents");
    if (items) {
        items.childNodes.forEach((video) => {
            video_check(video);
        });
        const observer_items = new MutationObserver((records) => {
            records.forEach((record) => {
                record.addedNodes.forEach((video) => {
                    video_check(video);
                });
            });
        });
        observer_items_list.push(observer_items);
        observer_items.observe(items, observe_option_childList);
    }
    var video_list;
    if (ytb_contents.tagName === "YTD-VIDEO-RENDERER") {
        video_list = [ytb_contents];
    } else {
        effect_clear(ytb_contents.querySelector("ytd-shelf-renderer[style]"));
        video_list = ytb_contents.querySelectorAll(
            "ytd-grid-video-renderer, ytd-video-renderer, ytd-rich-item-renderer"
        );
        if (video_list.length === 1) {
            video_list = [ytb_contents];
        }
    }
    video_list.forEach((video) => {
        video_check(video);
    });
};
const items_check = (target) => {
    if (!target) return;
    if (target.querySelector("#items")) {
        add_contents_check(target);
        return;
    }
    const observer = new MutationObserver((records) => {
        records.forEach((record) => {
            record.addedNodes.forEach((add) => {
                if (add.id === "items") {
                    add_contents_check(target);
                    observer.disconnect();
                }
            });
        });
    });
    observer_contents_list.push(observer);
    observer.observe(target, observe_option_childList);
};
const effect_clear = (video_renderer = null) => {
    if (video_renderer) {
        video_renderer.style.display = "";
        video_renderer.style.opacity = "";
        video_renderer.style.color = "";
        video_renderer.style.backgroundColor = "";
        video_renderer.style.pointerEvents = "";
    }
};
const effect_clear_all = () => {
    var video_renderer;
    while ((video_renderer = effect_video_list.pop())) {
        effect_clear(video_renderer);
    }
};
const observer_list_remove = (observer_list) => {
    var ob;
    while ((ob = observer_list.pop())) {
        ob.disconnect();
    }
};
const observer_list_all_remove = () => {
    observer_list_remove(observer_contents_list);
    observer_list_remove(observer_contents_child_list);
    observer_list_remove(observer_contents_contents_list);
    observer_list_remove(observer_items_list);
};
const contents_child_check = (contents) => {
    contents
        .querySelectorAll(
            "ytd-item-section-renderer[hidden], ytd-video-renderer[hidden]"
        )
        .forEach((contents_child) => {
            if (!contents_child.hidden) return;
            const observer_contents_child = new MutationObserver((records) => {
                records.forEach((record) => {
                    if (record.attributeName === "hidden") {
                        if (
                            record.target.getAttribute(record.attributeName) ===
                            null
                        ) {
                            observer_contents_child.disconnect();
                            add_contents_check(record.target, false);
                        }
                    }
                });
            });
            observer_contents_child_list.push(observer_contents_child);
            observer_contents_child.observe(
                contents_child,
                observe_option_attributes
            );
        });
};
const contents_check = (contents) => {
    if (!contents) return;
    contents.childNodes.forEach((elm) => {
        add_contents_check(elm);
    });
    const observer_contents = new MutationObserver((records) => {
        records.forEach((record) => {
            record.addedNodes.forEach((add) => {
                add_contents_check(add);
                contents_child_check(add);
            });
        });
    });
    observer_contents_list.push(observer_contents);
    observer_contents.observe(contents, observe_option_childList);
    contents_child_check(contents);

    if (contents.firstElementChild !== null) {
        const child_contents_list =
            contents.firstElementChild.querySelectorAll("#contents");
        child_contents_list.forEach((child_contents) => {
            const observer_contents_contents = new MutationObserver(
                (records) => {
                    records.forEach((record) => {
                        if (record.addedNodes.length > 0) {
                            effect_clear_all();
                            observer_list_all_remove();
                            new Promise(() => {
                                manager_check(main_browse);
                            });
                        }
                    });
                }
            );
            observer_contents_contents.observe(
                child_contents,
                observe_option_childList
            );
            observer_contents_contents_list.push(observer_contents_contents);
        });
    }
};
const manager_check = (main, clear_flag = true) => {
    if (clear_flag) effect_clear_all();
    if (main.getAttribute("role") === "main") {
        main_browse = main;
    }

    var primary = main.querySelector("#primary");
    var contents = primary.querySelector("#contents");
    var i = 0;
    if (contents === null) {
        const observer = new MutationObserver((records) => {
            contents = primary.querySelector("#contents");
            if (contents !== null) {
                observer.disconnect();
                contents_check(contents);
            } else if (++i > 9) {
                observer.disconnect();
            }
        });
        observer.observe(primary, observe_option_subtreeChild);
    } else {
        contents_check(contents);
    }
    items_check(
        document.querySelector("ytd-watch-next-secondary-results-renderer")
    );
    if (main.tagName === "YTD-SEARCH") {
        const section = main.querySelector("ytd-item-section-renderer");
        if (section) {
            const observer_section = new MutationObserver((records) => {
                records.forEach((record) => {
                    if (
                        record.target.getAttribute(record.attributeName) !==
                        null
                    ) {
                        effect_clear_all();
                        observer_list_all_remove();
                        new Promise(() => {
                            manager_check(main_browse);
                        });
                    }
                });
            });
            observer_section.observe(section, observe_option_attributes);
            observer_contents_list.push(observer_section);
        }
    }
};
const ytd_browse_check = (main, clear_flag = true) => {
    switch (main.tagName) {
        case "YTD-BROWSE":
        case "YTD-SEARCH":
        case "YTD-WATCH-FLEXY":
            manager_check(
                main,
                clear_flag && main.tagName !== "YTD-WATCH-FLEXY"
            );
            const observer = new MutationObserver((records) => {
                records.forEach((record) => {
                    if (record.attributeName === "role") {
                        if (
                            record.target.getAttribute(record.attributeName) ===
                            "main"
                        ) {
                            observer_list_all_remove();
                            manager_check(record.target);
                        }
                    }
                });
            });
            observer.observe(main, observe_option_attributes);
            break;
    }
};
const filter_setup = () => {
    var page_manager = document.querySelector("ytd-page-manager");
    page_manager.childNodes.forEach((add) => {
        ytd_browse_check(add, false);
    });
    const observer = new MutationObserver((records) => {
        records.forEach((record) => {
            record.addedNodes.forEach((add) => {
                ytd_browse_check(add);
            });
        });
    });
    observer.observe(page_manager, observe_option_childList);
};
function set_filters(v) {
    filters = v;
    filters.forEach((filter, key) => {
        Object.keys(filter).forEach((k) => {
            switch (k) {
                case "viewed":
                case "verified":
                    break;
                default:
                    if (!Array.isArray(filter[k])) {
                        filters[key][k] = [filter[k]];
                    }
                    break;
            }
        });
    });
}
function main() {
    fetch(chrome.extension.getURL("assets/filters.json"))
        .then((r) => {
            return r.json();
        })
        .then((v) => {
            set_filters(v);
            filter_setup();
        })
        .catch((e) => {
            if (e.message.match(/failed.*fetch/i)) {
                console.log("Please create assets/filters.json");
            } else {
                console.error(e);
            }
        });
}
document.addEventListener("DOMContentLoaded", main, false);
