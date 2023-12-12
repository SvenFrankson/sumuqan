/// <reference path="lib/babylon.d.ts" />
/// <reference path="../nabu/nabu.d.ts" />
/// <reference path="../mummu/mummu.d.ts" />
/// <reference path="../kulla-grid/kulla-grid.d.ts" />
declare namespace Sumuqan {
    class Leg {
        footLength: number;
        lowerLegLength: number;
        upperLegLength: number;
        foot: BABYLON.Mesh;
        lowerLeg: BABYLON.Mesh;
        upperLeg: BABYLON.Mesh;
        footPos: BABYLON.Vector3;
        hipPos: BABYLON.Vector3;
        right: BABYLON.Vector3;
        up: BABYLON.Vector3;
        forward: BABYLON.Vector3;
        constructor();
        instantiate(): Promise<void>;
        private _upperLegZ;
        private _lowerLegZ;
        private _kneePos;
        updatePositions(): void;
    }
}
declare namespace Sumuqan {
    class Walker extends BABYLON.Mesh {
        leftFootTarget: BABYLON.Mesh;
        rightFootTarget: BABYLON.Mesh;
        body: BABYLON.Mesh;
        leftLeg: Leg;
        rightLeg: Leg;
        private _stepping;
        constructor(name: string);
        initialize(): Promise<void>;
        private step;
        private _update;
    }
}
