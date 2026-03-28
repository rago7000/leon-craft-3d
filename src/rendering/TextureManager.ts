import * as THREE from 'three';

export class TextureManager {
  atlas!: THREE.Texture;
  opaqueMaterial!: THREE.MeshLambertMaterial;
  transparentMaterial!: THREE.MeshLambertMaterial;

  async load(): Promise<void> {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.load(
        '/textures/atlas.png',
        (texture) => {
          texture.magFilter = THREE.NearestFilter;
          texture.minFilter = THREE.NearestFilter;
          texture.colorSpace = THREE.SRGBColorSpace;
          this.atlas = texture;

          this.opaqueMaterial = new THREE.MeshLambertMaterial({ map: this.atlas });
          this.transparentMaterial = new THREE.MeshLambertMaterial({
            map: this.atlas,
            transparent: true,
            alphaTest: 0.5,
            side: THREE.DoubleSide,
          });

          resolve();
        },
        undefined,
        reject,
      );
    });
  }
}
