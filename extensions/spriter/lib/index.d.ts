declare namespace cc {
    interface Map<T> {
        [key: string]: T;
    }
}
declare namespace spriter {

    export function loadBool(json: any, key: string | number, def?: boolean): boolean;
    export function saveBool(json: any, key: string | number, value: boolean, def?: boolean): void;
    export function loadFloat(json: any, key: string | number, def?: number): number;
    export function saveFloat(json: any, key: string | number, value: number, def?: number): void;
    export function loadInt(json: any, key: string | number, def?: number): number;
    export function saveInt(json: any, key: string | number, value: number, def?: number): void;
    export function loadString(json: any, key: string | number, def?: string): string;
    export function saveString(json: any, key: string | number, value: string, def?: string): void;
    export function wrap(num: number, min: number, max: number): number;
    export function tween(a, b, t);
    export function wrapAngleRadians(angle);
    export function tweenAngleRadians(a, b, t, spin);
    export class Angle {
        public rad: number = 0;
        constructor(rad: number = 0);
        get deg(): number;
        set deg(value: number);
        get cos(): number;
        get sin(): number;
        selfIdentity(): Angle;
        copy(other: Angle): Angle;
        static add(a: Angle, b: Angle, out: Angle = new Angle()): Angle;
        add(other: Angle, out: Angle = new Angle()): Angle;
        selfAdd(other: Angle): Angle;
        static tween(a: Angle, b: Angle, pct: number, spin: number, out: Angle = new Angle()): Angle;
        tween(other: Angle, pct: number, spin: number, out: Angle = new Angle()): Angle;
        selfTween(other: Angle, pct: number, spin: number): Angle;
    }

    export class Vector {
        public x: number = 0.0;
        public y: number = 0.0;
        constructor(x: number = 0.0, y: number = 0.0);
        public copy(other: Vector): Vector;
        public static equal(a: Vector, b: Vector, epsilon: number = 1e-6): boolean;
        public static add(a: Vector, b: Vector, out: Vector = new Vector()): Vector;
        public add(other: Vector, out: Vector = new Vector()): Vector;
        public static tween(a: Vector, b: Vector, pct: number, out: Vector = new Vector());
        public tween(other: Vector, pct: number, out: Vector = new Vector()): Vector;
        public selfTween(other: Vector, pct: number): Vector;
    }

    export class Position extends Vector {
        constructor();
    }

    export class Rotation extends Angle {
        constructor();
    }

    export class Scale extends Vector {
        constructor();
        public selfIdentity(): Scale;
    }

    export class Pivot extends Vector {
        constructor();
        public selfIdentity(): Scale;
    }

    /**
     * @constructor
     */
    export class Space {
        position = new Position();
        rotation = new Rotation();
        scale = new Scale();
        copy(other: Space): Space;
        load(json: any): Space;
        static equal(a: Space, b: Space, epsilon: number = 1e-6);
        static identity(out: Space = new Space()): Space;
        static translate(space, x, y);
        static rotate(space, rad);
        static scale(space, x, y);
        static invert(space, out);
        static combine(a, b, out);
        static extract(ab, a, out);
        static transform(space, v, out);
        static untransform(space, v, out);
    }

    export class Element {
        id: number = -1;
        name: string = "";
        load(json: any): Element;
    }

    export class File extends Element {
        type: string = "unknown";
        constructor(type: string);
        load(json: any): File;
    }

    export class ImageFile extends File {
        width: number = 0;
        height: number = 0;
        pivot: Pivot = new Pivot();
        constructor();
        load(json: any): ImageFile;
    }

    export class SoundFile extends File {
        constructor();
        load(json: any): SoundFile;
    }

    export class Folder extends Element {
        file_array: File[] = [];
        load(json: any): Folder;
    }

    export class BaseObject {
        type: string = "unknown";
        name: string = "";
        constructor(type: string);
        load(json: any): BaseObject;
    }

    export class SpriteObject extends BaseObject {
        parent_index: number = -1;
        folder_index: number = -1;
        file_index: number = -1;
        local_space: Space = new Space();
        world_space: Space = new Space();
        default_pivot: boolean = false;
        pivot: Pivot = new Pivot();
        z_index: number = 0;
        alpha: number = 1.0;
        constructor();
        load(json: any): SpriteObject;;
        copy(other: SpriteObject): SpriteObject;
        tween(other, pct, spin): void;
    }

    export class Bone extends BaseObject {
        parent_index: number = -1;
        local_space: Space = new Space();
        world_space: Space = new Space();
        constructor();
        load(json: any): Bone;
        copy(other: Bone): Bone;
        tween(other: Bone, pct: number, spin: number): void;
    }

