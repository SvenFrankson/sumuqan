/// <reference path="../lib/babylon.d.ts"/>
/// <reference path="../../nabu/nabu.d.ts"/>
/// <reference path="../../mummu/mummu.d.ts"/>
var Sumuqan;
(function (Sumuqan) {
    class Leg {
        constructor(isLeftLeg) {
            this.isLeftLeg = isLeftLeg;
            this.footLength = 0.5;
            this.lowerLegLength = 1;
            this.upperLegLength = 1;
            this.footThickness = 0.23;
            this.footPos = BABYLON.Vector3.Zero();
            this.footUp = new BABYLON.Vector3(0, 1, 0);
            this.footForward = new BABYLON.Vector3(0, 0, 1);
            this.hipPos = BABYLON.Vector3.Zero();
            this.right = new BABYLON.Vector3(1, 0, 0);
            this.up = new BABYLON.Vector3(0, 1, 0);
            this.forward = new BABYLON.Vector3(0, 0, 1);
            this._upperLegZ = BABYLON.Vector3.Forward();
            this._lowerLegZ = BABYLON.Vector3.Forward();
            this._kneePos = BABYLON.Vector3.Zero();
            this.foot = new BABYLON.Mesh("foot");
            this.foot.rotationQuaternion = BABYLON.Quaternion.Identity();
            this.lowerLeg = new BABYLON.Mesh("lower-leg");
            this.lowerLeg.rotationQuaternion = BABYLON.Quaternion.Identity();
            this.upperLeg = new BABYLON.Mesh("upper-leg");
            this.upperLeg.rotationQuaternion = BABYLON.Quaternion.Identity();
        }
        updatePositions() {
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
    Sumuqan.Leg = Leg;
})(Sumuqan || (Sumuqan = {}));
var Sumuqan;
(function (Sumuqan) {
    class Walker extends BABYLON.Mesh {
        constructor(name) {
            super(name);
            this.leftHipAnchor = new BABYLON.Vector3(-0.5, 0, 0);
            this.rightHipAnchor = new BABYLON.Vector3(0.5, 0, 0);
            this.headAnchor = new BABYLON.Vector3(0, 0, 0.75);
            this.bodyAnchor = 1.8;
            this._footSpacing = 1.2;
            this._footThickness = 1.2;
            this._stepping = 0;
            this._update = () => {
                BABYLON.Vector3.TransformCoordinatesToRef(this.leftHipAnchor, this.body.getWorldMatrix(), this.leftLeg.hipPos);
                BABYLON.Vector3.TransformCoordinatesToRef(this.rightHipAnchor, this.body.getWorldMatrix(), this.rightLeg.hipPos);
                BABYLON.Vector3.TransformCoordinatesToRef(this.headAnchor, this.body.getWorldMatrix(), this.head.position);
                this.leftLeg.right = this.right;
                this.leftLeg.up = this.up;
                this.leftLeg.forward = this.forward;
                this.rightLeg.right = this.right;
                this.rightLeg.up = this.up;
                this.rightLeg.forward = this.forward;
                if (this._stepping === 0) {
                    let dRight = 0;
                    let dLeft = 0;
                    let rayRight = new BABYLON.Ray(this.rightFootTarget.absolutePosition.add(this.up), this.up.scale(-2));
                    console.log(this.rightFootTarget.absolutePosition);
                    let pickRight = this.getScene().pickWithRay(rayRight, this.terrainFilter);
                    let targetRight;
                    if (pickRight.hit && pickRight.pickedPoint) {
                        targetRight = pickRight.pickedPoint.add(pickRight.getNormal(true, true).scale(this.rightLeg.footThickness));
                        dRight = BABYLON.Vector3.DistanceSquared(this.rightLeg.footPos, targetRight);
                    }
                    let rayLeft = new BABYLON.Ray(this.leftFootTarget.absolutePosition.add(this.up), this.up.scale(-2));
                    let pickLeft = this.getScene().pickWithRay(rayLeft, this.terrainFilter);
                    let targetLeft;
                    if (pickLeft.hit && pickLeft.pickedPoint) {
                        targetLeft = pickLeft.pickedPoint.add(pickLeft.getNormal(true, true).scale(this.leftLeg.footThickness));
                        dLeft = BABYLON.Vector3.DistanceSquared(this.leftLeg.footPos, targetLeft);
                    }
                    if (Math.max(dRight, dLeft) > 0.01) {
                        this._stepping = 1;
                        if (dLeft > dRight) {
                            this.step(this.leftLeg, targetLeft, pickLeft.getNormal(true, true), this.forward).then(() => { this._stepping = 0; });
                        }
                        else {
                            this.step(this.rightLeg, targetRight, pickRight.getNormal(true, true), this.forward).then(() => { this._stepping = 0; });
                        }
                    }
                }
                this.leftLeg.updatePositions();
                this.rightLeg.updatePositions();
                let bodyPos = this.leftLeg.footPos.add(this.rightLeg.footPos).scaleInPlace(0.5);
                bodyPos.addInPlace(this.up.scale(this.bodyAnchor));
                let bodyQuat = BABYLON.Quaternion.Identity();
                Mummu.QuaternionFromYZAxisToRef(this.leftLeg.footUp.add(this.rightLeg.footUp), this.forward, bodyQuat);
                let feetQuat = BABYLON.Quaternion.Identity();
                Mummu.QuaternionFromXZAxisToRef(this.rightLeg.foot.absolutePosition.subtract(this.leftLeg.foot.absolutePosition), this.forward, feetQuat);
                BABYLON.Quaternion.SlerpToRef(feetQuat, bodyQuat, 0.5, bodyQuat);
                BABYLON.Quaternion.SlerpToRef(this.body.rotationQuaternion, bodyQuat, 0.05, this.body.rotationQuaternion);
                Mummu.QuaternionFromZYAxisToRef(this.forward, this.up, this.head.rotationQuaternion);
                this.body.position.scaleInPlace(0.9).addInPlace(bodyPos.scale(0.1));
            };
            this.body = BABYLON.MeshBuilder.CreateSphere("body", { diameterX: 1, diameterY: 1, diameterZ: 1.5 });
            this.body.rotationQuaternion = BABYLON.Quaternion.Identity();
            this.head = BABYLON.MeshBuilder.CreateSphere("head", { diameterX: 0.5, diameterY: 0.5, diameterZ: 0.75 });
            this.head.rotationQuaternion = BABYLON.Quaternion.Identity();
            this.leftLeg = new Sumuqan.Leg(true);
            this.rightLeg = new Sumuqan.Leg();
            this.rightFootTarget = new BABYLON.Mesh("right-foot-target");
            this.rightFootTarget.parent = this;
            this.rightFootTarget.position.x = this._footSpacing * 0.5;
            this.leftFootTarget = new BABYLON.Mesh("left-foot-target");
            this.leftFootTarget.parent = this;
            this.leftFootTarget.position.x = -this._footSpacing * 0.5;
        }
        get footSpacing() {
            return this._footSpacing;
        }
        set footSpacing(v) {
            this._footSpacing = v;
            this.rightFootTarget.position.x = this._footSpacing * 0.5;
            this.leftFootTarget.position.x = -this._footSpacing * 0.5;
        }
        get footThickness() {
            return this._footThickness;
        }
        set footThickness(v) {
            this._footThickness = v;
            this.rightLeg.footThickness = this._footThickness;
            this.leftLeg.footThickness = this._footThickness;
        }
        setPosition(p) {
            this.position.copyFrom(p);
            this.computeWorldMatrix(true);
            this.rightFootTarget.computeWorldMatrix(true);
            this.leftFootTarget.computeWorldMatrix(true);
            this.rightLeg.footPos.copyFrom(this.rightFootTarget.absolutePosition);
            this.leftLeg.footPos.copyFrom(this.rightFootTarget.absolutePosition);
            this.body.position.copyFrom(this.leftLeg.footPos).addInPlace(this.rightLeg.footPos).scaleInPlace(0.5);
            this.body.position.addInPlace(this.up.scale(0.5));
            this.body.computeWorldMatrix(true);
            BABYLON.Vector3.TransformCoordinatesToRef(this.leftHipAnchor, this.body.getWorldMatrix(), this.leftLeg.hipPos);
            BABYLON.Vector3.TransformCoordinatesToRef(this.rightHipAnchor, this.body.getWorldMatrix(), this.rightLeg.hipPos);
            BABYLON.Vector3.TransformCoordinatesToRef(this.headAnchor, this.body.getWorldMatrix(), this.head.position);
        }
        async initialize() {
            this.getScene().onBeforeRenderObservable.add(this._update);
        }
        async step(leg, target, targetNorm, targetForward) {
            console.log("step " + target.clone());
            return new Promise(resolve => {
                let origin = leg.footPos.clone();
                let originNorm = leg.footUp.clone();
                let originForward = leg.footForward.clone();
                let destination = target.clone();
                let destinationNorm = targetNorm.clone();
                let destinationForward = targetForward.clone();
                let dist = BABYLON.Vector3.Distance(origin, destination);
                let hMax = Math.min(Math.max(1, dist), 0.2);
                let duration = Math.min(0.8, 2 * dist);
                let t = 0;
                let animationCB = () => {
                    t += this.getScene().getEngine().getDeltaTime() / 1000;
                    let f = t / duration;
                    let h = Math.sqrt(Math.sin(f * Math.PI)) * hMax;
                    if (f < 1) {
                        let p = origin.scale(1 - f).addInPlace(destination.scale(f));
                        let n = originNorm.scale(1 - f).addInPlace(destinationNorm.scale(f)).normalize();
                        let forward = originForward.scale(1 - f).addInPlace(destinationForward.scale(f)).normalize();
                        //let n = this.up;
                        p.addInPlace(n.scale(h * dist * Math.sin(f * Math.PI)));
                        leg.footPos.copyFrom(p);
                        leg.footUp.copyFrom(n);
                        leg.footForward.copyFrom(forward);
                    }
                    else {
                        leg.footPos.copyFrom(destination);
                        leg.footUp.copyFrom(destinationNorm);
                        leg.footForward.copyFrom(destinationForward);
                        this.getScene().onBeforeRenderObservable.removeCallback(animationCB);
                        resolve();
                    }
                };
                this.getScene().onBeforeRenderObservable.add(animationCB);
            });
        }
    }
    Sumuqan.Walker = Walker;
})(Sumuqan || (Sumuqan = {}));
