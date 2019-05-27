const TiledObjectGroup = require('./CCTiledObjectGroup');
const RenderFlow = require('../core/renderer/render-flow');


let tmxObjectAssembler = {
    useModel: false,
    updateRenderData(group) {
        let objects = group.getObjects();
        let len = objects.length;
        if (len == 0) return;

        // TODO: Material API design and export from editor could affect the material activation process
        // need to update the logic here
        // sprite._calDynamicAtlas();

        let renderData = group._renderData;
        if (!renderData) {
            renderData = group._renderData = group.requestRenderData();
        }
        let data = renderData._data;
        if (!data) return;
        renderData.material = group.sharedMaterials[0];
        if (!renderData ||
            !(renderData.uvDirty || renderData.vertDirty))
            return;
        let mapSize = group.node.getContentSize();

        renderData.dataLength = Math.max(8, len*2);
        let l, b;
        for (let i = 0; i < len; i++) {
            let obj = objects[i];
            let frame = group.getFrame(obj.gid);
            let ow = frame._originalSize.width,
                oh = frame._originalSize.height,
                rw = frame._rect.width,
                rh = frame._rect.height,
                offset = frame._offset;

            let appx = obj.x - mapSize.width / 2;
            let appy = obj.y - mapSize.height / 2;
            let trimLeft = offset.x + (ow - rw) / 2;
            let trimBottom = offset.y + (oh - rh) / 2;
            l = appx - trimLeft;
            b = appy - trimBottom;
            data[i].x = l;
            data[i].y = b;
        }


        // update data property
        renderData.vertexCount = len * 4;
        renderData.indiceCount = len * 6;
        renderData.uvDirty = false;
        renderData.vertDirty = false;

    },

    fillBuffers(group, renderer) {
        let renderData = group._renderData;
        if (!renderData) return;
        let node = group.node,
            data = renderData._data;

        // buffer
        let buffer = renderer._meshBuffer;

        let offsetInfo = buffer.request(renderData.vertexCount, renderData.indiceCount);

        // buffer data may be realloc, need get reference after request.
        let indiceOffset = offsetInfo.indiceOffset,
            vertexOffset = offsetInfo.byteOffset >> 2,
            vertexId = offsetInfo.vertexOffset,
            vbuf = buffer._vData,
            ibuf = buffer._iData,
            uintbuf = buffer._uintVData;

        let objects = group.getObjects();
        let len = objects.length;
        if (len == 0) return;
        let color = node._color._val,
            matrix = node._worldMatrix,
            a = matrix.m00,
            b = matrix.m01,
            c = matrix.m04,
            d = matrix.m05,
            tx = matrix.m12,
            ty = matrix.m13;
        for (let i = 0; i < len; i++) {
            let obj = objects[i];
            let frame = group.getFrame(obj.gid);
            let uv = frame.uv;
            let x = data[i].x;
            let x1 = x + obj.width;
            let y = data[i].y;
            let y1 = y + obj.height;
            // Vertex
            // lb
            vbuf[vertexOffset] = x * a + y * c + tx;
            vbuf[vertexOffset + 1] = x * b + y * d + ty;
            // rb
            vbuf[vertexOffset + 5] = x1 * a + y * c + tx;
            vbuf[vertexOffset + 6] = x1 * b + y * d + ty;
            // lt
            vbuf[vertexOffset + 10] = x * a + y1 * c + tx;
            vbuf[vertexOffset + 11] = x * b + y1 * d + ty;
            // rt
            vbuf[vertexOffset + 15] = x1 * a + y1 * c + tx;
            vbuf[vertexOffset + 16] = x1 * b + y1 * d + ty;

            // lb
            vbuf[vertexOffset + 2] = uv[0];
            vbuf[vertexOffset + 3] = uv[1];
            // rb
            vbuf[vertexOffset + 7] = uv[0] + (uv[6] - uv[0]);
            vbuf[vertexOffset + 8] = uv[1];
            // lt
            vbuf[vertexOffset + 12] = uv[0];
            vbuf[vertexOffset + 13] = uv[1] + (uv[7] - uv[1]);
            // rt
            vbuf[vertexOffset + 17] = vbuf[vertexOffset + 7];
            vbuf[vertexOffset + 18] = vbuf[vertexOffset + 13];
            // color
            uintbuf[vertexOffset + 4] = color;
            uintbuf[vertexOffset + 9] = color;
            uintbuf[vertexOffset + 14] = color;
            uintbuf[vertexOffset + 19] = color;
            vertexOffset += 20;

        }
        for (let i = 0, l = renderData.indiceCount; i < l; i+=6) {
            ibuf[indiceOffset++] = vertexId;
            ibuf[indiceOffset++] = vertexId+1;
            ibuf[indiceOffset++] = vertexId+2;
            ibuf[indiceOffset++] = vertexId+1;
            ibuf[indiceOffset++] = vertexId+3;
            ibuf[indiceOffset++] = vertexId+2;
            vertexId += 4;
        }
        group.node._renderFlag |= RenderFlow.FLAG_UPDATE_RENDER_DATA;
    }
};

module.exports = TiledObjectGroup._assembler = tmxObjectAssembler;