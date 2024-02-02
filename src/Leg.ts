/// <reference path="../lib/babylon.d.ts"/>
/// <reference path="../../nabu/nabu.d.ts"/>
/// <reference path="../../mummu/mummu.d.ts"/>

namespace Sumuqan {

    export enum KneeMode {
        Backward,
        Vertical,
        Outward
    }

    export class Leg {

        public kneeMode: KneeMode = KneeMode.Vertical;
        public initialKneePos: BABYLON.Vector3;

        public footLength: number = 0.5;
        public lowerLegLength: number = 1;
        public upperLegLength: number = 1;
        public footThickness: number = 0.23;
        public get totalLength(): number {
            return (this.upperLegLength + this.lowerLegLength) * this.scale;
        }

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

        private _scale: number = 1;
        public get scale(): number {
            return this._scale;
        }
        public set scale(s: number) {
            this._scale = s;
            this.upperLeg.scaling.copyFromFloats(this.scale, this.scale, this.scale);
            this.lowerLeg.scaling.copyFromFloats(this.scale, this.scale, this.scale);
            this.foot.scaling.copyFromFloats(this.scale, this.scale, this.scale);
        }

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
            if (this.initialKneePos) {
                this._kneePos.copyFrom(this.initialKneePos);
            }
            else if (this.kneeMode === KneeMode.Backward) {
                this._kneePos.copyFrom(this.hipPos).addInPlace(this.footPos).scaleInPlace(0.5).addInPlace((this.up.add(this.footUp)).normalize()).subtractInPlace(this.forward).addInPlace(this.right.scale(this.isLeftLeg ? -1 : 1));
            }
            else if (this.kneeMode === KneeMode.Vertical) {
                this._kneePos.copyFrom(this.hipPos).addInPlace(this.footPos).scaleInPlace(0.5).addInPlace((this.up.add(this.footUp)).normalize());
            }
            else if (this.kneeMode === KneeMode.Outward) {
                this._kneePos.copyFrom(this.hipPos).addInPlace(this.footPos).scaleInPlace(0.5).addInPlace(this.right.scale(this.isLeftLeg ? -1 : 1));
            }
            
            for (let n = 0; n < 2; n++) {
                Mummu.ForceDistanceFromOriginInPlace(this._kneePos, this.footPos, this.lowerLegLength * this.scale);
                Mummu.ForceDistanceFromOriginInPlace(this._kneePos, this.hipPos, this.upperLegLength * this.scale);
            }

            this._upperLegZ.copyFrom(this._kneePos).subtractInPlace(this.hipPos).normalize();
            this._lowerLegZ.copyFrom(this.footPos).subtractInPlace(this._kneePos).normalize();

            this.upperLeg.position.copyFrom(this.hipPos);
            Mummu.QuaternionFromZYAxisToRef(this._upperLegZ, this.up, this.upperLeg.rotationQuaternion);

            this._upperLegZ.scaleInPlace(this.upperLegLength * this.scale);
            this._kneePos.copyFrom(this.hipPos).addInPlace(this._upperLegZ);
            
            this.lowerLeg.position.copyFrom(this._kneePos);
            if (this.kneeMode === KneeMode.Backward) {
                Mummu.QuaternionFromZYAxisToRef(this._lowerLegZ, this._upperLegZ, this.lowerLeg.rotationQuaternion);
            }
            else if (this.kneeMode === KneeMode.Vertical) {
                Mummu.QuaternionFromZYAxisToRef(this._lowerLegZ, this._upperLegZ, this.lowerLeg.rotationQuaternion);
            }
            else if (this.kneeMode === KneeMode.Outward) {
                Mummu.QuaternionFromZYAxisToRef(this._lowerLegZ, this._upperLegZ, this.lowerLeg.rotationQuaternion);
            }
            
            this._lowerLegZ.scaleInPlace(this.lowerLegLength * this.scale);
            this.foot.position.copyFrom(this.lowerLeg.position).addInPlace(this._lowerLegZ);

            Mummu.QuaternionFromYZAxisToRef(this.footUp, this.footForward, this.foot.rotationQuaternion);
        }
    }
}