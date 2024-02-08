namespace Sumuqan {

    export interface IPolypodeProps {
        legPairsCount: number;
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
        legScales?: number[];
        stepDuration?: number;
        stepDurationMin?: number;
        stepDurationMax?: number;
        stepHeight?: number;
        stepHeightMin?: number;
        stepHeightMax?: number;
        bootyShakiness?: number;
        bodyLocalOffset?: BABYLON.Vector3;
        bodyWorldOffset?: BABYLON.Vector3;
        headAnchor?: BABYLON.Vector3;
        
        antennaAnchor?: BABYLON.Vector3;
        antennaAlphaZero?: number;
        antennaBetaZero?: number;
        antennaLength?: number;

        scorpionTailProps?: IScorpionTailProps;
    }

    export class Polypode extends BABYLON.Mesh {

        public speed: number = 0;
        private _fSpeed: number = 0; // normalized speed between a min and a max (now 0 and 0.5)
        public rotationSpeed: number = 0;
        
        public bodyColliders: Mummu.SphereCollider[] = [];
        public terrain: (Mummu.Collider | BABYLON.Mesh)[] = [];

        // Debug collision display [v]
        protected _showDebug: boolean = false;
        public get showDebug(): boolean {
            return this._showDebug;
        }
        public set showDebug(v: boolean) {
            this._showDebug = v;
            this.debugPovMesh.isVisible = this._showDebug;
        }

        public debugPovMesh: BABYLON.Mesh;
        public debugBodyCollidersMeshes: BABYLON.Mesh[] = [];

        private _debugColliderMaterial: BABYLON.Material;
        public get debugColliderMaterial(): BABYLON.Material {
            return this._debugColliderMaterial;
        }
        public set debugColliderMaterial(mat: BABYLON.Material) {
            this.debugBodyCollidersMeshes.forEach(mesh => {
                mesh.material = mat;
            });
            if (this.tail && this.tail.debugColliderMesh) {
                this.tail.debugColliderMesh.material = mat;
            }
            this._debugColliderMaterial = mat;
        }
        private _debugColliderHitMaterial: BABYLON.Material;
        public get debugColliderHitMaterial(): BABYLON.Material {
            return this._debugColliderHitMaterial;
        }
        public set debugColliderHitMaterial(mat: BABYLON.Material) {
            this._debugColliderHitMaterial = mat;
        }

        private _debugPovMaterial: BABYLON.Material;
        public get debugPovMaterial(): BABYLON.Material {
            return this._debugPovMaterial;
        }
        public set debugPovMaterial(mat: BABYLON.Material) {
            if (this.debugPovMesh) {
                this.debugPovMesh.material = mat;
            }
            this._debugPovMaterial = mat;
        }
        // [^] Debug collision display

        public mentalMap: BABYLON.Vector3[] = [];
        public mentalMapNormal: BABYLON.Vector3[] = [];
        public mentalMapIndex: number = 0;
        public mentalMapMaxSize: number = 150;
        public localNormal: BABYLON.Vector3 = BABYLON.Vector3.Up();
        
        public mentalCheckPerFrame: number = 5;

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
        public bootyShakiness: number = 0.5;

        public bodyLocalOffset: BABYLON.Vector3 = BABYLON.Vector3.Zero();
        public bodyWorldOffset: BABYLON.Vector3 = BABYLON.Vector3.Zero();

        public body: BABYLON.Mesh;
        public head: BABYLON.Mesh;
        public leftLegs: Leg[] = [];
        public rightLegs: Leg[] = [];
        public legs: Leg[] = [];
        public antennas: Antenna[] = [];
        public tail: ScorpionTail;

        public povOffset: BABYLON.Vector3 = new BABYLON.Vector3(0, 0.4, 0);
        public povAlpha: number = 5 * Math.PI / 3;
        public povBetaMin: number = Math.PI / 10;
        public povBetaMax: number = Math.PI / 2.1;
        public povRadiusMax: number = 1;
        public povRadiusMin: number = 0.5;

        private _stepping: number = 0;

        constructor(name: string, prop: IPolypodeProps) {
            super(name);

            this.legPairCount = prop.legPairsCount;

            // Create all required meshes
            this.body = BABYLON.MeshBuilder.CreateSphere("body", { diameterX: 1, diameterY: 1, diameterZ: 1.5 });
            this.body.rotationQuaternion = BABYLON.Quaternion.Identity();

            for (let i = 0; i < this.legPairCount; i++) {
                this.rightLegs[i] = new Leg();
                this.rightLegs[i].kneeMode = KneeMode.Vertical;
                this.leftLegs[i] = new Leg(true);
                this.leftLegs[i].kneeMode = KneeMode.Vertical;
            }
            this.legs = [...this.rightLegs, ...this.leftLegs];
            
            this.head = BABYLON.MeshBuilder.CreateSphere("head", { diameterX: 0.5, diameterY: 0.5, diameterZ: 0.75 });
            this.head.rotationQuaternion = BABYLON.Quaternion.Identity();

            if (Mummu.IsFinite(prop.antennaAnchor)) {
                this.antennas = [
                    new Antenna(this, false),
                    new Antenna(this, true)
                ];
                this.antennas[0].position.copyFrom(prop.antennaAnchor);
                this.antennas[1].position.copyFrom(prop.antennaAnchor);
                this.antennas[1].position.x *= - 1;

                if (isFinite(prop.antennaAlphaZero)) {
                    this.antennas[0].alpha0 = prop.antennaAlphaZero;
                    this.antennas[1].alpha0 = prop.antennaAlphaZero;
                }
                if (isFinite(prop.antennaBetaZero)) {
                    this.antennas[0].beta0 = prop.antennaBetaZero;
                    this.antennas[1].beta0 = prop.antennaBetaZero;
                }
                if (isFinite(prop.antennaLength)) {
                    this.antennas[0].length = prop.antennaLength;
                    this.antennas[1].length = prop.antennaLength;
                }
            }

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

            if (prop.legScales) {
                for (let i = 0; i < this.legPairCount; i++) {
                    if (isFinite(prop.legScales[i])) {
                        this.rightLegs[i].scale = prop.legScales[i];
                        this.leftLegs[i].scale = prop.legScales[i];
                    }
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
            
            if (isFinite(prop.bootyShakiness)) {
                this.bootyShakiness = prop.bootyShakiness;
            }

            if (Mummu.IsFinite(prop.bodyLocalOffset)) {
                this.bodyLocalOffset = prop.bodyLocalOffset;
            }
            
            if (Mummu.IsFinite(prop.bodyWorldOffset)) {
                this.bodyWorldOffset = prop.bodyWorldOffset;
            }

            if (prop.scorpionTailProps) {
                this.tail = new ScorpionTail(this, prop.scorpionTailProps);
            }

            this.debugPovMesh = Mummu.CreateSphereCut(
                "debug-pov-mesh",
                {
                    dir: BABYLON.Vector3.Forward(),
                    alpha: this.povAlpha,
                    betaMin: this.povBetaMin,
                    betaMax: this.povBetaMax,
                    rMin: this.povRadiusMin,
                    rMax: this.povRadiusMax
                }
            )
            this.debugPovMesh.parent = this;
            this.debugPovMesh.position = this.povOffset;
            this.debugPovMesh.isVisible = this._showDebug;
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
                let hMax = Math.min(Math.max(this.stepHeightMin, dist), this.stepHeightMax);
                let duration = Math.min(Math.max(this.stepDurationMin, dist), this.stepDurationMax);
                duration *= 3 * (1 - this._fSpeed) + 1 * this._fSpeed;
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
            let dt = this.getScene().deltaTime / 1000;
            this._fSpeed = Nabu.MinMax(this.speed / 0.5, 0, 1);

            this.position.addInPlace(this.forward.scale(this.speed / 60));
            this.rotate(this.up, this.rotationSpeed / 60, BABYLON.Space.WORLD);
            this.computeWorldMatrix(true);
            Mummu.QuaternionFromYZAxisToRef(this.body.up, this.forward, this.rotationQuaternion);
            
            // Terrain scan [v]
            let fFindUp = 0.999 * (1 - this._fSpeed) + 0.98 * this._fSpeed;
            let origin = BABYLON.Vector3.TransformCoordinates(this.povOffset, this.getWorldMatrix());
            for (let i = 0; i < this.mentalCheckPerFrame; i++) {
                let distCheck = this.povRadiusMax;
                let dir = Mummu.RandomInSphereCut(this.forward, - this.povAlpha * 0.5, this.povAlpha * 0.5, this.povBetaMin, this.povBetaMax, this.up);
                let ray = new BABYLON.Ray(origin, dir, distCheck);
                let intersection = Mummu.RayCollidersIntersection(ray, this.terrain);
                //Mummu.DrawDebugLine(ray.origin, ray.origin.add(ray.direction.scale(distCheck)), this.mentalMapMaxSize / this.mentalCheckPerFrame, BABYLON.Color3.White());
                if (intersection.hit) {
                    let n = intersection.normal;
                    if (BABYLON.Vector3.Dot(n, this.up) > - 0.5) {
                        this.mentalMap[this.mentalMapIndex] = intersection.point;
                        this.mentalMapNormal[this.mentalMapIndex] = n;
                        this.localNormal.scaleInPlace(fFindUp).addInPlace(this.mentalMapNormal[this.mentalMapIndex].scale(1 - fFindUp));
                        if (this._showDebug) {
                            Mummu.DrawDebugHit(intersection.point, this.mentalMapNormal[this.mentalMapIndex], this.mentalMapMaxSize / this.mentalCheckPerFrame, BABYLON.Color3.Green());
                        }
                        this.mentalMapIndex = (this.mentalMapIndex + 1) % this.mentalMapMaxSize;
                    }
                }
            }
            this.localNormal.normalize();
            // [^] Terrain scan

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
                let averageTimeBetweenStep = Nabu.MinMax(2 - 20 * Math.abs(this.speed), 0, 2);
                let prob1s = 1 / averageTimeBetweenStep;
                let probDT = dt * prob1s;
                if (Math.random() < probDT) {
                    let legTarget = BABYLON.Vector3.Zero();
                    let longestStepDist = 0;
                    let legToMove: Leg;
                    let targetPosition: BABYLON.Vector3;
                    let targetNormal: BABYLON.Vector3;

                    for (let i = 0; i < this.legPairCount; i++) {

                        BABYLON.Vector3.TransformCoordinatesToRef(this.rightFootTargets[i], m, legTarget);
                        let targetRight: BABYLON.Vector3;
                        let normalRight: BABYLON.Vector3;
                        let closestMentalMapSqrDist = Infinity;

                        for (let j = 0; j < this.mentalMap.length; j++) {
                            let mentalPoint = this.mentalMap[j];
                            let sqrD = BABYLON.Vector3.DistanceSquared(legTarget, mentalPoint);
                            if (sqrD < closestMentalMapSqrDist) {
                                if (BABYLON.Vector3.DistanceSquared(this.rightLegs[i].hipPos, mentalPoint) < this.rightLegs[i].totalLength) {
                                    targetRight = mentalPoint;
                                    normalRight = this.mentalMapNormal[j];
                                    closestMentalMapSqrDist = sqrD;
                                }
                            }
                        }
                        if (targetRight) {
                            let d = BABYLON.Vector3.DistanceSquared(this.rightLegs[i].foot.position, targetRight) / this.rightLegs[i].totalLength;
                            if (d > longestStepDist) {
                                longestStepDist = d;
                                legToMove = this.rightLegs[i];
                                targetPosition = targetRight;
                                targetNormal = normalRight;
                            }
                        }

                        BABYLON.Vector3.TransformCoordinatesToRef(this.leftFootTargets[i], m, legTarget);
                        let targetLeft: BABYLON.Vector3;
                        let normalLeft: BABYLON.Vector3;
                        closestMentalMapSqrDist = Infinity;

                        for (let j = 0; j < this.mentalMap.length; j++) {
                            let mentalPoint = this.mentalMap[j];
                            let sqrD = BABYLON.Vector3.DistanceSquared(legTarget, mentalPoint);
                            if (sqrD < closestMentalMapSqrDist) {
                                if (BABYLON.Vector3.DistanceSquared(this.leftLegs[i].hipPos, mentalPoint) < this.leftLegs[i].totalLength) {
                                    targetLeft = mentalPoint;
                                    normalLeft = this.mentalMapNormal[j];
                                    closestMentalMapSqrDist = sqrD;
                                }
                            }
                        }
                        if (targetLeft) {
                            let d = BABYLON.Vector3.DistanceSquared(this.leftLegs[i].foot.position, targetLeft) / this.leftLegs[i].totalLength;
                            if (d > longestStepDist) {
                                longestStepDist = d;
                                legToMove = this.leftLegs[i];
                                targetPosition = targetLeft;
                                targetNormal = normalLeft;
                            }
                        }
                    }

                    if (longestStepDist > 0.01) {
                        this._stepping++;
                        //Mummu.DrawDebugLine(legToMove.hipPos, targetPosition, 60, BABYLON.Color3.Yellow());
                        this.step(legToMove, targetPosition, targetNormal.scale(0.3).add(this.up.scale(0.7)), this.forward).then(() => { this._stepping--; });
                    } 
                }
            }

            for (let i = 0; i < this.legPairCount; i++) {
                this.leftLegs[i].updatePositions();
                this.rightLegs[i].updatePositions();
            }

            let bodyPos = BABYLON.Vector3.Zero();
            let offset = BABYLON.Vector3.Zero();
            let averageRightFoot = BABYLON.Vector3.Zero();
            let averageLeftFoot = BABYLON.Vector3.Zero();
            for (let i = 0; i < this.legPairCount; i++) {
                averageRightFoot.addInPlace(this.rightLegs[i].foot.absolutePosition);
                averageLeftFoot.addInPlace(this.leftLegs[i].foot.absolutePosition);

                offset.addInPlace(this.rightFootTargets[i].scale(-1));
                offset.addInPlace(this.leftFootTargets[i].scale(-1));
            }
            averageRightFoot.scaleInPlace(1 / this.legPairCount);
            averageLeftFoot.scaleInPlace(1 / this.legPairCount);
            bodyPos.copyFrom(averageRightFoot).addInPlace(averageLeftFoot).scaleInPlace(0.5);
            offset.scaleInPlace(1 / this.legCount);
            offset.addInPlace(this.bodyLocalOffset);
            BABYLON.Vector3.TransformNormalToRef(offset, this.getWorldMatrix(), offset);
            offset.addInPlace(this.bodyWorldOffset);
            bodyPos.addInPlace(offset);

            averageRightFoot.subtractInPlace(this.body.position);
            averageLeftFoot.subtractInPlace(this.body.position);
            let quatFromLeg = Mummu.QuaternionFromYZAxis(this.localNormal, this.forward);

            BABYLON.Quaternion.SlerpToRef(this.body.rotationQuaternion, quatFromLeg, 0.1, this.body.rotationQuaternion);
            
            Mummu.QuaternionFromZYAxisToRef(this.forward, this.up, this.head.rotationQuaternion);

            BABYLON.Vector3.LerpToRef(this.body.position, bodyPos, 0.1, this.body.position);

            // Terrain collision [v]
            for (let i = 0; i < this.bodyColliders.length; i++) {
                if (this.showDebug) {
                    this.debugBodyCollidersMeshes[i].material = this.debugColliderMaterial;
                }
                let bodyCollider = this.bodyColliders[i];
                bodyCollider.recomputeWorldCenter();
                let intersections = Mummu.SphereCollidersIntersection(bodyCollider.center, bodyCollider.radius, this.terrain);
                let n = intersections.length;
                for (let j = 0; j < n; j++) {
                    let intersection = intersections[j];
                    this.body.position.addInPlace(intersection.normal.scale(0.2 * intersection.depth / n));
                    if (this.showDebug) {
                        this.debugBodyCollidersMeshes[i].material = this.debugColliderHitMaterial;
                    }
                }
            }
            // [^] Terrain collision
            
            // Prevent overstrech [v]
            let dir = this.position.subtract(this.body.absolutePosition);
            let l = dir.length();
            let maxL = 0.3;
            if (l > maxL) {
                dir.scaleInPlace(1 / l);
                this.position.copyFrom(dir).scaleInPlace(maxL).addInPlace(this.body.absolutePosition);
            }

            this.antennas.forEach(antenna => {
                antenna.update(dt);
            })

            if (this.tail) {
                this.tail.update(dt);
            }
            // [^] Prevent overstrech
        }

        public updateBodyCollidersMeshes(): void {
            while (this.debugBodyCollidersMeshes.length > 0) {
                this.debugBodyCollidersMeshes.pop().dispose();
            }

            for (let i = 0; i < this.bodyColliders.length; i++) {
                let collider = this.bodyColliders[i];
                let sphere = BABYLON.MeshBuilder.CreateSphere("bodycollider-" + i, { diameter: 2 * collider.radius });
                sphere.material = this._debugColliderMaterial;
                sphere.position.copyFrom(collider.localCenter);
                sphere.parent = collider.parent;

                this.debugBodyCollidersMeshes[i] = sphere;
            }

            if (this.tail) {
                this.tail.updateTailColliderMesh();
            }
        }
    }
}