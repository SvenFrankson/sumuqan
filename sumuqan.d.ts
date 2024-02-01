/// <reference path="lib/babylon.d.ts" />
/// <reference path="../nabu/nabu.d.ts" />
/// <reference path="../mummu/mummu.d.ts" />
declare namespace Sumuqan {
    enum KneeMode {
        Backward = 0,
        Vertical = 1
    }
    class Leg {
        isLeftLeg?: boolean;
        kneeMode: KneeMode;
        footLength: number;
        lowerLegLength: number;
        upperLegLength: number;
        footThickness: number;
        foot: BABYLON.Mesh;
        lowerLeg: BABYLON.Mesh;
        upperLeg: BABYLON.Mesh;
        footPos: BABYLON.Vector3;
        footUp: BABYLON.Vector3;
        footForward: BABYLON.Vector3;
        hipPos: BABYLON.Vector3;
        right: BABYLON.Vector3;
        up: BABYLON.Vector3;
        forward: BABYLON.Vector3;
        private _scale;
        get scale(): number;
        set scale(s: number);
        constructor(isLeftLeg?: boolean);
        private _upperLegZ;
        private _lowerLegZ;
        private _kneePos;
        updatePositions(): void;
    }
}
declare namespace Sumuqan {
    interface IPolypodeProps {
        legPairsCount: number;
        headAnchor?: BABYLON.Vector3;
        hipAnchors?: BABYLON.Vector3[];
        rightHipAnchors?: BABYLON.Vector3[];
        leftHipAnchors?: BABYLON.Vector3[];
        footTargets?: BABYLON.Vector3[];
        rightFootTargets?: BABYLON.Vector3[];
        leftFootTargets?: BABYLON.Vector3[];
        footThickness?: number;
        kneeMode?: KneeMode;
        upperLegLength?: number;
        lowerLegLength?: number;
        legScales?: number[];
        stepDuration?: number;
        stepDurationMin?: number;
        stepDurationMax?: number;
        stepHeight?: number;
        stepHeightMin?: number;
        stepHeightMax?: number;
        bootyShakiness?: number;
        bodyLocalOffset?: BABYLON.Vector3;
        bodyWorldOffset?: BABYLON.Vector3;
    }
    class Polypode extends BABYLON.Mesh {
        legPairCount: number;
        get legCount(): number;
        headAnchor: BABYLON.Vector3;
        rightHipAnchors: BABYLON.Vector3[];
        leftHipAnchors: BABYLON.Vector3[];
        rightFootTargets: BABYLON.Vector3[];
        leftFootTargets: BABYLON.Vector3[];
        setFootTarget(v: BABYLON.Vector3, index: number): void;
        private _footThickness;
        get footThickness(): number;
        setFootThickness(v: number): void;
        stepDurationMin: number;
        stepDurationMax: number;
        stepHeightMin: number;
        stepHeightMax: number;
        bootyShakiness: number;
        bodyLocalOffset: BABYLON.Vector3;
        bodyWorldOffset: BABYLON.Vector3;
        body: BABYLON.Mesh;
        head: BABYLON.Mesh;
        leftLegs: Leg[];
        rightLegs: Leg[];
        legs: Leg[];
        private _stepping;
        terrainFilter: (m: BABYLON.AbstractMesh) => boolean;
        constructor(name: string, prop: IPolypodeProps);
        setPosition(p: BABYLON.Vector3): void;
        initialize(): Promise<void>;
        private step;
        private _update;
    }
}
declare namespace Sumuqan {
    class Walker extends BABYLON.Mesh {
        leftHipAnchor: BABYLON.Vector3;
        rightHipAnchor: BABYLON.Vector3;
        headAnchor: BABYLON.Vector3;
        private _footTarget;
        get footTarget(): BABYLON.Vector3;
        set footTarget(v: BABYLON.Vector3);
        private _footThickness;
        get footThickness(): number;
        set footThickness(v: number);
        leftFootTarget: BABYLON.Mesh;
        rightFootTarget: BABYLON.Mesh;
        body: BABYLON.Mesh;
        head: BABYLON.Mesh;
        leftLeg: Leg;
        rightLeg: Leg;
        private _stepping;
        terrainFilter: (m: BABYLON.AbstractMesh) => boolean;
        constructor(name: string);
        setPosition(p: BABYLON.Vector3): void;
        initialize(): Promise<void>;
        private step;
        private _update;
    }
}
