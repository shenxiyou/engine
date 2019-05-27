/****************************************************************************
 Copyright (c) 2016 Chukong Technologies Inc.
 Copyright (c) 2017-2018 Xiamen Yaji Software Co., Ltd.

 https://www.cocos.com/

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated engine source code (the "Software"), a limited,
 worldwide, royalty-free, non-assignable, revocable and non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You shall
 not use Cocos Creator software for developing other software or tools that's
 used for developing games. You are not granted to publish, distribute,
 sublicense, and/or sell copies of Cocos Creator.

 The software or tools in this License Agreement are licensed, not sold.
 Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to you.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/
const RenderComponent = require('../core/components/CCRenderComponent');
const renderEngine = require('../core/renderer/render-engine');
 const SpriteMaterial = renderEngine.SpriteMaterial;

/**
 * !#en Renders the TMX object group.
 * !#zh 渲染 tmx object group。
 * @class TiledObjectGroup
 * @extends Component
 */
let TiledObjectGroup = cc.Class({
    name: 'cc.TiledObjectGroup',

    // Inherits from the abstract class directly,
    // because TiledLayer not create or maintains the sgNode by itself.
    extends: RenderComponent,

    /**
     * !#en Offset position of child objects.
     * !#zh 获取子对象的偏移位置。
     * @method getPositionOffset
     * @return {Vec2}
     * @example
     * let offset = tMXObjectGroup.getPositionOffset();
     */
    getPositionOffset () {
        return this._positionOffset;
    },


    /**
     * !#en List of properties stored in a dictionary.
     * !#zh 以映射的形式获取属性列表。
     * @method getProperties
     * @return {Object}
     * @example
     * let offset = tMXObjectGroup.getProperties();
     */
    getProperties () {
        this._properties;
    },

    /**
     * !#en Gets the Group name.
     * !#zh 获取组名称。
     * @method getGroupName
     * @return {String}
     * @example
     * let groupName = tMXObjectGroup.getGroupName;
     */
    getGroupName () {
        return this._groupName;
    },

    /**
     * Return the value for the specific property name
     * @param {String} propertyName
     * @return {Object}
     */
    getProperty (propertyName) {
        return this._properties[propertyName.toString()];
    },

    /**
     * !#en
     * Return the object for the specific object name. <br />
     * It will return the 1st object found on the array for the given name.
     * !#zh 获取指定的对象。
     * @method getObject
     * @param {String} objectName
     * @return {Object|Null}
     * @example
     * let object = tMXObjectGroup.getObject("Group");
     */
    getObject (objectName) {
        for (let i = 0, len = this._objects.length; i < len; i++) {
            let obj = this._objects[i];
            if (obj && obj.name === objectName) {
                return obj;
            }
        }
        // object not found
        return null;
    },

    /**
     * !#en Gets the objects.
     * !#zh 获取对象数组。
     * @method getObjects
     * @return {Array}
     * @example
     * let objects = tMXObjectGroup.getObjects();
     */
    getObjects () {
        return this._objects;
    },
    getTileSet(tilesets, gid) {
        for (let i = tilesets.length - 1; i >= 0; i--) {
            let t = tilesets[i];
            if (gid > t.firstGid) {
                return t;
            }
        }
    },
    createObject() {
        let objectGroup = this;
        let objects = objectGroup.getObjects();
        let parent = objectGroup.node;
        let group = parent.group;
        let mapInfo = objectGroup._mapInfo;
        let tilesets = mapInfo.getTilesets();
        let i = 0;
        for (; i < objects.length; i++) {
            let obj = objects[i];
            let go = parent.children[i];
            if(!go) {
                go = new cc.Node();
                parent.addChild(go);
            }
            go.name = obj.id + "";
            go.group = group;
            let sp = go.getComponent(cc.Sprite);
            if(!sp) sp = go.addComponent(cc.Sprite);
            let tileset = this.getTileSet(tilesets, obj.gid);
            let image = tileset.getImageByGid(obj.gid);
            sp.spriteFrame = image;
            
            go.scale = 1;
            go.width = obj.width;
            go.height = obj.height;
            let pos = this.positionForTileCoord(cc.v2(obj.x, obj.y));
            go.position = pos.add(cc.v2(go.width / 2, go.height / 2));
        }
        for(;i < parent.childrenCount;i++) {
            let go = parent.children[i];
            go.removeFromParent();
        }
    },
    positionForTileCoord(tileCoord) {
        let mapSize = this.node.getContentSize();
        let x = tileCoord.x - mapSize.width / 2;
        let y = tileCoord.y - mapSize.height / 2;
        return cc.v2(x, y);
    },
    _init (groupInfo, mapInfo) {
        this._groupName = groupInfo.name;
        this._positionOffset = cc.v2(groupInfo.offset.x,-groupInfo.offset.y);
        this._mapInfo = mapInfo;
        this._properties = groupInfo.getProperties();

        let mapSize = mapInfo._mapSize;
        let tileSize = mapInfo._tileSize;
        let width = 0, height = 0;
        if (mapInfo.orientation === cc.TiledMap.Orientation.HEX) {
            if (mapInfo.getStaggerAxis() === cc.TiledMap.StaggerAxis.STAGGERAXIS_X) {
                height = tileSize.height * (mapSize.height + 0.5);
                width = (tileSize.width + mapInfo.getHexSideLength()) * Math.floor(mapSize.width / 2) + tileSize.width * (mapSize.width % 2);
            } else {
                width = tileSize.width * (mapSize.width + 0.5);
                height = (tileSize.height + mapInfo.getHexSideLength()) * Math.floor(mapSize.height / 2) + tileSize.height * (mapSize.height % 2);
            }
        } else {
            width = mapSize.width * tileSize.width; 
            height = mapSize.height * tileSize.height;
        }
        this.node.setContentSize(width, height);

        let objects = groupInfo._objects;
        for (let i = 0, l = objects.length; i < l; i++) {
            let object = objects[i];
            object.offset = cc.v2(object.x, object.y);

            let points = object.points || object.polylinePoints;
            if (points) {
                for (let pi = 0; pi < points.length; pi++) {
                    points[pi].y *= -1;
                }
            }

            if (cc.TiledMap.Orientation.ISO !== mapInfo.orientation) {
                object.y = height - object.y;
            } else {
                let posIdxX = object.x / tileSize.width * 2;
                let posIdxY = object.y / tileSize.height;
                object.x = tileSize.width / 2 * (mapSize.width + posIdxX - posIdxY);
                object.y = tileSize.height / 2 * (mapSize.height * 2 - posIdxX - posIdxY);
            }

        }
        this._objects = objects;
        let tilesets = mapInfo.getTilesets();
        let obj = objects[0];
        if(obj) {
            let tileset = this.getTileSet(tilesets, obj.gid);
            let image = tileset.getImageByGid(obj.gid);
            this._texture = image.getTexture();
            this.tileset = tileset;
        }
        // this.createObject();
        this._activateMaterial();
    },
    getFrame(gid) {
        if(!this.tileset) return;
        return this.tileset.getImageByGid(gid);
    },
    _activateMaterial () {
        let material = this._material;
        if (!material) {
            material = this._material = new SpriteMaterial();
            material.useColor = false;
        }

        if (this._texture) {
            // TODO: old texture in material have been released by loader
            material.texture = this._texture;
            material.updateHash();
            this.markForUpdateRenderData(true);
            this.markForRender(true);
        }
        else {
            this.disableRender();   
        }
        
        this._updateMaterial(material);
    }
});

cc.TiledObjectGroup = module.exports = TiledObjectGroup;
