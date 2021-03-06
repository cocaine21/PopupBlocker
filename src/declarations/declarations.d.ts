/**
 * PopupBlocker wraps the page script with a function, in order to run itself in iframes.
 * We declare
 *  - the wrapper function (popupBlocker),
 *  - the function's arguments, which are used as a global variable throughout
 *    the page script.
 * 
 * @param PARENT_FRAME_KEY It is used for communication between a script in a page's
 * context and a script in its child frame's context.
 * @param CONTENT_SCRIPT_KEY It is used for communication between a content script
 * (for userscript, script in userscript host's sandboxed context) and the page's context.
 */
declare function popupBlocker(window, PARENT_FRAME_KEY?:string, CONTENT_SCRIPT_KEY?:string):any;
declare const PARENT_FRAME_KEY:string;
declare const CONTENT_SCRIPT_KEY:string;

interface Window {
    popupBlocker:typeof popupBlocker
}
declare function InstallTrigger();

// Non-standard DOM apis that are not understood by either Typescript or
// Closure Compiler are included here.
interface Document {
    documentMode?: number,
    elementsFromPoint(x:number, y:number):Element[],
    msElementsFromPoint(x:number, y:number):NodeListOf<Element>
}

interface Event {
    path?: EventTarget[],
    composedPath?():EventTarget[]
}

//

interface Window {
    Window:typeof Window
    Node:typeof Node
    EventTarget:typeof EventTarget
    HTMLElement:typeof HTMLElement
    HTMLIFrameElement:typeof HTMLIFrameElement
    HTMLFormElement:typeof HTMLFormElement
    HTMLObjectElement:typeof HTMLObjectElement
    Event:typeof Event
    Function:typeof Function
    Reflect:typeof Reflect
    MessageEvent:typeof MessageEvent
}


// Workaround for [Symbol.toStringTag] requirement of TS
interface IWeakMap<K extends object, V> {
    delete(key: K): boolean;
    get(key: K): V | undefined;
    has(key: K): boolean;
    set(key: K, value: V): this;
}

interface IWeakMapCtor {
    new (): IWeakMap<object, any>;
    new <K extends object, V>(entries?: [K, V][]): IWeakMap<K, V>;
    readonly prototype: IWeakMap<object, any>;
}

// Misc
type func = (...args)=>any

interface stringmap<T> {
    [id: string]:T
}

type StringMap = stringmap<string>

// inline-resource-literal
declare function RESOURCE_ARGS(marker:string, ...args):string
