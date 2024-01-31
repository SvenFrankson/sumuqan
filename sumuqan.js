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
    class Polypode extends BABYLON.Mesh {
        constructor(name, legPairCount) {
            super(name);
            this.legPairCount = 2;
            this.leftHipAnchors = [];
            this.rightHipAnchors = [];
            this.headAnchor = new BABYLON.Vector3(0, 0, 0.75);
            this._footTargets = [];
            this._footThickness = 1.2;
            this.leftFootTargets = [];
            this.rightFootTargets = [];
            this.leftLegs = [];
            this.rightLegs = [];
            this.legs = [];
            this._stepping = 0;
            this._update = () => {
                for (let i = 0; i < this.legPairCount; i++) {
                    BABYLON.Vector3.TransformCoordinatesToRef(this.leftHipAnchors[i], this.body.getWorldMatrix(), this.leftLegs[i].hipPos);
                    BABYLON.Vector3.TransformCoordinatesToRef(this.rightHipAnchors[i], this.body.getWorldMatrix(), this.rightLegs[i].hipPos);
                }
                BABYLON.Vector3.TransformCoordinatesToRef(this.headAnchor, this.body.getWorldMatrix(), this.head.position);
                for (let i = 0; i < this.legPairCount; i++) {
                    this.leftLegs[i].right = this.right;
                    this.leftLegs[i].up = this.up;
                    this.leftLegs[i].forward = this.forward;
                    this.rightLegs[i].right = this.right;
                    this.rightLegs[i].up = this.up;
                    this.rightLegs[i].forward = this.forward;
                }
                if (this._stepping === 0) {
                    let longestStepDist = 0;
                    let legToMove;
                    let targetPosition;
                    let targetNormal;
                    for (let i = 0; i < this.legPairCount; i++) {
                        let rayRight = new BABYLON.Ray(this.rightFootTargets[i].absolutePosition.add(this.up), this.up.scale(-2));
                        let pickRight = this.getScene().pickWithRay(rayRight, this.terrainFilter);
                        let targetRight;
                        if (pickRight.hit && pickRight.pickedPoint) {
                            targetRight = pickRight.pickedPoint.add(pickRight.getNormal(true, true).scale(this.rightLegs[i].footThickness));
                            let d = BABYLON.Vector3.DistanceSquared(this.rightLegs[i].footPos, targetRight);
                            if (d > longestStepDist) {
                                longestStepDist = d;
                                legToMove = this.rightLegs[i];
                                targetPosition = pickRight.pickedPoint;
                                targetNormal = pickRight.getNormal(true, true);
                            }
                        }
                        let rayLeft = new BABYLON.Ray(this.leftFootTargets[i].absolutePosition.add(this.up), this.up.scale(-2));
                        let pickLeft = this.getScene().pickWithRay(rayLeft, this.terrainFilter);
                        let targetLeft;
                        if (pickLeft.hit && pickLeft.pickedPoint) {
                            targetLeft = pickLeft.pickedPoint.add(pickLeft.getNormal(true, true).scale(this.leftLegs[i].footThickness));
                            let d = BABYLON.Vector3.DistanceSquared(this.leftLegs[i].footPos, targetLeft);
                            if (d > longestStepDist) {
                                longestStepDist = d;
                                legToMove = this.leftLegs[i];
                                targetPosition = pickLeft.pickedPoint;
                                targetNormal = pickLeft.getNormal(true, true);
                            }
                        }
                    }
                    if (longestStepDist > 0.01) {
                        this._stepping = 1;
                        this.step(legToMove, targetPosition, targetNormal, this.forward).then(() => { this._stepping = 0; });
                    }
                }
                for (let i = 0; i < this.legPairCount; i++) {
                    this.leftLegs[i].updatePositions();
                    this.rightLegs[i].updatePositions();
                }
                let bodyPos = this.legs.map(leg => { return leg.footPos; }).reduce((p1, p2) => { return p1.add(p2); }).scaleInPlace(1 / this.legCount);
                let offset = this.rightFootTargets[1].position.add(this.leftFootTargets[1].position).scale(0.5);
                BABYLON.Vector3.TransformNormalToRef(offset, this.getWorldMatrix(), offset);
                bodyPos.subtractInPlace(offset);
                BABYLON.Quaternion.SlerpToRef(this.body.rotationQuaternion, this.rotationQuaternion, 0.05, this.body.rotationQuaternion);
                Mummu.QuaternionFromZYAxisToRef(this.forward, this.up, this.head.rotationQuaternion);
                BABYLON.Vector3.LerpToRef(bodyPos, this.position, 0.2, this.body.position);
            };
            this.legPairCount = legPairCount;
            this.body = BABYLON.MeshBuilder.CreateSphere("body", { diameterX: 1, diameterY: 1, diameterZ: 1.5 });
            this.body.rotationQuaternion = BABYLON.Quaternion.Identity();
            this.head = BABYLON.MeshBuilder.CreateSphere("head", { diameterX: 0.5, diameterY: 0.5, diameterZ: 0.75 });
            this.head.rotationQuaternion = BABYLON.Quaternion.Identity();
            for (let i = 0; i < this.legPairCount; i++) {
                this.rightLegs[i] = new Sumuqan.Leg();
                this.leftLegs[i] = new Sumuqan.Leg(true);
            }
            this.legs = [...this.rightLegs, ...this.leftLegs];
            for (let i = 0; i < this.legPairCount; i++) {
                this.footTargets[i] = new BABYLON.Vector3(1, 0, 0.3 * i);
                this.rightFootTargets[i] = new BABYLON.Mesh("right-foot-target-" + i);
                this.rightFootTargets[i].parent = this;
                this.rightFootTargets[i].position.copyFrom(this.footTargets[i]);
                this.leftFootTargets[i] = new BABYLON.Mesh("left-foot-target-" + i);
                this.leftFootTargets[i].parent = this;
                this.leftFootTargets[i].position.copyFrom(this.footTargets[i]);
                this.leftFootTargets[i].position.x *= -1;
            }
        }
        get legCount() {
            return this.legPairCount * 2;
        }
        get footTargets() {
            return this._footTargets;
        }
        setFootTarget(v, index) {
            this._footTargets[index] = v;
            this.rightFootTargets[index].position.copyFrom(this._footTargets[index]);
            this.leftFootTargets[index].position.copyFrom(this._footTargets[index]);
            this.leftFootTargets[index].position.x *= -1;
        }
        get footThickness() {
            return this._footThickness;
        }
        set footThickness(v) {
            this._footThickness = v;
            for (let i = 0; i < this.legPairCount; i++) {
                this.rightLegs[i].footThickness = this._footThickness;
                this.leftLegs[i].footThickness = this._footThickness;
            }
        }
        setPosition(p) {
            this.position.copyFrom(p);
            this.computeWorldMatrix(true);
            for (let i = 0; i < this.legPairCount; i++) {
                this.rightFootTargets[i].computeWorldMatrix(true);
                this.leftFootTargets[i].computeWorldMatrix(true);
                this.rightLegs[i].footPos.copyFrom(this.rightFootTargets[i].absolutePosition);
                this.leftLegs[i].footPos.copyFrom(this.rightFootTargets[i].absolutePosition);
            }
            this.body.position.copyFrom(this.leftLegs[0].footPos).addInPlace(this.rightLegs[0].footPos).scaleInPlace(0.5);
            this.body.position.addInPlace(this.up.scale(0.5));
            this.body.computeWorldMatrix(true);
            for (let i = 0; i < this.legPairCount; i++) {
                BABYLON.Vector3.TransformCoordinatesToRef(this.leftHipAnchors[i], this.body.getWorldMatrix(), this.leftLegs[i].hipPos);
                BABYLON.Vector3.TransformCoordinatesToRef(this.rightHipAnchors[i], this.body.getWorldMatrix(), this.rightLegs[i].hipPos);
            }
            BABYLON.Vector3.TransformCoordinatesToRef(this.headAnchor, this.body.getWorldMatrix(), this.head.position);
        }
        async initialize() {
            this.getScene().onBeforeRenderObservable.add(this._update);
        }
        async step(leg, target, targetNorm, targetForward) {
            return new Promise(resolve => {
                let origin = leg.footPos.clone();
                let originNorm = leg.footUp.clone();
                let originForward = leg.footForward.clone();
                let destination = target.clone();
                let destinationNorm = targetNorm.clone();
                let destinationForward = targetForward.clone();
                let dist = BABYLON.Vector3.Distance(origin, destination);
                let hMax = Math.min(Math.max(0.5, dist), 0.1);
                //let duration = Math.min(0.5, 2 * dist);
                let duration = 0.3;
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
    Sumuqan.Polypode = Polypode;
})(Sumuqan || (Sumuqan = {}));
var Sumuqan;
(function (Sumuqan) {
    class Walker extends BABYLON.Mesh {
        constructor(name) {
            super(name);
            this.leftHipAnchor = new BABYLON.Vector3(-0.5, 0, 0);
            this.rightHipAnchor = new BABYLON.Vector3(0.5, 0, 0);
            this.headAnchor = new BABYLON.Vector3(0, 0, 0.75);
            this._footTarget = new BABYLON.Vector3(0.5, -0.5, 0);
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
                let offset = this.rightFootTarget.position.add(this.leftFootTarget.position).scale(0.5);
                BABYLON.Vector3.TransformNormalToRef(offset, this.getWorldMatrix(), offset);
                bodyPos.subtractInPlace(offset);
                let bodyQuat = BABYLON.Quaternion.Identity();
                Mummu.QuaternionFromYZAxisToRef(this.leftLeg.footUp.add(this.rightLeg.footUp), this.forward, bodyQuat);
                let feetQuat = BABYLON.Quaternion.Identity();
                Mummu.QuaternionFromXZAxisToRef(this.rightLeg.foot.absolutePosition.subtract(this.leftLeg.foot.absolutePosition), this.forward, feetQuat);
                BABYLON.Quaternion.SlerpToRef(feetQuat, bodyQuat, 0.5, bodyQuat);
                BABYLON.Quaternion.SlerpToRef(this.body.rotationQuaternion, bodyQuat, 0.05, this.body.rotationQuaternion);
                Mummu.QuaternionFromZYAxisToRef(this.forward, this.up, this.head.rotationQuaternion);
                BABYLON.Vector3.LerpToRef(bodyPos, this.position, 0.2, this.body.position);
            };
            this.body = BABYLON.MeshBuilder.CreateSphere("body", { diameterX: 1, diameterY: 1, diameterZ: 1.5 });
            this.body.rotationQuaternion = BABYLON.Quaternion.Identity();
            this.head = BABYLON.MeshBuilder.CreateSphere("head", { diameterX: 0.5, diameterY: 0.5, diameterZ: 0.75 });
            this.head.rotationQuaternion = BABYLON.Quaternion.Identity();
            this.leftLeg = new Sumuqan.Leg(true);
            this.rightLeg = new Sumuqan.Leg();
            this.rightFootTarget = new BABYLON.Mesh("right-foot-target");
            this.rightFootTarget.parent = this;
            this.rightFootTarget.position.copyFrom(this.footTarget);
            this.leftFootTarget = new BABYLON.Mesh("left-foot-target");
            this.leftFootTarget.parent = this;
            this.leftFootTarget.position.copyFrom(this.footTarget);
            this.leftFootTarget.position.x *= -1;
        }
        get footTarget() {
            return this._footTarget;
        }
        set footTarget(v) {
            this._footTarget = v;
            this.rightFootTarget.position.copyFrom(this.footTarget);
            this.leftFootTarget.position.copyFrom(this.footTarget);
            this.leftFootTarget.position.x *= -1;
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
            return new Promise(resolve => {
                let origin = leg.footPos.clone();
                let originNorm = leg.footUp.clone();
                let originForward = leg.footForward.clone();
                let destination = target.clone();
                let destinationNorm = targetNorm.clone();
                let destinationForward = targetForward.clone();
                let dist = BABYLON.Vector3.Distance(origin, destination);
                let hMax = Math.min(Math.max(0.5, dist), 0.2);
                //let duration = Math.min(0.5, 2 * dist);
                let duration = 0.7;
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
