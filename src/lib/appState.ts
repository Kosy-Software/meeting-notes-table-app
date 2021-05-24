import type { ClientInfo } from '@kosy/kosy-app-api/types';

export interface AppState {
    bulletPoints: BulletPoint[],
    beingEdited: { [bulletPointId: string]: string }
}

export interface BulletPoint {
    bulletPointId: string;
    parentBulletPointId?: string;
    text: string;
}