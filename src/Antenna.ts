namespace Sumuqan {

    export class Antenna extends BABYLON.Mesh {

        public alpha0: number = Math.PI / 5;
        public alphaSpeed: number = 0;
        public beta0: number = Math.PI / 12;
        public betaSpeed: number = 0;
        public length: number = 0.5;
        
        constructor(public polypode: Polypode, public isLeft?: boolean) {
            super(polypode.name + "-antenna-" + (isLeft ? "l" : "r"));
            if (this.isLeft) {
                this.alpha0 *= - 1;
            }
            this.parent = this.polypode.head;
        }

        public update(dt: number): void {
            if (isFinite(dt)) {
                let dir = this.forward;
                let ray = new BABYLON.Ray(this.absolutePosition, dir, this.length);
                let pick = this.getScene().pickWithRay(ray, this.polypode.terrainFilter);
                if (pick.hit) {
                    let n = pick.getNormal(true);
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