/// <reference path="lib/babylon.d.ts" />
/// <reference path="../nabu/nabu.d.ts" />
/// <reference path="../mummu/mummu.d.ts" />
/// <reference path="../kulla-grid/kulla-grid.d.ts" />
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
        hipPos: BABYLON.Vector3;
        right: BABYLON.Vector3;
        up: BABYLON.Vector3;
        forward: BABYLON.Vector3;
        constructor(isLeftLeg?: boolean);
        instantiate(): Promise<void>;
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
        leftFootTarget: BABYLON.Mesh;
        rightFootTarget: BABYLON.Mesh;
        body: BABYLON.Mesh;
        bodyVelocity: BABYLON.Vector3;
        leftLeg: Leg;
        rightLeg: Leg;
        private _stepping;
        terrainFilter: (m: BABYLON.AbstractMesh) => boolean;
        constructor(name: string);
        initialize(): Promise<void>;
        private step;
        private _update;
    }
}
