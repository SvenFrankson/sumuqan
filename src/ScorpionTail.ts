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

        public alpha0: number = Math.PI / 5;
        public alphaSpeed: number = 0;
        public beta0: number = Math.PI / 12;
        public betaSpeed: number = 0;
        public length: number = 0.5;

        public tailSegments: BABYLON.Mesh[] = [];
        
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
                let dir = this.forward;
                let ray = new BABYLON.Ray(this.absolutePosition, dir, this.length);
                let intersection = Mummu.RayCollidersIntersection(ray, this.polypode.terrain);
                if (intersection.hit) {
                    let n = intersection.normal;
                    if (BABYLON.Vector3.Dot(n, this.polypode.up) > 0) {
                        this.betaSpeed -= Math.PI * 0.2;
                    }
                    else {
                        this.betaSpeed += Math.PI * 0.2;
                    }
                    if (BABYLON.Vector3.Dot(n, this.polypode.right) > 0) {
                        this.alphaSpeed -= Math.PI * 0.2;
                    }
                    else {
                        this.alphaSpeed += Math.PI * 0.2;
                    }
                }
                else {
                    this.alphaSpeed += 0.1 * (this.alpha0 - this.rotation.y);
                    this.betaSpeed += 0.1 * (this.beta0 - this.rotation.x);
                }
    
                this.alphaSpeed *= 0.95;
                this.betaSpeed *= 0.95;
    
                this.rotation.x += this.betaSpeed * dt;
                this.rotation.x = Nabu.MinMax(this.rotation.x, - Math.PI / 2, Math.PI / 2);
                this.rotation.y += this.alphaSpeed * dt;
                this.rotation.y = Nabu.MinMax(this.rotation.y, - Math.PI / 3, Math.PI / 3);
            }
        }
    }
}