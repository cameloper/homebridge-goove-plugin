import {
  AccessoryConfig,
  AccessoryPlugin,
  API,
  CharacteristicEventTypes,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
  HAP,
  Logging,
  Service
} from "homebridge";

/*
 * IMPORTANT NOTICE
 *
 * One thing you need to take care of is, that you never ever ever import anything directly from the "homebridge" module (or the "hap-nodejs" module).
 * The above import block may seem like, that we do exactly that, but actually those imports are only used for types and interfaces
 * and will disappear once the code is compiled to Javascript.
 * In fact you can check that by running `npm run build` and opening the compiled Javascript file in the `dist` folder.
 * You will notice that the file does not contain a `... = require("homebridge");` statement anywhere in the code.
 *
 * The contents of the above import statement MUST ONLY be used for type annotation or accessing things like CONST ENUMS,
 * which is a special case as they get replaced by the actual value and do not remain as a reference in the compiled code.
 * Meaning normal enums are bad, const enums can be used.
 *
 * You MUST NOT import anything else which remains as a reference in the code, as this will result in
 * a `... = require("homebridge");` to be compiled into the final Javascript code.
 * This typically leads to unexpected behavior at runtime, as in many cases it won't be able to find the module
 * or will import another instance of homebridge causing collisions.
 *
 * To mitigate this the {@link API | Homebridge API} exposes the whole suite of HAP-NodeJS inside the `hap` property
 * of the api object, which can be acquired for example in the initializer function. This reference can be stored
 * like this for example and used to access all exported variables and classes from HAP-NodeJS.
 */
let hap: HAP;

const axios = require('axios');

enum RequestType {
  Connect,
  SetBrightness,
  SetColor
}

/*
 * Initializer function called when the plugin is loaded.
 */
export = (api: API) => {
  hap = api.hap;
  api.registerAccessory("GoveeLedStrip", GoveeLedStrip);
};

class GoveeLedStrip implements AccessoryPlugin {
  private readonly log: Logging;
  private readonly name: string;
  private readonly serverAddress: string;
  private readonly serverPort: number;
  private readonly keepAlive: boolean;
  private brightness = 0;
  private hue = 0.0;
  private saturation = 0.0;

  private readonly lightService: Service;
  private readonly informationService: Service;
  
  constructor(log: Logging, config: AccessoryConfig, api: API) {
    this.log = log;
    this.name = config.name;
    this.serverAddress = config.serverAddress;
    this.serverPort = config.serverPort;
    this.keepAlive = config.keepAlive;

    this.connectionRequest(this.keepAlive);

    this.lightService = new hap.Service.Lightbulb(this.name);
    this.lightService.getCharacteristic(hap.Characteristic.On)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        log.info("Returning on status: " + (this.brightness ? "on" : "off"));
        callback(undefined, (this.brightness == 0));
      })
      .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        log.info("Setting on status: " + (this.brightness ? "on" : "off"));
        this.brightness = (value ? 100 : 0);
        callback();
      });
    this.lightService.getCharacteristic(hap.Characteristic.Brightness)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        log.info("Returning brightness: " + this.brightness);
        callback(undefined, this.brightness);
      })
      .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        log.info("Setting brightness: " + value);
        this.brightness = value as number;
        callback();
      });
    this.lightService.getCharacteristic(hap.Characteristic.Hue)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        log.info("Returning hue: " + this.hue);
        callback(undefined, this.hue);
      })
      .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        log.info("Setting hue: " + value);
        this.hue = value as number;
        callback();
      });
    this.lightService.getCharacteristic(hap.Characteristic.Saturation)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        log.info("Returning saturation: " + this.saturation);
        callback(undefined, this.saturation);
      })
      .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        log.info("Setting saturation: " + value);
        this.saturation = value as number;
        callback();
      });
    
    this.informationService = new hap.Service.AccessoryInformation()
      .setCharacteristic(hap.Characteristic.Manufacturer, "Govee")
      .setCharacteristic(hap.Characteristic.Model, "H6139");
  }

  

  getServices(): Service[] {
    return [
      this.informationService,
      this.lightService
    ];
  }

  connectionRequest(keepAlive: boolean) {
    const log = this.log;
    const url = `${this.serverAddress}:${this.serverPort}/connect`;
    axios.post(url, {
      keepAlive: keepAlive
    })
    .then(function (response: any) {
      log.debug(response);
    })
    .catch(function (error: any) {
      log.error(error);
    });
  }
}

