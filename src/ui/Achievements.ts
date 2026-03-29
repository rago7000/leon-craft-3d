const SAVE_KEY = 'leon-craft-3d-achievements';

interface AchievementDef {
  id: string;
  icon: string;
  name: string;
  desc: string;
}

const ACHIEVEMENT_LIST: AchievementDef[] = [
  { id: 'first_jump', icon: '🦘', name: 'Primer salto', desc: 'Saltaste por primera vez' },
  { id: 'first_break', icon: '💥', name: 'Primer bloque roto', desc: 'Rompiste tu primer bloque' },
  { id: 'first_place', icon: '🧱', name: 'Primer bloque', desc: 'Colocaste tu primer bloque' },
  { id: 'builder', icon: '🏗️', name: 'Constructor', desc: 'Colocaste 20 bloques' },
  { id: 'explorer', icon: '🧭', name: 'Explorador', desc: 'Caminaste 200 bloques' },
  { id: 'pet_friend', icon: '🐥', name: 'Amigo del pollito', desc: 'Te acercaste al pollito' },
  { id: 'magic_tree', icon: '🌳', name: 'Arbol magico', desc: 'Visitaste el arbol magico' },
  { id: 'found_house', icon: '🏠', name: 'Mi casita', desc: 'Encontraste la casita' },
  { id: 'star_10', icon: '⭐', name: '10 estrellas', desc: 'Coleccionaste 10 estrellas' },
  { id: 'treasure', icon: '🎁', name: 'Regalo especial', desc: 'Encontraste el cofre secreto' },
  { id: 'special_block', icon: '🌈', name: 'Bloque magico', desc: 'Colocaste un bloque especial' },
  { id: 'night_owl', icon: '🌙', name: 'Nocturno', desc: 'Jugaste de noche' },
];

export class Achievements {
  private unlocked: Set<string>;
  private panelEl: HTMLElement;
  private gridEl: HTMLElement;
  private countEl: HTMLElement;
  private visible = false;
  onUnlock: ((name: string) => void) | null = null;

  constructor() {
    this.unlocked = new Set(this.loadFromStorage());
    this.panelEl = document.getElementById('achievements-panel')!;
    this.gridEl = document.getElementById('achievements-grid')!;
    this.countEl = document.getElementById('achievements-count')!;
    this.render();
  }

  unlock(id: string): boolean {
    if (this.unlocked.has(id)) return false;
    this.unlocked.add(id);
    this.saveToStorage();
    this.render();
    const def = ACHIEVEMENT_LIST.find(a => a.id === id);
    if (def) {
      this.onUnlock?.(`${def.icon} ${def.name}`);
    }
    return true;
  }

  has(id: string): boolean {
    return this.unlocked.has(id);
  }

  toggle(): void {
    this.visible = !this.visible;
    this.panelEl.classList.toggle('hidden', !this.visible);
    if (this.visible) this.render();
  }

  hide(): void {
    this.visible = false;
    this.panelEl.classList.add('hidden');
  }

  get count(): number {
    return this.unlocked.size;
  }

  get total(): number {
    return ACHIEVEMENT_LIST.length;
  }

  private render(): void {
    this.countEl.textContent = `${this.unlocked.size} / ${ACHIEVEMENT_LIST.length}`;
    this.gridEl.innerHTML = '';
    for (const ach of ACHIEVEMENT_LIST) {
      const got = this.unlocked.has(ach.id);
      const card = document.createElement('div');
      card.className = 'ach-card' + (got ? ' unlocked' : '');

      const icon = document.createElement('div');
      icon.className = 'ach-icon';
      icon.textContent = got ? ach.icon : '🔒';
      card.appendChild(icon);

      const name = document.createElement('div');
      name.className = 'ach-name';
      name.textContent = got ? ach.name : '???';
      card.appendChild(name);

      if (got) {
        const desc = document.createElement('div');
        desc.className = 'ach-desc';
        desc.textContent = ach.desc;
        card.appendChild(desc);
      }

      this.gridEl.appendChild(card);
    }
  }

  private loadFromStorage(): string[] {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify([...this.unlocked]));
    } catch { /* ignore */ }
  }

  reset(): void {
    this.unlocked.clear();
    localStorage.removeItem(SAVE_KEY);
    this.render();
  }
}
