export interface JiraSearchResponse {
    issues: Array<{
        id: string;
        key: string;
        fields: {
            summary?: string;
            status?: { name: string };
            assignee?: {
                accountId: string;
                displayName: string;
                emailAddress?: string;
                avatarUrls: { '24x24': string };
            } | null;
            priority?: { name: string; id: string };
            duedate?: string | null;
            created?: string;
            updated?: string;
        };
    }>;
}

export interface JiraUserResponse {
    accountId: string;
    displayName: string;
    emailAddress?: string;
    avatarUrls: { '24x24': string };
    active: boolean;
}

export interface JiraProjectResponse {
    values: Array<{
        id: string;
        key: string;
        name: string;
        projectTypeKey: string;
    }>;
}
