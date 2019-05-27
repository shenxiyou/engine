const Fs = require('fire-fs');
const Path = require('fire-path');
const SPRITER_ENCODING = {
    encoding: 'utf-8'
};
const CustomAssetMeta = Editor.metas['custom-asset'];



class SpriterMeta extends CustomAssetMeta {
    constructor(assetdb) {
        super(assetdb);
        this._spriterJson = '';
        this._textures = [];
        this._atlas = [];
        this._spriterData = null;
    }

    static version() {
        return '1.0.0';
    }
    static defaultType() {
        return 'spriter';
    }


    import(fspath, cb) {
        Fs.readFile(fspath, SPRITER_ENCODING, (err, data) => {
            if (err) {
                return cb(err);
            }
            let root = Path.dirname(fspath);
            let json = JSON.parse(data);
            this._spriterData = json;
            this._spriterJson = JSON.stringify(json);
            let atlas = this._spriterData.atlas || [];
            for (let i = 0; i < atlas.length; i++) {
                let path = Path.join(root, atlas[i].name);
                this._atlas.push(atlas[i].name);
                if (Fs.existsSync(path)) {
                    let text = Fs.readFileSync(path, SPRITER_ENCODING);
                    let json = JSON.parse(text);
                    let img = json.meta.image;
                    this._textures.push(img);
                } else {
                    Editor.warn('file %s not find.', path);
                }
            }

            cb();
        });
    }
    postImport(fspath, cb) {
        var db = this._assetdb;
        let asset = new cc.SpriterAsset();
        asset.name = Path.basenameNoExt(fspath);
        asset.spriterJson = this._spriterJson;
        asset.textures = this._textures.map(p => {
            var path = Path.join(Path.dirname(fspath), p);
            var uuid = db.fspathToUuid(path);
            return uuid ? Editor.serialize.asAsset(uuid) : null;
        });
        asset.atlas = this._atlas.map(p => {
            var path = Path.join(Path.dirname(fspath), p);
            var uuid = db.fspathToUuid(path);
            if (uuid) {
                return Editor.serialize.asAsset(uuid);
            } else {
                Editor.error(`Can not find file ${path}`);
            }
            return null;
        });

        db.saveAssetToLibrary(this.uuid, asset);
        cb();
    }
}
module.exports = SpriterMeta;
