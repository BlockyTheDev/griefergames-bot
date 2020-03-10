import vec3 from 'vec3';
import { Bot } from '../bot';
import { ConnectorOptions } from '../interfaces';
import { config } from '../config';

// An overwhelming amount of code
// due to bad Mineflayer physics.
// ¯\_(ツ)_/¯

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function waitForSpawn(bot: Bot): Promise<void> {
  return new Promise((resolve) => {
    bot.client.once('spawn', resolve);
  });
}

// bot.look rotates from north, not east,
// like falsely described in the API.
// It is counter-clockwise though.
const CARDINAL_YAWS = {
  NORTH: 0,
  NORTH_WEST: (1 * Math.PI) / 4,
  WEST: Math.PI / 2,
  SOUTH_WEST: (3 * Math.PI) / 4,
  SOUTH: Math.PI,
  SOUTH_EAST: (5 * Math.PI) / 4,
  EAST: (3 * Math.PI) / 2,
  NORTH_EAST: (7 * Math.PI) / 4,
};

const WIGGLE_INTERVAL = 1000;

async function run(bot: Bot, options: ConnectorOptions): Promise<void> {
  const timeout = setTimeout(() => {
    throw new Error('Timed out while connecting on CityBuild.');
  }, config.PORTAL_TIMEOUT);

  let startPos: any;
  let lookDirection: number[];
  switch (options.start) {
    case 0: // SW
      startPos = vec3(323, 117, 281);
      lookDirection = [CARDINAL_YAWS.SOUTH_WEST, 0];
      break;
    case 1: // NW
      startPos = vec3(323, 117, 279);
      lookDirection = [CARDINAL_YAWS.NORTH_WEST, 0];
      break;
    case 2: // NE
      startPos = vec3(327, 117, 279);
      lookDirection = [CARDINAL_YAWS.NORTH_EAST, 0];
      break;
    case 3: // SE
      startPos = vec3(327, 117, 281);
      lookDirection = [CARDINAL_YAWS.SOUTH_EAST, 0];
      break;
    default:
      throw new Error('Start position not provided! Check path file.');
  }

  bot.sendCommand('portal');
  await waitForSpawn(bot);
  await delay(3000);

  try {
    await bot.client.navigate.promise.to(startPos);
  } catch (e) {
    throw new Error('Stuck in connector.');
  }
  await delay(500);

  const [yaw, pitch] = lookDirection;
  bot.client.look(yaw, pitch, true);
  await delay(500);

  bot.client.setControlState('sprint', true);
  bot.client.setControlState('jump', true);
  bot.client.setControlState('forward', true);
  await delay(200);

  bot.client.setControlState('jump', false);
  await delay(300);

  bot.client.clearControlStates();
  await delay(2000);

  const [frontX, frontY, frontZ] = options.front;
  const frontPos = vec3(frontX, frontY, frontZ);
  try {
    await bot.client.navigate.promise.to(frontPos);
  } catch (e) {
    throw new Error('Stuck in connector.');
  }
  await delay(2000);

  const [portalX, portalY, portalZ] = options.portal;
  const portalPos = vec3(portalX, portalY, portalZ);
  bot.client.lookAt(portalPos, true);
  bot.client.setControlState('sprint', true);
  bot.client.setControlState('forward', true);
  bot.client.setControlState('jump', true);
  await delay(1000);

  bot.client.clearControlStates();

  const stopWiggle = wiggle(bot);

  await waitForSpawn(bot);

  stopWiggle();
  clearTimeout(timeout);
}

function wiggle(bot: Bot): () => void {
  function moveLeft() {
    bot.client.setControlState('left', true);
  }

  function moveRight() {
    bot.client.setControlState('right', true);
  }

  let left = true;
  const interval = setInterval(() => {
    bot.client.clearControlStates();
    left ? moveLeft() : moveRight();

    left = !left;
  }, WIGGLE_INTERVAL);

  return () => {
    clearInterval(interval);
  };
}

export { run as connectorTask };
