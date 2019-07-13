const DONOTHING = 0;
const LOCAL_TRANSFORM = 1 << 0;
const WORLD_TRANSFORM = 1 << 1;
const TRANSFORM = LOCAL_TRANSFORM | WORLD_TRANSFORM;
const UPDATE_RENDER_DATA = 1 << 2;
const OPACITY = 1 << 3;
const COLOR = 1 << 4;
const RENDER = 1 << 5;
const CUSTOM_IA_RENDER = 1 << 6;
const CHILDREN = 1 << 7;
const POST_UPDATE_RENDER_DATA = 1 << 8;
const POST_RENDER = 1 << 9;
const FINAL = 1 << 10;

let _batcher;
let _cullingMask = 0;

function RenderFlow () {
    this._func = init;
    this._next = null;
}

let _proto = RenderFlow.prototype;
_proto._doNothing = function () {
};

_proto._localTransform = function (node) {
    node._updateLocalMatrix();
    node._renderFlag &= ~LOCAL_TRANSFORM;
    this._next._func(node);
};

function mul (out, a, b) {
    let aa=a.m00, ab=a.m01, ac=a.m04, ad=a.m05, atx=a.m12, aty=a.m13;
    let ba=b.m00, bb=b.m01, bc=b.m04, bd=b.m05, btx=b.m12, bty=b.m13;
    if (bb !== 0 || bc !== 0) {
        out.m00 = aa * ba + ab * bc;
        out.m01 = aa * bb + ab * bd;
        out.m04 = ac * ba + ad * bc;
        out.m05 = ac * bb + ad * bd;
        out.m12 = ba * atx + bc * aty + btx;
        out.m13 = bb * atx + bd * aty + bty;
    }
    else {
        out.m00 = aa * ba;
        out.m01 = ab * bd;
        out.m04 = ac * ba;
        out.m05 = ad * bd;
        out.m12 = ba * atx + btx;
        out.m13 = bd * aty + bty;
    }
}

_proto._worldTransform = function (node) {
    _batcher.worldMatDirty ++;

    let t = node._matrix;
    let position = node._position;
    t.m12 = position.x;
    t.m13 = position.y;

    mul(node._worldMatrix, t, node._parent._worldMatrix);
    node._renderFlag &= ~WORLD_TRANSFORM;
    this._next._func(node);

    _batcher.worldMatDirty --;
};

_proto._color = function (node) {
    let comp = node._renderComponent;
    if (comp) {
        comp._updateColor();
    }
    else {
        node._renderFlag &= ~COLOR;
    }
    this._next._func(node);
};

_proto._opacity = function (node) {
    _batcher.parentOpacityDirty++;

    node._renderFlag &= ~OPACITY;
    this._next._func(node);

    _batcher.parentOpacityDirty--;
};

_proto._updateRenderData = function (node) {
    let comp = node._renderComponent;
    comp._assembler.updateRenderData(comp);
    node._renderFlag &= ~UPDATE_RENDER_DATA;
    this._next._func(node);
};

_proto._render = function (node) {
    let comp = node._renderComponent;
    _batcher._commitComp(comp, comp._assembler, node._cullingMask);
    this._next._func(node);
};

_proto._customIARender = function (node) {
    let comp = node._renderComponent;
    _batcher._commitIA(comp, comp._assembler, node._cullingMask);
    this._next._func(node);
};

_proto._children = function (node) {
    let cullingMask = _cullingMask;
    let batcher = _batcher;

    let parentOpacity = batcher.parentOpacity;
    let opacity = (batcher.parentOpacity *= (node._opacity / 255));

    let worldTransformFlag = batcher.worldMatDirty ? WORLD_TRANSFORM : 0;
    let worldOpacityFlag = batcher.parentOpacityDirty ? COLOR : 0;
    let worldDirtyFlag = worldTransformFlag | worldOpacityFlag;

    let children = node._children;
    for (let i = 0, l = children.length; i < l; i++) {
        let c = children[i];

        // Advance the modification of the flag to avoid node attribute modification is invalid when opacity === 0.
        c._renderFlag |= worldDirtyFlag;
        if (!c._activeInHierarchy || c._opacity === 0) continue;

        // TODO: Maybe has better way to implement cascade opacity
        let colorVal = c._color._val;
        c._color._fastSetA(c._opacity * opacity);
        flows[c._renderFlag]._func(c);
        c._color._val = colorVal;
    }

    batcher.parentOpacity = parentOpacity;

    this._next._func(node);
};

