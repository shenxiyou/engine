let spriter = require("./lib/spriter-js");

function getKeyValue(frames) {
    if (typeof (frames) == "object" && typeof (frames.length) == "number") {
        let obj = {};
        for (let i = 0; i < frames.length; i++) {
            let f = frames[i];
            obj[f.filename] = f;
        }
        return obj;
    }
    return frames;
}

/**
 * Class for spriter asset handling.
 * @class SpriterAsset
 * @extends Asset
 *
 */
var SpriterAsset = cc.Class({
    name: 'cc.SpriterAsset',
    extends: cc.Asset,
    ctor: function () {
        this._spriteFrames = null;
        this.reset();
    },
    properties: {
        _spriterJson: '',
        /**
         * !#en The animation data.
         * !#zh 动画数据
         * @property {String} spriterJson
         */
        spriterJson: {
            get: function () {
                return this._spriterJson;
            },
            set: function (value) {
                this._spriterJson = value;
                this.reset();
            }
        },

        /**
         * @property {String} atlasText
         */
        atlas: {
            default: [],
            type: [cc.JsonAsset]
        },
        /**
         * @property {Texture2D[]} textures
         */
        textures: {
            default: [],
            type: [cc.Texture2D]
        }


    },
    statics: {
        preventDeferredLoadDependents: true
    },
    reset: function () {
        this._spriterCache = null;
        this._atlasCache = null;
        this._spriteFrames = null;
        if (CC_EDITOR) {
            this._entityEnum = null;
            this._animsEnum = null;
        }
    },
    /**
     * !#en get all SpriteFrame.
     * !#zh 获得精灵帧
     * @method getFrames
     * @return {Map<SpriteFrame>}
     */
    getFrames: function () {
        if (this._spriteFrames) return this._spriteFrames;
        if (!(this.textures && this.textures.length > 0)) {
            cc.errorID(7507, this.name);
            return {};
        }
        this._spriteFrames = {};
        let pose = this.getRuntimeData();
        let data = pose.data;
        data.folder_array.forEach(folder => {
            let atlas = this.atlas[folder.atlas];
            let texture = this.textures[folder.atlas];
            folder.file_array.forEach((file) => {
                switch (file.type) {
                    case 'image':
                        {
                            let image_key = file.name;
                            // image_key = image_key.substring(image_key.lastIndexOf("/") + 1);
                            if (atlas) {
                                let frames = getKeyValue(atlas.json.frames);
                                let item = frames[image_key];
                                let _frame = item.frame;
                                let sourceSize = item.sourceSize;
                                let rect = cc.rect(_frame.x, _frame.y, _frame.w, _frame.h);
                                var frame = new cc.SpriteFrame(texture, rect, item.rotated == "true",
                                    cc.v2(0, 0), cc.size(sourceSize.w, sourceSize.h));
                                this._spriteFrames[image_key] = frame;
                            }

                            break;
                        }
                    default:
                        {
                            // TODO: Add pose.bone_array, pose.event_array, pose.tag_array
                            cc.log('not load', file.type, file.name);
                            break;
                        }
                }
            });
        });
        return this._spriteFrames;
    },
    /**
     * !#en get all SpriteFrame.
     * !#zh 获得动画数据
     * @method getRuntimeData
     * @return {spriter.Pose}
     */
    getRuntimeData: function () {
        if (this._spriterCache) {
            return this._spriterCache;
        }

        const data = new spriter.Data().load(JSON.parse(this.spriterJson));
        this._spriterCache = new spriter.Pose(data);

        return this._spriterCache;
    },
     /**
     * !#en get default Entity.
     * !#zh 获得动画默认Entity
     * @method getDefaultEntity
     * @return {String}
     */
    getDefaultEntity: function() {
        let pose = this.getRuntimeData();
        if(pose) {
            return pose.getEntityKeys()[0]; 
        }
        return "";
    },
    // EDITOR

    getEntitysEnum: CC_EDITOR && function () {
        if (this._entityEnum) {
            return this._entityEnum;
        }
        var sd = this.getRuntimeData();
        if (sd) {
            var entitys = sd.getEntityKeys();
            var enumDef = {};
            for (var i = 0; i < entitys.length; i++) {
                var name = entitys[i];
                enumDef[name] = i;
            }
            return this._entityEnum = cc.Enum(enumDef);
        }
        return null;
    },

    getAnimsEnum: CC_EDITOR && function () {
        if (this._animsEnum) {
            return this._animsEnum;
        }
        var sd = this.getRuntimeData();
        if (sd) {
            var enumDef = {};
            var anims = sd.getAnimKeys();
            for (var i = 0; i < anims.length; i++) {
                var name = anims[i];
                enumDef[name] = i;
            }
            return this._animsEnum = cc.Enum(enumDef);
        }
        return null;
    },
    createNode: CC_EDITOR && function (callback) {
        var node = new cc.Node(this.name);
        var sp = node.addComponent(cc.SpriterNode);
        sp.sconAsset = this;

        return callback(null, node);
    }
});

module.exports = SpriterAsset;
cc.SpriterAsset = SpriterAsset;
