namespace Sumuqan {

    export interface IScorpionTailProps {
        length: number;
        anchor?: BABYLON.Vector3;
        localDir?: BABYLON.Vector3;
        dist?: number;
        distances?: number[];
        distGeometricFactor?: number;
    }

    export class ScorpionTail extends BABYLON.Mesh {

        public tailCollider: Mummu.SphereCollider;

        public lace: number = 0;
        public laceSpeed: number = 0;
        public roll: number = 0;
        public rollSpeed: number = 0;
        public length: number = 0.5;

        public tailSegments: BABYLON.Mesh[] = [];
        public debugColliderMesh: BABYLON.Mesh;
        
        constructor(public polypode: Polypode, props: IScorpionTailProps) {
            super(polypode.name + "-tail-root");
            this.parent = this.polypode.body;

            if (props.anchor) {
                this.position.copyFrom(props.anchor);
            }
            if (props.localDir) {
                this.rotationQuaternion = Mummu.QuaternionFromZYAxis(props.localDir, BABYLON.Axis.Y);
            }
            else {
                this.rotationQuaternion = Mummu.QuaternionFromZYAxis(new BABYLON.Vector3(0, 0, -1), BABYLON.Axis.Y);
            }

            let d = 0.3;
            if (isFinite(props.dist)) {
                d = props.dist;
            }
            this.tailSegments[0] = new BABYLON.Mesh("tail-0");
            this.tailSegments[0].parent = this;
            for (let i = 1; i < props.length; i++) {
                this.tailSegments[i] = new BABYLON.Mesh("tail-" + i);
                this.tailSegments[i].parent = this.tailSegments[i - 1];
                if (props.distances) {
                    this.tailSegments[i].position.z = props.distances[i];
                }
                else {
                    this.tailSegments[i].position.z = d;
                    if (isFinite(props.distGeometricFactor)) {
                        d *= props.distGeometricFactor;
                    }
                }
            }
        }

        public update(dt: number): void {
            if (isFinite(dt)) {
                this.debugColliderMesh.material = this.polypode.debugColliderMaterial;
                this.tailCollider.recomputeWorldCenter();
                let intersections = Mummu.SphereCollidersIntersection(this.tailCollider.center, this.tailCollider.radius, this.polypode.terrain);
                let n = intersections.length;
                for (let j = 0; j < n; j++) {
                    let intersection = intersections[j];
                    if (intersection.hit) {
                        let n = intersection.normal;
                        let dir = this.tailCollider.center.subtract(intersection.point).normalize().addInPlace(n).normalize();
                        let dotUp = BABYLON.Vector3.Dot(dir, this.polypode.up);
                        let dotRight = BABYLON.Vector3.Dot(dir, this.polypode.right);
                        
                        this.rollSpeed += Math.PI * 0.25 * dotUp;
                        this.laceSpeed -= Math.PI * 0.25 * dotRight;

                        if (this.polypode.showDebug) {
                            this.debugColliderMesh.material = this.polypode.debugColliderHitMaterial;
                        }
                    }
                }

                this.laceSpeed -= 0.05 * this.lace;
                this.rollSpeed -= 0.05 * this.roll;

                this.laceSpeed *= 0.99;
                this.rollSpeed *= 0.99;
    
                this.roll += this.rollSpeed * dt;
                this.roll = Nabu.MinMax(this.roll, - Math.PI / 2, Math.PI / 2);
                this.lace += this.laceSpeed * dt;
                this.lace = Nabu.MinMax(this.lace, - Math.PI / 3, Math.PI / 3);

                this.tailSegments[0].rotation.x = - Math.PI / 5 * this.roll;
                this.tailSegments[0].rotation.z = - Math.PI / 8 * this.lace;
                for (let i = 1; i < 7; i++) {
                    this.tailSegments[i].rotation.x = - Math.PI / 6 * this.roll;
                    let f = 1 - i / 6;
                    this.tailSegments[i].rotation.z = - Math.PI / 8 * this.lace * f * f;
                }    
            }
        }

        public updateTailColliderMesh(): void {
            if (this.debugColliderMesh) {
                this.debugColliderMesh.dispose();
            }
            this.debugColliderMesh = BABYLON.MeshBuilder.CreateSphere("tail-collider", { diameter: 2 * this.tailCollider.radius });
            this.debugColliderMesh.material = this.polypode.debugColliderMaterial;
            this.debugColliderMesh.parent = this.tailCollider.parent;
        }
    }
}