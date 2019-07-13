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

/**
 * !#en Renders the TMX object group.
 * !#zh 渲染 tmx object group。
 * @class TiledGroup
 * @extends Component
 */
let TiledGroup = cc.Class({
    name: 'cc.TiledGroup',
    extends: cc.Component,

    /**
     * !#en Offset position of child objects.
     * !#zh 获取子对象的偏移位置。
     * @method getPositionOffset
     * @return {Vec2}
     * @example
     * let offset = tMXObjectGroup.getPositionOffset();
     */
    getPositionOffset() {
        return this._positionOffset;
    },
    /**
     * !#en Gets the Group name.
     * !#zh 获取组名称。
     * @method getGroupName
     * @return {String}
     * @example
     * let groupName = tMXObjectGroup.getGroupName;
     */
    getGroupName() {
        return this._groupName;
    },
    /**
     * Return the value for the specific property name
     * @param {String} propertyName
     * @return {Object}
     */
    getProperty(propertyName) {
        return this._properties[propertyName.toString()];
    },
    /**
     * !#en List of properties stored in a dictionary.
     * !#zh 以映射的形式获取属性列表。
     * @method getProperties
     * @return {Object}
     * @example
     * let offset = tMXObjectGroup.getProperties();
     */
    getProperties() {
        this._properties;
    },

    /**
     * !#en
     * Return the object for the specific object name. <br />
     * It will return the 1st object found on the array for the given name.
     * !#zh 获取指定的对象。
     * @method getObject
     * @param {String} objectName
     * @return {cc.TiledLayer|cc.TiledObjectGroup|Null}
     * @example
     * let object = tMXObjectGroup.getObject("Group");
     */
    getObject(objectName) {
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
    getObjects() {
        return this._objects;
    },


    _init(groupInfo, mapInfo) {
        this._groupName = groupInfo.name;
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
        this._objects = objects;
    }

});

cc.TiledGroup = module.exports = TiledGroup;
