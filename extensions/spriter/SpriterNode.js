require("./SpriterAsset");

let SpriterCache = require("./SpriterCache");
let DefaultEntitysEnum = cc.Enum({
    'default': -1
});
let DefaultAnimsEnum = cc.Enum({
    '<None>': 0
});

function setEnumAttr(obj, propName, enumDef) {
    cc.Class.attr(obj, propName, {
        type: 'Enum',
        enumList: cc.Enum.getList(enumDef)
    });
}
/**
 * !#en Renders a scon Spriter in the scene.
 * !#zh 在场景中渲染一个 scon 格式的 Spriter。
 * @class SpriterNode
 * @extends Component
 */
let SpriterNode = cc.Class({
    name: 'cc.SpriterNode',
    extends: cc.Component,
    editor: CC_EDITOR && {
        executeInEditMode: true,
        menu: 'i18n:MAIN_MENU.component.renderers/Spriter',
    },
    ctor() {
        this.timeStep = cc.game.getFrameRate();
        this.sprites = {};
        this._currentAnimationTime = 0;
    },
    properties: {
        _sconFile: {
            default: null,
            type: cc.SpriterAsset
        },
        /**
         * !#en The Spriter Asset.
         * !#zh Spriter 资源。
         * @property {SpriterAsset} sconAsset
         * @default ""
         */
        sconAsset: {
            get() {
                return this._sconFile;
            },
            set(value, force) {
                if (this._sconFile !== value || (CC_EDITOR && force)) {
                    this._sconFile = value;
                    if (CC_EDITOR) {
                        this.defaultAnimation = "";
                    }
                    this.defaultEntity = this._sconFile.getDefaultEntity();
                    this.sprites = {};
                    this._lastSprites = {};
                    this.node.removeAllChildren();
                    this._applyFile();
                }
            },
            type: cc.SpriterAsset
        },
        /**
         * !#en The name of default skin.
         * !#zh 默认的皮肤名称。
         * @property {String} defaultEntity
         */
        defaultEntity: {
            default: '',
            visible: false
        },


        defaultAnimation: {
            default: '',
            visible: false
        },
        /**
         * !#en The name of current playing animation.
         * !#zh 当前播放的动画名称。
         * @property {String} animation
         */
        animation: {
            get() {
                return this.defaultAnimation;
            },
            set(value) {
                this.defaultAnimation = value;
                if (value) {
                    this._initSpriter(this.sconAsset);
                } else {
                    this._relseasInfo();
                }
            },
            visible: false
        },
        _defaultEntityIndex: {
            get() {
                if (this.sconAsset && this.defaultEntity) {
                    var skinsEnum = this.sconAsset.getEntitysEnum();
                    if (skinsEnum) {
                        var skinIndex = skinsEnum[this.defaultEntity];
                        if (skinIndex !== undefined) {
                            return skinIndex;
                        }
                    }
                }
                return 0;
            },
            set(value) {
                var skinsEnum;
                if (this.sconAsset) {
                    skinsEnum = this.sconAsset.getEntitysEnum();
                }
                if (!skinsEnum) {
                    return cc.errorID('',
                        this.name);
                }
                var skinName = skinsEnum[value];
                if (skinName !== undefined) {
                    this.defaultEntity = skinName;
                    if (CC_EDITOR && !cc.engine.isPlaying) {
                        this._refreshInspector();
                    }

                } else {
                    cc.errorID(7501, this.name);
                }
            },
            type: DefaultEntitysEnum,
            visible: true,
            displayName: "Default Entity"
        },

        // value of 0 represents no animation
        _animationIndex: {
            get() {
                var animationName = this.defaultAnimation;
                if (this.sconAsset && animationName) {
                    var animsEnum = this.sconAsset.getAnimsEnum();
                    if (animsEnum) {
                        var animIndex = animsEnum[animationName];
                        if (animIndex !== undefined) {
                            return animIndex;
                        }
                    }
                }
                return 0;
            },
            set(value) {
                var animsEnum;
                if (this.sconAsset) {
                    animsEnum = this.sconAsset.getAnimsEnum();
                }
                if (!animsEnum) {
                    return cc.errorID(7502, this.name);
                }
                var animName = animsEnum[value];
                if (animName !== undefined) {
                    this.animation = animName;
                } else {
                    cc.errorID(7503, this.name);
                }

            },
            type: DefaultAnimsEnum,
            visible: true,
            displayName: 'Animation'
        },
        /**
         * !#en The animation is loop.
         * !#zh 是否循环。
         * @property {Boolean} loop
         */
        loop: true,
        /**
         * !#en The animation rate.
         * !#zh 播放帧率
         * @property {Number} timeRate
         */
        timeRate: 1
    },
    /**
     * !#en The animation is finish.
     * !#zh 动画是否播放完成。
     * @method isFinish
     * @return {Boolean}
     */
    isFinish() {
        return this._isAniComplete || false;
    },
    /**
     * !#en The time of animation.
     * !#zh 动画当前时间。
     * @method getTime
     * @return {Number}
     */
    getTime() {
        let pose = this.pose;
        const newTime = pose.getTime();
        return newTime;
    },
    /**
     * !#en set The animation time.
     * !#zh 设置动画时间。
     * @method setTime
     * @param {Number} time
     */
    setTime(time) {
        if (!this._sconFile) return;
        let pose = this.pose;
        this._isAniComplete = true;
        pose.setTime(time);
        pose.strike();
        this._hideAllSprites();
        this._curFrame = pose.object_array;
        this._updateSpriteFrames();
    },
    /**
     * !#en set The animation loop.
     * !#zh 设置动画是否循环播放。
     * @method setLoop
     * @param {Boolean} value
     */
    setLoop(value) {
        if (this.loop === value) return;
        this._isAniComplete = false;

        if (value) {
            this.loop = true;
        } else {
            this.loop = false;
            this._currentAnimationTime = 0.0;
        }
    },
    /**
     * !#en set The animation Entity.
     * !#zh 设置动画实例。
     * @method setEntity
     * @param {String} entiry
     */
    setEntity(entiry) {
        if (this.entiry == this.defaultEntity) return;
        if (this._spriterCache) this._spriterCache.resetSpriter();
        this.defaultEntity = entiry;
    },
    /**
     * !#en set The animation name.
     * !#zh 设置播放动画名
     * @method setAnim
     * @param {String} animation
     */
    setAnim(animation) {
        if (this.defaultAnimation == animation) return;
        this.animation = animation;
    },
    /**
     * !#en set The animation name.
     * !#zh 获取动画长度
     * @method getAnimLength
     * @return {Number}
     */
    getAnimLength() {
        let pose = this.pose;
        if (!pose) return 0;
        return pose.getAnimLength();
    },
    __preload() {
        if (this._sconFile) {
            // refresh layer entities
            this._applyFile();
        }
    },

    _refreshInspector: CC_EDITOR && function () {
        // update inspector
        this._updateAnimEnum();
        this._updateEntityEnum();
        Editor.Utils.refreshSelectedInspector('node', this.node.uuid);
    },
    // update animation list for editor
    _updateAnimEnum: CC_EDITOR && function () {
        var animEnum;
        if (this.sconAsset) {
            animEnum = this.sconAsset.getAnimsEnum();
            if (animEnum && !this.defaultAnimation) this.defaultAnimation = animEnum[0];
        }
        // change enum
        setEnumAttr(this, '_animationIndex', animEnum || DefaultAnimsEnum);
    },
    // update skin list for editor
    _updateEntityEnum: CC_EDITOR && function () {
        var entityEnum;
        if (this.sconAsset) {
            entityEnum = this.sconAsset.getEntitysEnum();
            if (entityEnum) this.defaultEntity = entityEnum[0];
        }
        // change enum
        setEnumAttr(this, '_defaultEntityIndex', entityEnum || DefaultEntitysEnum);
    },


    _applyFile: function () {
        let file = this._sconFile;
        if (file) {
            this.pose = file.newPose();
            this._isAniComplete = true;
            if (CC_EDITOR) {
                this._refreshInspector();
            } else {
                this._spriterCache = SpriterCache.sharedCache;
                this._spriterCache.getSpriterCache(this.sconAsset._uuid, this.sconAsset);
            }
            this._initSpriter(file);

        } else {
            this._relseasInfo();
        }
    },

    _initSpriter(file) {
        let name = this.animation;
        if (!this.defaultEntity || !this.defaultAnimation) return;
        let pose = this.pose;
        if (pose) {
            pose.setEntity(this.defaultEntity);
            pose.setAnim(this.animation || "");
        }
        if (this._spriterCache) {
            let cache = this._spriterCache.getAnimationCache(this.sconAsset._uuid, name);
            if (!cache) {
                cache = this._spriterCache.updateAnimationCache(this.sconAsset._uuid, name);
            }
            if (cache) {
                this._isAniComplete = false;
                this._accTime = 0;
                this._frameCache = cache;
                this._curFrame = this._frameCache.frames[0];
                this._updateSpriteFrames();
            }
        } else {

            this.setTime(0);
            this._isAniComplete = false;
        }

    },
    _relseasInfo: function () {
        // remove the object added before
        if (!CC_EDITOR) {
            this._hideAllSprites();
            return;
        }
        this.node.removeAllChildren();
        this.sprites = {};
        this.pose = null;
    },
    update(dt) {
        if (this._isAniComplete) return;
        if (!this._sconFile || CC_EDITOR) return;
        if (this._frameCache) {
            this._updateCache(dt);
        } else {
            this._updateRealtime(dt);
        }

    },
    _updateCache(dt) {
        let frames = this._frameCache.frames;
        let totalTime = this._frameCache.totalTime;
        let frameCount = frames.length;

        this._accTime += dt * this.timeRate;
        let frameIdx = Math.floor(this._accTime / totalTime * frameCount);
        this._updateSpriteFrames();
        if (frameIdx >= frameCount) {
            this._accTime = 0;
            frameIdx = 0;
            if (!this.loop)
                this._isAniComplete = true;
        }
        this._curFrame = frames[frameIdx];
    },
    _updateRealtime(dt) {
        let pose = this.pose;
        if (!pose) return;
        pose.update(this.timeStep * this.timeRate * dt);
        pose.strike();
        this._curFrame = pose.object_array;
        this._updateSpriteFrames();
        if (!this.loop) {
            this._compareFinishAnimation();
        }
    },

    _compareFinishAnimation() {
        let pose = this.pose;
        const newTime = pose.getTime();

        if (newTime > this._currentAnimationTime) {
            this._currentAnimationTime = newTime;
        } else {
            this.setTime(this.getAnimLength() - 1);
            this._isAniComplete = true;
        }
    },
    _hideAllSprites() {
        if (this._lastSprites) {
            let _lastSprites = this._lastSprites;
            for (let i in _lastSprites) {
                _lastSprites[i].opacity = 0;
            }
            return;
        }
        let find = 0;
        for (find in this.sprites) {
            find = 1;
            break;
        }
        if (find) return;
        let children = this.node.children;
        for (let i in children) {
            children[i].opacity = 0;
        }
    },
    _updateSprite(index, object, spriteFrames, useSprites) {
        let name = object.name;
        let sprite = this.sprites[name];
        let node;
        if (!sprite) {
            node = this.node.getChildByName(name);
            if (!node) {
                node = new cc.Node(name);
                sprite = node.addComponent(cc.Sprite);
                this.node.addChild(node);
                sprite.name = object.imgKey;
                this.sprites[name] = sprite;
            } else {
                sprite = node.getComponent(cc.Sprite);
                this.sprites[name] = sprite;
            }
            let imageKey = object.imgKey;
            const spriteFrame = spriteFrames[imageKey];
            if (!spriteFrame) {
                cc.error(imageKey + " not find");
                return;
            }
            sprite.spriteFrame = spriteFrame;
            var rect = spriteFrame.getRect();
            node.width = rect.width;
            node.height = rect.height;

        } else
            node = sprite.node;
        node.zIndex = index;
        let worldSpace = object.world_space;
        node.opacity = object.alpha * 255;
        node.x = worldSpace.position.x;
        node.y = worldSpace.position.y;
        node.scaleX = worldSpace.scale.x;
        node.scaleY = worldSpace.scale.y;
        node.rotation = -worldSpace.rotation.deg;

        useSprites[name] = node;
    },
    _updateSpriteFrames() {
        let objectArraySprites = this._curFrame || [];
        let spriteFrames = this.sconAsset.getFrames();
        let object;
        let useSprites = {};
        let _index = 0;
        this._hideAllSprites();
        for (let index = 0, len = objectArraySprites.length; index < len; index++) {
            object = objectArraySprites[index];
            if (object.type === "sprite") {
                this._updateSprite(_index, object, spriteFrames, useSprites);
                _index++;
            }

        }
        this._lastSprites = useSprites;

    },
    is(a, b) {
        return a == b;
    }
});

cc.SpriterNode = module.exports = SpriterNode;
cc.js.obsolete(cc.SpriterNode.prototype, 'cc.SpriterNode.sconFile', 'sconAsset', true);
