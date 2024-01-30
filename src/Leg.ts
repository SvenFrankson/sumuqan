/// <reference path="../lib/babylon.d.ts"/>
/// <reference path="../../nabu/nabu.d.ts"/>
/// <reference path="../../mummu/mummu.d.ts"/>

namespace Sumuqan {

    export class Leg {

        public footLength: number = 0.5;
        public lowerLegLength: number = 1;
        public upperLegLength: number = 1;
        public footThickness: number = 0.23;

        public foot: BABYLON.Mesh;
        public lowerLeg: BABYLON.Mesh;
        public upperLeg: BABYLON.Mesh;

        public footPos: BABYLON.Vector3 = BABYLON.Vector3.Zero();
        public footUp: BABYLON.Vector3 = new BABYLON.Vector3(0, 1, 0);
        public footForward: BABYLON.Vector3 = new BABYLON.Vector3(0, 0, 1);

        public hipPos: BABYLON.Vector3 = BABYLON.Vector3.Zero();
        public right: BABYLON.Vector3 = new BABYLON.Vector3(1, 0, 0);
        public up: BABYLON.Vector3 = new BABYLON.Vector3(0, 1, 0);
        public forward: BABYLON.Vector3 = new BABYLON.Vector3(0, 0, 1);

        constructor(public isLeftLeg?: boolean) {
            this.foot = new BABYLON.Mesh("foot");
            this.foot.rotationQuaternion = BABYLON.Quaternion.Identity();
            this.lowerLeg = new BABYLON.Mesh("lower-leg");
            this.lowerLeg.rotationQuaternion = BABYLON.Quaternion.Identity();
            this.upperLeg = new BABYLON.Mesh("upper-leg");
            this.upperLeg.rotationQuaternion = BABYLON.Quaternion.Identity();
        }

        private _upperLegZ: BABYLON.Vector3 = BABYLON.Vector3.Forward();
        private _lowerLegZ: BABYLON.Vector3 = BABYLON.Vector3.Forward();
        private _kneePos: BABYLON.Vector3 = BABYLON.Vector3.Zero();
        public updatePositions(): void {
            this._kneePos.copyFrom(this.hipPos).addInPlace(this.footPos).scaleInPlace(0.5).subtractInPlace(this.forward).addInPlace(this.right.scale(this.isLeftLeg ? -1 : 1));
            
            for (let n = 0; n < 2; n++) {
                Mummu.ForceDistanceFromOriginInPlace(this._kneePos, this.footPos, this.lowerLegLength);
                Mummu.ForceDistanceFromOriginInPlace(this._kneePos, this.hipPos, this.upperLegLength);
            }

            this._upperLegZ.copyFrom(this._kneePos).subtractInPlace(this.hipPos).normalize();
            this._lowerLegZ.copyFrom(this.footPos).subtractInPlace(this._kneePos).normalize();

            this.upperLeg.position.copyFrom(this.hipPos);
            Mummu.QuaternionFromZYAxisToRef(this._upperLegZ, this.up, this.upperLeg.rotationQuaternion);

            this._upperLegZ.scaleInPlace(this.upperLegLength);
            this._kneePos.copyFrom(this.hipPos).addInPlace(this._upperLegZ);
            
            this.lowerLeg.position.copyFrom(this._kneePos);
            Mummu.QuaternionFromZYAxisToRef(this._lowerLegZ, this.up, this.lowerLeg.rotationQuaternion);
            
            this._lowerLegZ.scaleInPlace(this.lowerLegLength);
            this.foot.position.copyFrom(this.lowerLeg.position).addInPlace(this._lowerLegZ);

            Mummu.QuaternionFromYZAxisToRef(this.footUp, this.footForward, this.foot.rotationQuaternion);
        }
    }
}