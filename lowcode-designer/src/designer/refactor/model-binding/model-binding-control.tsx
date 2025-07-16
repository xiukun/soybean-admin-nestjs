import React, { useEffect, useState } from 'react'
import { DSField } from 'amis-editor'
import { DataBindingProps, DataBindingState } from 'amis-editor/lib/renderer/DataBindingControl'
import { Icon, InputBox, PickerContainer, Spinner, Select } from 'amis-ui'
import { Form } from 'antd'
import { filterMethodList } from '@/utils/filter-method'

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
        title="字段过滤条件"
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
          return <ModelEntity result={result} onSelectedFieldName={this.onSelectedFieldName} />
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
  const [filterMethodValue, setFilterMethodValue] = useState('equal')
  const [fieldValue, setFieldValue] = useState('')

  const getParams = (code: string) => {
    const regex = /([\w$]+)\['([^']+)'\]/
    const match = code.match(regex)

    return {
      name: match?.[1],
      method: match?.[2],
    }
  }
  useEffect(() => {
    if (props.result.includes('[')) {
      //paramsName['method'] 正则拆解为paramsName 和 method
      const obj = getParams(props.result)
      setFieldValue(obj.name || '')
      setFilterMethodValue(obj.method || 'equal')
    } else {
      setFieldValue(props.result || '')
      setFilterMethodValue('equal')
    }
  }, [])

  function onFilterMethodChange(item: any) {
    setFilterMethodValue(item?.value)
    if (item) {
      props.onSelectedFieldName(`${fieldValue}['${item.value}']`)
    } else {
      props.onSelectedFieldName(`${fieldValue}`)
    }
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
        <Form.Item label="过滤方法" name="selectedfilterMethod">
          <Select
            options={filterMethodList}
            value={filterMethodValue}
            searchable
            clearable
            className="w-full"
            onChange={onFilterMethodChange}
          />
          <span className="">{filterMethodValue}</span>
        </Form.Item>
      </Form>
    </>
  )
}

export const ModelEntity = React.forwardRef((props: any, ref: any) => (
  <CustomDialogContent {...props} forwardRef={ref} />
))
