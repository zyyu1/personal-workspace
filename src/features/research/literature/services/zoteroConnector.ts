import type { LiteratureSnapshot, ZoteroLibrary } from '../types'

export interface ZoteroConnector {
  getLibrary(): Promise<ZoteroLibrary>
  getSnapshot(): Promise<LiteratureSnapshot>
  openItem(libraryId: string, itemKey: string): Promise<{ opened: boolean; reason?: string }>
}

// Read-only boundary. A future connector may fetch Zotero metadata, but must not expose tokens to the frontend.
export class DisconnectedZoteroConnector implements ZoteroConnector {
  constructor(private readonly snapshot: LiteratureSnapshot) {}
  async getLibrary() { return this.snapshot.library }
  async getSnapshot() { return this.snapshot }
  async openItem() { return { opened: false, reason: 'Zotero is not connected on this device.' } }
}
