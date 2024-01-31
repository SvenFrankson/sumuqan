namespace Sumuqan {

    export class Polypode extends BABYLON.Mesh {

        public legPairCount: number = 2;
        public get legCount(): number {
            return this.legPairCount * 2;
        }
        public leftHipAnchors: BABYLON.Vector3[] = [];
        public rightHipAnchors: BABYLON.Vector3[] = [];
        public headAnchor: BABYLON.Vector3 = new BABYLON.Vector3(0, 0, 0.75);
        private _footTargets: BABYLON.Vector3[] = [];
        public get footTargets(): BABYLON.Vector3[] {
            return this._footTargets;
        }
        public setFootTarget(v: BABYLON.Vector3, index: number) {
            this._footTargets[index] = v;
            this.rightFootTargets[index].position.copyFrom(this._footTargets[index]);
            this.leftFootTargets[index].position.copyFrom(this._footTargets[index]);
            this.leftFootTargets[index].position.x *= -1;
        }
        private _footThickness: number = 1.2;
        public get footThickness(): number {
            return this._footThickness;
        }
        public set footThickness(v: number) {
            this._footThickness = v;
            for (let i = 0; i < this.legPairCount; i++) {
                this.rightLegs[i].footThickness = this._footThickness;
                this.leftLegs[i].footThickness = this._footThickness;
            }
        }

        public leftFootTargets: BABYLON.Mesh[] = [];
        public rightFootTargets: BABYLON.Mesh[] = [];

        public body: BABYLON.Mesh;
        public head: BABYLON.Mesh;
        public leftLegs: Leg[] = [];
        public rightLegs: Leg[] = [];
        public legs: Leg[] = [];
        private _stepping: number = 0;

        public terrainFilter: (m: BABYLON.AbstractMesh) => boolean;

        constructor(name: string, legPairCount: number) {
            super(name);

            this.legPairCount = legPairCount;

            this.body = BABYLON.MeshBuilder.CreateSphere("body", { diameterX: 1, diameterY: 1, diameterZ: 1.5 });
            this.body.rotationQuaternion = BABYLON.Quaternion.Identity();
            
            this.head = BABYLON.MeshBuilder.CreateSphere("head", { diameterX: 0.5, diameterY: 0.5, diameterZ: 0.75 });
            this.head.rotationQuaternion = BABYLON.Quaternion.Identity();

            for (let i = 0; i < this.legPairCount; i++) {
                this.rightLegs[i] = new Leg();
                this.rightLegs[i].kneeMode = KneeMode.Vertical;
                this.leftLegs[i] = new Leg(true);
                this.leftLegs[i].kneeMode = KneeMode.Vertical;
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

        public setPosition(p: BABYLON.Vector3): void {
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

        public async initialize(): Promise<void> {
            this.getScene().onBeforeRenderObservable.add(this._update);
        }

        private async step(leg: Leg, target: BABYLON.Vector3, targetNorm: BABYLON.Vector3, targetForward: BABYLON.Vector3): Promise<void> {
            return new Promise<void>(resolve => {
                let origin = leg.footPos.clone();
                let originNorm = leg.footUp.clone();
                let originForward = leg.footForward.clone();
                let destination = target.clone();
                let destinationNorm = targetNorm.clone();
                let destinationForward = targetForward.clone();
                let dist = 1.5 * BABYLON.Vector3.Distance(origin, destination);
                let hMax = Math.min(Math.max(0.5, dist), 0.2)
                let duration = Math.min(0.5, dist) * (0.9 + 0.2 * Math.random());
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
                }
                this.getScene().onBeforeRenderObservable.add(animationCB);
            })
        }

        private _update = () => {
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

            if (this._stepping <= 0) {
                let longestStepDist = 0;
                let legToMove: Leg;
                let targetPosition: BABYLON.Vector3;
                let targetNormal: BABYLON.Vector3;

                for (let i = 0; i < this.legPairCount; i++) {
                    let rayRight = new BABYLON.Ray(this.rightFootTargets[i].absolutePosition.add(this.up), this.up.scale(- 2));
                    let pickRight = this.getScene().pickWithRay(rayRight, this.terrainFilter);
                    let targetRight: BABYLON.Vector3;
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
    
                    let rayLeft = new BABYLON.Ray(this.leftFootTargets[i].absolutePosition.add(this.up), this.up.scale(- 2));
                    let pickLeft = this.getScene().pickWithRay(rayLeft, this.terrainFilter);
                    let targetLeft: BABYLON.Vector3;
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
                    this._stepping++;
                    this.step(legToMove, targetPosition, targetNormal, this.forward).then(() => { this._stepping--; });
                }
            }

            for (let i = 0; i < this.legPairCount; i++) {
                this.leftLegs[i].updatePositions();
                this.rightLegs[i].updatePositions();
            }

            let bodyPos = BABYLON.Vector3.Zero();
            let offset = BABYLON.Vector3.Zero();
            for (let i = 0; i < this.legPairCount; i++) {
                bodyPos.addInPlace(this.rightLegs[i].foot.absolutePosition);
                bodyPos.addInPlace(this.leftLegs[i].foot.absolutePosition);

                offset.addInPlace(this.rightFootTargets[i].position);
                offset.addInPlace(this.leftFootTargets[i].position);
            }
            bodyPos.scaleInPlace(1 / this.legCount);
            offset.scaleInPlace(1 / this.legCount);
            offset.copyFromFloats(0, -0.15, 0);
            bodyPos.y -= 0.1;

            BABYLON.Vector3.TransformNormalToRef(offset, this.getWorldMatrix(), offset);
            bodyPos.subtractInPlace(offset);

            BABYLON.Quaternion.SlerpToRef(this.body.rotationQuaternion, this.rotationQuaternion, 0.01, this.body.rotationQuaternion);
            
            Mummu.QuaternionFromZYAxisToRef(this.forward, this.up, this.head.rotationQuaternion);

            BABYLON.Vector3.LerpToRef(this.body.position, bodyPos, 0.1, this.body.position);
        }
    }
}