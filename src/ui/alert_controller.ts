import IStorageManager from '../storage/IStorageManager';
import II18nService from '../localization/II18nService';
import createUrl from '../shared/url';
import * as log from '../shared/log';
import IStorageProvider from '../storage/IStorageProvider';

declare const RESOURCE_ALERT_TEMPLATE:string;

const enum STYLE_CONST {
    top_offset = 10,
    right_offset = 10,
    height = 76,
    collapsed_height = 48,
    width = 574,
    collapsed_width = 180, //135,
    middle_offset = 10
};

const FULL_ALERT_TIMEOUT = 2000;
const COLLAPSED_ALERT_TIMEOUT = 5000;

const MAX_ALERT_NUM = 4;

const px = 'px';

const initialAlertFrameStyle = {
    "position": "fixed",
    "right": STYLE_CONST.right_offset + px,
    "top": STYLE_CONST.top_offset + px,
    "border": "none",
    "opacity": "0",
    "z-index": String(-1 - (1 << 31)),
    "transform": "translate3d(0,0,0)", // GPU acceleration
    "transition": "opacity 200ms,top 200ms",
    "transitionTimingFunction": "cubic-bezier(0.86,0,0.07,1),cubic-bezier(0.645,0.045,0.355,1)"
};

interface AlertIntf {
    readonly $element: HTMLIFrameElement,
    readonly $collapsed:boolean,
    readonly $top:number,
    readonly $height:number,
    readonly toggleCollapse:()=>void,
    readonly $destroy:()=>void,
    readonly pushdown:(amount:number)=>void,
    readonly lastUpdate:number,
    timerId:number // timer Id that schedules an alert's next state change (collapse, destroy) is assigned here.
}

function attachClickListenerForEach (iterable:NodeList, listener:(this:Node,evt:MouseEvent)=>any) {
    let l = iterable.length;
    while (l-- > 0) {
        iterable[l].addEventListener('click', listener);
    }
}

class Alert implements AlertIntf {
    public $element:HTMLIFrameElement;
    public $collapsed:boolean;
    public $top:number;
    public $height:number;
    constructor(
        orig_domain:string,
        popup_url:string,
        private i18nService:II18nService,
        storageManager:IStorageManager
    ) {
        let iframe = document.createElement('iframe');
        let loaded = false;
        // Prepare innerHTML
        let url = createUrl(popup_url);

        const localizationContext:StringMap = Object.create(null);
        localizationContext['displayUrl'] = url[0];
        localizationContext['domain'] = url[1];
        localizationContext['href'] = popup_url;
        localizationContext['parent'] = orig_domain

        let _innerHTML = i18nService.formatText(RESOURCE_ALERT_TEMPLATE, localizationContext, true);
        iframe.addEventListener('load', (evt) => {
            // Attach event handlers
            if (loaded) { return; }
            loaded = true;
            let document = iframe.contentDocument;
            document.documentElement.innerHTML = _innerHTML; // document.write('..') does not work on FF Greasemonkey
            i18nService.applyTranslation(document.body, {
                'domain': url[1]
            });
            attachClickListenerForEach(document.getElementsByClassName('popup__link--allow'), () => {
                if (this.showConfirmationDialog("popup_allow_dest_conf", localizationContext)) {
                    storageManager.requestDestinationWhitelist(url[1]);
                }
            });
            attachClickListenerForEach(document.getElementsByClassName('popup__link--all'), () => {
                if (this.showConfirmationDialog("popup_allow_origin_conf", localizationContext)) {
                    storageManager.requestDomainWhitelist(orig_domain);
                }
            });
            requestAnimationFrame(() => {
                iframe.style.opacity = '1';
            });
            // Without this, the background of the iframe will be white in IE11
            document.body.setAttribute('style', 'background-color:transparent;');
        });
        // Adjust css of an iframe
        iframe.setAttribute('allowTransparency', 'true');
        for (let prop in initialAlertFrameStyle) { iframe.style[prop] = initialAlertFrameStyle[prop]; }
        let height = this.$height = STYLE_CONST.height;
        let width = STYLE_CONST.width;
        iframe.style.height = height + px;
        iframe.style.width = width + px;
        // Commenting out the below due to https://bugs.chromium.org/p/chromium/issues/detail?id=489431,
        // iframe.setAttribute('sandbox', 'allow-same-origin');

        this.$element = iframe;
        this.$collapsed = false;
        this.$top = STYLE_CONST.top_offset;
        this.lastUpdate = new Date().getTime();
    }
    // Until we come up with a proper UI, we reponse to user interaction with window.confirm.
    private showConfirmationDialog (messageId:string, context:StringMap):boolean {
        const message = this.i18nService.formatText(this.i18nService.$getMessage(messageId), context);
        // Certain browsers always return `false` from window.confirm;
        // In such cases, we skip confirmation step.
        // https://github.com/AdguardTeam/PopupBlocker/issues/50
        let now = Date.now();
        let response = window.confirm(message);
        if (Date.now() - now < 100) { return true; }
        return response;
    }
    pushdown(amount:number) {
        let newTop = this.$top + amount;
        this.$element.style.top = newTop + px;
        this.$top = newTop;
    }
    toggleCollapse() {
        const collapsed = this.$collapsed = !this.$collapsed;
        this.$element.style.height = (this.$height = (collapsed ? STYLE_CONST.collapsed_height : STYLE_CONST.height)) + px;
        this.$element.style.width = (collapsed ? STYLE_CONST.collapsed_width : STYLE_CONST.width) + px;
        let root = this.$element.contentDocument.getElementsByClassName('popup')[0];
        root.classList.toggle('popup--min');
        // Since its state was changed, update its lastUpdate property.
        this.lastUpdate = new Date().getTime();
    }
    $destroy() {
        clearTimeout(this.timerId);
        let parentNode = this.$element.parentNode;
        if (parentNode) { parentNode.removeChild(this.$element); }
    }
    public lastUpdate:number
    public timerId:number // This will be initialized when an alert is created by AlertController#createAlert.
}