    export class BoxObject extends BaseObject {
        parent_index: number = -1;
        local_space: Space = new Space();
        world_space: Space = new Space();
        pivot: Pivot = new Pivot();
        constructor();
        load(json: any): BoxObject;
        copy(other: BoxObject): BoxObject;
        tween(other: BoxObject, pct: number, spin: number): void;
    }

    export class PointObject extends BaseObject {
        parent_index: number = -1;
        local_space: Space = new Space();
        world_space: Space = new Space();
        constructor();
        load(json: any): PointObject;
        copy(other: PointObject): PointObject;
        tween(other: PointObject, pct: number, spin: number): void;
    }

    export class SoundObject extends BaseObject {
        folder_index: number = -1;
        file_index: number = -1;
        trigger: boolean = false;
        volume: number = 1.0;
        panning: number = 0.0;
        constructor();
        load(json: any): SoundObject;
        copy(other: SoundObject): SoundObject;
        tween(other: SoundObject, pct: number, spin: number): void;
    }

    export class EntityObject extends BaseObject {
        parent_index: number = -1;
        local_space: Space = new Space();
        world_space: Space = new Space();
        entity_index: number = -1;
        animation_index: number = -1;
        animation_time: number = 0.0;
        pose: Pose;
        constructor();
        load(json: any): EntityObject;
        copy(other: EntityObject): EntityObject;
        tween(other: EntityObject, pct: number, spin: number): void;
    }

    export class VariableObject extends BaseObject {
        constructor();
        load(json: any): VariableObject;
        copy(other: VariableObject): VariableObject;
        tween(other: VariableObject, pct: number, spin: number): void;
    }

    export class Ref extends Element {
        parent_index: number = -1;
        timeline_index: number = -1;
        keyframe_index: number = -1;
        load(json: any): Ref;
    }

    export class BoneRef extends Ref {
    }

    export class ObjectRef extends Ref {
        z_index: number = 0;
        load(json: any): ObjectRef;
    }

    export class Keyframe extends Element {
        time: number = 0;
        load(json: any): Keyframe;
        static find(array: Keyframe[], time: number): number;
        static compare(a: Keyframe, b: Keyframe): number;
    }

    export class Curve {
        type: string = "linear";
        c1: number = 0.0;
        c2: number = 0.0;
        c3: number = 0.0;
        c4: number = 0.0;
        load(json: any): Curve;
        evaluate(t: number): number;
    }

    export class MainlineKeyframe extends Keyframe {
        curve: Curve = new Curve();
        bone_ref_array: BoneRef[];
        object_ref_array: ObjectRef[];
        load(json: any): MainlineKeyframe;
    }

    export class Mainline {
        keyframe_array: MainlineKeyframe[];
        load(json: any): Mainline;
    }

    export class TimelineKeyframe extends Keyframe {
        type: string = "unknown";
        spin: number = 1; // 1: counter-clockwise, -1: clockwise
        curve: Curve = new Curve();
        constructor(type: string);
        load(json: any): TimelineKeyframe;
    }

    export class SpriteTimelineKeyframe extends TimelineKeyframe {
        sprite: SpriteObject;
        constructor();
        load(json: any): SpriteTimelineKeyframe;
    }

    export class BoneTimelineKeyframe extends TimelineKeyframe {
        bone: Bone;
        constructor();
        load(json: any): BoneTimelineKeyframe;
    }

    export class BoxTimelineKeyframe extends TimelineKeyframe {
        box: BoxObject;
        constructor();
        load(json: any): BoxTimelineKeyframe;
    }

    export class PointTimelineKeyframe extends TimelineKeyframe {
        point: PointObject;
        constructor();
        load(json: any): PointTimelineKeyframe;
    }

    export class SoundTimelineKeyframe extends TimelineKeyframe {
        sound: SoundObject;
        constructor();
        load(json: any): SoundTimelineKeyframe;
    }

    export class EntityTimelineKeyframe extends TimelineKeyframe {
        entity: EntityObject;
        constructor();
        load(json: any): EntityTimelineKeyframe;
    }

    export class VariableTimelineKeyframe extends TimelineKeyframe {
        variable: VariableObject;
        constructor();
        load(json: any): VariableTimelineKeyframe;
    }

    export class TagDef extends Element {
        tag_index: number = -1;
        load(json: any): TagDef;
    }

    export class Tag extends Element {
        tag_def_index: number = -1;
        load(json: any): Tag;
    }

    export class TaglineKeyframe extends Keyframe {
        tag_array: Tag[];
        load(json: any): TaglineKeyframe;
    }

    export class Tagline extends Element {
        keyframe_array: TaglineKeyframe[] = [];
        load(json: any): Tagline;
    }