_proto._postUpdateRenderData = function (node) {
    let comp = node._renderComponent;
    comp._postAssembler && comp._postAssembler.updateRenderData(comp);
    node._renderFlag &= ~POST_UPDATE_RENDER_DATA;
    this._next._func(node);
};

_proto._postRender = function (node) {
    let comp = node._renderComponent;
    _batcher._commitComp(comp, comp._postAssembler, node._cullingMask);
    this._next._func(node);
};

const EMPTY_FLOW = new RenderFlow();
EMPTY_FLOW._func = EMPTY_FLOW._doNothing;
EMPTY_FLOW._next = EMPTY_FLOW;

let flows = {};

function createFlow (flag, next) {
    let flow = new RenderFlow();
    flow._next = next || EMPTY_FLOW;

    switch (flag) {
        case DONOTHING: 
            flow._func = flow._doNothing;
            break;
        case LOCAL_TRANSFORM: 
            flow._func = flow._localTransform;
            break;
        case WORLD_TRANSFORM: 
            flow._func = flow._worldTransform;
            break;
        case COLOR:
            flow._func = flow._color;
            break;
        case OPACITY:
            flow._func = flow._opacity;
            break;
        case UPDATE_RENDER_DATA:
            flow._func = flow._updateRenderData;
            break;
        case RENDER: 
            flow._func = flow._render;
            break;
        case CUSTOM_IA_RENDER:
            flow._func = flow._customIARender;
            break;
        case CHILDREN: 
            flow._func = flow._children;
            break;
        case POST_UPDATE_RENDER_DATA: 
            flow._func = flow._postUpdateRenderData;
            break;
        case POST_RENDER: 
            flow._func = flow._postRender;
            break;
    }

    return flow;
}

function getFlow (flag) {
    let flow = null;
    let tFlag = FINAL;
    while (tFlag > 0) {
        if (tFlag & flag)
            flow = createFlow(tFlag, flow);
        tFlag = tFlag >> 1;
    }
    return flow;
}

// 
function init (node) {
    let flag = node._renderFlag;
    let r = flows[flag] = getFlow(flag);
    r._func(node);
}

RenderFlow.flows = flows;
RenderFlow.createFlow = createFlow;
RenderFlow.visit = function (scene) {
    _batcher.reset();
    _batcher.walking = true;

    _cullingMask = 1 << scene.groupIndex;

    if (scene._renderFlag & WORLD_TRANSFORM) {
        _batcher.worldMatDirty ++;
        scene._calculWorldMatrix();
        scene._renderFlag &= ~WORLD_TRANSFORM;

        flows[scene._renderFlag]._func(scene);

        _batcher.worldMatDirty --;
    }
    else {
        flows[scene._renderFlag]._func(scene);
    }

    _batcher.terminate();
};

RenderFlow.init = function (batcher) {
    _batcher = batcher;

    flows[0] = EMPTY_FLOW;
    for (let i = 1; i < FINAL; i++) {
        flows[i] = new RenderFlow();
    }
};

RenderFlow.FLAG_DONOTHING = DONOTHING;
RenderFlow.FLAG_LOCAL_TRANSFORM = LOCAL_TRANSFORM;
RenderFlow.FLAG_WORLD_TRANSFORM = WORLD_TRANSFORM;
RenderFlow.FLAG_TRANSFORM = TRANSFORM;
RenderFlow.FLAG_COLOR = COLOR;
RenderFlow.FLAG_OPACITY = OPACITY;
RenderFlow.FLAG_UPDATE_RENDER_DATA = UPDATE_RENDER_DATA;
RenderFlow.FLAG_RENDER = RENDER;
RenderFlow.FLAG_CUSTOM_IA_RENDER = CUSTOM_IA_RENDER;
RenderFlow.FLAG_CHILDREN = CHILDREN;
RenderFlow.FLAG_POST_UPDATE_RENDER_DATA = POST_UPDATE_RENDER_DATA;
RenderFlow.FLAG_POST_RENDER = POST_RENDER;
RenderFlow.FLAG_FINAL = FINAL;

module.exports = cc.RenderFlow = RenderFlow;