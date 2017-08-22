import { ApplyHandler, makeObjectProxy, wrapMethod } from '../proxy';
import { verifyEvent, retrieveEvent, verifyCurrentEvent } from '../events/verify';
import examineTarget from '../events/examine-target';
import { _dispatchEvent } from './dispatchEvent/orig';
import { timeline, position } from '../timeline/index';
import { TLEventType, TimelineEvent } from '../timeline/event';
import createUrl from '../url';
import * as log from '../log';
import bridge from '../bridge';

const openVerifiedWindow:ApplyHandler = function(_open, _this, _arguments, context) {
    let url = _arguments[0];
    log.call('Called window.open with url ' + url);
    // Checks if an url is in a whitelist
    const destDomain = createUrl(url).hostname;
    if (bridge.whitelistedDestinations.indexOf(destDomain) !== -1) {
        log.print(`The domain ${destDomain} is in whitelist.`);
        return _open.apply(_this, _arguments);
    }
    let currentEvent = retrieveEvent();
    let passed = verifyEvent(currentEvent);
    let win;
    if (passed) {
        log.print('event verified, inquiring event timeline..');
        if (timeline.canOpenPopup(position)) {
            log.print('calling original window.open...');
            win = _open.apply(_this, _arguments);
            win = makeObjectProxy(win);
            log.callEnd();
            return win;
        }
        log.print('canOpenPopup returned false');
        log.callEnd();
    }
    bridge.showAlert(bridge.domain, url , false);
    if (currentEvent) { examineTarget(currentEvent, _arguments[0]); }
    log.print('mock a window object');
    // Return a mock window object, in order to ensure that the page's own script does not accidentally throw TypeErrors.
    win = mockWindow(_arguments[0], _arguments[1]);
    win = makeObjectProxy(win);
    context['mocked'] = true;
    log.callEnd();
    return win;
};

const mockObject = (orig:Object, mocked?:Object):Object => {
    mocked = mocked || <any>{};
    const mockPropValue = (prop:PropertyKey) => {
        switch(typeof orig[prop]) {
            case 'object':
            mocked[prop] = {}; break;
            case 'function':
            mocked[prop] = function() {return true;}; break;
            default:
            mocked[prop] = orig[prop];
        }
    }
    Object.getOwnPropertyNames(orig).forEach(mockPropValue);
    if (Object.getOwnPropertySymbols) Object.getOwnPropertySymbols(orig).forEach(mockPropValue);
    return mocked;
}

// used by mockWindow
let windowPType:Object, win:any, docPType:Object, doc:any;
let initialized = false;

const mockWindow = (href, name) => {
    if (!initialized) {
        const windowPType = mockObject(Window.prototype);
        const win = Object.create(windowPType);
        mockObject(window, win);
        const docPType = mockObject(Document.prototype);
        const doc = Object.create(docPType);
        win.opener = window;
        win.closed = false;
        win.name = name;
        win.document = doc;
        initialized = true;
    }
    const loc = document.createElement('a');
    loc.href = href;
    doc[_location] = loc;
    // doc.open = function(){return this;}
    // doc.write = function(){};
    // doc.close = function(){};

    Object.defineProperty(win, _location, {
        get: function() {
            timeline.registerEvent(new TimelineEvent(TLEventType.GET, _location, {
                this: this
            }), position);
            return loc;
        },
        set: function(incoming) {
            timeline.registerEvent(new TimelineEvent(TLEventType.SET, _location, {
                this: this,
                arguments: [incoming]
            }), position);
        }
    });

    return win;
};

var _location = 'location';

wrapMethod(window, 'open', openVerifiedWindow);
wrapMethod(Window.prototype, 'open', openVerifiedWindow); // for IE
