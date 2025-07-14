// import { request } from '../request';

export const amisApi = {
  /** Get amis schema */
  fetchGetAmisSchema: async () => {
    const randomNum = Math.floor(Math.random() * 3) + 1;
    const schema = await import(`@/amis/json/${randomNum}.amis.json`);
    return schema.default;
  },
  fetchGetAmisBigScreenSchema: async () => {
    const schema = await import(`@/amis/json/bigscreen.amis.json`);
    return schema.default;
  },
  fetchGetAmisGanttSchema: async () => {
    const schema = await import(`@/amis/json/gantt.amis.json`);
    return schema.default;
  },
  fetchGetConstant2: async () => {
    const schema = await import(`@/amis/json/2.amis.json`);
    return schema.default;
  },
  fetchGetLocation: async () => {
    const schema = await import(`@/amis/json/location.json`);
    return schema.default;
  }
};
