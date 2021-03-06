/**
 * @fileoverview Utility functions for instanceof checks against DOM classes. Used for type casting.
 * Since it is common for us to cross the border of browsing contexts, instanceof
 * check for DOM element is not reliable.
 */

import { getTagName } from './dom';

export const isMouseEvent = (event:Event):event is MouseEvent => {
    return 'clientX' in event;
};

export const isTouchEvent = (event:Event):event is TouchEvent => {
    return 'touches' in event;
};

export const isUIEvent = (event:Event):event is UIEvent => {
    return 'view' in event;
};

/**/

export const isNode = (el:EventTarget):el is Node => {
    return 'nodeName' in el;
};

export const isElement = (el:EventTarget):el is Element => {
    return 'id' in el;
};

export const isHTMLElement = (el:Element):el is HTMLElement => {
    return 'style' in el;
};

export const isAnchor = (el:Node):el is HTMLAnchorElement => {
    return getTagName(el) == 'A';
};

/**/

const toString = Object.prototype.toString;

export const isWindow = (el:any):el is Window => {
    return toString.call(el) === '[object Window]';
}

export const isLocation = (el:any):el is Location => {
    return toString.call(el) === '[object Location]';
}

/**/

export const isUndef = (obj:any):obj is undefined => {
    return typeof obj === 'undefined';
};

/**/

export const isClickEvent = (evt:MouseEvent):boolean => {
    let type = evt.type;
    return type === 'click' || type === 'mousedown' || type === 'mouseup';
}
