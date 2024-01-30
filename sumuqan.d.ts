/// <reference path="lib/babylon.d.ts" />
/// <reference path="../nabu/nabu.d.ts" />
/// <reference path="../mummu/mummu.d.ts" />
declare namespace Sumuqan {
    class Leg {
        isLeftLeg?: boolean;
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
        constructor(isLeftLeg?: boolean);
        private _upperLegZ;
        private _lowerLegZ;
        private _kneePos;
        updatePositions(): void;
    }
}
declare namespace Sumuqan {
    class Walker extends BABYLON.Mesh {
        leftHipAnchor: BABYLON.Vector3;
        rightHipAnchor: BABYLON.Vector3;
        headAnchor: BABYLON.Vector3;
        bodyAnchor: number;
        private _footSpacing;
        get footSpacing(): number;
        set footSpacing(v: number);
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
