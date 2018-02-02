// ==UserScript==
// @name Popup Blocker by AdGuard (Dev)
// @name:tr AdGuard Popup Blocker (Dev)
// @name:ko Popup Blocker by AdGuard (Dev)
// @name:ja Popup Blocker by AdGuard (Dev)
// @name:sk AdGuard blokovač vyskakovacích okien (Dev)
// @name:id Popup Blocker by AdGuard (Dev)
// @name:pt-BR AdGuard Bloqueador de Pop-up (Dev)
// @name:fr Bloqueur de popup de AdGuard (Dev)
// @name:uk Блокувальник спливаючої реклами AdGuard (Dev)
// @name:zh-TW AdGuard 彈出式視窗封鎖器 (Dev)
// @name:nl Popup Blocker by AdGuard (Dev)
// @name:de Adguard Popup-Blocker (Dev)
// @name:da AdGuard Popup Blocker (Dev)
// @name:pt-PT Popup Blocker by AdGuard (Dev)
// @name:it Blocco Pop-Up di AdGuard (Dev)
// @name:es-419 Popup Blocker by AdGuard (Dev)
// @name:ru Блокировщик всплывающей рекламы AdGuard (Dev)
// @name:ar Popup Blocker by AdGuard (Dev)
// @name:sr-Latn Koristi AdGuard-ov blokator iskačućih prozora (Dev)
// @name:zh-CN 使用 AdGuard 弹窗拦截器 (Dev)
// @name:sv Popup Blocker by AdGuard (Dev)
// @name:pl Bloker wyskakujących okienek (Dev)
// @name:mk-MK Popup Blocker by AdGuard (Dev)
// @name:no Popup Blocker by AdGuard (Dev)
// @namespace AdGuard
// @description Blocks popup ads on web pages
// @description:tr Web sayfalarında açılan pencere reklamları engeller
// @description:ko 웹 페이지의 팝업 광고를 차단합니다.
// @description:ja Blocks popup ads on web pages
// @description:sk Blokuje vyskakovacie reklamy na webových stránkach
// @description:id Blocks popup ads on web pages
// @description:pt-BR Bloqueia anúncios em pop-up dentro dos sites
// @description:fr Bloque les publicités intrusives sur les pages web
// @description:uk Блокує спливаючу рекламу на веб-сторінках
// @description:zh-TW 封鎖於網頁上之彈出式視窗廣告
// @description:nl Blocks popup ads on web pages
// @description:de Blockiert Anzeige-Popups auf Webseiten
// @description:da Blokerer pop op-reklamer på websider
// @description:pt-PT Blocks popup ads on web pages
// @description:it Blocca gli annunci di popup nelle pagine internet
// @description:es-419 Blocks popup ads on web pages
// @description:ru Блокирует всплывающую рекламу на страницах
// @description:ar Blocks popup ads on web pages
// @description:sr-Latn Blokira iskačuće reklame na veb stranicama
// @description:zh-CN 拦截网页弹窗广告
// @description:sv Blocks popup ads on web pages
// @description:pl Blokuje wyskakujące okienka z reklamami na stronach internetowych
// @description:mk-MK Blocks popup ads on web pages
// @description:no Blocks popup ads on web pages
// @version 2.2.1
// @license LGPL-3.0; https://github.com/AdguardTeam/PopupBlocker/blob/master/LICENSE
// @downloadURL https://AdguardTeam.github.io/PopupBlocker/popupblocker.user.js
// @updateURL https://AdguardTeam.github.io/PopupBlocker/popupblocker.meta.js
// @supportURL https://github.com/AdguardTeam/PopupBlocker/issues
// @homepageURL https://github.com/AdguardTeam/PopupBlocker
// @match http://*/*
// @match https://*/*
// @grant GM_getValue
// @grant GM_setValue
// @grant unsafeWindow
// @run-at document-start
// ==/UserScript==
(function () {
var entityMap = {
    '&': 'amp;',
    '<': 'lt;',
    '>': 'gt;',
    '"': 'quot;',
    "'": '#39;',
    '/': '#x2F;',
    '`': '#x60;',
    '=': '#x3D;'
};
function toHtmlSafeString(str) {
    return str.replace(/[&<>"'`=\/]/g, function (s) { return ('&' + entityMap[s]); });
}
var I18nService = /** @class */ (function () {
    function I18nService($getMessage) {
        this.$getMessage = $getMessage;
    }
    I18nService.prototype.parseMessage = function (message, context) {
        var res = [];
        var text = '';
        var match;
        var ind, i;
        while (message) {
            match = I18nService.rePhStart.exec(message);
            if (!match) {
                text += message;
                if (text) {
                    res.push(text);
                }
                return res;
            }
            else {
                ind = match.index;
                text += message.substr(0, ind);
                ind += 2;
                if (match[0].charCodeAt(0) === 36 /* $ */) {
                    i = message.indexOf('}', ind);
                    var messageId = message.slice(ind, i);
                    var rep = context[messageId];
                    if (rep) {
                        text += rep;
                    }
                    message = message.slice(i + 1);
                }
                else {
                    i = message.indexOf('}}', ind);
                    if (text) {
                        res.push(text);
                    }
                    text = '';
                    var num = message.charCodeAt(ind) - 48; // parseInt(*, 10)
                    res.push(num);
                    message = message.slice(i + 2);
                }
            }
        }
        if (text) {
            res.push(text);
        }
        return res;
    };
    I18nService.prototype.formatText = function (message, context, htmlSafe) {
        for (var contextId in context) {
            var toBeReplacedWith = context[contextId];
            if (htmlSafe) {
                toBeReplacedWith = toHtmlSafeString(toBeReplacedWith);
            }
            message = message.replace(new RegExp("\\$\\{" + contextId + "\\}"), toBeReplacedWith);
        }
        return message;
    };
    I18nService.prototype.applyTranslation = function (root, context) {
        var nodeIterator = document.createNodeIterator(root, 128 /* NodeFilter.SHOW_COMMENT */, null, false);
        var current;
        var val;
        // If DOM order is modified during iteration, 
        // NodeIterator may skip some nodes,
        // so we do a batch process.
        var tasks = [];
        while (current = nodeIterator.nextNode()) {
            val = current.nodeValue;
            if (I18nService.reCommentPh.test(val)) {
                val = val.slice(5);
                var message = this.$getMessage(val);
                var parsed = this.parseMessage(message, context);
                var pr = current.parentNode;
                tasks.push(new InsertTask(pr, current, parsed.map(function (el) {
                    if (typeof el == 'number') {
                        return nthElemSib(current, el);
                    }
                    else {
                        return document.createTextNode(el);
                    }
                })));
            }
        }
        for (var i = 0, l = tasks.length; i < l; i++) {
            tasks[i].insert();
        }
    };
    /**
     * ${variableName} is a string reference.
     * {{0_help_link}} is a html node reference.
     */
    I18nService.rePhStart = /(?:\${|{{)/;
    I18nService.reCommentPh = /^i18n:/;
    return I18nService;
}());
var InsertTask = /** @class */ (function () {
    function InsertTask(pr, before, toInsert) {
        this.pr = pr;
        this.before = before;
        this.toInsert = toInsert;
    }
    InsertTask.prototype.insert = function () {
        for (var i = 0, l = this.toInsert.length; i < l; i++) {
            this.pr.insertBefore(this.toInsert[i], this.before);
        }
        this.pr.removeChild(this.before);
    };
    return InsertTask;
}());
function nthElemSib(node, index) {
    var el = node;
    while (index >= 0) {
        // Edge and old browsers does not support `nextElementSibling` property on non-Element Nodes.
        el = el.nextSibling;
        if (el.nodeType === Node.ELEMENT_NODE) {
            index--;
        }
    }
    return el;
}

var reCommonProtocol = /^http/;
/**
 * Parses a url and returns 3 strings.
 * The first string is a `displayUrl`, which will be used to show as
 * a shortened url. The second string is a `canonicalUrl`, which is used to match against whitelist data in storage.
 * The third string is a full absolute url.
 */
var createUrl = function (href) {
    href = convertToString(href);
    var location = createLocation(href);
    var displayUrl, canonicalUrl;
    var protocol = location.protocol;
    if (reCommonProtocol.test(protocol)) {
        displayUrl = location.href.slice(protocol.length + 2);
        canonicalUrl = location.hostname;
    }
    else {
        displayUrl = href;
        var i = href.indexOf(',');
        canonicalUrl = i === -1 ? href : href.slice(0, i);
    }
    return [displayUrl, canonicalUrl, location.href];
};
/**
 * There are certain browser quirks regarding how they treat non-string values
 * provided as arguments of `window.open`, and we can't rely on third-party scripts
 * playing nicely with it.
 * undefined --> 'about:blank'
 * null --> 'about:blank', except for Firefox, in which it is converted to 'null'.
 * false --> 'about:blank', except for Edge, in which it is converted to 'false'.
 * These behaviors are different from how anchor tag's href attributes behaves with non-string values.
 */
var convertToString = function (href) {
    if (typeof href !== 'string') {
        if (href instanceof Object) {
            href = String(href);
        }
        else {
            href = '';
        }
    }
    return href;
};
/**
 * Creates an object that implements properties of Location api.
 */
var createLocation = function (href) {
    var anchor = document.createElement('a');
    anchor.href = href;
    // https://gist.github.com/disnet/289f113e368f1bfb06f3
    if (anchor.host == "") {
        anchor.href = anchor.href;
    }
    return anchor;
};

var FULL_ALERT_TIMEOUT = 2000;
var COLLAPSED_ALERT_TIMEOUT = 5000;
var MAX_ALERT_NUM = 4;
var px = 'px';
var initialAlertFrameStyle = {
    "position": "fixed",
    "right": 10 /* right_offset */ + px,
    "top": 10 /* top_offset */ + px,
    "border": "none",
    "opacity": "0",
    "z-index": String(-1 - (1 << 31)),
    "transform": "translate3d(0,0,0)",
    "transition": "opacity 200ms,top 200ms",
    "transitionTimingFunction": "cubic-bezier(0.86,0,0.07,1),cubic-bezier(0.645,0.045,0.355,1)"
};
function attachClickListenerForEach(iterable, listener) {
    var l = iterable.length;
    while (l-- > 0) {
        iterable[l].addEventListener('click', listener);
    }
}
var Alert = /** @class */ (function () {
    function Alert(orig_domain, popup_url, i18nService, storageManager) {
        var _this = this;
        this.i18nService = i18nService;
        var iframe = document.createElement('iframe');
        var loaded = false;
        // Prepare innerHTML
        var url = createUrl(popup_url);
        var localizationContext = Object.create(null);
        localizationContext['displayUrl'] = url[0];
        localizationContext['domain'] = url[1];
        localizationContext['href'] = popup_url;
        localizationContext['parent'] = orig_domain;
        var _innerHTML = i18nService.formatText("<!DOCTYPE html><html lang=\"en\"><meta charset=\"UTF-8\"><style>body{font-family:\"Gotham Pro\",\"Helvetica Neue\",Helvetica,Arial,sans-serif;margin:0}.popup{position:fixed;top:0;right:0;padding:15px 35px 15px 20px;font-size:13px;white-space:nowrap;background-color:#fff;border:1px solid #d6d6d6;box-shadow:0 2px 5px 0 rgba(0,0,0,.2)}.popup--min{padding:8px 38px 8px 14px}.popup--min .popup__text-min{display:block}.popup--min .popup__text-full{display:none}.popup--min .popup__logo{width:24px;height:24px;margin-right:9px}.popup--min .popup__text{font-size:11px;line-height:1.2}.popup--min .popup__close{top:50%;transform:translateY(-50%)}.popup__logo{display:inline-block;vertical-align:middle;width:30px;height:30px;margin-right:12px;background-repeat:no-repeat;background-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNS4zIDI1LjkiPjxwYXRoIGZpbGw9IiM2OGJjNzEiIGQ9Ik0xMi43IDBDOC43IDAgMy45LjkgMCAzYzAgNC40LS4xIDE1LjQgMTIuNyAyM0MyNS40IDE4LjQgMjUuMyA3LjQgMjUuMyAzIDIxLjQuOSAxNi42IDAgMTIuNyAweiIvPjxwYXRoIGZpbGw9IiM2N2IyNzkiIGQ9Ik0xMi42IDI1LjlDLS4xIDE4LjQgMCA3LjQgMCAzYzMuOS0yIDguNy0zIDEyLjYtM3YyNS45eiIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0xMi4yIDE3LjNMMTkuOCA3YS45OS45OSAwIDAgMC0xLjMuMWwtNi40IDYuNi0yLjQtMi45Yy0xLjEtMS4zLTIuNy0uMy0zLjEgMGw1LjYgNi41Ii8+PC9zdmc+)}.popup__text{display:inline-block;vertical-align:middle;font-size:13px;line-height:1.6}.popup__text-min{display:none}.popup__text-blocked{max-width:150px;overflow:hidden;text-overflow:ellipsis}.popup__link{display:inline-block;vertical-align:middle;color:#66b574;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.popup__link--url{max-width:130px;vertical-align:bottom}.popup__link--allow{max-width:215px;margin-right:5px}.popup__close{position:absolute;top:10px;right:10px;width:15px;height:15px;border:0;background-color:#fff;background-repeat:no-repeat;background-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMC41IDIwLjUiPjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0xMS4zIDEwLjNsOS05Yy4zLS4zLjMtLjggMC0xLjFzLS44LS4zLTEuMSAwbC05IDktOS05QzEtLjEuNS0uMS4yLjJzLS4zLjggMCAxLjFsOSA5LTkgOWMtLjMuMy0uMy44IDAgMS4xLjEuMS4zLjIuNS4ycy40LS4xLjUtLjJsOS05IDkgOWMuMS4xLjMuMi41LjJzLjQtLjEuNS0uMmMuMy0uMy4zLS44IDAtMS4xbC04LjktOXoiLz48L3N2Zz4=);-webkit-appearance:none;appearance:none;cursor:pointer;opacity:.3}</style><div class=\"popup\"><div class=\"popup__logo\"></div><div class=\"popup__text\"><div class=\"popup__text-full\"><!--i18n:popup_text_full--> <a href=\"${href}\" target=\"_blank\" class=\"popup__link popup__link--url\">${displayUrl}</a><div class=\"popup__actions\"><a href=\"javascript:void(0)\" class=\"popup__link popup__link--allow\"><!--i18n:popup_allow_dest--> </a><a href=\"javascript:void(0)\" class=\"popup__link popup__link--all\"><!--i18n:popup_allow_origin--></a></div></div><div class=\"popup__text-min\"><div class=\"popup__text-blocked\"><!--i18n:popup_text_min--></div><div class=\"popup__actions\"><a href=\"javascript:void(0)\" class=\"popup__link popup__link--expand\"><!--i18n:popup_expand_min--></a></div></div></div><button class=\"popup__close\"></button></div>", localizationContext, true);
        iframe.addEventListener('load', function (evt) {
            // Attach event handlers
            if (loaded) {
                return;
            }
            loaded = true;
            var document = iframe.contentDocument;
            document.documentElement.innerHTML = _innerHTML; // document.write('..') does not work on FF Greasemonkey
            i18nService.applyTranslation(document.body, {
                'domain': url[1]
            });
            attachClickListenerForEach(document.getElementsByClassName('popup__link--allow'), function () {
                if (_this.showConfirmationDialog("popup_allow_dest_conf", localizationContext)) {
                    storageManager.requestDestinationWhitelist(url[1]);
                }
            });
            attachClickListenerForEach(document.getElementsByClassName('popup__link--all'), function () {
                if (_this.showConfirmationDialog("popup_allow_origin_conf", localizationContext)) {
                    storageManager.requestDomainWhitelist(orig_domain);
                }
            });
            requestAnimationFrame(function () {
                iframe.style.opacity = '1';
            });
            // Without this, the background of the iframe will be white in IE11
            document.body.setAttribute('style', 'background-color:transparent;');
        });
        // Adjust css of an iframe
        iframe.setAttribute('allowTransparency', 'true');
        for (var prop in initialAlertFrameStyle) {
            iframe.style[prop] = initialAlertFrameStyle[prop];
        }
        var height = this.$height = 76;
        var width = 574;
        iframe.style.height = height + px;
        iframe.style.width = width + px;
        // Commenting out the below due to https://bugs.chromium.org/p/chromium/issues/detail?id=489431,
        // iframe.setAttribute('sandbox', 'allow-same-origin');
        this.$element = iframe;
        this.$collapsed = false;
        this.$top = 10 /* top_offset */;
        this.lastUpdate = new Date().getTime();
    }
    // Until we come up with a proper UI, we reponse to user interaction with window.confirm.
    Alert.prototype.showConfirmationDialog = function (messageId, context) {
        var message = this.i18nService.formatText(this.i18nService.$getMessage(messageId), context);
        // Certain browsers always return `false` from window.confirm;
        // In such cases, we skip confirmation step.
        // https://github.com/AdguardTeam/PopupBlocker/issues/50
        var now = Date.now();
        var response = window.confirm(message);
        if (Date.now() - now < 100) {
            return true;
        }
        return response;
    };
    Alert.prototype.pushdown = function (amount) {
        var newTop = this.$top + amount;
        this.$element.style.top = newTop + px;
        this.$top = newTop;
    };
    Alert.prototype.toggleCollapse = function () {
        var collapsed = this.$collapsed = !this.$collapsed;
        this.$element.style.height = (this.$height = (collapsed ? 48 /* collapsed_height */ : 76 /* height */)) + px;
        this.$element.style.width = (collapsed ? 180 /* collapsed_width */ : 574 /* width */) + px;
        var root = this.$element.contentDocument.getElementsByClassName('popup')[0];
        root.classList.toggle('popup--min');
        // Since its state was changed, update its lastUpdate property.
        this.lastUpdate = new Date().getTime();
    };
    Alert.prototype.$destroy = function () {
        clearTimeout(this.timerId);
        var parentNode = this.$element.parentNode;
        if (parentNode) {
            parentNode.removeChild(this.$element);
        }
    };
    return Alert;
}());
var AlertController = /** @class */ (function () {
    function AlertController(i18nService, storageManager) {
        this.i18nService = i18nService;
        this.storageManager = storageManager;
        this.alerts = [];
    }
    AlertController.prototype.createAlert = function (orig_domain, popup_url) {
        var _this = this;
        var alert = new Alert(orig_domain, popup_url, this.i18nService, this.storageManager);
        // Pushes previous alerts down
        var l = this.alerts.length;
        var offset = 10 /* middle_offset */ + alert.$height;
        this.moveBunch(l, offset);
        // Adds event listeners that needs to run in this context
        alert.$element.addEventListener('load', function () {
            var alertDoc = alert.$element.contentDocument;
            attachClickListenerForEach(alertDoc.getElementsByClassName('popup__close'), function () {
                _this.destroyAlert(alert);
            });
            attachClickListenerForEach(alertDoc.getElementsByClassName('popup__link--expand'), function () {
                _this.toggleCollapseAlert(alert);
            });
        });
        alert.$element.addEventListener('mouseover', function () { _this.onMouseOver(); });
        alert.$element.addEventListener('mouseout', function () { _this.onMouseOut(); });
        // Appends an alert to DOM
        document.documentElement.appendChild(alert.$element);
        // Schedules collapsing & destroying
        alert.timerId = setTimeout(function () {
            _this.toggleCollapseAlert(alert);
        }, FULL_ALERT_TIMEOUT);
        // Pushes the new alert to an array, destroy from the oldest alert when needed
        if ((l = this.alerts.push(alert)) > MAX_ALERT_NUM) {
            l -= MAX_ALERT_NUM;
            while (l-- > 0) {
                this.destroyAlert(this.alerts[l]);
            }
        }
    };
    AlertController.prototype.moveBunch = function (index, offset) {
        while (index-- > 0) {
            this.alerts[index].pushdown(offset);
        }
    };
    /**
     * Collapses an alert and schedules its destruction
     */
    AlertController.prototype.toggleCollapseAlert = function (alert) {
        var _this = this;
        var prevHeight = alert.$height;
        alert.toggleCollapse();
        var offset = alert.$height - prevHeight;
        var index = this.alerts.indexOf(alert);
        this.moveBunch(index, offset);
        clearTimeout(alert.timerId);
        if (!this.hovered) {
            alert.timerId = alert.$collapsed ? setTimeout(function () {
                _this.destroyAlert(alert);
            }, COLLAPSED_ALERT_TIMEOUT) : setTimeout(function () {
                _this.toggleCollapseAlert(alert);
            }, FULL_ALERT_TIMEOUT);
        }
    };
    AlertController.prototype.destroyAlert = function (alert) {
        alert.$destroy();
        var i = this.alerts.indexOf(alert);
        var offset = alert.$height + 10;
        this.moveBunch(i, -offset);
        this.alerts.splice(i, 1);
    };
    /************************************************************************************

        When a user hovers the mouse over any of alerts,

         1. All timers are cleared, so as to prevent ui change during
            user interaction;

         2. When the mouse is moved out of alerts:
           - It resumes all timers as if there was no pause;
           - If a pause was long enough so that ANY of timer's callback should
             have been called, call the oldest callback immediately, and then schedules
             other callbacks so that relative fire time differences are unchanged.

    **/
    AlertController.prototype.onMouseOver = function () {
        this.hovered = true;
        this.alerts.forEach(function (alert) {
            clearTimeout(alert.timerId);
        });
    };
    AlertController.prototype.onMouseOut = function () {
        var _this = this;
        this.hovered = false;
        var now = new Date().getTime();
        var time = this.getImminentDue();
        var pastDue = now > time ? now - time : 0;
        this.alerts.forEach(function (alert) {
            if (alert.$collapsed) {
                alert.timerId = setTimeout(function () {
                    _this.destroyAlert(alert);
                    // This value will be 0 for the oldest callback.
                }, alert.lastUpdate + COLLAPSED_ALERT_TIMEOUT - now + pastDue);
            }
            else {
                alert.timerId = setTimeout(function () {
                    _this.toggleCollapseAlert(alert);
                }, alert.lastUpdate + FULL_ALERT_TIMEOUT - now + pastDue);
            }
        });
    };
    AlertController.prototype.getImminentDue = function () {
        var amongCollapsed, amongUncollapsed;
        var alerts = this.alerts;
        for (var i = 0, l = alerts.length; i < l; i++) {
            if (alerts[i].$collapsed) {
                if (amongCollapsed) {
                    continue;
                }
                amongCollapsed = alerts[i].lastUpdate + COLLAPSED_ALERT_TIMEOUT;
                if (amongUncollapsed) {
                    break;
                }
            }
            else {
                if (amongUncollapsed) {
                    continue;
                }
                amongUncollapsed = alerts[i].lastUpdate + FULL_ALERT_TIMEOUT;
                if (amongCollapsed) {
                    break;
                }
            }
        }
        return amongCollapsed > amongUncollapsed ? amongUncollapsed : amongCollapsed;
    };
    return AlertController;
}());

var UserscriptSettings = /** @class */ (function () {
    function UserscriptSettings() {
        this.domainOption = JSON.parse(GM_getValue(location.host, UserscriptSettings.INITIAL_DOMAIN_OPTION));
        this.whitelistedDestinations = this.getValue('whitelist', '').split(',').filter(function (host) { return host.length; });
        this.isFirefox = typeof InstallTrigger !== 'undefined' && document.currentScript === null;
    }
    UserscriptSettings.prototype.getValue = function (key, defaultValue) {
        var val = GM_getValue(key);
        if (typeof val === 'undefined') {
            GM_setValue(key, defaultValue);
            return defaultValue;
        }
        else {
            return val;
        }
    };
    UserscriptSettings.INITIAL_DOMAIN_OPTION = JSON.stringify({
        whitelisted: false,
        use_strict: false
    });
    return UserscriptSettings;
}());

var UserscriptStorageManager = /** @class */ (function () {
    function UserscriptStorageManager(userscriptSettings) {
        this.userscriptSettings = userscriptSettings;
    }
    UserscriptStorageManager.prototype.requestDestinationWhitelist = function (dest) {
        var whitelistedDestinations = this.userscriptSettings.whitelistedDestinations;
        whitelistedDestinations.push(dest);
        GM_setValue('whitelist', whitelistedDestinations.join(','));
    };
    UserscriptStorageManager.prototype.requestDomainWhitelist = function (domain) {
        var domainOption = this.userscriptSettings.domainOption;
        domainOption.whitelisted = true;
        GM_setValue(domain, JSON.stringify(domainOption));
    };
    return UserscriptStorageManager;
}());

var getTime = 'now' in performance ? function () {
    return performance.timing.navigationStart + performance.now();
} : Date.now;

/**
 * @fileoverview Logging functions to be used in dev channel. Function bodies are enclosed with preprocess
 * directives in order to ensure that these are stripped out by minifier in beta and release channels.
 */
var prefix = '';
var win$1 = window;
while (win$1.parent !== win$1) {
    win$1 = win$1.parent;
    prefix += '-- ';
}
var loc = location.href;
var suffix = "    (at " + loc + ")";



function print(str, obj) {
    var date = getTime().toFixed(3);
    var indent = 10 - date.length;
    if (indent < 0) {
        indent = 0;
    }
    var indentstr = '';
    while (indent-- > 0) {
        indentstr += ' ';
    }
    console.log(prefix + ("[" + indentstr + date + "]: " + str + suffix));
    if (obj !== undefined) {
        console.log(prefix + '=============================');
        console.log(obj);
        console.log(prefix + '=============================');
    }
}
/**
 * Accepts a function, and returns a wrapped function that calls `call` and `callEnd`
 * automatically before and after invoking the function, respectively.
 * @param fn A function to wrap
 * @param message
 * @param cond optional argument, the function argument will be passed to `cond` function, and
 * its return value will determine whether to call `call` and `callEnd`.
 */

var UserscriptStorageProvider = /** @class */ (function () {
    function UserscriptStorageProvider(userscriptSettings, alertController, $getMessage) {
        this.userscriptSettings = userscriptSettings;
        this.alertController = alertController;
        this.$getMessage = $getMessage;
        this.domain = location.hostname;
    }
    UserscriptStorageProvider.prototype.originIsWhitelisted = function () {
        return this.userscriptSettings.domainOption.whitelisted;
    };
    UserscriptStorageProvider.prototype.destinationIsWhitelisted = function (dest) {
        return this.userscriptSettings.whitelistedDestinations.indexOf(dest) !== -1;
    };
    UserscriptStorageProvider.prototype.showAlert = function (orig_domain, popup_url) {
        var _this = this;
        print("UserscriptStorageProvider: showAlert");
        setTimeout(function () {
            _this.alertController.createAlert(orig_domain, popup_url);
        });
    };
    UserscriptStorageProvider.prototype.expose = function () {
        var BRIDGE_KEY = '__PB' + (Math.random() * 1e9 >>> 0) + '__';
        if (this.userscriptSettings.isFirefox) {
            this.originIsWhitelisted = this.originIsWhitelisted.bind(this);
            this.destinationIsWhitelisted = this.destinationIsWhitelisted.bind(this);
            this.showAlert = this.showAlert.bind(this);
            unsafeWindow[BRIDGE_KEY] = cloneInto(this, unsafeWindow, { cloneFunctions: true });
        }
        else {
            unsafeWindow[BRIDGE_KEY] = this;
        }
        return BRIDGE_KEY;
    };
    return UserscriptStorageProvider;
}());

/**
 * @fileoverview A custom getMessage implementation for userscripts.
 */
var translations = {"tr":{"popup_text_full":"{{0_url}} sitesinin açılır pencere açma isteği engellendi","popup_allow_dest":"${domain} alan adına her zaman izin ver","popup_allow_dest_conf":"${domain} sitesine yönlendiren tüm açılır pencerelere izin verilsin mi?","popup_allow_origin":"Bu web sitesinde tüm açılır pencerelere izin ver","popup_allow_origin_conf":"${parent} kaynaklı tüm açılır pencerelere izin verilsin mi?","popup_text_min":"Engellendi","popup_expand_min":"açılır pencere","on_navigation_by_popunder":"Yeni sayfaya geçiş, bir gizli pencere nedeniyle meydana gelmiş olabilir. Devam etmek istiyor musunuz?","aborted_popunder_execution":"Arka plan yönlendirmesini önlemek için Açılır Pencere Engelleyicisi bir komut dosyasının çalışmasını engelledi"},"ko":{"popup_text_full":"{{0_url}} 팝업을 차단했습니다","popup_allow_dest":"항상 ${domain} 허용","popup_allow_dest_conf":"페이지 ${domain} 로의 팝업을 항상 허용하시겠습니까?","popup_allow_origin":"이 웹사이트의 팝업을 항상 허용","popup_allow_origin_conf":"현재 페이지 ${parent} 에서 팝업을 항상 허용하시겠습니까?","popup_text_min":"차단됨","popup_expand_min":"팝업","on_navigation_by_popunder":"이 페이지 전환은 팝업 스크립트가 유발했을 수 있습니다. 계속하시겠습니까?","aborted_popunder_execution":"페이지 전환이 일어나지 않도록 팝업 차단기가 스크립트 실행을 중단시켰습니다"},"ja":{"popup_text_full":"{{0_url}}のポップアップウィンドウが開かれるのをブロックしました","popup_allow_dest":"${domain}を常に許可する","popup_allow_dest_conf":"${domain}へ繋がるすべてのポップアップを許可しますか？","popup_allow_origin":"このウェブサイト上のすべてのポップアップを許可する","popup_allow_origin_conf":"${parent}から発生したすべてのポップアップを許可しますか？","popup_text_min":"ブロック","popup_expand_min":"ポップアップ","on_navigation_by_popunder":"新しいページへの移動はポップアンダーによって生じた可能性があります。続行しますか？","aborted_popunder_execution":"PopupBlockerはバックグラウンドリダイレクトを防ぐためにスクリプトの実行を中止しました"},"sk":{"popup_text_full":"Bol zablokovaný pokus otvoriť vyskakovacie okno {{0_url}}","popup_allow_dest":"Vždy povoliť ${domain}","popup_allow_dest_conf":"Povoliť všetky vyskakovacie okná vedúce na ${domain}?","popup_allow_origin":"Povoliť všetky vyskakovacie okná na stránke","popup_allow_origin_conf":"Povoliť všetky vyskakovacie okná pochádzajúce z ${parent}?","popup_text_min":"Zablokované","popup_expand_min":"vyskakovacie okno","on_navigation_by_popunder":"Tento prechod na novú stránku je pravdepodobne spôsobený pop-under. Chcete pokračovať?","aborted_popunder_execution":"PopupBlocker prerušil vykonanie skriptu, aby zabránil presmerovaniu na pozadí"},"id":{"popup_text_full":"Memblokir percobaan membuka pop-up laman {{0_url}}","popup_allow_dest":"Selalu izinkan ${domain}","popup_allow_dest_conf":"Izinkan semua pop-up yang mengarah ke ${domain}?","popup_allow_origin":"Izinkan semua pop-up di situs ini","popup_allow_origin_conf":"Izinkan semua pop-up yang berasal dari ${parent}?","popup_text_min":"Diblok","popup_expand_min":"pop-up","on_navigation_by_popunder":"Transisi ke laman baru ini kemungkinan disebabkan oleh sebuah pop-up. Apakah Anda ingin melanjutkan?","aborted_popunder_execution":"PopupBlocker menghentikan eksekusi script untuk mencegah perubahan laman di latar belakang"},"pt-BR":{"popup_text_full":"Bloqueou uma tentativa de abrir uma janela pop-up de {{0_url}}","popup_allow_dest":"Sempre permitir ${domain}","popup_allow_dest_conf":"Permitir que todos os pop-ups que levam ${domain}?","popup_allow_origin":"Permitir todos os pop-ups neste site","popup_allow_origin_conf":"Permitir todos os pop-ups provenientes de ${parent}?","popup_text_min":"Bloqueado","popup_expand_min":"pop-up","on_navigation_by_popunder":"Essa transição para a nova página provavelmente será causada por um pop-under. Você deseja continuar?","aborted_popunder_execution":"O bloqueador de pop-ups interrompeu uma execução de script para evitar um redirecionamento em plano de fundo"},"fr":{"popup_text_full":"Blocked an attempt to open a {{0_url}} pop-up window","popup_allow_dest":"Toujours autoriser ${domain}","popup_allow_dest_conf":"Allow all pop-ups leading to ${domain}?","popup_allow_origin":"Allow all pop-ups on this website","popup_allow_origin_conf":"Allow all pop-ups originating from ${parent}?","popup_text_min":"Bloqué","popup_expand_min":"pop-up","on_navigation_by_popunder":"This transition to the new page is likely to be caused by a pop-under. Do you wish to continue?","aborted_popunder_execution":"PopupBlocker aborted a script execution to prevent background redirect"},"uk":{"popup_text_full":"Заблоковано спробу відкрити спливаюче вікно {{0_url}}","popup_allow_dest":"Завжди дозволяти ${domain}","popup_allow_dest_conf":"Завжди дозволяти спливаючі вікна, які ведуть на ${domain}?","popup_allow_origin":"Дозволити всі спливаючі вікна на цьому веб-сайті","popup_allow_origin_conf":"Дозволити всі спливаючі вікна, що походять від ${parent}?","popup_text_min":"Заблоковано","popup_expand_min":"Спливаюче вікно","on_navigation_by_popunder":"Цей перехід на нову сторінку, ймовірно, міг бути викликаний поп-андером. Бажаєте продовжити?","aborted_popunder_execution":"PopupBlocker перервав виконання скрипта, щоб запобігти фоновому перенаправленню"},"zh-TW":{"popup_text_full":"封鎖打開 {{0_url}} 彈出式視窗的企圖","popup_allow_dest":"總是允許 ${domain}","popup_allow_dest_conf":"允許所有的通向 ${domain} 之彈出式視窗？","popup_allow_origin":"允許於此網站上之所有的彈出式視窗","popup_allow_origin_conf":"允許所有的來自 ${parent} 之彈出式視窗？","popup_text_min":"已封鎖","popup_expand_min":"彈出式視窗","on_navigation_by_popunder":"此至新的頁面之轉換很可能是由一個背彈式視窗引起。您想要繼續嗎？","aborted_popunder_execution":"彈出式視窗封鎖器中止腳本執行以防止背景重定向"},"nl":{"popup_text_full":"Een poging om een {{0_url}} venster te openen is geblokkeerd","popup_allow_dest":"Sta altijd ${domain} toe","popup_allow_dest_conf":"Wil je alle pop-ups naar ${domain} toestaan?","popup_allow_origin":"Sta alle pop-ups op deze website toe","popup_allow_origin_conf":"Wil je alle pop-ups van ${parent} toestaan?","popup_text_min":"Geblokkeerd","popup_expand_min":"pop-up","on_navigation_by_popunder":"De overgang naar de nieuwe pagina wordt waarschijnlijk veroorzaakt door een pop-under. Wil je doorgaan?","aborted_popunder_execution":"De pop-up blocker heeft de uitvoering van een script onderbroken om te voorkomen dat er op de achtergrond een redirect plaatsvindt."},"de":{"popup_text_full":"Es wurde ein Versuch blockiert ein {{0_url}} Pop-up-Fenster zu öffnen.","popup_allow_dest":"${domain} immer zulassen","popup_allow_dest_conf":"Alle Pop-ups zulassen, die zu ${domain} führen?","popup_allow_origin":"Alle Pop-ups auf dieser Webseite erlauben","popup_allow_origin_conf":"Alle Pop-ups aus der aktuellen Domain zulassen — ${parent}?","popup_text_min":"Blockiert","popup_expand_min":"Pop-up","on_navigation_by_popunder":"Diese Seiten-Navigation wird wahrscheinlich durch ein Pop-under verursacht. Möchten Sie fortfahren?","aborted_popunder_execution":"PopupBlocker hat eine Skript-Ausführung abgebrochen, um eine Hintergrundumleitung zu verhindern"},"da":{"popup_text_full":"Blokerede et forsøg på at åbne et {{0_url}} pop op-vindue","popup_allow_dest":"Tillad altid ${domain}","popup_allow_dest_conf":"Tillad alle pop op-vinduer der fører til ${domain}?","popup_allow_origin":"Tillad alle pop op-vinduer på denne webside","popup_allow_origin_conf":"Tillad alle pop op-vinduer med oprindelse fra ${parent}?","popup_text_min":"Blokeret","popup_expand_min":"pop op-vindue","on_navigation_by_popunder":"Denne overgang til den nye side vil sandsynligvis medføre et pop under-vindue. Ønsker du at fortsætte?","aborted_popunder_execution":"PopupBlocker afbrød en script udførelse for at forhindre baggrunds omdirigering"},"pt-PT":{"popup_text_full":"Foi bloqueada uma tentativa de abrir uma janela popup {{0_url}}","popup_allow_dest":"Permitir sempre ${domain}","popup_allow_dest_conf":"Permitir todos os popups que conduzem a ${domain}?","popup_allow_origin":"Permitir todos os popups neste site","popup_allow_origin_conf":"Permitir todos os popups provenientes de ${parent}?","popup_text_min":"Bloqueado","popup_expand_min":"popup","on_navigation_by_popunder":"Esta transição para a nova página  será  provavelmente causada por um popunder. Deseja continuar?","aborted_popunder_execution":"PopupBlocker abortou uma execução de script para evitar o redireccionamento em segundo plano"},"it":{"popup_text_full":"Blocked an attempt to open a {{0_url}} pop-up window","popup_allow_dest":"Always allow ${domain}","popup_allow_dest_conf":"Allow all pop-ups leading to ${domain}?","popup_allow_origin":"Permetti tutti i pop-up su questo sito","popup_allow_origin_conf":"Allow all pop-ups originating from ${parent}?","popup_text_min":"Bloccato","popup_expand_min":"pop-up","on_navigation_by_popunder":"This transition to the new page is likely to be caused by a pop-under. Do you wish to continue?","aborted_popunder_execution":"PopupBlocker ha interrotto l'esecuzione di uno script per impedire il reindirizzamento in background"},"es-419":{"popup_text_full":"Bloqueado intento de abrir una ventana pop-up {{0_url}} ","popup_allow_dest":"Permitir siempre ${domain}","popup_allow_dest_conf":"¿Permitir todos los pup-ups que conducen a ${domain}?","popup_allow_origin":"Permitir todos los pop-ups en este sitio web","popup_allow_origin_conf":"¿Permitir todos los pop-ups originados en ${parent}?","popup_text_min":"Bloqueado","popup_expand_min":"Ventana","on_navigation_by_popunder":"Esta transición a la nueva página parece estar causada por un pop-under (que aparece detrás de la ventada actual). ¿Desea continuar?","aborted_popunder_execution":"PopupBlocker abortó la ejecución de un script para prevenir un redireccionamiento en segundo plano."},"ru":{"popup_text_full":"Заблокирована попытка открытия всплывающего окна {{0_url}}","popup_allow_dest":"Всегда разрешать ${domain}","popup_allow_dest_conf":"Всегда разрешать всплывающие окна, ведущие на ${domain}?","popup_allow_origin":"Разрешить все поп-апы на этом сайте","popup_allow_origin_conf":"Разрешить все поп-апы, исходящие от ${parent}?","popup_text_min":"Заблокировано","popup_expand_min":"поп-ап","on_navigation_by_popunder":"Этот переход на новую страницу скорее всего вызван поп-андером. Всё равно продолжить?","aborted_popunder_execution":"PopupBlocker прервал исполнение скрипта, чтобы предотвратить фоновую переадресацию"},"ar":{"popup_text_full":"تم حظر محاولة فتح نافذة منبثقة {{0_url}}","popup_allow_dest":"السماح دائما  {${domain}}","popup_allow_dest_conf":"السماح لجميع النوافذ المنبثقة المؤدية إلى${domain}؟","popup_allow_origin":"السماح لجميع النوافذ المنبثقة علي هذا الموقع","popup_allow_origin_conf":"السماح بكافة الإطارات المنبثقة الناشئة عن${parent}؟","popup_text_min":"منع","popup_expand_min":"الإطار المنبثق","on_navigation_by_popunder":"من المحتمل ان يكون هذا الانتقال إلى الصفحة الجديدة ناتجا عن الإطار المنبثق. هل ترغب في المتابعة ؟","aborted_popunder_execution":"تم إحباط البرنامج النصي لمنع أعاده توجيه الخلفية"},"sr-Latn":{"popup_text_full":"Blokiran pokušaj otvaranja {{0_url}} iskačućeg prozora","popup_allow_dest":"Uvek dozvoli ${domain}","popup_allow_dest_conf":"Dozvoliti sve iskačuće prozore sa ${domain}?","popup_allow_origin":"Dozvoli sve iskačuće prozore na ovom sajtu","popup_allow_origin_conf":"Dozvoliti sve iskačuće prozore koji dolaze sa ${parent}?","popup_text_min":"Blokirano","popup_expand_min":"Iskačući prozor","on_navigation_by_popunder":"Ovaj prelaz na novu stranicu je verovatno uzrokovan iskačućim prozorom. Želite li da nastavite?","aborted_popunder_execution":"Blokator iskačućeg prozora je blokirao izvršenje skripte kako bi sprečio pozadinsko preusmerenje"},"zh-CN":{"popup_text_full":"已拦截打开 {{0_url}} 弹窗的尝试","popup_allow_dest":"始终允许 ${domain}","popup_allow_dest_conf":"允许通向 ${domain} 的所有弹窗？","popup_allow_origin":"允许此网站的所有弹出","popup_allow_origin_conf":"允许源自 ${parent} 所有弹窗口？","popup_text_min":"已拦截","popup_expand_min":"弹出","on_navigation_by_popunder":"此网页导航可能导致弹窗。您要继续？","aborted_popunder_execution":"PopupBlocker 已中止脚本执行以防止后台重新定向"},"sv":{"popup_text_full":"Blockerade ett försök att öppna ett popup-fönster på {{0_url}}","popup_allow_dest":"Tillåt alltid ${domain}","popup_allow_dest_conf":"Tillåt alla popupfönster som pekar på ${domain}?","popup_allow_origin":"Tillåt alla popupfönster från den här webbplatsen","popup_allow_origin_conf":"Tillåt alla popupfönster som härstammar från ${parent}?","popup_text_min":"Blockerad","popup_expand_min":"Popup","on_navigation_by_popunder":"Övergången till den nya webbsidan orsakas sannolikt av en underliggande fönster (en s.k. pop-under). Vill du fortsätta?","aborted_popunder_execution":"Popupblockeraren avbröt en skriptexekvering för att hindra omdirigering av en bakgrundsaktivitet."},"pl":{"popup_text_full":"Zablokowano próbę otwarcia {{0_url}} wyskakującego okienka","popup_allow_dest":"Zawsze zezwalaj ${domain}","popup_allow_dest_conf":"Zezwalaj na wszystkie wyskakujące okienka prowadzące do ${domain}?","popup_allow_origin":"Zezwalaj na wszystkie wyskakujące okienka na tej stronie internetowej","popup_allow_origin_conf":"Zezwalaj na wszystkie wyskakujące okienka pochodzące z ${parent}?","popup_text_min":"Zablokowane","popup_expand_min":"wyskakujące okienko","on_navigation_by_popunder":"To przejście na nową stronę może być spowodowane przez pop-under. Czy chcesz kontynuować?","aborted_popunder_execution":"PopupBlocker anulował wykonanie skryptu by przeciwdziałać przekierowaniu w tle"},"mk-MK":{"popup_text_full":"Blocked an attempt to open a {{0_url}} pop-up window","popup_allow_dest":"Секогаш дозволи го ${domain}","popup_allow_dest_conf":"Дозволи ги сите скокачки прозорци кои водат до ${domain}?","popup_allow_origin":"Дозволи ги сите скокачки прозорци на оваа веб страница","popup_allow_origin_conf":"Дозволи ги сите скокачки прозорци кои потекнуваат од ${parent}?","popup_text_min":"Блокирани","popup_expand_min":"скокачки прозорец","on_navigation_by_popunder":"This transition to the new page is likely to be caused by a pop-under. Do you wish to continue?","aborted_popunder_execution":"PopupBlocker aborted a script execution to prevent background redirect"},"en":{"popup_text_full":"Blocked an attempt to open a {{0_url}} pop-up window","popup_allow_dest":"Always allow ${domain}","popup_allow_dest_conf":"Allow all pop-ups leading to ${domain}?","popup_allow_origin":"Allow all pop-ups on this website","popup_allow_origin_conf":"Allow all pop-ups originating from ${parent}?","popup_text_min":"Blocked","popup_expand_min":"pop-up","on_navigation_by_popunder":"This transition to the new page is likely to be caused by a pop-under. Do you wish to continue?","aborted_popunder_execution":"PopupBlocker aborted a script execution to prevent background redirect"},"no":{"popup_text_full":"Blokkert et forsøk på å åpne et {{0_url}} popup-vindu","popup_allow_dest":"Alltid tillat ${domain}","popup_allow_dest_conf":"Tillat alle popup-vinduer som fører til ${domain}?","popup_allow_origin":"Tillat alle popup-vinduer på denne nettsiden","popup_allow_origin_conf":"Tillat alle popup-vinduer som kommer fra ${parent}?","popup_text_min":"Blokkert","popup_expand_min":"popup","on_navigation_by_popunder":"Omdirigeringen til den nye nettsiden er sannsynligvis forårsaket av en pop-under. Ønsker du å fortsette?","aborted_popunder_execution":"PopupBlocker avbrøt en skrift fra å kjøre for å hindre bakgrunnsomdirigering"}};
/**
 * AdGuard for Windows noramlizes locales like this.
 */
function normalizeLocale(locale) {
    return locale.toLowerCase().replace('_', '-');
}
var supportedLocales = Object.keys(translations).map(function (locale) { return normalizeLocale(locale); });
var defaultLocale = 'en';
var currentLocale = null;
function setLocaleIfSupported(locale) {
    if (supportedLocales.indexOf(locale) !== -1) {
        currentLocale = locale;
        return true;
    }
    return false;
}
function setLocale() {
    if (typeof AdguardSettings !== 'undefined') {
        var locale = normalizeLocale(AdguardSettings.locale);
        if (setLocaleIfSupported(locale)) {
            return;
        }
    }
    var lang = normalizeLocale(navigator.language);
    if (setLocaleIfSupported(lang)) {
        return;
    }
    var i = lang.indexOf('-');
    if (i !== -1) {
        lang = lang.slice(0, i);
    }
    if (setLocaleIfSupported(lang)) {
        return;
    }
    currentLocale = defaultLocale;
}
setLocale();
var getMessage = function (messageId) {
    var message = translations[currentLocale][messageId];
    if (!message) {
        message = translations[defaultLocale][messageId];
        throw messageId + ' not localized';
    }
    return message;
};

/**************************************************************************/
/**************************************************************************/
var i18nService = new I18nService(getMessage);
var settings = new UserscriptSettings();
var storageManager = new UserscriptStorageManager(settings);
var alertController = new AlertController(i18nService, storageManager);
var storageProvider = new UserscriptStorageProvider(settings, alertController, getMessage);
var BRIDGE_KEY = storageProvider.expose();
/**************************************************************************/
function popupBlocker(window,PARENT_FRAME_KEY,CONTENT_SCRIPT_KEY){/**
 * @fileoverview Service locator object to be used throughout the page script.
 */
var adguard = {};

var getTime = 'now' in performance ? function () {
    return performance.timing.navigationStart + performance.now();
} : Date.now;

/**
 * @fileoverview Logging functions to be used in dev channel. Function bodies are enclosed with preprocess
 * directives in order to ensure that these are stripped out by minifier in beta and release channels.
 */
var prefix = '';
var win = window;
while (win.parent !== win) {
    win = win.parent;
    prefix += '-- ';
}
var loc = location.href;
var suffix = "    (at " + loc + ")";
var depth = 0;
function call(msg) {
    depth++;
    console.group(prefix + msg + suffix);
}
function callEnd() {
    depth--;
    console.groupEnd();
}
function closeAllGroup() {
    while (depth > 0) {
        console.groupEnd();
        depth--;
    }
}
function print(str, obj) {
    var date = getTime().toFixed(3);
    var indent = 10 - date.length;
    if (indent < 0) {
        indent = 0;
    }
    var indentstr = '';
    while (indent-- > 0) {
        indentstr += ' ';
    }
    console.log(prefix + ("[" + indentstr + date + "]: " + str + suffix));
    if (obj !== undefined) {
        console.log(prefix + '=============================');
        console.log(obj);
        console.log(prefix + '=============================');
    }
}
/**
 * Accepts a function, and returns a wrapped function that calls `call` and `callEnd`
 * automatically before and after invoking the function, respectively.
 * @param fn A function to wrap
 * @param message
 * @param cond optional argument, the function argument will be passed to `cond` function, and
 * its return value will determine whether to call `call` and `callEnd`.
 */
function connect(fn, message, cond) {
    return function () {
        var shouldLog = cond ? cond.apply(null, arguments) : true;
        if (shouldLog) {
            call(message);
        }
        var ret = fn.apply(this, arguments);
        if (shouldLog) {
            callEnd();
        }
        return ret;
    };
}

var matches = Element.prototype.matches || Element.prototype.msMatchesSelector;
var closest = 'closest' in Element.prototype ? function (el, selector) {
    return el.closest(selector);
} : function (el, selector) {
    for (var parent_1 = el; parent_1; parent_1 = parent_1.parentElement) {
        if (matches.call(el, selector)) {
            return el;
        }
    }
};
var getTagName = function (el) {
    return el.nodeName.toUpperCase();
};
/**
 * Detects about:blank, about:srcdoc urls.
 */
var ABOUT_PROTOCOL = 'about:';
var reEmptyUrl = new RegExp('^' + ABOUT_PROTOCOL);
var isEmptyUrl = function (url) {
    return reEmptyUrl.test(url);
};
var frameElementDesc = Object.getOwnPropertyDescriptor(window, 'frameElement') || Object.getOwnPropertyDescriptor(Window.prototype, 'frameElement');
var getFrameElement = frameElementDesc.get;
/**
 * A function to be called inside an empty iframe to obtain a reference to a parent window.
 * `window.parent` is writable and configurable, so this could be modified by external scripts,
 * and this is actually common for popup/popunder scripts.
 * However, `frameElement` property is defined with a getter, so we can keep its reference
 * and use it afterhands.
 */
var getSafeParent = function (window) {
    var frameElement = getFrameElement.call(window);
    if (!frameElement) {
        return null;
    }
    return frameElement.ownerDocument.defaultView;
};
var getSafeNonEmptyParent = function (window) {
    var frame = window;
    while (frame && isEmptyUrl(frame.location.href)) {
        frame = getSafeParent(frame);
    }
    if (!frame) {
        return null;
    }
    return frame;
};

/**
 * @fileoverview This establishes a private messaging channel between child frames and
 * the parent frame using `postMessage` and `MessageChannel` api, to be used for various
 * operations which needs to cross border of different browsing contexts. For security
 * reasons, we do not use a simple `postMessage`, for if we did so all `message` event
 * listeners in the top frame would be able to listen to such a message and frames would
 * be able to simulate our postMessage requests, opening a gate for a
 * potential abuse.
 * Current usages:
 *  - a request to show a blocked popup alert on the top frame.
 *  - a request to dispatch a MouseEvent to a specified coordinate inside a frame.
 */
var supported = typeof WeakMap === 'function';
var parent = window.parent;
var isTop = parent === window;
var isEmpty = isEmptyUrl(location.href);
var _preventDefault = Event.prototype.preventDefault;
var onMessage = function (evt) {
    var data = evt.data;
    print('received a message of type: ' + data.$type);
    switch (data.$type) {
        case 0 /* SHOW_ALERT */: {
            createAlertInTopFrame(data.orig_domain, data.popup_url, data.isGeneric);
            break;
        }
        case 1 /* DISPATCH_MOUSE_EVENT */: {
            dispatchMouseEvent(data.args);
            break;
        }
    }
};
var MAGIC = 'pb_handshake';
var framePortMap = supported ? new WeakMap() : null; // Maps a frame's contentWindow --> a port to communicate with the frame
var handshake = function (evt) {
    if (evt.data !== MAGIC) {
        // `MAGIC` indicates that this message is sent by the popupblocker from the child frame.
        return;
    }
    // From now on, propagation of event must be stopped.
    receivePort: {
        if (typeof evt.source === 'undefined') {
            // evt.source can be undefiend when an iframe has been removed from the document before the message is received.
            break receivePort;
        }
        if (framePortMap.has(evt.source)) {
            // Such frames have already sent its message port, we do not accept additional ports.
            break receivePort;
        }
        print('received a message from:', evt.source);
        var port = evt.ports[0]; // This is a port that a child frame sent.
        port.onmessage = onMessage;
        framePortMap.set(evt.source, port);
    }
    evt.stopImmediatePropagation();
    _preventDefault.call(evt);
};
var channel = !isTop && supported ? new MessageChannel() : null;
if (supported) {
    window.addEventListener('message', handshake);
    if (!isTop) {
        parent.postMessage(MAGIC, '*', [channel.port1]);
        channel.port2.onmessage = onMessage;
    }
}
/**********************************************************************/
// SHOW_ALERT
var createAlertInTopFrame = supported && !isTop && !isEmpty ? function (orig_domain, popup_url, isGeneric) {
    // If a current window is not top nor empty and the browser supports WeakMap, postMessage to parent.
    var data = {
        $type: 0 /* SHOW_ALERT */,
        orig_domain: orig_domain,
        popup_url: popup_url,
        isGeneric: isGeneric
    };
    channel.port2.postMessage(data);
} : (isTop || isEmpty) ? function (orig_domain, popup_domain) {
    // If a current window is the top frame or an empty frame, display an alert using bridge.
    // Empty iframes can be detached from the document shortly after opening a popup.
    // In such cases, `postMessage` may not work due to `evt.source` being `undefined`,
    // so we use bridge directly which is readily available anyway.
    // A `setTimeout` is used to prevent event handler from blocking UI.
    //
    // const targetFrame = getSafeNonEmptyParent(window);
    // targetFrame.setTimeout(adguard.storageProvider.showAlert, 0, orig_domain, popup_domain);
    adguard.storageProvider.showAlert(orig_domain, popup_domain);
} : /* noop */ function (orig_domain, popup_domain, isGeneric) {
    // If a current window is not top and the browser does not support WeakMap, do nothing.
};
/**********************************************************************/
// DISPATCH_MOUSE_EVENT
/**
 * Formats and posts a message to a target frame. It expects to receive a initMouseEventArgs
 * that is already modified according to the targetFrame's position.
 */
function dispatchMouseEventToFrame(initMouseEventArgs, targetWin) {
    var port = framePortMap.get(targetWin);
    if (!port) {
        print('port is undefined');
        return;
    }
    var data = {
        $type: 1 /* DISPATCH_MOUSE_EVENT */,
        args: initMouseEventArgs
    };
    print('posting a message...', port);
    port.postMessage(data);
}
var pressed = false;
function dispatchMouseEvent(initMouseEventArgs, target) {
    call('dispatchMouseEvent');
    var clientX = initMouseEventArgs[7];
    var clientY = initMouseEventArgs[8];
    target = target || document.elementFromPoint(clientX, clientY);
    if (getTagName(target) === 'IFRAME') {
        print('target is an iframe');
        var _target = target;
        // adjust initMouseEventArgs array values here
        var rect = _target.getBoundingClientRect();
        initMouseEventArgs[7] -= rect.left;
        initMouseEventArgs[8] -= rect.top;
        initMouseEventArgs[3] = null; // Window object cannot be cloned
        dispatchMouseEventToFrame(initMouseEventArgs, _target.contentWindow);
    }
    else {
        print('target is not an iframe, directly dispatching event...', target);
        // The purpose of this is to prevent triggering click for both `mousedown` and `click`,
        // or `mousedown` and `mouseup`.
        if (pressed) {
            return;
        }
        pressed = true;
        setTimeout(function () {
            pressed = false;
        }, 100);
        // Using click(). Manually dispatching a cloned event may not trigger an intended behavior.
        // For example, when a cloned mousedown event is dispatched to a target and a real mouseup
        // event is dispatched to the target, it won't cause a `click` event.
        target.click();
    }
    callEnd();
}
var initMouseEventArgs = 'type,canBubble,cancelable,view,detail,screenX,screenY,clientX,clientY,ctrlKey,altKey,shiftKey,metaKey,button,relatedTarget'.split(',');

var createOpen = function (index, events) {
    print('index:', index);
    var evt = events[index][0];
    if (evt.$type == 0 /* CREATE */ && getTime() - evt.$timeStamp < 200) {
        /**
         * A test here is meant to block attempts to call window.open from iframes which
         * was created later than 200 milliseconds ago. Such techniques are mostly used
         * by popup/popunder scripts on Firefox.
         * In an issue https://github.com/AdguardTeam/PopupBlocker/issues/63, a pop-up
         * window of Google Hangout is created with chrome-extension://... url, and it
         * contains an iframe having domain hangouts.google.com, and inside it it immediately
         * calls window.open with empty url in order to obtain reference to certain browsing
         * context.
         */
        if (evt.$data.location.protocol === ABOUT_PROTOCOL) {
            return false;
        }
    }
    return true;
};
var createOpen$1 = connect(createOpen, 'Performing create test');

var reCommonProtocol = /^http/;
/**
 * Parses a url and returns 3 strings.
 * The first string is a `displayUrl`, which will be used to show as
 * a shortened url. The second string is a `canonicalUrl`, which is used to match against whitelist data in storage.
 * The third string is a full absolute url.
 */
var createUrl = function (href) {
    href = convertToString(href);
    var location = createLocation(href);
    var displayUrl, canonicalUrl;
    var protocol = location.protocol;
    if (reCommonProtocol.test(protocol)) {
        displayUrl = location.href.slice(protocol.length + 2);
        canonicalUrl = location.hostname;
    }
    else {
        displayUrl = href;
        var i = href.indexOf(',');
        canonicalUrl = i === -1 ? href : href.slice(0, i);
    }
    return [displayUrl, canonicalUrl, location.href];
};
/**
 * There are certain browser quirks regarding how they treat non-string values
 * provided as arguments of `window.open`, and we can't rely on third-party scripts
 * playing nicely with it.
 * undefined --> 'about:blank'
 * null --> 'about:blank', except for Firefox, in which it is converted to 'null'.
 * false --> 'about:blank', except for Edge, in which it is converted to 'false'.
 * These behaviors are different from how anchor tag's href attributes behaves with non-string values.
 */
var convertToString = function (href) {
    if (typeof href !== 'string') {
        if (href instanceof Object) {
            href = String(href);
        }
        else {
            href = '';
        }
    }
    return href;
};
/**
 * Creates an object that implements properties of Location api.
 */
var createLocation = function (href) {
    var anchor = document.createElement('a');
    anchor.href = href;
    // https://gist.github.com/disnet/289f113e368f1bfb06f3
    if (anchor.host == "") {
        anchor.href = anchor.href;
    }
    return anchor;
};

var aboutBlank = function (index, events) {
    // if there is a blocked popup within 100 ms, do not allow opening popup with url about:blank.
    // It is a common technique used by popunder scripts on FF to regain focus of the current window.
    var latestOpenEvent = events[index][events[index].length - 1];
    var now = latestOpenEvent.$timeStamp;
    if (latestOpenEvent.$type === 1 /* APPLY */ && latestOpenEvent.$name === 'open' && isEmptyUrl(convertToString(latestOpenEvent.$data.arguments[0]))) {
        print('The latest event is open(\'about:blank\')');
        var l = events.length;
        while (l-- > 0) {
            var frameEvents = events[l];
            var k = frameEvents.length;
            while (k-- > 0) {
                var event_1 = frameEvents[k];
                if (now - event_1.$timeStamp > 200) {
                    break;
                }
                if (event_1.$name === 'open' && event_1.$type === 1 /* APPLY */) {
                    if (event_1.$data.context['mocked']) {
                        return false;
                    }
                }
            }
        }
    }
    return true;
};
var aboutBlank$1 = connect(aboutBlank, 'Performing aboutBlank test');

/**
 * @fileoverview There are some unfortunate cases where throwing inside a script is necessary
 * for seamless user experience. When a popunder script tries to replicate a window to a popup
 * and navigate the window to some ads landing page, it usually uses methods of `location` object
 * and we cannot add a layer of check on those methods (they are all non-configurable).
 * See https://github.com/AdguardTeam/PopupBlocker/issues/14, nothing prevent from popunder scripts
 * using it at any time. Currently, the only reliable way is to abort script execution on an attempt
 * to open a popup window which must happen before calling `location` methods.
 * To do so, during popup detection, we additionaly checks if the target of the popup is identical
 * to the current window or `href` attribute of a clicked anchor, and triggers aborting in such cases.
 */
var MAGIC$1;
function abort() {
    closeAllGroup();
    MAGIC$1 = Math.random().toString(36).substr(7);
    console.warn(adguard.storageProvider.$getMessage('aborted_popunder_execution'));
    throw MAGIC$1;
}

/**
 * @fileoverview Utility functions for instanceof checks against DOM classes. Used for type casting.
 * Since it is common for us to cross the border of browsing contexts, instanceof
 * check for DOM element is not reliable.
 */
var isMouseEvent = function (event) {
    return 'clientX' in event;
};
var isTouchEvent = function (event) {
    return 'touches' in event;
};
var isUIEvent = function (event) {
    return 'view' in event;
};
/**/
var isNode = function (el) {
    return 'nodeName' in el;
};
var isElement = function (el) {
    return 'id' in el;
};
var isHTMLElement = function (el) {
    return 'style' in el;
};
var isAnchor = function (el) {
    return getTagName(el) == 'A';
};
/**/
var toString = Object.prototype.toString;
var isWindow = function (el) {
    return toString.call(el) === '[object Window]';
};
var isLocation = function (el) {
    return toString.call(el) === '[object Location]';
};
/**/

/**/
var isClickEvent = function (evt) {
    var type = evt.type;
    return type === 'click' || type === 'mousedown' || type === 'mouseup';
};

var navigatePopupToItself = function (index, events, incoming) {
    var $type = incoming.$type;
    var $name = incoming.$name;
    if ((($name === 'assign' || $name === 'replace') && $type === 1 /* APPLY */) ||
        (($name === 'location' || $name === 'href') && $type === 3 /* SET */)) {
        var currentHref = location.href; // ToDo: Consider making this work on empty iframes
        var newLocation = String(incoming.$data.arguments[0]);
        if (newLocation === currentHref) {
            // Performs a check that it is a modification of a mocked object.
            // Non-determinism here is inevitable, due to our decoupled approach in timeline implementation.
            // This may be improved in future.
            if ((incoming.$name === 'location' && !isWindow(incoming.$data.this)) ||
                !isLocation(incoming.$data.this)) {
                print('navigatePopupToItself - found a suspicious attempt');
                abort();
            }
        }
    }
    return true;
};

var TimelineEvent = /** @class */ (function () {
    function TimelineEvent($type, $name, $data) {
        this.$type = $type;
        this.$name = $name;
        this.$data = $data;
        this.$timeStamp = getTime();
    }
    return TimelineEvent;
}());

var beforeTest = [createOpen$1, aboutBlank$1];
var afterTest = [navigatePopupToItself];
var EVENT_RETENTION_LENGTH = 5000;
var Timeline = /** @class */ (function () {
    function Timeline() {
        this.events = [[]];
        this.isRecording = false;
        // Registers a unique event when it is first created.
        this.registerEvent(new TimelineEvent(0 /* CREATE */, undefined, undefined), 0);
    }
    /**
     * When an event is registered, it performs some checks by calling functions of type `condition`
     * which accepts an existing events as a first argument, and an incoming event as a second argument.
     * An object at which the event is happened is included in the event as a `data` property,
     * and such functions can act on it appropriately, for example, it can close a popup window.
     */
    Timeline.prototype.registerEvent = function (event, index) {
        var i = afterTest.length;
        while (i--) {
            afterTest[i](index, this.events, event);
        }
        var frameEvents = this.events[index];
        frameEvents.push(event);
        if (!this.isRecording) {
            setTimeout(function () {
                frameEvents.splice(frameEvents.indexOf(event), 1);
            }, EVENT_RETENTION_LENGTH);
        }
        else {
            var name_1 = event.$name ? event.$name.toString() : '';
            print("Timeline.registerEvent: " + event.$type + " " + name_1, event.$data);
        }
    };
    /**
     * Wrapped window.open calls this. If it returns false, it does not call window.open.
     * beforeTests are basically the same as the afterTests except that
     * it does not accept a second argument.
     */
    Timeline.prototype.canOpenPopup = function (index) {
        call('Inquiring events timeline about whether window.open can be called...');
        var i = beforeTest.length;
        while (i--) {
            if (!beforeTest[i](index, this.events)) {
                print('false');
                callEnd();
                return false;
            }
        }
        print('true');
        callEnd();
        return true;
    };
    Timeline.prototype.onNewFrame = function (window) {
        var pos = this.events.push([]) - 1;
        // Registers a unique event when a frame is first created.
        // It passes the `window` object of the frame as a value of `$data` property.
        this.registerEvent(new TimelineEvent(0 /* CREATE */, undefined, window), pos);
        return pos;
    };
    /**
     * Below methods are used only for logging & testing purposes.
     * It does not provide any functionality to block popups,
     * and is stipped out in production builds.
     * In dev build, the timeline instance is exposed to the global scope with a name '__t',
     * and one can call below methods of it to inspect how the popup script calls browser apis.
     * In test builds, it is used to access a private member `events`.
     */
    Timeline.prototype.startRecording = function () {
        this.isRecording = true;
    };
    /**
     * Returns an array. Its elements corresponds to frames to which the current window
     * has access, and the first element corresponds to the current window.
     */
    Timeline.prototype.takeRecords = function () {
        this.isRecording = false;
        var res = this.events.map(function (el) { return (Array.prototype.slice.call(el)); });
        var now = getTime();
        var l = this.events.length;
        while (l-- > 0) {
            var frameEvents = this.events[l];
            while (frameEvents[0]) {
                if (now - frameEvents[0].$timeStamp > EVENT_RETENTION_LENGTH) {
                    frameEvents.shift();
                }
                else {
                    break;
                }
            }
        }
        return res;
    };
    return Timeline;
}());
var timeline = typeof PARENT_FRAME_KEY === 'string' ? window.parent[PARENT_FRAME_KEY][2] : new Timeline();
var position = typeof PARENT_FRAME_KEY === 'string' ? timeline.onNewFrame(window) : 0;
// These are called from the outside of the code, so we have to make sure that call structures of those are not modified.
// It is removed in minified builds, see the gulpfile.
/** @suppress {uselessCode} */
function cc_export() {
    "REMOVE_START";
    window['registerEvent'] = timeline.registerEvent;
    window['canOpenPopup'] = timeline.canOpenPopup;
    window['onNewFrame'] = timeline.onNewFrame;
    "REMOVE_END";
}
cc_export();
window['__t'] = timeline;

// https://github.com/Polymer/WeakMap
var wm$1;
if (typeof WeakMap == 'function') {
    wm$1 = WeakMap;
}
else {
    var counter_1 = Date.now() % 1e9;
    var defineProperty_1 = Object.defineProperty;
    wm$1 = /** @class */ (function () {
        function WM() {
            this.name = '__st' + (Math.random() * 1e9 >>> 0) + (counter_1++ + '__');
        }
        WM.prototype.set = function (key, value) {
            var entry = key[this.name];
            if (entry && entry[0] === key)
                entry[1] = value;
            else
                defineProperty_1(key, this.name, { value: [key, value], writable: true });
            return this;
        };
        WM.prototype.get = function (key) {
            var entry;
            return (entry = key[this.name]) && entry[0] === key ?
                entry[1] : undefined;
        };
        WM.prototype.delete = function (key) {
            var entry = key[this.name];
            if (!entry)
                return false;
            var hasValue = entry[0] === key;
            entry[0] = entry[1] = undefined;
            return hasValue;
        };
        WM.prototype.has = function (key) {
            var entry = key[this.name];
            if (!entry)
                return false;
            return entry[0] === key;
        };
        return WM;
    }());
}
var WeakMap$1 = wm$1;

var mockObject = function (orig, mocked) {
    mocked = mocked || {};
    for (var prop in orig) {
        var desc = Object.getOwnPropertyDescriptor(orig, prop);
        if (desc) {
            switch (typeof desc.value) {
                case 'undefined':
                    break;
                case 'object':
                    mocked[prop] = {};
                    break;
                case 'function':
                    mocked[prop] = function () { return true; };
                    break;
                default:
                    mocked[prop] = orig[prop];
            }
        }
    }
    return mocked;
};
var hrefDesc = Object.getOwnPropertyDescriptor(HTMLAnchorElement.prototype, 'href');
var mockedWindowCollection = new WeakMap$1();
var mockWindow = function (href, name) {
    var win, doc;
    win = mockObject(window);
    mockObject(Window.prototype, win);
    doc = mockObject(document);
    mockObject(Document.prototype, doc);
    win['opener'] = window;
    win['closed'] = false;
    win['name'] = name;
    win['document'] = doc;
    doc['open'] = function () { return this; };
    doc['write'] = function () { };
    doc['writeln'] = function () { };
    doc['close'] = function () { };
    var loc = mockLocation(href);
    var locDesc = {
        get: function () { return loc; },
        set: function () { }
    };
    Object.defineProperty(win, _location, locDesc);
    Object.defineProperty(doc, _location, locDesc);
    mockedWindowCollection.set(win, true);
    return win;
};
var mockLocation = function (href) {
    var a = createLocation(href);
    a[_assign] = a[_replace] = hrefDesc.set;
    Object.defineProperty(a, _href, hrefDesc);
    return a;
};
var _location = 'location';
var _assign = 'assign';
var _replace = 'replace';
var _href = 'href';

var supported$1 = false;
supported$1 = typeof Proxy !== 'undefined';
/**
 * Why not use Proxy on production version?
 * Using proxy instead of an original object in some places require overriding Function#bind,apply,call,
 * and replacing such native codes into js implies serious performance effects on codes completely unrelated to popups.
 */
var _bind = Function.prototype.bind;
var _apply = Function.prototype.apply;
var _call = Function.prototype.call;
var _toStringFn = Function.prototype.toString;
var _reflect;
if (supported$1) {
    _reflect = Reflect.apply;
}
// Lodash isNative
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
var reIsNative = new RegExp('^' + _toStringFn.call(Object.prototype.hasOwnProperty).replace(reRegExpChar, '\\$&').replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$');
/**
 * Certain built-in functions depends on internal slots of 'this' of its execution context.
 * In order to make such methods of proxied objects behave identical to the original object,
 * we need to bind the original 'this' for the proxy's [[Get]] handler.
 * However, non-native functions does not have access to object's internal slots,
 * so we can safely bind the proxied objects for such non-native methods.
 * If isNativeFn test is passed, the object is either a native function,
 * or a non-native function whose function body consists of '[native code]',
 * which obviously does not have access to the internal slot of 'this'.
 */
var isNativeFn = function (fn) {
    if (typeof fn !== 'function') {
        return false;
    }
    var tostr;
    try {
        tostr = _reflect(_toStringFn, fn, []);
    }
    catch (e) {
        // The above block throws if `fn` is a Proxy constructed over a function, from a third-party code.
        // Such a proxy is still callable, so Function.prototype.(bind,apply,call) may be invoked on it.
        // It is a common practice to bind the correct `this` to methods, so we try in that way.
        try {
            tostr = fn.toString();
        }
        catch (e) {
            // In this case, we bail out, hoping for a third-party code does not mess with internal slots.
            return false;
        }
    }
    return reIsNative.test(tostr);
};
// See HTMLIFrame.ts
var proxyToReal = typeof PARENT_FRAME_KEY === 'string' ? window.parent[PARENT_FRAME_KEY][0] : new WeakMap$1();
var realToProxy = typeof PARENT_FRAME_KEY === 'string' ? window.parent[PARENT_FRAME_KEY][1] : new WeakMap$1();
var expose = function (key) { window[key] = [proxyToReal, realToProxy, timeline, adguard.storageProvider]; };
var unexpose = function (key) { delete window[key]; };
/**
 * An apply handler to be used to proxy Function#(bind, apply, call) methods.
 * Example: (Event.prototype.addEventListener).call(window, 'click', function() { });
 * target: Function.prototype.call
 * _this: Event.prototype.addEventListener
 * _arguments: [window, 'click', function() { }]
 * We unproxies 'window' in the above case.
 *
 * @param target Must be one of Function#(bind, apply, call).
 * @param _this A function which called (bind, apply, call).
 * @param _arguments
 */
var applyWithUnproxiedThis = function (target, _this, _arguments) {
    // Convert _arguments[0] to its unproxied version
    // When it is kind of object which may depend on its internal slot
    var _caller = proxyToReal.get(_this) || _this;
    if (isNativeFn(_caller) && _caller !== _bind && _caller !== _apply && _caller !== _call) {
        // Function#(bind, apply, call) does not depend on the target's internal slots,
        // In (Function.prototype.call).apply(Function.prototype.toString, open)
        // we should not convert Function.prototype.toString to the original function.
        var thisOfReceiver = _arguments[0];
        var unproxied = proxyToReal.get(thisOfReceiver);
        if (unproxied) {
            _arguments[0] = unproxied;
        }
    }
    return _reflect(target, _this, _arguments);
};
/**
 * An apply handler to make Reflect.apply handler
 * Reflect.apply(EventTarget.prototype.addEventListener, proxideWindow, ['click', function(){}])
 */
var reflectWithUnproxiedThis = function (target, _this, _arguments) {
    var appliedFn = _arguments[0];
    appliedFn = proxyToReal.get(appliedFn) || appliedFn;
    if (isNativeFn(appliedFn) && appliedFn !== _bind && appliedFn !== _apply && appliedFn !== _call) {
        var thisOfAppliedFn = _arguments[1];
        var unproxied = proxyToReal.get(thisOfAppliedFn);
        if (unproxied) {
            _arguments[1] = unproxied;
        }
    }
    return _reflect(target, _this, _arguments);
};
/**
 * An apply handler to make invoke handler.
 */
var invokeWithUnproxiedThis = function (target, _this, _arguments) {
    var unproxied = proxyToReal.get(_this);
    if (typeof unproxied == 'undefined') {
        unproxied = _this;
    }
    return supported$1 ? _reflect(target, unproxied, _arguments) : target.apply(unproxied, _arguments);
};
/**
 * An apply handler to be used for MessageEvent.prototype.source.
 */
var proxifyReturn = function (target, _this, _arguments) {
    var ret = _reflect(target, _this, _arguments);
    var proxy = realToProxy.get(ret);
    if (proxy) {
        ret = proxy;
    }
    return ret;
};
var reportGetToTL = function (target, prop, receiver) {
    var _receiver = proxyToReal.get(receiver) || receiver;
    timeline.registerEvent(new TimelineEvent(2 /* GET */, prop, _receiver), position);
    var value = Reflect.get(target, prop, _receiver);
    if (isNativeFn(value)) {
        return makeFunctionWrapper(value, invokeWithUnproxiedThis);
    }
    else if ((prop === 'location' && mockedWindowCollection.get(target)) ||
        (isLocation(value) || isWindow(value))) {
        // We deep-proxy such objects.
        // Such `value` objects won't be used as arguments of built-in functions, which may
        // depend on internal slots of its arguments.
        // For instance, `createNodeIterator` does not work if its first arguments is a proxied `Node` instance.
        // Fix https://github.com/AdguardTeam/PopupBlocker/issues/52
        // We should not deep-proxy when it is impossible to return proxy
        // due to invariants imposed to `Proxy`.
        // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/get
        var desc = Reflect.getOwnPropertyDescriptor(target, prop);
        if (desc && desc.writable === false && desc.configurable === false) {
            return value;
        }
        return makeObjectProxy(value);
    }
    else {
        return value;
    }
};
var reportSetToTL = function (target, prop, value, receiver) {
    var _receiver = proxyToReal.get(receiver) || receiver;
    var data = {
        this: _receiver,
        arguments: [value]
    };
    timeline.registerEvent(new TimelineEvent(3 /* SET */, prop, data), position);
    return Reflect.set(target, prop, value, _receiver);
};
function makeObjectProxy(obj) {
    if (obj === null || typeof obj !== 'object' || !supported$1) {
        return obj;
    }
    var proxy = realToProxy.get(obj);
    if (proxy) {
        return proxy;
    }
    proxy = new Proxy(obj, {
        get: reportGetToTL,
        set: reportSetToTL
    });
    realToProxy.set(obj, proxy);
    proxyToReal.set(proxy, obj);
    return proxy;
}
var defaultApplyHandler = supported$1 ? _reflect : function (_target, _this, _arguments) { return (_target.apply(_this, _arguments)); };
function makeFunctionWrapper(orig, applyHandler) {
    var wrapped;
    var proxy = realToProxy.get(orig);
    if (proxy) {
        return proxy;
    }
    if (supported$1) {
        wrapped = new Proxy(orig, { apply: applyHandler });
    }
    else {
        wrapped = function () { return applyHandler(orig, this, arguments); };
        copyProperty(orig, wrapped, 'name');
        copyProperty(orig, wrapped, 'length');
    }
    proxyToReal.set(wrapped, orig);
    realToProxy.set(orig, wrapped);
    return wrapped;
}
function copyProperty(orig, wrapped, prop) {
    var desc = Object.getOwnPropertyDescriptor(orig, prop);
    if (desc && desc.configurable) {
        desc.value = orig[prop];
        Object.defineProperty(wrapped, prop, desc);
    }
}
/**
 * @param option Can be a boolean 'false' to disable logging, or can be a function which accepts the same type
 * of params as ApplyHandler and returns booleans which indicates whether to log it or not.
 */
function makeLoggedFunctionWrapper(orig, type, name, applyHandler, option) {
    applyHandler = applyHandler || defaultApplyHandler;
    if (option === false) {
        return makeFunctionWrapper(orig, applyHandler);
    }
    return makeFunctionWrapper(orig, function (target, _this, _arguments) {
        var context = {};
        if (typeof option == 'undefined' || option(target, _this, _arguments)) {
            var data = {
                this: _this,
                arguments: _arguments,
                context: context
            };
            timeline.registerEvent(new TimelineEvent(type, name, data), position);
        }
        return applyHandler(target, _this, _arguments, context);
    });
}
function wrapMethod(obj, prop, applyHandler, option) {
    if (obj.hasOwnProperty(prop)) {
        obj[prop] = makeLoggedFunctionWrapper(obj[prop], 1 /* APPLY */, prop, applyHandler, option);
    }
}
function wrapAccessor(obj, prop, getterApplyHandler, setterApplyHandler, option) {
    var desc = Object.getOwnPropertyDescriptor(obj, prop);
    if (desc && desc.get && desc.configurable) {
        var getter = makeLoggedFunctionWrapper(desc.get, 2 /* GET */, prop, getterApplyHandler, option);
        var setter;
        if (desc.set) {
            setter = makeLoggedFunctionWrapper(desc.set, 3 /* SET */, prop, setterApplyHandler, option);
        }
        Object.defineProperty(obj, prop, {
            get: getter,
            set: setter,
            configurable: true,
            enumerable: desc.enumerable
        });
    }
}
if (supported$1) {
    wrapMethod(Function.prototype, 'bind', applyWithUnproxiedThis, false);
    wrapMethod(Function.prototype, 'apply', applyWithUnproxiedThis, false);
    wrapMethod(Function.prototype, 'call', applyWithUnproxiedThis, false);
    wrapMethod(Reflect, 'apply', reflectWithUnproxiedThis, false);
    wrapAccessor(MessageEvent.prototype, 'source', proxifyReturn, undefined, false);
}
wrapMethod(Function.prototype, 'toString', invokeWithUnproxiedThis, false);
wrapMethod(Function.prototype, 'toSource', invokeWithUnproxiedThis, false);

var CurrentMouseEvent = /** @class */ (function () {
    function CurrentMouseEvent() {
        var mousedownQueue = [];
        var mouseupQueue = [];
        var clickQueue = [];
        var removeFromQueue = function (array, el) {
            var i = array.indexOf(el);
            if (i != -1) {
                array.splice(i, 1);
            }
        };
        var captureListener = function (queue) {
            return function (evt) {
                queue.push(evt);
                /**
                 * Schedules dequeueing in next task. It will be executed once all event handlers
                 * for the current event fires up. Note that task queue is flushed between the end of
                 * `mousedown` event handlers and the start of `mouseup` event handlers, but may not between
                 * the end of `mouseup` and `click` depending on browsers.
                 */
                setTimeout(removeFromQueue.bind(null, queue, evt));
            };
        };
        window.addEventListener('mousedown', captureListener(mousedownQueue), true);
        window.addEventListener('mouseup', captureListener(mouseupQueue), true);
        window.addEventListener('click', captureListener(clickQueue), true);
        /**
         * Some events in event queues may have been finished firing event handlers,
         * either by bubbling up to `window` or by `Event#(stopPropagation,stopImmediatePropagation)`
         * or by `Event#cancelBubble`. Such events will satisfy `.currentTarget === null`. We skip
         * such events.
         */
        var getLatest = function (queue) {
            var l = queue.length;
            var evt;
            while (!evt || !evt.currentTarget) {
                if (l === 0) {
                    return undefined;
                }
                evt = queue[--l];
            }
            return evt;
        };
        /**
         * When there are latest events of different types,
         * we choose the latest one.
         */
        var compareTimestamp = function (a, b) {
            if (!a) {
                return 1;
            }
            if (!b) {
                return -1;
            }
            return b.timeStamp - a.timeStamp;
        };
        this.getCurrentMouseEvent = function () {
            call('getCurrentClickEvent');
            var md = getLatest(mousedownQueue);
            var mu = getLatest(mouseupQueue);
            var cl = getLatest(clickQueue);
            var evt = [cl, md, mu].sort(compareTimestamp)[0];
            print('Retrieved event is: ', evt);
            callEnd();
            return evt;
        };
    }
    return CurrentMouseEvent;
}());

var hasDefaultHandler = function (el) {
    var name = getTagName(el);
    if (name == 'IFRAME' || name == 'INPUT' || name == 'A' || name == 'BUTTON' || el.hasAttribute('onclick') || el.hasAttribute('onmousedown') || el.hasAttribute('onmouseup')) {
        return true;
    }
    return false;
};
var eventTargetIsRootNode = function (el) {
    if (isWindow(el)) {
        return true;
    }
    if (isNode(el)) {
        var name_1 = getTagName(el);
        // Technically, document.body can be a frameset node,
        // but ui events originating from its child frames won't propagate
        // past the frame border, so such cases are irrelevant.
        // https://www.w3.org/TR/html401/present/frames.html
        if (name_1 === '#DOCUMENT' || name_1 === 'HTML' || name_1 === 'BODY') {
            return true;
        }
    }
    return false;
};
var maskStyleTest = function (el) {
    var style = getComputedStyle(el);
    var position = style.getPropertyValue('position');
    var zIndex = style.getPropertyValue('z-index');
    // Theoretically, opacity css property can be used to make masks as well
    // but hasn't encountered such usage in the wild, so not including it.
    if (position !== 'static' && parseInt(zIndex, 10) > 1000) {
        return true;
    }
    return false;
};
var maskContentTest = function (el) {
    var textContent = el.textContent;
    if (textContent && textContent.trim().length) {
        return false;
    }
    return el.getElementsByTagName('img').length === 0;
};
/**
 * Detects common overlay pattern.
 * @param el an element to check whether it is an overlay.
 * @return true if el is an overlay.
 */
function maybeOverlay(el) {
    if (!isHTMLElement(el)) {
        return false;
    } // not an HTMLElement instance
    call('maybeOverlay test');
    var w = window.innerWidth, h = window.innerHeight;
    if (el.offsetLeft << 4 < w && (w - el.offsetWidth) << 3 < w
        && el.offsetTop << 4 < h && (h - el.offsetHeight) << 3 < w) {
        return maskStyleTest(el);
    }
    // ToDo: the element may have been modified in the event handler.
    // We may still test it using the inline style attribute.
    callEnd();
    return false;
}

/**
 * @fileoverview Current popup detection mechanism relies heavily on `Event#currentTarget`,
 * and some JS frameworks that use event delegation tend to hide event listeners' intended target.
 * For popular frameworks among such, we attempt to utilize frameworks' specifics to provide
 * a way to retrieve an intended target, or at least detect it in order to reduce false-positives.
 * Such workarounds are not very robust, hence 'attempt', but it will still provide huge benefit to users.
 */
var _data = '_data';
var selector = 'selector';
/**
 * A function to retrieve target selectors from jQuery event delegation mechanism.
 * When an event handler is bound with jQuery like this:
 * `$('html').on('click', '.open-newtab', function(evt) { ... })`
 * inside of the event handler function, `evt.currentTarget` will be `document.documentElement`.
 * When this function is called with `evt`, it will return `'.open-newtab'`, and from this we know that
 * the event handler is not supposed to be called when user clicks anywhere.
 *
 * It makes use of an undocumented static method `_data` of `jQuery`. It has existed for a long time
 * and not likely to be removed in a near future according to https://github.com/jquery/jquery/issues/2583.
 * @param event
 */
function getSelectorFromCurrentjQueryEventHandler(event) {
    var jQuery = window['jQuery'] || window['$'];
    if (!jQuery || !jQuery[_data]) {
        return;
    }
    var current = event.currentTarget;
    var type = event.type;
    var eventsData = jQuery[_data](current, 'events');
    if (!eventsData) {
        return;
    }
    var registeredHandlers = eventsData[type];
    if (!registeredHandlers) {
        return;
    }
    var handlerObj;
    for (var i = 0, l = registeredHandlers.length; i < l; i++) {
        if (handlerObj = registeredHandlers[i]) {
            var handler = handlerObj.handler;
            try {
                // Using Function.arguments, so it may not work on handlers that are nested in call stack
                var args = handler.arguments;
                if (args !== null && args[0] && args[0].originalEvent === event) {
                    return handlerObj[selector];
                }
            }
            catch (e) {
                continue;
            }
        }
    }
}
/**
 * React production build by default attaches an event listener to `document`
 * and processes all events in its internel 'event hub'. It should be possible
 * to retrieve information about the intended target component or target element
 * technically, but for now, we instead fallback to allowing events whose `currentTarget`
 * is `document`. It needs to be improved if it causes missed popups on websites
 * which use react and popups at the same time, or it is challenged by popup scripts.
 */
var reactRootSelector = '[data-reactroot]';
var reactIdSelector = '[data-reactid]';
function isReactInstancePresent() {
    return !!document.querySelector(reactRootSelector) || !!document.querySelector(reactIdSelector);
}
/**
 * https://github.com/google/jsaction
 */
function jsActionTarget(event) {
    var target = event.target;
    if (isElement(target)) {
        var type = event.type;
        var possibleTarget = closest(target, "[jsaction*=\"" + type + ":\"]");
        if (possibleTarget && possibleTarget.hasOwnProperty('__jsaction')) {
            var action = possibleTarget['__jsaction'];
            if (action.hasOwnProperty(type)) {
                return possibleTarget;
            }
        }
    }
}
var reGtmWindowName = /^gtm\_autoEvent/;
var gtmScriptTagSelector = 'script[src*="googletagmanager.com/gtm.js"]';
var defaultGtmVariableName = 'dataLayer';
var reGTMVariableName = /[\?&]l=([^&]*)(?:&|$)/;
var gtmLinkClickEventName = 'gtm.linkClick';
/**
 * Google Tag Manager can be configured to fire tags upon link clicks, and in certian cases,
 * gtm script calls `window.open` to simulate a click on an anchor tag.
 * such call occurs inside of an event handler attached to `document`, so it is considered
 * suspicious by `verifyEvent`.
 * This function performs a minimal check of whether the `open` call is triggered by gtm.
 * See: https://github.com/AdguardTeam/PopupBlocker/issues/36
 */
function isGtmSimulatedAnchorClick(event, windowName) {
    if (!reGtmWindowName.test(windowName)) {
        return false;
    }
    if (event.eventPhase !== 3 /* Event.BUBBLING_PHASE */) {
        return false;
    }
    // Locate googletagManager script
    var scriptTags = document.querySelectorAll(gtmScriptTagSelector);
    var l = scriptTags.length;
    if (l === 0) {
        return false;
    }
    while (l--) {
        var scriptTag = scriptTags[l];
        var src = scriptTag.src;
        var gtmVariableName = defaultGtmVariableName;
        var match = reGTMVariableName.exec(src);
        if (match) {
            gtmVariableName = match[1];
        }
        var dataLayer = window[gtmVariableName];
        if (!dataLayer) {
            continue;
        }
        var latestEvent = dataLayer[dataLayer.length - 1];
        if (latestEvent && latestEvent.event == gtmLinkClickEventName) {
            return true;
        }
    }
    return false;
}

/**
 * On IE 10 and lower, window.event is a `MSEventObj` instance which does not implement `target` property.
 * We use a polyfill for such cases.
 */
var supported$2 = 'event' in window && (!('documentMode' in document) || (document.documentMode === 11));
var currentMouseEvent;
if (!supported$2) {
    print('window.event is not supported.');
    currentMouseEvent = (new CurrentMouseEvent()).getCurrentMouseEvent;
}
else {
    print('window.event is supported.');
}
/**
 * Gets the event that is being currently handled.
 * @suppress {es5Strict}
 */
function retrieveEvent() {
    call('Retrieving event');
    var win = window;
    var currentEvent;
    if (supported$2) {
        currentEvent = win.event;
        while (!currentEvent) {
            var parent_1 = win.parent;
            if (parent_1 === win) {
                break;
            }
            win = parent_1;
            try {
                currentEvent = win.event;
            }
            catch (e) {
                // Cross-origin error
                break;
            }
        }
    }
    else {
        currentEvent = currentMouseEvent();
    }
    if (!currentEvent) {
        print('window.event does not exist, trying to get event from Function.caller');
        try {
            var caller = arguments.callee;
            var touched = new WeakMap$1();
            while (caller.caller) {
                caller = caller.caller;
                if (touched.has(caller)) {
                    throw "Recursion in the call stack";
                }
                touched.set(caller, true);
            }
            print('Reached at the top of caller chain.');
            if (caller.arguments && caller.arguments[0] && 'target' in caller.arguments[0]) {
                currentEvent = caller.arguments[0];
                print('The function at the bottom of the stack has an expected type. The current event is:', currentEvent);
            }
            else {
                print('The function at the bottom of the call stack does not have an expected type.', caller.arguments[0]);
            }
        }
        catch (e) {
            print('Getting event from Function.caller failed, due to an error:', e);
        }
    }
    else {
        print('window.event exists, of which the value is:', currentEvent);
    }
    callEnd();
    return currentEvent;
}

/**
 * @param event Optional argument, an event to test with. Default value is currentEvent.
 * @return True if the event is legit, false if it is something that we should not allow window.open or dispatchEvent.
 */
var verifyEvent = connect(function (event) {
    if (event) {
        if ((!isMouseEvent(event) || !isClickEvent(event)) && !isTouchEvent(event)) {
            return true;
        }
        var currentTarget = event.currentTarget;
        if (currentTarget) {
            print('Event is:', event);
            print('currentTarget is: ', currentTarget);
            if (eventTargetIsRootNode(currentTarget)) {
                var eventPhase = event.eventPhase;
                print('Phase is: ' + eventPhase);
                // Workaround for jsaction
                var maybeJsActionTarget = jsActionTarget(event);
                if (maybeJsActionTarget) {
                    print('maybeJsActionTarget');
                    if (eventTargetIsRootNode(maybeJsActionTarget)) {
                        return false;
                    }
                    else {
                        print('jsActionTarget is not a root');
                        return true;
                    }
                }
                if (eventPhase === 1 /* Event.CAPTURING_PHASE */ || eventPhase === 2 /* Event.AT_TARGET */) {
                    print('VerifyEvent - the current event handler is suspicious, for the current target is either window, document, html, or body.');
                    return false;
                }
                else {
                    print('VerifyEvent - the current target is document/html/body, but the event is in a bubbling phase.');
                    // Workaround for jQuery
                    var selector = getSelectorFromCurrentjQueryEventHandler(event);
                    if (selector) {
                        if (matches.call(document.documentElement, selector) || matches.call(document.body, selector)) {
                            return false;
                        }
                    }
                    else if (!isReactInstancePresent() || (isNode(currentTarget) && getTagName(currentTarget) !== '#DOCUMENT')) {
                        // Workaround for React
                        return false;
                    }
                }
                // When an overlay is being used, checking for useCapture is not necessary.
            }
            else if (isElement(currentTarget) && maybeOverlay(currentTarget)) {
                print('VerifyEvent - the current event handler is suspicious, for the current target looks like an artificial overlay.');
                return false;
            }
        }
    }
    return true;
}, 'Verifying event', function () { return arguments[0]; });

/**
 * @fileoverview Keeps a reference of MutationObserver constructor.
 * Other than this being more succinct, we need to retrieve a reference
 * from a 'persistent' frame, because it seems that browser discards
 * from the DOM the observer when the originating frame is detached
 * from the document.
 */
var parent$1 = getSafeNonEmptyParent(window);
var MO = parent$1.MutationObserver || parent$1.WebKitMutationObserver;

/**
 * @fileoverview Certain popunder scripts exploits chrome pdf plugin to gain focus of a window.
 * The purpose of this mutation observer is to detect an insertion of pdf document during a short time
 * after a popup is blocked, and neutralize it.
 * Without this, a prompt window "Please wait..." can be displayed. This can also be prevented by
 * aborting a popunder script's execution, but I suppose this is a more gentle way.
 */
var PdfObjectObserver = /** @class */ (function () {
    function PdfObjectObserver() {
        this.lastActivated = 0;
        this.callback = connect(function (mutations, observer) {
            print('mutations:', mutations);
            var i = mutations.length;
            while (i--) {
                var mutation = mutations[i];
                var addedNodes = mutation.addedNodes;
                if (addedNodes) {
                    var j = addedNodes.length;
                    while (j-- > 0) {
                        var addedNode = addedNodes[j];
                        if (isElement(addedNode)) {
                            var objectNodes = addedNode.querySelectorAll(PdfObjectObserver.pdfObjectSelector);
                            if (objectNodes) {
                                var k = objectNodes.length;
                                while (k-- > 0) {
                                    var objectNode = objectNodes[k];
                                    PdfObjectObserver.neutralizeDummyPdf(objectNode);
                                }
                            }
                        }
                    }
                }
            }
        }, 'pdfObjectObserver callback fired');
        if (MO)
            this.observer = new MO(this.callback);
    }
    PdfObjectObserver.prototype.$start = function () {
        var _this = this;
        if (this.observer && this.lastActivated === 0) {
            var frame = getSafeNonEmptyParent(window);
            if (frame) {
                var docEl = frame.document.documentElement;
                this.observer.observe(docEl, PdfObjectObserver.option);
                print('MO started at ' + getTime());
                this.lastActivated = getTime();
            }
        }
        setTimeout(function () {
            _this.stop();
        }, PdfObjectObserver.OBSERVE_TIME);
    };
    PdfObjectObserver.prototype.stop = function () {
        if (this.observer && this.lastActivated !== 0) {
            this.observer.disconnect();
            this.lastActivated = 0;
        }
    };
    PdfObjectObserver.OBSERVE_TIME = 200;
    PdfObjectObserver.pdfObjectSelector = 'object[data^="data:application/pdf"]';
    PdfObjectObserver.option = {
        childList: true,
        subtree: true
    };
    PdfObjectObserver.neutralizeDummyPdf = function (el) {
        el.removeAttribute('data');
    };
    return PdfObjectObserver;
}());
var pdfObjObserver = new PdfObjectObserver();

var onbeforeunloadHandler = function (evt) {
    var MSG = adguard.storageProvider.$getMessage('on_navigation_by_popunder');
    evt.returnValue = MSG;
    return MSG;
};
var setBeforeunloadHandler = function () {
    // ToDo: if this is found to be useful, consider making it work on cross-origin iframes
    if (window === window.top) {
        call("Attaching beforeunload event handler");
        window.addEventListener('beforeunload', onbeforeunloadHandler);
        setTimeout(function () {
            window.removeEventListener('beforeunload', onbeforeunloadHandler);
        }, 1000);
        callEnd();
    }
};

/**
 * Some popup scripts adds transparent overlays on each of page's links
 * which disappears only when popups are opened.
 * To restore the expected behavior, we need to detect if the event is 'masked' by artificial layers
 * and redirect it to the correct element.
 * It will return true if no mask was detected and we should throw to abort script execution.
 * ToDo: we may need to prevent `preventDefault` in touch events
 */
var examineTarget = function (currentEvent, targetHref) {
    print('Event is:', currentEvent);
    if (!currentEvent.isTrusted) {
        return;
    }
    var target;
    var x, y;
    if (isMouseEvent(currentEvent)) {
        // mouse event
        print("It is a mouse event");
        target = currentEvent.target;
        x = currentEvent.clientX;
        y = currentEvent.clientY;
    }
    else if (isTouchEvent(currentEvent)) {
        // This is just a stuff. It needs more research.
        target = currentEvent.target;
        var touch = currentEvent.changedTouches[0];
        if (!touch) {
            return;
        }
        x = touch.clientX;
        y = touch.clientY;
    }
    if (!target || !isElement(target)) {
        return;
    }
    // Use elementsFromPoint API
    var candidates;
    if (document.elementsFromPoint) {
        candidates = document.elementsFromPoint(x, y);
    }
    else if (document.msElementsFromPoint) {
        candidates = document.msElementsFromPoint(x, y);
    }
    else {
        print("elementsFromPoint api is missing, exiting..");
        return;
        // log something
    }
    print('ElementsFromPoint:', candidates);
    // Use Event#deepPath API
    var path;
    if ('path' in currentEvent) {
        path = currentEvent.path;
    }
    else if ('composedPath' in currentEvent) {
        path = currentEvent.composedPath();
    }
    /**
     * This is a heuristic. I won't try to make it robust by following specs for now.
     * ToDo: make the logic more modular and clear.
     * https://drafts.csswg.org/cssom-view/#dom-document-elementsfrompoint
     * https://philipwalton.com/articles/what-no-one-told-you-about-z-index/
     */
    var candidate;
    var i = 0;
    var j = 0;
    var l = candidates.length;
    var parent;
    var check = false;
    if (candidates[0] !== target) {
        print('A target has changed in an event listener');
        i = -1;
    }
    // Unrolling first iteration
    candidate = parent = target;
    while (parent) {
        if (hasDefaultHandler(parent)) {
            check = true;
            break;
        }
        if (maskStyleTest(parent)) {
            break;
        }
        if (path) {
            if (!isElement(path[++j])) {
                parent = null;
            }
            else {
                parent = path[j];
            }
        }
        else {
            parent = parent.parentElement;
        }
    }
    if (check) {
        // Parent has a default event handler.
        if (parent && getTagName(parent) === 'A') {
            // Can't set beforeunload handler here; it may prevent legal navigations.
            if (parent.href === targetHref) {
                print("Throwing, because the target url is an href of an eventTarget or its ancestor");
                abort();
            }
            if (maybeOverlay(parent)) {
                // We should check elements behind this if there is a real target.
                print("current target looks like an overlay");
                check = false;
                preventPointerEvent(parent);
            }
        }
        else {
            return;
        }
    }
    if (location.href === targetHref) {
        print("Throwing, because the target url is the same as the current url");
        abort();
    }
    if (!parent || !maskContentTest(candidate)) {
        setBeforeunloadHandler();
        return;
    }
    if (!check) {
        iterate_candidates: while (i < l - 1) {
            if (candidate.parentElement === (candidate = candidates[++i])) {
                continue;
            }
            parent = candidate;
            while (parent) {
                if (hasDefaultHandler(parent)) {
                    check = true;
                    break iterate_candidates;
                }
                if (maskStyleTest(parent)) {
                    break;
                }
                parent = parent.parentElement;
            }
            if (maskContentTest(candidate)) {
                // found a mask-looking element
                continue;
            }
            else {
                break;
            }
        }
    }
    // Performs mask neutralization and event delivery
    if (check) {
        print("Detected a mask");
        preventPointerEvent(target);
        while (i-- > 0) {
            preventPointerEvent(candidates[i]);
        }
        var args = initMouseEventArgs.map(function (prop) { return currentEvent[prop]; });
        dispatchMouseEvent(args, candidate);
    }
};
var preventPointerEvent = function (el) {
    if (!isHTMLElement(el)) {
        return;
    }
    el.style.setProperty('display', "none", important);
    el.style.setProperty('pointer-events', "none", important);
};
var important = 'important';
var examineTarget$1 = connect(examineTarget, 'Examining Target');

function onBlocked(popup_url, isGeneric, currentEvent) {
    createAlertInTopFrame(adguard.storageProvider.domain, popup_url, isGeneric);
    pdfObjObserver.$start();
    if (currentEvent) {
        examineTarget$1(currentEvent, popup_url);
    }
}

var openVerifiedWindow = function (_open, _this, _arguments, context) {
    if (adguard.storageProvider.originIsWhitelisted()) {
        return _open.apply(_this, _arguments);
    }
    var targetHref = _arguments[0];
    call('Called window.open with url ' + targetHref);
    var url = createUrl(targetHref);
    var destDomain = url[1];
    if (adguard.storageProvider.destinationIsWhitelisted(destDomain)) {
        print("The domain " + destDomain + " is in whitelist.");
        return _open.apply(_this, _arguments);
    }
    var currentEvent = retrieveEvent();
    var win;
    verification: {
        var passed = verifyEvent(currentEvent);
        if (!passed) {
            if (!isGtmSimulatedAnchorClick(currentEvent, _arguments[1])) {
                break verification;
            }
        }
        print('event verified, inquiring event timeline..');
        if (!timeline.canOpenPopup(position)) {
            print('canOpenPopup returned false');
            break verification;
        }
        print('calling original window.open...');
        win = _open.apply(_this, _arguments);
        win = makeObjectProxy(win);
        callEnd();
        return win;
    }
    onBlocked(url[2], false, currentEvent);
    print('mock a window object');
    // Return a mock window object, in order to ensure that the page's own script does not accidentally throw TypeErrors.
    win = mockWindow(_arguments[0], _arguments[1]);
    win = makeObjectProxy(win);
    context['mocked'] = true;
    callEnd();
    return win;
};
wrapMethod(window, 'open', openVerifiedWindow);
wrapMethod(window.Window.prototype, 'open', openVerifiedWindow); // for IE

var clickVerified = function (_click, _this, _arguments, context) {
    if (getTagName(_this) === 'A') {
        print('click() was called on an anchor tag');
        if (adguard.storageProvider.originIsWhitelisted()) {
            return _click.call(_this);
        }
        // Checks if an url is in a whitelist
        var url = createUrl(_this.href);
        var destDomain = url[1];
        if (adguard.storageProvider.destinationIsWhitelisted(destDomain)) {
            print("The domain " + destDomain + " is in whitelist.");
            _click.call(_this);
            return;
        }
        var currentEvent = retrieveEvent();
        if (!verifyEvent(currentEvent)) {
            print('It did not pass the test, not clicking element');
            onBlocked(url[2], false, currentEvent);
            return;
        }
    }
    _click.call(_this);
};
wrapMethod(HTMLElement.prototype, 'click', connect(clickVerified, 'Verifying click'));

var dispatchVerifiedEvent = function (_dispatchEvent, _this, _arguments, context) {
    var evt = _arguments[0];
    if (isMouseEvent(evt) && isClickEvent(evt) && getTagName(_this) === 'A' && !evt.isTrusted) {
        call('It is a MouseEvent on an anchor tag.');
        print('dispatched event is:', evt);
        if (adguard.storageProvider.originIsWhitelisted()) {
            return _dispatchEvent.call(_this, evt);
        }
        // Checks if an url is in a whitelist
        var url = createUrl(_this.href);
        var destDomain = url[1];
        if (adguard.storageProvider.destinationIsWhitelisted(destDomain)) {
            print("The domain " + destDomain + " is in whitelist.");
            return _dispatchEvent.call(_this, evt);
        }
        var currentEvent = retrieveEvent();
        if (!verifyEvent(currentEvent)) {
            // Before blocking an artificial click, we perform another check:
            // Page's script may try to re-dispatch certain events inside of
            // its handlers. In such case, targets of each events will be closely related,
            // and we allow such cases.
            // In case of popup/popunder scripts, the target of an event to be dispatched
            // is normally an anchor tag that is just created or is detached to the document.
            // See: https://github.com/AdguardTeam/PopupBlocker/issues/49
            var currentTarget = currentEvent.target;
            if (!isNode(currentTarget) ||
                // Certain iOS browser allow text nodes as event targets.
                // We treat its parent as a correct target in such cases.
                !(currentTarget.nodeType === 3 /* Node.TEXT_NODE */ ? currentTarget.parentNode : currentTarget).contains(_this)) {
                print('It did not pass the test, not dispatching event');
                onBlocked(url[2], false, currentEvent);
                callEnd();
                return false;
            }
            print("dispatched event's target is contained in the original target.");
        }
        print("It passed the test");
        callEnd();
    }
    return _dispatchEvent.call(_this, evt);
};
var logUIEventOnly = function (target, _this, _arguments) {
    return isUIEvent(_this);
};
var eventTarget = window.EventTarget || window.Node;
wrapMethod(eventTarget.prototype, 'dispatchEvent', dispatchVerifiedEvent, logUIEventOnly);

/**
 * @fileoverview Applies the userscript to iframes which has `location.href` `about:blank`.
 * It evaluates the code to the iframe's contentWindow when its getter is called for the first time.
 * There is a 2-way binding we are maintaining in proxy.ts between objects and proxied objects,
 * and this must be shared to the iframe, because objects can be passed back and forth between
 * the parent and the child iframes. To do so, we temporarily expose 2 weakmaps to the global scope
 * just before calling `eval`, and deletes it afterwards.
 * When debugging is active, iframe elements are printed to consoles, and some browsers may
 * invoke the contentWindow's getter. This may cause an infinite loop, so we do not apply the main block of eval'ing
 * the userscript when it is being processed, and to do so, we store such informaction in a `beingProcessed` WeakMap instance.
 */
var processed = new WeakMap$1();
var beingProcessed = new WeakMap$1();
var getContentWindow = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'contentWindow').get;
var applyPopupBlockerOnGet = function (_get, _this) {
    if (!processed.has(_this)) {
        if (!beingProcessed.has(_this)) {
            call('getContent');
            beingProcessed.set(_this, true);
            var key = Math.random().toString(36).substr(7);
            var contentWindow = getContentWindow.call(_this);
            try {
                if (isEmptyUrl(contentWindow.location.href)) {
                    print('An empty iframe called the contentWindow/Document getter for the first time, applying popupBlocker..', _this);
                    expose(key);
                    var code = '(' + popupBlocker.toString() + ')(window,"' + key + '");';
                    contentWindow.eval(code); // Injects the code wrapping browser apis to the child context.
                    unexpose(key);
                }
            }
            catch (e) {
                print('Applying popupBlocker to an iframe failed, due to an error:', e);
            }
            finally {
                processed.set(_this, true);
                beingProcessed.delete(_this);
                callEnd();
            }
        }
    }
    return makeObjectProxy(_get.call(_this));
};
wrapAccessor(HTMLIFrameElement.prototype, 'contentWindow', applyPopupBlockerOnGet);
wrapAccessor(HTMLIFrameElement.prototype, 'contentDocument', applyPopupBlockerOnGet);
wrapAccessor(HTMLIFrameElement.prototype, 'src'); // logging only
wrapAccessor(HTMLIFrameElement.prototype, 'srcdoc');

wrapAccessor(window.HTMLObjectElement.prototype, 'data');

wrapMethod(window.Node.prototype, 'appendChild'); //This cause too much noise during document startup
wrapMethod(window.Node.prototype, 'removeChild');

wrapMethod(Document.prototype, 'write');
wrapMethod(Document.prototype, 'writeIn');

var allowVerifiedCall = function (_orig, _this) {
    var currentEvent = retrieveEvent();
    if (isMouseEvent(_this)) {
        if (_this === currentEvent) {
            if (currentEvent.eventPhase === 1 && !verifyEvent(currentEvent)) {
                print('Not allowing');
                return;
            }
        }
    }
    return _orig.call(_this);
};
wrapMethod(Event.prototype, 'preventDefault', connect(allowVerifiedCall, 'Performing verification on preventDefault..', function () {
    return isMouseEvent(arguments[1]);
}));

var OverlayAnchorObserver = /** @class */ (function () {
    function OverlayAnchorObserver() {
        var _this = this;
        this.lastFired = 0;
        this.callbackTimer = -1;
        this.callback = function (mutations, observer) {
            _this.lastFired = getTime();
            _this.callbackTimer = -1;
            var el = OverlayAnchorObserver.hitTest();
            if (el) {
                OverlayAnchorObserver.preventPointerEventIfOverlayAnchor(el);
            }
        };
        this.clicked = false;
        this.throttledCallback = function (mutations, observer) {
            var time = getTime() - _this.lastFired;
            if (_this.clicked) {
                if (_this.callbackTimer !== -1) {
                    return;
                }
                if (time > 50) {
                    _this.callback(mutations, observer);
                }
                else {
                    _this.callbackTimer = setTimeout(function () {
                        _this.callback(mutations, observer);
                    }, 50 - time);
                }
            }
        };
        window.addEventListener('mousedown', function (evt) {
            if (evt.isTrusted) {
                _this.clicked = true;
                clearTimeout(_this.clickTimer);
                _this.clickTimer = setTimeout(function () {
                    _this.clicked = false;
                }, 200);
            }
        }, true);
        if (MO) {
            this.observer = new MO(this.throttledCallback);
            this.observer.observe(document.documentElement, OverlayAnchorObserver.option);
        }
    }
    OverlayAnchorObserver.hitTest = function () {
        var w = window.innerWidth, h = window.innerHeight;
        var el = document.elementFromPoint(w >> 1, h >> 1);
        return el;
    };
    OverlayAnchorObserver.preventPointerEventIfOverlayAnchor = function (el) {
        if (isAnchor(el) && maybeOverlay(el)) {
            print('Found an overlay Anchor, processing it...');
            preventPointerEvent(el);
            return true;
        }
        return false;
    };
    OverlayAnchorObserver.option = {
        childList: true,
        subtree: true
    };
    return OverlayAnchorObserver;
}());
window.addEventListener('DOMContentLoaded', function () {
    new OverlayAnchorObserver();
});

if (typeof CONTENT_SCRIPT_KEY !== 'undefined') {
    adguard.storageProvider = window[CONTENT_SCRIPT_KEY];
    delete window[CONTENT_SCRIPT_KEY];
}
else {
    adguard.storageProvider = window.parent[PARENT_FRAME_KEY][3];
}
};
/**************************************************************************/
/**
 * In Firefox, userscripts can't write properties of unsafeWindow, so we
 * create a <script> tag to run the script in the page's context.
 */
if (settings.isFirefox) {
    var script = document.createElement('script');
    var text = "(" + popupBlocker.toString() + ")(this,!1,'" + BRIDGE_KEY + "')";
    script.textContent = text;
    var el = document.body || document.head || document.documentElement;
    el.appendChild(script);
    el.removeChild(script);
}
else {
    var win = typeof unsafeWindow !== 'undefined' ? unsafeWindow.window : window;
    popupBlocker(win, undefined, BRIDGE_KEY);
}
/**************************************************************************/
/**************************************************************************/

}());
