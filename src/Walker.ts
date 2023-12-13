namespace Sumuqan {

    export class Walker extends BABYLON.Mesh {

        public leftHipAnchor: BABYLON.Vector3 = new BABYLON.Vector3(-0.5, 0, 0);
        public rightHipAnchor: BABYLON.Vector3 = new BABYLON.Vector3(0.5, 0, 0);

        public leftFootTarget: BABYLON.Mesh;
        public rightFootTarget: BABYLON.Mesh;

        public body: BABYLON.Mesh;
        public bodyVelocity: BABYLON.Vector3 = BABYLON.Vector3.Zero();
        public leftLeg: Leg;
        public rightLeg: Leg;
        private _stepping: number = 0;

        public terrainFilter: (m: BABYLON.AbstractMesh) => boolean;

        constructor(name: string) {
            super(name);

            this.body = BABYLON.MeshBuilder.CreateSphere("body", { diameterX: 1, diameterY: 1, diameterZ: 1.5 });
            this.body.rotationQuaternion = BABYLON.Quaternion.Identity();

            this.leftLeg = new Leg(true);
            this.rightLeg = new Leg();

            this.rightFootTarget = new BABYLON.Mesh("right-foot-target");
            this.rightFootTarget.parent = this;
            this.rightFootTarget.position.x = 0.6;

            this.leftFootTarget = new BABYLON.Mesh("left-foot-target");
            this.leftFootTarget.parent = this;
            this.leftFootTarget.position.x = - 0.6;
        }

        public async initialize(): Promise<void> {
            this.leftLeg.instantiate();
            this.rightLeg.instantiate();

            this.getScene().onBeforeRenderObservable.add(this._update);
        }

        private async step(leg: Leg, target: BABYLON.Vector3, targetNorm: BABYLON.Vector3): Promise<void> {
            return new Promise<void>(resolve => {
                let origin = leg.footPos.clone();
                let originNorm = leg.footUp.clone();
                let destination = target.clone();
                let destinationNorm = targetNorm.clone();
                let dist = BABYLON.Vector3.Distance(origin, destination);
                let hMax = Math.min(Math.max(1, dist), 0.2)
                let duration = Math.min(0.8, 2 * dist);
                let t = 0;
                let animationCB = () => {
                    t += this.getScene().getEngine().getDeltaTime() / 1000;
                    let f = t / duration;
                    let h = Math.sqrt(Math.sin(f * Math.PI)) * hMax;
                    if (f < 1) {
                        let p = origin.scale(1 - f).addInPlace(destination.scale(f));
                        let n = originNorm.scale(1 - f).addInPlace(destinationNorm.scale(f)).normalize();
                        //let n = this.up;
                        p.addInPlace(n.scale(h * dist * Math.sin(f * Math.PI)));
                        leg.footPos.copyFrom(p);
                        leg.footUp.copyFrom(n);
                    }
                    else {
                        leg.footPos.copyFrom(destination);
                        leg.footUp.copyFrom(destinationNorm);
                        this.getScene().onBeforeRenderObservable.removeCallback(animationCB);
                        resolve();
                    }
                }
                this.getScene().onBeforeRenderObservable.add(animationCB);
            })
        }

        private _update = () => {
            BABYLON.Vector3.TransformCoordinatesToRef(this.leftHipAnchor, this.body.getWorldMatrix(), this.leftLeg.hipPos);
            BABYLON.Vector3.TransformCoordinatesToRef(this.rightHipAnchor, this.body.getWorldMatrix(), this.rightLeg.hipPos);

            this.leftLeg.right = this.right;
            this.leftLeg.up = this.up;
            this.leftLeg.forward = this.forward;

            this.rightLeg.right = this.right;
            this.rightLeg.up = this.up;
            this.rightLeg.forward = this.forward;

            if (this._stepping === 0) {
                let dRight = 0;
                let dLeft = 0;

                let rayRight = new BABYLON.Ray(this.rightFootTarget.absolutePosition.add(this.up), this.up.scale(- 2));
                let pickRight = this.getScene().pickWithRay(rayRight, this.terrainFilter);
                let targetRight: BABYLON.Vector3;
                if (pickRight.hit && pickRight.pickedPoint) {
                    targetRight = pickRight.pickedPoint.add(pickRight.getNormal(true, true).scale(this.rightLeg.footThickness));
                    dRight = BABYLON.Vector3.DistanceSquared(this.rightLeg.footPos, targetRight);
                }

                let rayLeft = new BABYLON.Ray(this.leftFootTarget.absolutePosition.add(this.up), this.up.scale(- 2));
                let pickLeft = this.getScene().pickWithRay(rayLeft, this.terrainFilter);
                let targetLeft: BABYLON.Vector3;
                if (pickLeft.hit && pickLeft.pickedPoint) {
                    targetLeft = pickLeft.pickedPoint.add(pickLeft.getNormal(true, true).scale(this.leftLeg.footThickness));
                    dLeft = BABYLON.Vector3.DistanceSquared(this.leftLeg.footPos, targetLeft);
                }

                if (Math.max(dRight, dLeft) > 0.01) {
                    this._stepping = 1;
                    if (dLeft > dRight) {
                        this.step(this.leftLeg, targetLeft, pickLeft.getNormal(true, true)).then(() => { this._stepping = 0; });
                    }
                    else {
                        this.step(this.rightLeg, targetRight, pickRight.getNormal(true, true)).then(() => { this._stepping = 0; });
                    }
                }
            }

            this.leftLeg.updatePositions();
            this.rightLeg.updatePositions();

            let bodyPos = this.leftLeg.footPos.add(this.rightLeg.footPos).scaleInPlace(0.5);
            bodyPos.addInPlace(this.up.scale(1.8));

            let bodyQuat = BABYLON.Quaternion.Identity();
            Mummu.QuaternionFromYZAxisToRef(this.leftLeg.footUp.add(this.rightLeg.footUp), this.forward, bodyQuat);

            let feetQuat = BABYLON.Quaternion.Identity();
            Mummu.QuaternionFromXZAxisToRef(this.rightLeg.foot.absolutePosition.subtract(this.leftLeg.foot.absolutePosition), this.forward, feetQuat);

            BABYLON.Quaternion.SlerpToRef(feetQuat, bodyQuat, 0.5, bodyQuat);

            BABYLON.Quaternion.SlerpToRef(this.body.rotationQuaternion, bodyQuat, 0.05, this.body.rotationQuaternion);

            this.body.position.scaleInPlace(0.9).addInPlace(bodyPos.scale(0.1));
        }
    }
}