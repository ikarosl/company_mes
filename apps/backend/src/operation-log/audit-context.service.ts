import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

interface AuditSnapshotStore {
  beforeData?: unknown;
  afterData?: unknown;
}

@Injectable()
export class AuditContextService {
  private readonly storage = new AsyncLocalStorage<AuditSnapshotStore>();

  run<T>(callback: () => T) {
    return this.storage.run({}, callback);
  }

  setBeforeData(value: unknown) {
    const store = this.storage.getStore();
    if (store) {
      store.beforeData = value;
    }
  }

  setAfterData(value: unknown) {
    const store = this.storage.getStore();
    if (store) {
      store.afterData = value;
    }
  }

  getSnapshot() {
    return this.storage.getStore();
  }
}
