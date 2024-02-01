namespace Sumuqan {

    export interface IPolypodeProps {
        legPairsCount: number;
        headAnchor?: BABYLON.Vector3;
        hipAnchors?: BABYLON.Vector3[];
        rightHipAnchors?: BABYLON.Vector3[];
        leftHipAnchors?: BABYLON.Vector3[];
        footTargets?: BABYLON.Vector3[];
        rightFootTargets?: BABYLON.Vector3[];
        leftFootTargets?: BABYLON.Vector3[];
        footThickness?: number;
        kneeMode?: KneeMode;
        upperLegLength?: number;
        lowerLegLength?: number;
        stepDuration?: number;
        stepDurationMin?: number;
        stepDurationMax?: number;
        stepHeight?: number;
        stepHeightMin?: number;
        stepHeightMax?: number;
        bodyLocalOffset?: BABYLON.Vector3;
        bodyWorldOffset?: BABYLON.Vector3;
    }

    export class Polypode extends BABYLON.Mesh {

        public legPairCount: number = 2;
        public get legCount(): number {
            return this.legPairCount * 2;
        }
        public headAnchor: BABYLON.Vector3 = new BABYLON.Vector3(0, Math.SQRT2, Math.SQRT2);

        public rightHipAnchors: BABYLON.Vector3[];
        public leftHipAnchors: BABYLON.Vector3[];

        public rightFootTargets: BABYLON.Vector3[];
        public leftFootTargets: BABYLON.Vector3[];
        public setFootTarget(v: BABYLON.Vector3, index: number): void {
            this.rightFootTargets[index].copyFrom(v);
            this.leftFootTargets[index].copyFrom(v);
            this.leftFootTargets[index].x *= -1;
        }

        private _footThickness: number = 1.2;
        public get footThickness(): number {
            return this._footThickness;
        }
        public setFootThickness(v: number) {
            this._footThickness = v;
            for (let i = 0; i < this.legPairCount; i++) {
                this.rightLegs[i].footThickness = this._footThickness;
                this.leftLegs[i].footThickness = this._footThickness;
            }
        }
        
        public stepDurationMin: number = 0.3;
        public stepDurationMax: number = 0.7;
        public stepHeightMin: number = 0.3;
        public stepHeightMax: number = 0.7;

        public bodyLocalOffset: BABYLON.Vector3 = BABYLON.Vector3.Zero();
        public bodyWorldOffset: BABYLON.Vector3 = BABYLON.Vector3.Zero();

        public body: BABYLON.Mesh;
        public head: BABYLON.Mesh;
        public leftLegs: Leg[] = [];
        public rightLegs: Leg[] = [];
        public legs: Leg[] = [];

        private _stepping: number = 0;

        public terrainFilter: (m: BABYLON.AbstractMesh) => boolean;

        constructor(name: string, prop: IPolypodeProps) {
            super(name);

            this.legPairCount = prop.legPairsCount;

            // Create all required meshes
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

            /*
            for (let i = 0; i < this.legPairCount; i++) {
                this.rightFootTargets[i] = new BABYLON.Mesh("right-foot-target-" + i);
                BABYLON.CreateCapsuleVertexData({ radius: 0.005, height: 0.2 }).applyToMesh(this.rightFootTargets[i]);
                this.rightFootTargets[i].parent = this;
    
                this.leftFootTargets[i] = new BABYLON.Mesh("left-foot-target-" + i);
                BABYLON.CreateCapsuleVertexData({ radius: 0.005, height: 0.2 }).applyToMesh(this.leftFootTargets[i]);
                this.leftFootTargets[i].parent = this;
            }
            */

            // Apply properties
            if (Mummu.IsFinite(prop.headAnchor)) {
                this.headAnchor = prop.headAnchor;
            }
            
            if (prop.hipAnchors) {
                // HipAnchors provided
                this.rightHipAnchors = [...prop.hipAnchors].map(v => { return v.clone(); });
                this.leftHipAnchors = [...prop.hipAnchors].map(v => { return v.multiplyByFloats(- 1, 1, 1); });
            }
            else {
                if (prop.rightHipAnchors && prop.leftHipAnchors) {
                    // Right and Left HipAnchors provided
                    this.rightHipAnchors = [...prop.rightHipAnchors].map(v => { return v.clone(); });
                    this.leftHipAnchors = [...prop.leftHipAnchors].map(v => { return v.clone(); });
                }
                else {
                    // Generate default HipAnchors
                    this.rightHipAnchors = [];
                    this.leftHipAnchors = [];
                    for (let i = 0; i < this.legPairCount; i++) {
                        let a = (i + 1) / (this.legPairCount + 1) * Math.PI;
                        let cosa = Math.cos(a);
                        let sina = Math.sin(a);
                        this.rightHipAnchors[i] = (new BABYLON.Vector3(sina, 0, cosa)).normalize();
                        this.leftHipAnchors[i] = (new BABYLON.Vector3(- sina, 0, cosa)).normalize();
                    }
                }
            }
            
            if (prop.footTargets) {
                // FootTargets provided
                this.rightFootTargets = [...prop.footTargets].map(v => { return v.clone(); });
                this.leftFootTargets = [...prop.footTargets].map(v => { return v.multiplyByFloats(- 1, 1, 1); });
            }
            else {
                if (prop.rightFootTargets && prop.leftFootTargets) {
                    // Right and Left FootTargets provided
                    this.rightFootTargets = [...prop.rightFootTargets].map(v => { return v.clone(); });
                    this.leftFootTargets = [...prop.leftFootTargets].map(v => { return v.clone(); });
                }
                else {
                    // Generate default FootTargets
                    this.rightFootTargets = [];
                    this.leftFootTargets = [];
                    for (let i = 0; i < this.legPairCount; i++) {
                        let a = (i + 1) / (this.legPairCount + 1) * Math.PI;
                        let cosa = Math.cos(a);
                        let sina = Math.sin(a);
                        this.rightFootTargets[i] = (new BABYLON.Vector3(sina, - 0.5, cosa)).normalize().scaleInPlace(2);
                        this.leftFootTargets[i] = (new BABYLON.Vector3(- sina, - 0.5, cosa)).normalize().scaleInPlace(2);
                    }
                }
            }

            if (isFinite(prop.footThickness)) {
                for (let i = 0; i < this.legPairCount; i++) {
                    this.rightLegs[i].footThickness = prop.footThickness;
                    this.leftLegs[i].footThickness = prop.footThickness;
                }
            }

            if (isFinite(prop.kneeMode)) {
                for (let i = 0; i < this.legPairCount; i++) {
                    this.rightLegs[i].kneeMode = prop.kneeMode;
                    this.leftLegs[i].kneeMode = prop.kneeMode;
                }
            }

            if (isFinite(prop.upperLegLength)) {
                for (let i = 0; i < this.legPairCount; i++) {
                    this.rightLegs[i].upperLegLength = prop.upperLegLength;
                    this.leftLegs[i].upperLegLength = prop.upperLegLength;
                }
            }

            if (isFinite(prop.lowerLegLength)) {
                for (let i = 0; i < this.legPairCount; i++) {
                    this.rightLegs[i].lowerLegLength = prop.lowerLegLength;
                    this.leftLegs[i].lowerLegLength = prop.lowerLegLength;
                }
            }

            if (isFinite(prop.stepDuration)) {
                this.stepDurationMin = prop.stepDuration;
                this.stepDurationMax = prop.stepDuration;
            }
            if (isFinite(prop.stepDurationMin)) {
                this.stepDurationMin = prop.stepDurationMin;
            }
            if (isFinite(prop.stepDurationMax)) {
                this.stepDurationMax = prop.stepDurationMax;
            }

            if (isFinite(prop.stepHeight)) {
                this.stepHeightMin = prop.stepHeight;
                this.stepHeightMax = prop.stepHeight;
            }
            if (isFinite(prop.stepHeightMin)) {
                this.stepHeightMin = prop.stepHeightMin;
            }
            if (isFinite(prop.stepHeightMax)) {
                this.stepHeightMax = prop.stepHeightMax;
            }
            
            if (Mummu.IsFinite(prop.bodyLocalOffset)) {
                this.bodyLocalOffset = prop.bodyLocalOffset;
            }
            
            if (Mummu.IsFinite(prop.bodyWorldOffset)) {
                this.bodyWorldOffset = prop.bodyWorldOffset;
            }
        }

        public setPosition(p: BABYLON.Vector3): void {
            this.position.copyFrom(p);
            let m = this.computeWorldMatrix(true);
            
            for (let i = 0; i < this.legPairCount; i++) {
                BABYLON.Vector3.TransformCoordinatesToRef(this.rightFootTargets[i], m, this.rightLegs[i].footPos);
                BABYLON.Vector3.TransformCoordinatesToRef(this.leftFootTargets[i], m, this.leftLegs[i].footPos);
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

            let m = this.computeWorldMatrix(true);
            if (this._stepping <= 0) {
                let legTarget = BABYLON.Vector3.Zero();
                let longestStepDist = 0;
                let legToMove: Leg;
                let targetPosition: BABYLON.Vector3;
                let targetNormal: BABYLON.Vector3;

                for (let i = 0; i < this.legPairCount; i++) {
                    BABYLON.Vector3.TransformCoordinatesToRef(this.rightFootTargets[i], m, legTarget);
                    let rayRight = new BABYLON.Ray(legTarget.add(this.up), this.up.scale(- 2));
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

                    BABYLON.Vector3.TransformCoordinatesToRef(this.leftFootTargets[i], m, legTarget);
                    let rayLeft = new BABYLON.Ray(legTarget.add(this.up), this.up.scale(- 2));
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

                offset.addInPlace(this.rightFootTargets[i].scale(-1));
                offset.addInPlace(this.leftFootTargets[i].scale(-1));
            }
            bodyPos.scaleInPlace(1 / this.legCount);
            offset.scaleInPlace(1 / this.legCount);
            offset.addInPlace(this.bodyLocalOffset);
            BABYLON.Vector3.TransformNormalToRef(offset, this.getWorldMatrix(), offset);
            offset.addInPlace(this.bodyWorldOffset);

            bodyPos.addInPlace(offset);

            BABYLON.Quaternion.SlerpToRef(this.body.rotationQuaternion, this.rotationQuaternion, 0.01, this.body.rotationQuaternion);
            
            Mummu.QuaternionFromZYAxisToRef(this.forward, this.up, this.head.rotationQuaternion);

            BABYLON.Vector3.LerpToRef(this.body.position, bodyPos, 0.1, this.body.position);
        }
    }
}