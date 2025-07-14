import type { InternalAxiosRequestConfig } from 'axios';
import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import { nanoid } from '@sa/utils';
import {
  BACKEND_ERROR_CODE,
  type CreateAxiosDefaults,
  REQUEST_ID_KEY,
  type RequestOption,
  type ResponseType,
  createAxiosConfig,
  createDefaultOptions,
  createRetryOptions
} from '@sa/axios';
import { getServiceBaseURL } from '@/utils/service';
import { localStg } from '@/utils/storage';

const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
const { baseURL, otherBaseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);
console.log('baseURL', baseURL);
export function amisCommonRequest<ResponseData = any>(
  axiosConfig?: CreateAxiosDefaults,
  options?: Partial<RequestOption<ResponseData>>
) {
  const opts = createDefaultOptions<ResponseData>(options);

  const axiosConf = createAxiosConfig(axiosConfig);
  const instance = axios.create(axiosConf);

  const abortControllerMap = new Map<string, AbortController>();

  // config axios retry
  const retryOptions = createRetryOptions(axiosConf);
  axiosRetry(instance, retryOptions);

  instance.interceptors.request.use((conf: InternalAxiosRequestConfig) => {
    const config: InternalAxiosRequestConfig = { ...conf };

    // set request id
    const requestId = nanoid();
    config.headers.set(REQUEST_ID_KEY, requestId);

    // config abort controller
    if (!config.signal) {
      const abortController = new AbortController();
      config.signal = abortController.signal;
      abortControllerMap.set(requestId, abortController);
    }

    // handle config by hook
    const handledConfig = opts.onRequest?.(config) || config;

    return handledConfig;
  });

  instance.interceptors.response.use(
    async (response: any) => {
      const responseType = (response.config?.responseType || 'json') as ResponseType;

      if (responseType !== 'json' || opts.isBackendSuccess(response)) {
        return Promise.resolve(response);
      }

      const fail = await opts.onBackendFail(response, instance);
      if (fail) {
        return fail;
      }

      const backendError = new AxiosError<ResponseData>(
        'the backend request error',
        BACKEND_ERROR_CODE,
        response.config,
        response.request,
        response
      );

      await opts.onError(backendError);

      return Promise.reject(backendError);
    },
    async (error: AxiosError<ResponseData>) => {
      await opts.onError(error);

      return Promise.reject(error);
    }
  );

  function cancelRequest(requestId: string) {
    const abortController = abortControllerMap.get(requestId);
    if (abortController) {
      abortController.abort();
      abortControllerMap.delete(requestId);
    }
  }

  function cancelAllRequest() {
    abortControllerMap.forEach(abortController => {
      abortController.abort();
    });
    abortControllerMap.clear();
  }

  return {
    instance,
    opts,
    cancelRequest,
    cancelAllRequest
  };
}

export function amisRequest() {
  return amisCommonRequest(
    {
      baseURL: otherBaseURL.amisService
    },
    {
      async onRequest(config) {
        const { headers } = config;

        // set token
        const token = localStg.get('token');
        const Authorization = token ? `Bearer ${token}` : null;
        Object.assign(headers, { Authorization });

        return config;
      },
      isBackendSuccess(response) {
        // when the backend response code is "200", it means the request is success
        // you can change this logic by yourself
        // return response.data.status === '200';
        const successFlags = import.meta.env.VITE_SERVICE_SUCCESS_CODE?.split(',') || [];
        if (successFlags.includes(String(response.data.status))) {
          return true;
        }
        return false;
      },
      async onBackendFail(_response) {
        // when the backend response code is not "200", it means the request is fail
        // for example: the token is expired, refresh token and retry request
      },
      transformBackendResponse(response) {
        return response.data.result;
      }
      // ,
      // onError(error) {
      //   // when the request is fail, you can show error message
      //   console.log(error, 'error...');
      //   let message = error.message;

      //   // show backend error message
      //   if (error.code === BACKEND_ERROR_CODE) {
      //     message = error.response?.data?.message || message;
      //   }

      //   window.$message?.error(message);
      // }
    }
  );
}
