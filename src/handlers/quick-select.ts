import {AVRHandlerOpts, MQTTHandler, MQTTHandlerOpts} from "./types";
import {getLogger} from "../logger";
import {DenonAVRClient} from "../denon/client";

export function quickSelectHandler(opts: AVRHandlerOpts & MQTTHandlerOpts): MQTTHandler {
    const logger = getLogger();

    return async (payload) => {
        const value = parseInt(payload.toString("utf8"));
        if (!(value >= 0 && value <= 5)) {
            throw new Error(`Wrong preset id value: ${payload.toString("utf8")}`);
        }
        await DenonAVRClient.exchange(opts.endpoint, `MSQUICK${value}`);
        logger.info(`Set volume to ${value}`);
    };
}