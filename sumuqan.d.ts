/// <reference path="lib/babylon.d.ts" />
/// <reference path="../nabu/nabu.d.ts" />
/// <reference path="../mummu/mummu.d.ts" />
declare namespace Sumuqan {
    class Antenna extends BABYLON.Mesh {
        polypode: Polypode;
        isLeft?: boolean;
        alpha0: number;
        alphaSpeed: number;
        beta0: number;
        betaSpeed: number;
        length: number;
        constructor(polypode: Polypode, isLeft?: boolean);
        update(dt: number): void;
    }
}
declare namespace Sumuqan {
    enum KneeMode {
        Backward = 0,
        Vertical = 1,
        Outward = 2
    }
    class Leg {
        isLeftLeg?: boolean;
        kneeMode: KneeMode;
        initialKneePos: BABYLON.Vector3;
        footLength: number;
        lowerLegLength: number;
        upperLegLength: number;
        footThickness: number;
        get totalLength(): number;
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
        headAnchor?: BABYLON.Vector3;
        antennaAnchor?: BABYLON.Vector3;
        antennaAlphaZero?: number;
        antennaBetaZero?: number;
        antennaLength?: number;
        scorpionTailProps?: IScorpionTailProps;
    }
    class Polypode extends BABYLON.Mesh {
        bodyColliders: Mummu.SphereCollider[];
        terrain: (Mummu.Collider | BABYLON.Mesh)[];
        protected _showDebug: boolean;
        get showDebug(): boolean;
        set showDebug(v: boolean);
        debugPovMesh: BABYLON.Mesh;
        debugBodyCollidersMeshes: BABYLON.Mesh[];
        private _debugColliderMaterial;
        get debugColliderMaterial(): BABYLON.Material;
        set debugColliderMaterial(mat: BABYLON.Material);
        private _debugColliderHitMaterial;
        get debugColliderHitMaterial(): BABYLON.Material;
        set debugColliderHitMaterial(mat: BABYLON.Material);
        private _debugPovMaterial;
        get debugPovMaterial(): BABYLON.Material;
        set debugPovMaterial(mat: BABYLON.Material);
        mentalMap: BABYLON.Vector3[];
        mentalMapNormal: BABYLON.Vector3[];
        mentalMapIndex: number;
        mentalMapMaxSize: number;
        localNormal: BABYLON.Vector3;
        mentalCheckPerFrame: number;
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
        antennas: Antenna[];
        tail: ScorpionTail;
        povOffset: BABYLON.Vector3;
        povAlpha: number;
        povBetaMin: number;
        povBetaMax: number;
        povRadiusMax: number;
        povRadiusMin: number;
        private _stepping;
        constructor(name: string, prop: IPolypodeProps);
        setPosition(p: BABYLON.Vector3): void;
        initialize(): Promise<void>;
        private step;
        private _update;
        updateBodyCollidersMeshes(): void;
    }
}
declare namespace Sumuqan {
    interface IScorpionTailProps {
        length: number;
        anchor?: BABYLON.Vector3;
        localDir?: BABYLON.Vector3;
        dist?: number;
        distances?: number[];
        distGeometricFactor?: number;
    }
    class ScorpionTail extends BABYLON.Mesh {
        polypode: Polypode;
        alpha0: number;
        alphaSpeed: number;
        beta0: number;
        betaSpeed: number;
        length: number;
        tailSegments: BABYLON.Mesh[];
        constructor(polypode: Polypode, props: IScorpionTailProps);
        update(dt: number): void;
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
