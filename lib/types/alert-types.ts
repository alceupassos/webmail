export type AlertType = 'urgent' | 'important' | 'newsletter' | 'social' | 'promo';
export type AlertPriority = 'high' | 'medium' | 'low';

export interface EmailAlert {
    id: string;
    email_id: string;
    type: AlertType;
    priority: AlertPriority;
    title: string;
    preview: string;
    created_at: string;
    read: boolean;
    pushed_to_mobile: boolean;
}
