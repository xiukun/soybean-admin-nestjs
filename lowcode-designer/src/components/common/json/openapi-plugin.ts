import { ApiDB } from "@/db/api-db";
import { toast } from "amis-ui";
export const openapiPlugin = () => {
  return {
    type: "group",
    body: [
      {
        type: "service",
        body: [
          {
            type: "select",
            label: false,
            name: "dataModelEntity",
            id: "u:d7273d5634cf",
            multiple: false,
            clearable: true,
            searchable: true,
            creatable: true,
            placeholder: "请选择接口",
            source: "${rows}",
            labelField: "name",
            valueField: "id",
            menuTpl: "<div>${name} -- ${apiPath}</div>",
          },
        ],
        id: "u:d6606e429449",
        dsType: "api",
        dataProvider: async (data: any, setData: any) => {
          const apiDB = ApiDB.getInstance();
          const rows = (await apiDB.getApiData()) || [];
          setData({ rows });
        },
        name: "openapiDataService",
      },
      // {
      //   type: "select",
      //   name: "dataModelEntity",
      //   id: "u:d4975ba0f9ca",
      //   multiple: false,
      //   searchable: true,
      //   source: async () => {
      //     const apiDb = ApiDB.getInstance();
      //     console.log(await apiDb.getApiData(), "apiDb");
      //     return (await apiDb.getApiData()) || [];
      //   },
      //   labelField: "name",
      //   valueField: "id",
      // },
      {
        type: "button-toolbar",
        label: "",
        buttons: [
          {
            type: "button",
            label: "openapi生成数据列",
            onEvent: {
              click: {
                actions: [
                  {
                    ignoreError: false,
                    script: async (ctx: any) => {
                      const dataModelEntity = ctx.props.data.dataModelEntity;
                      if (dataModelEntity) {
                        const apiDb = ApiDB.getInstance();
                        const result = (await apiDb.getApiData()) || [];
                        const currentData = result.filter(
                          (i: any) => i.id === dataModelEntity
                        );
                        const items = currentData?.[0]?.responseProps || [];

                        const autoFillKeyValues: any[] = [];
                        if (Array.isArray(items)) {
                          items.forEach((obj: any) => {
                            autoFillKeyValues.push({
                              label: obj.key,
                              type: "tpl",
                              name: obj.description || obj.key,
                            });
                          });
                          ctx.props.formStore.setValues({
                            columns: autoFillKeyValues,
                          });
                          const apiData = currentData?.[0];

                          // 查询条件的字段列表
                          ctx.props.formStore.setValues({
                            api: {
                              method: apiData.method?.toLowerCase() || "get",
                              url: apiData.apiPath,
                            },
                            filterSettingSource: autoFillKeyValues.map(
                              (column) => {
                                return column.name;
                              }
                            ),
                          });
                        } else {
                          toast.warning("数据模型对象格式错误，应返回数组～～");
                        }
                      } else {
                        toast.warning("暂无数据～～");
                      }
                    },
                    actionType: "custom",
                  },
                ],
              },
            },
          },
        ],
        level: "horizontal",
        mode: "inline",
      },
    ],
    className: "m-t",
    mode: "horizontal",
  };
};
