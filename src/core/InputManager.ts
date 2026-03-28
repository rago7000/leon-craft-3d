export class InputManager {
  keys = new Set<string>();
  justPressed = new Set<string>();
  mouseLeft = false;
  mouseRight = false;
  private mouseLeftDown = false;
  private mouseRightDown = false;
  scrollDelta = 0;

  constructor() {
    window.addEventListener('keydown', (e) => {
      const key = e.code;
      if (!this.keys.has(key)) {
        this.justPressed.add(key);
      }
      this.keys.add(key);
      // Prevent default for game keys
      if (['Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Tab', 'F3'].includes(key)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouseLeftDown = true;
      if (e.button === 2) this.mouseRightDown = true;
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouseLeftDown = false;
      if (e.button === 2) this.mouseRightDown = false;
    });

    window.addEventListener('wheel', (e) => {
      this.scrollDelta += Math.sign(e.deltaY);
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  update(): void {
    // mouseLeft/Right are true for one frame only
    this.mouseLeft = this.mouseLeftDown;
    this.mouseRight = this.mouseRightDown;
    this.mouseLeftDown = false;
    this.mouseRightDown = false;
  }

  endFrame(): void {
    this.justPressed.clear();
    this.scrollDelta = 0;
  }

  isDown(code: string): boolean {
    return this.keys.has(code);
  }

  wasPressed(code: string): boolean {
    return this.justPressed.has(code);
  }
}
