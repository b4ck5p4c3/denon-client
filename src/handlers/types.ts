import {IPublishPacket} from "mqtt";
import {Endpoint} from "../denon/client";

export type MQTTHandler = (payload: Buffer, packet: IPublishPacket) => Promise<void>;

export interface MQTTHandlerOpts {
}

export interface AVRHandlerOpts {
    endpoint: Endpoint;
}