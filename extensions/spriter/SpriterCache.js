let spriter = require("./lib/spriter-js");
let _frameTime = 60;
let AnimationCache = cc.Class({
    name: "AnimationCache",
    ctor() {
        this.frames = [];
        this.totalTime = 0;
        this._isCompleted = false;
        this._animationName = null;
    },
    init(animationName) {
        this._animationName = animationName;
    },
    update(pose) {
        pose.setAnim(this._animationName);
        let len = pose.getAnimLength();
        let _currentAnimationTime = -1;
        let frameIdx = 0;
        let _isCompleted = false;
        do {
            pose.strike();
            let newTime = pose.getTime();
            if (newTime > _currentAnimationTime) {
                _currentAnimationTime = newTime;
                this._updateFrame(pose, frameIdx);
                frameIdx++;
                pose.update(_frameTime);
            } else {
                _isCompleted = true;
            }
        } while (!_isCompleted);
        this.totalTime = len / 1000;
        // Update frame length.
        this.frames.length = frameIdx;
    },
    _updateFrame(pose, frameIdx) {
        let list = [];
        for (let i = 0; i < pose.object_array.length; i++) {
            let sp = new spriter.SpriteObject();
            let obj = pose.object_array[i];
            if (obj.type != "sprite") continue;
            sp.clone(obj);
            list.push(sp);
        }
        this.frames[frameIdx] = list;
    },
    clear() {

    }
});

let SpriterCache = cc.Class({
    name: "SpriterCache",
    ctor() {
        this._animationPool = {};
        this._spriterCache = {};
    },

    clear() {
        this._animationPool = {};
        this._spriterCache = {};
    },

    removeSpriter(uuid) {
        var spriterInfo = this._spriterCache[uuid];
        if (!spriterInfo) return;
        let animationsCache = spriterInfo.animationsCache;
        for (var aniKey in animationsCache) {
            let animationCache = animationsCache[aniKey];
            if (!animationCache) continue;
            this._animationPool[uuid + "#" + aniKey] = animationCache;
            animationCache.clear();
        }

        delete this._spriterCache[uuid];
    },

    resetSpriter(uuid) {
        var spriterInfo = this._spriterCache[uuid];
        if (!spriterInfo) return;
        let animationsCache = spriterInfo.animationsCache;
        for (var aniKey in animationsCache) {
            let animationCache = animationsCache[aniKey];
            if (!animationCache) continue;
            this._animationPool[uuid + "#" + aniKey] = animationCache;
            animationCache.clear();
        }
    },

    getSpriterCache(uuid, sconAsset) {
        let spriterInfo = this._spriterCache[uuid];
        if (!spriterInfo) {
            this._spriterCache[uuid] = spriterInfo = {
                pose: sconAsset.getRuntimeData(),
                animationsCache: {},
            };
        }
        return spriterInfo;
    },

    getAnimationCache(uuid, animationName) {
        let spriterInfo = this._spriterCache[uuid];
        if (!spriterInfo) return null;

        let animationsCache = spriterInfo.animationsCache;
        return animationsCache[animationName];
    },

    updateAnimationCache(uuid, animationName) {
        let spriterInfo = this._spriterCache[uuid];
        let spriter = spriterInfo && spriterInfo.pose;
        if (!spriter) return null;

        let animation = spriter.getAnims();
        if (!animation || !animation[animationName]) {
            return null;
        }

        let animationsCache = spriterInfo.animationsCache;
        let animationCache = animationsCache[animationName];
        if (!animationCache) {
            // If cache exist in pool, then just use it.
            let poolKey = uuid + "#" + animationName;
            animationCache = this._animationPool[poolKey];
            if (animationCache) {
                delete this._animationPool[poolKey];
            } else {
                animationCache = new AnimationCache();
            }
            animationsCache[animationName] = animationCache;
        }
        animationCache.init(animationName);
        animationCache.update(spriter);

        return animationCache;
    }
});

SpriterCache.sharedCache = new SpriterCache();
module.exports = SpriterCache;
