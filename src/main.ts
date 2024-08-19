import dotenv from "dotenv";
import mqtt from "mqtt";
import {getLogger} from "./logger";
import {AVRHandlerOpts, MQTTHandler, MQTTHandlerOpts} from "./handlers/types";
import {volumeHandler} from "./handlers/volume";
import fs from "fs";
import {quickSelectHandler} from "./handlers/quick-select";

const logger = getLogger();

dotenv.config({
    path: ".env.development"
});
dotenv.config();

const MQTT_URL = process.env.MQTT_URL;
if (!MQTT_URL) {
    throw new Error("MQTT_URL variable not found");
}

const MQTT_TOPIC_PREFIX = process.env.MQTT_TOPIC_PREFIX;
if (!MQTT_TOPIC_PREFIX) {
    throw new Error("MQTT_TOPIC_PREFIX variable not found");
}

const AVR_HOST = process.env.AVR_HOST;
if (!AVR_HOST) {
    throw new Error("AVR_HOST variable not found");
}

const AVR_PORT = process.env.AVR_PORT;
if (!AVR_PORT) {
    throw new Error("AVR_PORT variable not found");
}

const avrPort = parseInt(AVR_PORT);

const MQTT_CA_PATH = process.env.MQTT_CA_PATH;

const handlerOpts: MQTTHandlerOpts & AVRHandlerOpts = {
    endpoint: [AVR_HOST, avrPort]
};

const mqttHandlers: Record<string, MQTTHandler> = {
    "volume": volumeHandler(handlerOpts),
    "quick-select": quickSelectHandler(handlerOpts)
};

(async () => {
    const mqttClient = mqtt.connect(MQTT_URL, {
        ca: MQTT_CA_PATH ? fs.readFileSync(MQTT_CA_PATH) : undefined
    });

    mqttClient.on("connect", () => {
        logger.info("Connected to MQTT");
        for (const suffix of Object.keys(mqttHandlers)) {
            const topic = `${MQTT_TOPIC_PREFIX}/${suffix}`;
            mqttClient.subscribe(topic, (e) => {
                if (e) {
                    logger.error(`Failed to subscribe to '${topic}': ${e}`);
                } else {
                    logger.info(`Subscribed to '${topic}'`);
                }
            });
        }
    });

    mqttClient.on("error", (e) => {
        logger.error(`MQTT error: ${e}`);
    });

    mqttClient.on("message", (topic, payload, packet) => {
        const handlerName = topic.replace(RegExp(`^${MQTT_TOPIC_PREFIX}/`), "");
        const handler = mqttHandlers[handlerName];
        if (!handler) {
            logger.warn(`Handler for '${handlerName}' not found`);
            return;
        }

        handler(payload, packet)
            .catch(e => logger.error(`Handler '${handlerName}' threw an error: ${e}`));
    });
})().catch(e => logger.fatal(e));