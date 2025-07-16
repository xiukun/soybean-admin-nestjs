import React, { useState } from "react";
import { Button, Modal, Input, message } from "antd";
// @ts-ignore
import SwaggerClient from "swagger-client";
import { ApiDB } from "@/db/api-db";
const App: React.FC = (props: any) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const { Search } = Input;

  const fetchSwaggerJson = async (url: string) => {
    // 'https://petstore.swagger.io/v2/swagger.json'
    // https://converter.swagger.io/api/openapi.json

    const client = await SwaggerClient(url);
    const apiList: {
      apiPath: string;
      method: string;
      id: string;
      name: string;
      responseProps?: { key: string; type: string; description: string }[];
    }[] = [];

    const getResponseProps = (schema: any, components: any, isSwagger2: boolean): { key: string; type: string; description: string }[] => {
      const props: { key: string; type: string; description: string }[] = [];
      if (!schema) return props;

      // 检查是否存在data属性，如果存在则优先解析data对象
      if (schema.properties?.data) {
        return getResponseProps(schema.properties.data, components, isSwagger2);
      }

      if (schema.$ref) {
        const refPath = schema.$ref.split('/');
        const refKey = decodeURIComponent(refPath[refPath.length - 1]);
        const refSchema = isSwagger2 ? components?.[refKey] : components?.schemas?.[refKey];
        if (refSchema?.properties) {
          Object.entries(refSchema.properties).forEach(([key, value]: [string, any]) => {
            if (value?.$ref || (value.type === 'array' && value.items?.$ref)) {
              const itemProps = getResponseProps(value.type === 'array' ? value.items : value, components, isSwagger2);
              props.push(...itemProps);
            } else if (value.type === 'array' && value.items?.properties) {
              props.push(...Object.entries(value.items.properties).map(([key, value]: [string, any]) => ({
                key,
                type: value.type || 'string',
                description: value.description || '',
                format: value.format
              })));
            } else {
              props.push({
                key,
                type: value.type || 'string',
                description: value.description || ''
              });
            }
          });
        }
      } else if (schema.properties) {
        Object.entries(schema.properties).forEach(([key, value]: [string, any]) => {
          if (value?.$ref || (value.type === 'array' && value.items?.$ref)) {
            const itemProps = getResponseProps(value.type === 'array' ? value.items : value, components, isSwagger2);
            props.push(...itemProps);
          } else if (value.type === 'array' && value.items?.properties) {
            props.push(...Object.entries(value.items.properties).map(([key, value]: [string, any]) => ({
              key,
              type: value.type || 'string',
              description: value.description || ''
            })));
          } else {
            props.push({
              key,
              type: value.type || 'string',
              description: value.description || ''
            });
          }
        });
      }

      return props;
    };

    const isSwagger2 = !!client.spec?.definitions;
    const basePath = client.spec?.basePath?.length > 1 ? client.spec.basePath : "";

    Object.keys(client.spec.paths).forEach((path) => {
      let apiPath = `${basePath + path}`;
      Object.keys(client.spec.paths[path]).forEach((method) => {
        const pathObj = client.spec.paths[path][method];
        let responseSchema;
        if (isSwagger2) {
          responseSchema = pathObj.responses?.['200']?.schema;
        } else {
          responseSchema = pathObj.responses?.['200']?.content?.['*/*']?.schema || pathObj.responses?.['200']?.content?.['application/json']?.schema;
        }
        const responseProps = getResponseProps(
          responseSchema,
          isSwagger2 ? client.spec.definitions : client.spec.components,
          isSwagger2
        );

        apiList.push({
          apiPath,
          method: method.toUpperCase(),
          id: `${method}::${apiPath}`,
          name: pathObj.summary, // 接口名称 总结字段
          responseProps
        });
      });
    });

    const apiDB = ApiDB.getInstance();
    await apiDB.saveApiData(apiList);
    messageApi.success("数据重置，接口列表初始化成功");
  };
  const onSearch = (value: string) => {
    fetchSwaggerJson(value);
  };
  const onOk = (_e: any) => {
    // 执行刷新列表操作
    props.onAction(
      _e,
      {
        type: "action",
        label: "刷新列表",
        actionType: "reload",
        target: "loadApiDataService",
      },
      {} // 这是 data
    );
    setModalOpen(false);
  };

  return (
    <>
      <Button type="default" onClick={() => setModalOpen(true)}>
        openapi导入
      </Button>
      <Modal
        title="openapi导入"
        style={{ top: 20 }}
        open={modalOpen}
        onOk={(e) => onOk(e)}
        onCancel={() => setModalOpen(false)}
      >
        {contextHolder}
        <div className="">
          <Search
            placeholder="在线swagger地址"
            defaultValue="https://petstore.swagger.io/v2/swagger.json"
            onSearch={onSearch}
            enterButton
            allowClear
          />
        </div>
      </Modal>
    </>
  );
};

export default App;
