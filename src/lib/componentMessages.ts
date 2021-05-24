export type BulletPointEvent = {
    "message": BulletPointMessage
}

export type BulletPointMessage =
    | LockBulletPoint
    | UnlockBulletPoint
    | EditBulletPoint
    | RemoveBulletPoint
    | AddBulletPointChild

export interface LockBulletPoint {
    type: "lock";
    bulletPointId: string;
}

export interface UnlockBulletPoint {
    type: "unlock";
    bulletPointId: string;
}

export interface EditBulletPoint {
    type: "edit";
    bulletPointId: string;
    text: string;
}

export interface RemoveBulletPoint {
    type: "remove";
    bulletPointId: string;
}

export interface AddBulletPointChild {
    type: "add-child";
    bulletPointId: string;
}