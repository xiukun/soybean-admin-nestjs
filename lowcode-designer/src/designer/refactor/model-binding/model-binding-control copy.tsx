import React, { useEffect, useRef, useState } from 'react'
import { DSField } from 'amis-editor'
import { DataBindingProps, DataBindingState } from 'amis-editor/lib/renderer/DataBindingControl'
import { Icon, InputBox, PickerContainer, Spinner, Select } from 'amis-ui'
import agHttp from '@/utils/http'
import { Form } from 'antd'
import { useReactive } from 'ahooks'

const filterMethodList = [
  {
    label: '等于',
    value: 'equal',
  },
  {
    label: '不等于',
    value: 'notEqual',
  },
  {
    label: '包含',
    value: 'like',
  },
  {
    label: '不包含',
    value: 'notLike',
  },
  {
    label: '在范围内',
    value: 'between',
  },
  {
    label: '大于',
    value: 'gt',
  },
  {
    label: '大于等于',
    value: 'gte',
  },
  {
    label: '小于',
    value: 'lt',
  },
  {
    label: '小于等于',
    value: 'lte',
  },
  {
    label: '为空',
    value: 'empty',
  },
  {
    label: '不为空',
    value: 'notEmpty',
  },
]

export class ModelBindingControl extends React.PureComponent<
  DataBindingProps,
  DataBindingState & { selectedFieldName: string }
> {
  constructor(props: DataBindingProps) {
    super(props)
    this.state = {
      loading: false,
      hint: undefined,
      selectedFieldName: '',
    }
    this.handleConfirm = this.handleConfirm.bind(this)
    this.handlePickerOpen = this.handlePickerOpen.bind(this)
  }

  handleConfirm(result: DSField) {
    const { manager, data, onChange, onBulkChange, onBindingChange } = this.props
    if (this.state.selectedFieldName) {
      onChange(this.state.selectedFieldName)
    } else if (result?.value) {
      onChange(result.value)
      onBulkChange && onBindingChange?.(result, onBulkChange)
      manager.config?.dataBindingChange?.(result.value, data, manager)
    }
  }

  async handlePickerOpen() {
    // const { manager, node } = this.props

    this.setState({
      loading: true,
      schema: undefined,
      selectedFieldName: '',
    })

    let schema
    // try {
    //   schema = undefined
    // } catch (e) {
    //   this.setState({
    //     loading: false,
    //     hint: '加载可用字段失败，请联系管理员！',
    //     selectedFieldName: '',
    //   })
    //   return
    // }

    this.setState({
      loading: false,
      hint: schema ? undefined : '暂无可绑定字段',
      schema: schema ?? undefined,
      selectedFieldName: '',
    })
  }

  /**
   * 修改实体字段值
   * @param val 字段名
   */
  onSelectedFieldName = (val: string) => {
    this.setState({ selectedFieldName: val })
  }

  render() {
    const { className, value: result, onChange, disabled } = this.props

    // const { schema, loading, hint } = this.state
    const { loading } = this.state
    return (
      <PickerContainer
        onPickerOpen={this.handlePickerOpen}
        className={className}
        title="绑定字段"
        bodyRender={({ value, isOpened, onChange }: any) => {
          if (!isOpened) {
            return null
          }

          if (loading) {
            return <Spinner show icon="reload" spinnerClassName="ae-DataBindingList-spinner" />
          }

          // if (hint) {
          //   return <p className="ae-DataBindingList-hint">{hint}</p>
          // }

          // return render('modal-body', schema!, {})
          return <ModelEntity onSelectedFieldName={this.onSelectedFieldName} />
        }}
        value={result}
        onConfirm={this.handleConfirm}
      >
        {({ onClick }: { onClick: (e: React.MouseEvent) => void }) => {
          return (
            <InputBox
              className="ae-InputVariable"
              clearable={false}
              value={result}
              onChange={onChange}
              disabled={disabled}
            >
              <span
                onClick={async e => {
                  onClick(e)
                }}
              >
                <Icon icon="plus" className="icon cursor-pointer" />
              </span>
            </InputBox>
          )
        }}
      </PickerContainer>
    )
  }
}
function CustomDialogContent(props: any) {
  const fieldRef: any = useRef()
  const [modelList, setModelList] = useState([])
  const [modelFieldList, setModelFieldList] = useState([])
  const states = useReactive({
    fieldValue: '',
    filterMethodValue: 'equal',
  })
  useEffect(() => {
    // 接口
    modelListApi()
  }, [])

  /**
   * 数据模型列表接口
   */
  async function modelListApi() {
    const res = await agHttp.post('/system/structTab/query', { objName: '' })
    setModelList(res.data.options)
  }
  /**
   * 表字段接口
   * @param name 表名
   */
  async function modelFieldApi(name: any) {
    const res: any = await agHttp.post(`/system/structCol/query`, {
      mainId: name,
    })
    setModelFieldList(res.data.options)
  }

  function onModelEntityChange(item: any) {
    if (item) modelFieldApi(item.id)
    else setModelFieldList([])

    states.fieldValue = ''
    fieldRef.current?.props?.onChange('')
  }
  function onModelFieldChange(item: any) {
    states.fieldValue = item?.paramName || ''
    props.onSelectedFieldName(states.fieldValue)
  }

  function onFilterMethodChange(item: any) {
    props.onSelectedFieldName(`${states.fieldValue}['${states.filterMethodValue}']`)
  }

  return (
    <>
      <Form
        name="basic"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        initialValues={{ remember: true }}
        autoComplete="off"
      >
        <Form.Item label="数据实体" name="selectedModelEntity">
          <Select
            name="selectModelName"
            labelField="remark"
            valueField="id"
            options={modelList}
            searchable
            clearable
            className="w-full"
            onChange={onModelEntityChange}
          />
        </Form.Item>
        <Form.Item label="实体字段" name="selectedModelField">
          <Select
            ref={fieldRef}
            options={modelFieldList}
            labelField="remark"
            valueField="paramName"
            value={states.fieldValue}
            searchable
            clearable
            className="w-full"
            onChange={onModelFieldChange}
          />
        </Form.Item>
        <Form.Item label="过滤方法" name="selectedfilterMethod">
          <Select
            options={filterMethodList}
            value={states.filterMethodValue}
            searchable
            clearable
            className="w-full"
            onChange={onFilterMethodChange}
          />
          <span className="hidden">{states.filterMethodValue}</span>
        </Form.Item>
      </Form>
    </>
  )
}

export const ModelEntity = React.forwardRef((props: any, ref: any) => (
  <CustomDialogContent {...props} forwardRef={ref} />
))
