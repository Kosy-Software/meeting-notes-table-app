import type { BulletPoint } from './appState';

export type ClientToHostMessage =
    | LockBulletPoint
    | UnlockBulletPoint
    | EditBulletPoint
    | RemoveBulletPoint
    | AddBulletPoint

export interface LockBulletPoint {
    type: "lock-bullet-point";    
    lockedByClientUuid: string;
    lockedBulletPointId: string;
}

export interface UnlockBulletPoint {
    type: "unlock-bullet-point";
    lockedByClientUuid: string;
    lockedBulletPointId: string;
}

export interface EditBulletPoint {
    type: "edit-bullet-point";
    bulletPoint: BulletPoint;
    clientUuid: string;
}

export interface RemoveBulletPoint {
    type: "remove-bullet-point";
    clientUuid: string;
    bulletPointId: string;
}

export interface AddBulletPoint {
    type: "add-bullet-point";
    clientUuid: string;
    bulletPoint: BulletPoint;
}


/// Messages that are relayed to all of the clients
export type HostToClientMessage =
    | BulletPointLocked
    | BulletPointUnlocked
    | BulletPointChanged
    | BulletPointAdded
    | BulletPointRemoved

export interface BulletPointLocked {
    type: "bullet-point-locked";
    lockedByClientUuid: string;
    lockedBulletPointId: string;
}

export interface BulletPointUnlocked {
    type: "bullet-point-unlocked";
    lockedByClientUuid: string;
    lockedBulletPointId: string;
}

export interface BulletPointChanged {
    type: "bullet-point-changed";
    clientUuid: string;
    bulletPoint: BulletPoint;
}

export interface BulletPointAdded {
    type: "bullet-point-added";
    clientUuid: string;
    bulletPoint: BulletPoint;
}

export interface BulletPointRemoved {
    type: "bullet-point-removed";
    clientUuid: string;
    bulletPointId: string;
}