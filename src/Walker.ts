namespace Sumuqan {

    export class Walker extends BABYLON.Mesh {

        public leftFootTarget: BABYLON.Mesh;
        public rightFootTarget: BABYLON.Mesh;

        public body: BABYLON.Mesh;
        public leftLeg: Leg;
        public rightLeg: Leg;
        private _stepping: number = 0;

        constructor(name: string) {
            super(name);

            this.body = BABYLON.MeshBuilder.CreateSphere("body", { diameterX: 1, diameterY: 1, diameterZ: 1.5 });

            this.leftLeg = new Leg();
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

        private async step(leg: Leg, target: BABYLON.Vector3/*, targetNorm: BABYLON.Vector3*/): Promise<void> {
            return new Promise<void>(resolve => {
                let origin = leg.footPos.clone();
                //let originNorm = leg.targetNormal.clone();
                let destination = target.clone();
                //let destinationNorm = targetNorm.clone();
                let dist = BABYLON.Vector3.Distance(origin, destination);
                let hMax = Math.min(Math.max(0.5, dist), 0.1)
                let duration = Math.min(0.45, dist);
                let t = 0;
                let animationCB = () => {
                    t += this.getScene().getEngine().getDeltaTime() / 1000;
                    let f = t / duration;
                    let h = Math.sqrt(Math.sin(f * Math.PI)) * hMax;
                    if (f < 1) {
                        let p = origin.scale(1 - f).addInPlace(destination.scale(f));
                        //let n = originNorm.scale(1 - f).addInPlace(destinationNorm.scale(f)).normalize();
                        let n = this.up;
                        p.addInPlace(n.scale(h * dist * Math.sin(f * Math.PI)));
                        leg.footPos.copyFrom(p);
                        //leg.targetNormal.copyFrom(n);
                    }
                    else {
                        leg.footPos.copyFrom(destination);
                        //leg.targetNormal.copyFrom(destinationNorm);
                        this.getScene().onBeforeRenderObservable.removeCallback(animationCB);
                        resolve();
                    }
                }
                this.getScene().onBeforeRenderObservable.add(animationCB);
            })
        }

        private _update = () => {
            BABYLON.Vector3.TransformCoordinatesToRef(new BABYLON.Vector3(-0.5, 0, 0), this.body.getWorldMatrix(), this.leftLeg.hipPos);
            BABYLON.Vector3.TransformCoordinatesToRef(new BABYLON.Vector3(0.5, 0, 0), this.body.getWorldMatrix(), this.rightLeg.hipPos);

            this.leftLeg.right = this.right;
            this.leftLeg.up = this.up;
            this.leftLeg.forward = this.forward;

            this.rightLeg.right = this.right;
            this.rightLeg.up = this.up;
            this.rightLeg.forward = this.forward;

            if (this._stepping === 0) {
                let dRight = BABYLON.Vector3.DistanceSquared(this.rightLeg.footPos, this.rightFootTarget.absolutePosition);
                let dLeft = BABYLON.Vector3.DistanceSquared(this.leftLeg.footPos, this.leftFootTarget.absolutePosition);
                if (Math.max(dRight, dLeft) > 0.01) {
                    this._stepping = 1;
                    if (dLeft > dRight) {
                        this.step(this.leftLeg, this.leftFootTarget.absolutePosition).then(() => { this._stepping = 0; });
                    }
                    else {
                        this.step(this.rightLeg, this.rightFootTarget.absolutePosition).then(() => { this._stepping = 0; });
                    }
                }
            }

            this.leftLeg.updatePositions();
            this.rightLeg.updatePositions();

            let bodyPos = this.leftLeg.footPos.add(this.rightLeg.footPos).scaleInPlace(0.5);
            bodyPos.addInPlace(this.up.scale(1.3));
            this.body.position.copyFrom(bodyPos);
        }
    }
}