export default class AlertController {
    private alerts:AlertIntf[];
    private hovered:boolean;
    constructor(
        private i18nService:II18nService,
        private storageManager:IStorageManager
    ) {
        this.alerts = [];
    }
    createAlert(orig_domain:string, popup_url:string) {
        let alert = new Alert(orig_domain, popup_url, this.i18nService, this.storageManager);
        // Pushes previous alerts down
        let l = this.alerts.length;
        let offset = STYLE_CONST.middle_offset + alert.$height;
        this.moveBunch(l, offset);
        // Adds event listeners that needs to run in this context
        alert.$element.addEventListener('load', () => {
            let alertDoc = alert.$element.contentDocument;
            attachClickListenerForEach(alertDoc.getElementsByClassName('popup__close'), () => {
                this.destroyAlert(alert);
            });
            attachClickListenerForEach(alertDoc.getElementsByClassName('popup__link--expand'), () => {
                this.toggleCollapseAlert(alert);
            });
        });
        alert.$element.addEventListener('mouseover', () => { this.onMouseOver(); });
        alert.$element.addEventListener('mouseout', () => { this.onMouseOut(); });
        // Appends an alert to DOM
        document.documentElement.appendChild(alert.$element);
        // Schedules collapsing & destroying
        alert.timerId = setTimeout(() => {
            this.toggleCollapseAlert(alert);
        }, FULL_ALERT_TIMEOUT);
        // Pushes the new alert to an array, destroy from the oldest alert when needed
        if ((l = this.alerts.push(alert)) > MAX_ALERT_NUM) {
            l -= MAX_ALERT_NUM;
            while (l-- > 0) { this.destroyAlert(this.alerts[l]); }
        }
    }
    private moveBunch(index:number, offset:number) {
        while (index-- > 0) { this.alerts[index].pushdown(offset); }
    }
    /**
     * Collapses an alert and schedules its destruction
     */
    private toggleCollapseAlert(alert:AlertIntf) {
        let prevHeight = alert.$height;
        alert.toggleCollapse();
        let offset = alert.$height - prevHeight;
        let index = this.alerts.indexOf(alert);
        this.moveBunch(index, offset);
        clearTimeout(alert.timerId);
        if (!this.hovered) {
            alert.timerId = alert.$collapsed ? setTimeout(() => {
                this.destroyAlert(alert);
            }, COLLAPSED_ALERT_TIMEOUT) : setTimeout(() => {
                this.toggleCollapseAlert(alert);
            }, FULL_ALERT_TIMEOUT);
        }
    }
    private destroyAlert(alert:AlertIntf) {
        alert.$destroy();
        let i = this.alerts.indexOf(alert);
        let offset = alert.$height + STYLE_CONST.middle_offset;
        this.moveBunch(i, -offset);
        this.alerts.splice(i, 1);
    }
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
    private onMouseOver() {
        this.hovered = true;
        this.alerts.forEach((alert) => {
            clearTimeout(alert.timerId);
        });
    }
    private onMouseOut() {
        this.hovered = false;
        const now = new Date().getTime();
        const time = this.getImminentDue();
        const pastDue = now > time ? now - time : 0;
        this.alerts.forEach((alert) => {
            if (alert.$collapsed) {
                alert.timerId = setTimeout(() => {
                    this.destroyAlert(alert);
                // This value will be 0 for the oldest callback.
                }, alert.lastUpdate + COLLAPSED_ALERT_TIMEOUT - now + pastDue);
            } else {
                alert.timerId = setTimeout(() => {
                    this.toggleCollapseAlert(alert);
                }, alert.lastUpdate + FULL_ALERT_TIMEOUT - now + pastDue);
            }
        });
    }
    private getImminentDue() {
        let amongCollapsed, amongUncollapsed;
        const alerts = this.alerts;
        for (let i = 0, l = alerts.length; i < l; i++) {
            if (alerts[i].$collapsed) {
                if (amongCollapsed) { continue; }
                amongCollapsed = alerts[i].lastUpdate + COLLAPSED_ALERT_TIMEOUT;
                if (amongUncollapsed) { break; }
            } else {
                if (amongUncollapsed) { continue; }
                amongUncollapsed = alerts[i].lastUpdate + FULL_ALERT_TIMEOUT;
                if (amongCollapsed) { break; }
            }
        }
        return amongCollapsed > amongUncollapsed ? amongUncollapsed : amongCollapsed;
    }
}
