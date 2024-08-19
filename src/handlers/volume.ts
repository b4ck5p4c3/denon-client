import {AVRHandlerOpts, MQTTHandler, MQTTHandlerOpts} from "./types";
import {DenonAVRClient} from "../denon/client";
import {getLogger} from "../logger";

export function volumeHandler(opts: AVRHandlerOpts & MQTTHandlerOpts): MQTTHandler {
    const logger = getLogger();

    return async (payload) => {
        const value = parseInt(payload.toString("utf8"));
        if (!(value >= 0 && value <= 99)) {
            throw new Error(`Wrong volume value: ${payload.toString("utf8")}`);
        }
        await DenonAVRClient.exchange(opts.endpoint, `MV${value}`);
        logger.info(`Set volume to ${value}`);

    };
}