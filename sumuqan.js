/// <reference path="../lib/babylon.d.ts"/>
/// <reference path="../../nabu/nabu.d.ts"/>
/// <reference path="../../mummu/mummu.d.ts"/>
/// <reference path="../../kulla-grid/kulla-grid.d.ts"/>
var Sumuqan;
(function (Sumuqan) {
    class Leg {
        constructor() {
            this.footLength = 0.5;
            this.lowerLegLength = 1;
            this.upperLegLength = 1;
            this._upperLegZ = BABYLON.Vector3.Forward();
            this._lowerLegZ = BABYLON.Vector3.Forward();
            this._kneePos = BABYLON.Vector3.Zero();
            this.foot = new BABYLON.Mesh("foot");
            this.lowerLeg = new BABYLON.Mesh("lower-leg");
            this.upperLeg = new BABYLON.Mesh("upper-leg");
        }
        async initialize() {
            this.foot = BABYLON.MeshBuilder.CreateLines(this.foot.name, { points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, this.footLength)] });
            this.foot.rotationQuaternion = BABYLON.Quaternion.Identity();
            this.lowerLeg = BABYLON.MeshBuilder.CreateLines(this.lowerLeg.name, { points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, this.lowerLegLength)] });
            this.lowerLeg.rotationQuaternion = BABYLON.Quaternion.Identity();
            this.upperLeg = BABYLON.MeshBuilder.CreateLines(this.upperLeg.name, { points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, this.upperLegLength)] });
            this.upperLeg.rotationQuaternion = BABYLON.Quaternion.Identity();
        }
        updatePositions() {
            this._kneePos.copyFrom(this.hipPos).addInPlace(this.footPos).scaleInPlace(0.5).subtractInPlace(this.forward);
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
            Mummu.QuaternionFromZYAxisToRef(this.forward, this.up, this.foot.rotationQuaternion);
        }
    }
    Sumuqan.Leg = Leg;
})(Sumuqan || (Sumuqan = {}));
