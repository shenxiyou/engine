require("./SpriterAsset");
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
                    this.defaultAnimation = "";
                    this.defaultEntity = "";
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
        _defaultEntityIndex: CC_EDITOR && {
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
        _animationIndex: CC_EDITOR && {
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
                if (value === 0) {
                    this.defaultAnimation = '';
                    return;
                }
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
        return this._animationFinish || false;
    },
    /**
     * !#en The time of animation.
     * !#zh 动画当前时间。
     * @method getTime
     * @return {Number}
     */
    getTime() {
        let pose = this._sconFile.getRuntimeData();
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
        let pose = this._sconFile.getRuntimeData();
        this._hideAllSprites();
        this._animationFinish = true;
        pose.setTime(time);
        pose.strike();
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
        this._animationFinish = false;

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
        this.defaultEntity = entiry;
    },
    /**
     * !#en set The animation name.
     * !#zh 设置播放动画名
     * @method setAnim
     * @param {String} animation
     */
    setAnim(animation) {
        this.animation = animation;
    },
    /**
     * !#en set The animation name.
     * !#zh 获取动画长度
     * @method getAnimLength
     * @return {Number}
     */
    getAnimLength() {
        let pose = this.sconAsset.getRuntimeData();
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
            if (animEnum) this.defaultAnimation = animEnum[0];
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
            if (CC_EDITOR) this._refreshInspector();
            this._initSpriter(file);

        } else {
            this._relseasInfo();
        }
    },
    _getObjectArraySprites() {
        let spriteFrames = this.sconAsset.getFrames();
        let pose = this.sconAsset.getRuntimeData();
        var sps = pose.object_array.map((object) => {
            if (object.type === 'sprite') {
                const folder = pose.data.folder_array[object.folder_index];
                const file = folder.file_array[object.file_index];
                let imageKey = file.name;
                const spriteFrame = spriteFrames[imageKey];
                if (!spriteFrame) {
                    cc.error(imageKey + " not find");
                }
                return {
                    file,
                    imageKey,
                    folder,
                    object,
                    spriteFrame
                };
            } else if (object.type === "box") {
                return {
                    file: null,
                    imageKey: null,
                    folder: null,
                    object: null,
                    spriteFrame: null
                };
            }
        });
        return sps;
    },
    /**
     * Update sprite
     * @param sprite {cc.Sprite}
     * @param worldSpace {Object}
     * @param e {Object}
     * @private
     */
    _updateSprite(sp, worldSpace, e) {
        let sprite = sp.node;
        sprite.opacity = e.object.alpha * 255;
        sprite.x = worldSpace.position.x;
        sprite.y = worldSpace.position.y;
        sprite.scaleX = worldSpace.scale.x;
        sprite.scaleY = worldSpace.scale.y;
        sprite.rotation = -worldSpace.rotation.deg;
        sp.myFile = e.file;
        sp.myFolder = e.folder;
        sp.myIndex = e.myIndex;
    },

    _initSpriter(file) {
        this._relseasInfo();
        if (!this.defaultEntity || !this.defaultAnimation) return;
        let pose = file.getRuntimeData();
        pose.setEntity(this.defaultEntity);
        pose.setAnim(this.animation || "");
        pose.strike();
        this._updateSpriteFrames();
    },
    _relseasInfo: function () {
        // remove the object added before
        if (!CC_EDITOR) {
            this._hideAllSprites();
            return;
        }
        this.node.removeAllChildren();
        this.sprites = {};
    },
    update() {
        if (this._animationFinish) return;
        if (!this._sconFile || CC_EDITOR) return;
        let pose = this._sconFile.getRuntimeData();
        if (!pose) return;
        pose.update(this.timeStep * this.timeRate);
        pose.strike();
        this._hideAllSprites();
        this._updateSpriteFrames();
        if (!this.loop) {
            this._compareFinishAnimation();
        }
    },

    _compareFinishAnimation() {
        let pose = this._sconFile.getRuntimeData();
        const newTime = pose.getTime();

        if (newTime > this._currentAnimationTime) {
            this._currentAnimationTime = newTime;
        } else {
            this.setTime(this.getAnimLength() - 1);
            this._animationFinish = true;
        }
    },
    _hideAllSprites() {
        if (this.lastSprites && this.lastSprites.length > 0) {
            let lastSprites = this.lastSprites;
            for (let i in lastSprites) {
                lastSprites[i].opacity = 0;
            }
            return;
        }
        let children = this.node.children;
        for (let i in children) {
            children[i].opacity = 0;
        }
    },
    _updateSpriteFrames() {
        let objectArraySprites = this._getObjectArraySprites();
        let sp;
        let worldSpace;
        let sprite;
        this.lastSprites = [];

        for (let index = 0, len = objectArraySprites.length; index < len; index++) {
            sp = objectArraySprites[index];
            if (!sp.file) return;
            sp.myIndex = index;
            worldSpace = sp.object.world_space;
            let name = sp.object.name;
            sprite = this.sprites[name];
            // If sprite not found - creating a new sprite
            let node;
            if (!sprite) {
                node = this.node.getChildByName(name);
                if (!node) {
                    node = new cc.Node(name);
                    sprite = node.addComponent(cc.Sprite);
                    this.node.addChild(node);
                    sprite.name = sp.imageKey;
                    this.sprites[name] = sprite;
                } else {
                    sprite = node.getComponent(cc.Sprite);
                    this.sprites[name] = sprite;
                }
                sprite.spriteFrame = sp.spriteFrame;
                var rect = sp.spriteFrame.getRect();
                node.width = rect.width;
                node.height = rect.height;

            } else
                node = sprite.node;
            this._updateSprite(sprite, worldSpace, sp);
            node.zIndex = index;
            this.lastSprites.push(node);
        }
    },
    is(a, b) {
        return a == b;
    }
});

cc.SpriterNode = module.exports = SpriterNode;
cc.js.obsolete(cc.SpriterNode.prototype, 'cc.SpriterNode.sconFile', 'sconAsset', true);
