import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CurrentOrg {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  owner?: { id: string; email: string; firstName: string; lastName: string };
}

const STORAGE_KEY = 'taskmanager_current_org';

@Injectable({
  providedIn: 'root',
})
export class OrgContextService {
  private currentOrgSubject = new BehaviorSubject<CurrentOrg | null>(
    this.getStoredOrg()
  );
  currentOrg$ = this.currentOrgSubject.asObservable();

  getCurrentOrg(): CurrentOrg | null {
    return this.currentOrgSubject.value;
  }

  getCurrentOrgId(): string | null {
    return this.currentOrgSubject.value?.id ?? null;
  }

  setCurrentOrg(org: CurrentOrg): void {
    this.currentOrgSubject.next(org);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(org));
    } catch {
      // ignore
    }
  }

  clearCurrentOrg(): void {
    this.currentOrgSubject.next(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  private getStoredOrg(): CurrentOrg | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
