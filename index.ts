import { decodeAny } from "govee-bt-client/dist/decode";
import { isValidPeripheral } from "govee-bt-client/dist/validation";
import * as dotenv from "dotenv";
import noble from "@abandonware/noble";
import {
  Accessory,
  Categories,
  Characteristic,
  Service,
  uuid,
} from "hap-nodejs";

const log = (msg: any) => {
  if (DEBUG === "true") console.log(msg);
};

const createGoveeAccessory = (id: string) => {
  const accessory = new Accessory(id, uuid.generate(id));

  accessory.addService(
    new Service.TemperatureSensor(`${id} TemperatureSensorService`)
  );
  accessory.addService(
    new Service.HumiditySensor(`${id} HumiditySensorService`)
  );
  accessory.addService(new Service.Battery(`${id} BatteryService`));

  accessory.publish({
    username: Buffer.from(uuid.generate(id))
      .toString("hex")
      .split("")
      .reduce((prev, curr, i) => {
        if (i && i % 2 === 0) prev = prev.concat(":");
        prev = prev.concat(curr);
        return prev;
      }, "")
      .slice(0, 17),
    pincode: "123-45-678",
    category: Categories.SENSOR,
  });

  accessoriesByid[id] = accessory;

  return accessory;
};

const setCharacteristics = (
  id: string,
  temp: number,
  humidity: number,
  battery: number
) => {
  const accessory = accessoriesByid[id];
  if (!accessory) throw new Error(`Can't find accessory ${id}`);

  const temperatureSensorService = accessory.getService(
    `${id} TemperatureSensorService`
  );
  if (!temperatureSensorService)
    throw new Error(`Can't find service ${id} TemperatureSensorService`);
  temperatureSensorService.setCharacteristic(
    Characteristic.CurrentTemperature,
    temp
  );
  log(`${id} TemperatureSensorService.CurrentTemperature -> ${temp}`);

  const humiditySensorService = accessory.getService(
    `${id} HumiditySensorService`
  );
  if (!humiditySensorService)
    throw new Error(`Can't find service ${id} HumiditySensorService`);
  humiditySensorService.setCharacteristic(
    Characteristic.CurrentRelativeHumidity,
    humidity
  );
  log(`${id} HumiditySensorService.CurrentRelativeHumidity -> ${humidity}`);

  const batteryService = accessory.getService(`${id} BatteryService`);
  if (!batteryService)
    throw new Error(`Can't find service ${id} BatteryService`);
  batteryService.setCharacteristic(Characteristic.BatteryLevel, battery);
  log(`${id} BatteryService.BatteryLevel -> ${battery}`);
  const lowBattery = battery < 20;
  batteryService.setCharacteristic(Characteristic.StatusLowBattery, lowBattery);
  log(`${id} BatteryService.StatusLowBattery -> ${lowBattery}`);
};

dotenv.config();
const { DEBUG } = process.env;
console.log({ DEBUG });

const accessoriesByid: { [key: string]: Accessory } = {};

noble
  .on("stateChange", async (state) => {
    if (state === "poweredOn")
      await noble.startScanningAsync(["ec88", "0001"], true);
  })
  .on("discover", async (peripheral) => {
    if (!isValidPeripheral(peripheral)) return;

    const {
      advertisement: { localName: id, manufacturerData },
    } = peripheral;
    const { battery, humidity, tempInC, tempInF } = decodeAny(
      manufacturerData.toString("hex")
    );

    if (!accessoriesByid[id]) createGoveeAccessory(id);

    setCharacteristics(id, tempInC, humidity, battery);
  });
