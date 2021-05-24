<script type="ts">
    import type { ClientInfo, InitialInfo } from "@kosy/kosy-app-api/types";    
    import type { AppState, BulletPoint as BPoint } from "./lib/appState";
    import type { BulletPointMessage } from "./lib/componentMessages";
    import Button from "@kosy/kosy-svelte-components/Button.svelte";
    import { KosyApi } from "@kosy/kosy-app-api";
    import BulletPoint from "./components/BulletPoint.svelte";
    import type { ClientToHostMessage, HostToClientMessage } from "./lib/appMessages";
    
    let state: AppState = { bulletPoints: [], beingEdited: {} };

    let initializerUuid: string;
    let currentClientUuid: string;
    let allClients: { [clientUuid: string]: ClientInfo } = {};

    //Simplest to implement -> just return the current state
    let getState = () => {
        return state;
    }

    let setState = (newState: AppState) => {
        state = newState ?? state;
    }

    let onClientHasJoined = (client: ClientInfo) => {
        allClients[client.clientUuid] = client;
    }

    let onClientHasLeft = (clientUuid: string) => {
        if (currentClientUuid === initializerUuid) {
            //Make it so that if the client was editing a bullet point, the lock is cleared
            let toUnlock = state.bulletPoints.find(bp => state.beingEdited[bp.bulletPointId] === clientUuid);
            if (toUnlock) { 
                unlockBulletPoint(toUnlock.bulletPointId);
            }
        }
    }

    let processBulletPointAdded = (bulletPoint: BPoint, clientUuid: string) => {
        state = { 
            bulletPoints: [ ...state.bulletPoints, bulletPoint ], 
            beingEdited: { ...state.beingEdited, [bulletPoint.bulletPointId]: clientUuid } 
        };
    }

    let processBulletPointChanged = (updated: BPoint, clientUuid: string) => {
        let editedBulletPoints = state.bulletPoints.map(bp => bp.bulletPointId === updated.bulletPointId ? updated : bp);
        state = { ...state, bulletPoints: editedBulletPoints };
    }

    let processBulletPointRemoved = (bulletPointId: string, clientUuid: string) => {
        let toRemove = state.bulletPoints.find(bp => bp.bulletPointId === bulletPointId);
        if (toRemove) {
            let newBulletPoints = state.bulletPoints.filter(bp => bp.bulletPointId !== bulletPointId);
            state = { ...state, bulletPoints: newBulletPoints }
        }
    }

    let processBulletPointLocked = (bulletPointId: string, clientUuid: string) => {
        state = { ...state, beingEdited: { ...state.beingEdited, [bulletPointId]: clientUuid } };
    }

    let processBulletPointUnlocked = (bulletPointId: string, clientUuid: string) => {
        state = { ...state, beingEdited: { ...state.beingEdited, [bulletPointId]: undefined } };
    }

    //Process the message that was sent via the kosy network
    let processHostToClientMessage = async (message: HostToClientMessage) => {
        console.log("Received a message from Kosy: ", message);
        switch (message.type) {
            case "bullet-point-added":
                processBulletPointAdded (message.bulletPoint, message.clientUuid);
                break;
            case "bullet-point-changed":
                if (message.clientUuid !== currentClientUuid) {
                    processBulletPointChanged (message.bulletPoint, message.clientUuid);
                }
                break;
            case "bullet-point-removed":
                processBulletPointRemoved (message.bulletPointId, message.clientUuid);
                break;
            case "bullet-point-locked":
                processBulletPointLocked (message.lockedBulletPointId, message.lockedByClientUuid);
                break;
            case "bullet-point-unlocked":
                processBulletPointUnlocked (message.lockedBulletPointId, message.lockedByClientUuid);
                break;
            default:
                break;
        }
    }

    let addBulletPoint = (parentIdentifier?: string) => {
        let newBulletPoint: BPoint = {
            bulletPointId: Date.now().toString(),
            parentBulletPointId: parentIdentifier,
            text: ""
        }
        kosyApi.relayMessage({ type: "add-bullet-point", bulletPoint: newBulletPoint, clientUuid: currentClientUuid });
    }

    let changeBulletPoint = (bulletPointId: string, text: string) => {
        let toEdit = state.bulletPoints.find(bp => bp.bulletPointId === bulletPointId);
        if (toEdit) {
            let updated = { ...toEdit, text: text };
            kosyApi.relayMessage({ type: "edit-bullet-point", clientUuid: currentClientUuid, bulletPoint: updated });
        }
    }

    let removeBulletPoint = (bulletPointId: string) => {
        kosyApi.relayMessage({ type: "remove-bullet-point", bulletPointId: bulletPointId, clientUuid: currentClientUuid });
    }

    let lockBulletPoint = (bulletPointId: string) => {
        kosyApi.relayMessage({ type: "lock-bullet-point", lockedBulletPointId: bulletPointId, lockedByClientUuid: currentClientUuid });
    }

    let unlockBulletPoint = (bulletPointId: string) => {
        kosyApi.relayMessage({ type: "unlock-bullet-point", lockedBulletPointId: bulletPointId, lockedByClientUuid: currentClientUuid });
    }

    let processClientToHostMessage = (message: ClientToHostMessage): HostToClientMessage => {
        switch (message.type) {
            case "add-bullet-point": {
                return {
                    type: "bullet-point-added",
                    bulletPoint: message.bulletPoint,
                    clientUuid: message.clientUuid
                }
            }
            case "edit-bullet-point": {
                if (state.beingEdited[message.bulletPoint.bulletPointId] === message.clientUuid) {
                    return {
                        type: "bullet-point-changed",
                        bulletPoint: message.bulletPoint,
                        clientUuid: message.clientUuid
                    }
                }
                break;
            }
            case "remove-bullet-point": {
                if (!state.beingEdited[message.bulletPointId] || state.beingEdited[message.bulletPointId] === message.clientUuid) {
                    return {
                        type: "bullet-point-removed",
                        clientUuid: message.clientUuid,
                        bulletPointId: message.bulletPointId
                    }
                }
                break;
            }
            case "lock-bullet-point": {
                if (!state.beingEdited[message.lockedBulletPointId]) {
                    return {
                        type: "bullet-point-locked",
                        lockedByClientUuid: message.lockedByClientUuid,
                        lockedBulletPointId: message.lockedBulletPointId
                    }
                }
                break;
            }
            case "unlock-bullet-point": {
                if (state.beingEdited[message.lockedBulletPointId] === message.lockedByClientUuid) {
                    return { 
                        type: "bullet-point-unlocked",
                        lockedByClientUuid: message.lockedByClientUuid,
                        lockedBulletPointId: message.lockedBulletPointId 
                    }
                }
                break;
            }
            default: break;
        }
        return undefined;
    }

    const kosyApi = new KosyApi<AppState, ClientToHostMessage, HostToClientMessage>({
        onClientHasJoined: (client) => onClientHasJoined(client),
        onClientHasLeft: (clientUuid) => onClientHasLeft(clientUuid),
        onReceiveMessageAsHost: (message) => processClientToHostMessage(message),
        onReceiveMessageAsClient: (message) => { processHostToClientMessage(message) },
        onRequestState: () => getState(),
        onProvideState: (newState: AppState) => setState(newState)
    });

    let kosyApiPromise = kosyApi.startApp().then((initialInfo: InitialInfo<AppState>) => {
        initializerUuid = initialInfo.initializerClientUuid;
        currentClientUuid = initialInfo.currentClientUuid;
        allClients = initialInfo.clients;
        state = initialInfo.currentAppState ?? state;
    }).then(() => true);

    let processBulletPointMessage = (message: BulletPointMessage) => {
        switch (message.type) {
            case "lock":
                lockBulletPoint(message.bulletPointId);
                break;
            case "unlock":
                unlockBulletPoint(message.bulletPointId);
                break;
            case "edit":
                changeBulletPoint(message.bulletPointId, message.text);
                break;
            case "remove":
                removeBulletPoint(message.bulletPointId);
                break;
            case "add-child":
                addBulletPoint(message.bulletPointId);
                break;
        }
    }
</script>

{#await kosyApiPromise}
    <p></p>
{:then active}
    <div>
        <ol>
            {#each state.bulletPoints.filter(bp => !bp.parentBulletPointId) as bulletPoint}
                <li>
                    <BulletPoint 
                        {bulletPoint} 
                        isLocked={state.beingEdited[bulletPoint.bulletPointId] !== currentClientUuid} 
                        isLockedBy={allClients[state.beingEdited[bulletPoint.bulletPointId]]?.clientName} 
                        on:message={ e => processBulletPointMessage(e.detail) } 
                    />
                </li>
            {/each}
        </ol>
    </div>
    <div>
        <Button importance="primary" on:click={ () => addBulletPoint() }>Add bullet point</Button>
    </div>
{/await}