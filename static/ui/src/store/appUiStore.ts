import { makeAutoObservable } from 'mobx';
import type { JiraIssue } from '../types/jira';

type Tab = 'issues' | 'team';

class AppUiStore {
    activeTab: Tab = 'issues';

    showAssignModal = false;
    showPriorityModal = false;
    showMultiFixModal = false;
    showAutoAssignConfirm = false;

    selectedIssue: JiraIssue | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    setActiveTab = (tab: Tab) => {
        this.activeTab = tab;
    };

    setSelectedIssue = (issue: JiraIssue | null) => {
        this.selectedIssue = issue;
    };

    setShowAssignModal = (v: boolean) => { this.showAssignModal = v; };
    setShowPriorityModal = (v: boolean) => { this.showPriorityModal = v; };
    setShowMultiFixModal = (v: boolean) => { this.showMultiFixModal = v; };
    setShowAutoAssignConfirm = (v: boolean) => { this.showAutoAssignConfirm = v; };

    resetModals = () => {
        this.showAssignModal = false;
        this.showPriorityModal = false;
        this.showMultiFixModal = false;
        this.showAutoAssignConfirm = false;
    };
}

export const appUiStore = new AppUiStore();