    export class VarlineKeyframe extends Keyframe {
        val: number | string;
        load(json: any): VarlineKeyframe;
    }

    export class Varline extends Element {
        var_def_index: number = -1;
        keyframe_array: VarlineKeyframe[];
        load(json: any): Varline;
    }

    export class Meta extends Element {
        tagline: Tagline;
        varline_array: Varline[];
        load(json: any): Meta;
    }

    export class Timeline extends Element {
        type: string = "sprite";
        object_index: number = -1;
        keyframe_array: TimelineKeyframe[];
        meta: Meta;
        load(json: any): Timeline;
    }

    export class SoundlineKeyframe extends Keyframe {
        sound: SoundObject;
        load(json: any): SoundlineKeyframe;
    }

    export class Soundline extends Element {
        keyframe_array: SoundlineKeyframe[];
        load(json: any): Soundline;
    }

    export class EventlineKeyframe extends Keyframe {
        /// event: EventObject;
        load(json: any): EventlineKeyframe;
    }

    export class Eventline extends Element {
        keyframe_array: EventlineKeyframe[];
        load(json: any): Eventline;
    }

    export class MapInstruction {
        folder_index: number = -1;
        file_index: number = -1;
        target_folder_index: number = -1;
        target_file_index: number = -1;
        load(json: any): MapInstruction;
    }

    export class CharacterMap extends Element {
        map_instruction_array: MapInstruction[] = [];
        load(json: any): CharacterMap;
    }

    export class VarDef extends Element {
        type: string;
        default_value: number | string;
        value: number | string;
        load(json: any): VarDef;
    }

    export class VarDefs extends Element {
        var_def_array: VarDef[];
        load(json: any): VarDefs;
    }

    export class ObjInfo extends Element {
        type: string = "unknown";
        var_defs: VarDefs;
        constructor(type: string);
        load(json: any): ObjInfo;
    }

    export class SpriteFrame {
        folder_index: number = -1;
        file_index: number = -1;
        load(json: any): SpriteFrame;
    }

    export class SpriteObjInfo extends ObjInfo {
        sprite_frame_array: SpriteFrame[];
        constructor();
        load(json: any): SpriteObjInfo;
    }

    export class BoneObjInfo extends ObjInfo {
        w: number = 0;
        h: number = 0;
        constructor();
        load(json: any): BoneObjInfo;
    }

    export class BoxObjInfo extends ObjInfo {
        w: number = 0;
        h: number = 0;
        constructor();
        load(json: any): BoxObjInfo;
    }

    export class Animation extends Element {
        length: number = 0;
        looping: string = "true"; // "true", "false" or "ping_pong"
        loop_to: number = 0;
        mainline: Mainline;
        timeline_array: Timeline[];
        soundline_array: Soundline[];
        eventline_array: Eventline[];
        meta: Meta;
        min_time: number = 0;
        max_time: number = 0;
        load(json: any): Animation;
    }

    export class Entity extends Element {
        character_map_map: { [key: string]: CharacterMap };
        character_map_keys: string[];
        var_defs: VarDefs;
        obj_info_map: { [key: string]: ObjInfo };
        obj_info_keys: string[];
        animation_map: { [key: string]: Animation };
        animation_keys: string[];
        load(json: any): Entity;
    }

    export class Data {
        folder_array: Folder[] = [];
        tag_def_array: TagDef[] = [];
        entity_map: { [key: string]: Entity } = {};
        entity_keys: string[] = [];
        load(json: any): Data;
        getEntities(): { [key: string]: Entity };
        getEntityKeys(): string[];
        getAnims(entity_key: string): { [key: string]: Animation };
        getAnimKeys(entity_key: string): string[];
    }

    export class Pose {
        data: Data;
        entity_key: string = "";
        character_map_key_array: string[] = [];
        anim_key: string = "";
        time: number = 0;
        elapsed_time: number = 0;
        dirty: boolean = true;
        bone_array: Bone[] = [];
        object_array: BaseObject[] = [];
        sound_array: any[] = [];
        event_array: string[] = [];
        tag_array: string[] = [];
        var_map: { [key: string]: number | string } = {};
        constructor(data: Data);
        getEntities(): { [key: string]: Entity };
        getEntityKeys(): string[];
        curEntity(): Entity;
        getEntity(): string {
            return this.entity_key;
        }
        setEntity(entity_key: string): void;
        getAnims(): { [key: string]: Animation };
        getAnimKeys(): string[];
        curAnim(): Animation;
        curAnimLength(): number;
        getAnim(): string;
        setAnim(anim_key: string): void;
        getAnimLenght(): number;
        getTime(): number;
        setTime(time: number): void;
        update(elapsed_time: number): void;
        strike(): void;
    }
}
