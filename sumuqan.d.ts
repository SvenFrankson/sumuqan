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
        initialize(): Promise<void>;
        private _upperLegZ;
        private _lowerLegZ;
        private _kneePos;
        updatePositions(): void;
    }
}
