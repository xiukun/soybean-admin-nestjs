import ValidationControl from 'amis-editor/lib/renderer/ValidationControl'
import { groupBy, remove } from 'lodash'
import { ReactNode } from 'react'
import ValidationItemRefactor from './validation-item'
import { getValidator } from 'amis-editor/lib/validator'
import { i18n } from 'i18n-runtime'

/**
 * 基础组件右侧 “校验” 的label i18n无效，重写相关方法
 */
export default class AeValidationControlRenderer extends ValidationControl {
  /**
   * 添加规则下拉框
   */
  renderDropdown() {
    const { render, validations = {} } = this.props

    const {
      avaliableValids: { moreValidators },
    } = this.state
    // 去掉已经选用的
    const validators = Object.values(moreValidators).filter(
      item => !validations.hasOwnProperty(item.name),
    )
    const buttons = Object.entries(groupBy(validators, 'group')).map(([group, validations]) => ({
      label: i18n(group),
      children: validations.map(v => ({
        label: i18n(v.label),
        onClick: () => this.handleAddValidator(v),
      })),
    }))

    return (
      <div className="ae-ValidationControl-dropdown">
        {render(
          'validation-control-dropdown',
          {
            type: 'dropdown-button',
            btnClassName: 'ae-ValidationControl-dropdown-btn',
            menuClassName: 'ae-ValidationControl-dropdown-menu',
            level: 'link',
            size: 'md',
            icon: 'fa fa-plus',
            label: '',
            tooltip: '添加校验规则',
            placement: 'left',
            align: 'right',
            tooltipTrigger: 'hover',
            closeOnClick: true,
            closeOnOutside: true,
            hideCaret: true,
            disabled: buttons.length === 0,
            buttons,
          },
          {
            key: 'validation-control-dropdown',
            popOverContainer: null,
          },
        )}
      </div>
    )
  }

  /**
   * 规则列表
   */
  renderValidaton() {
    const classPrefix = this.props?.env?.theme?.classPrefix
    const {
      avaliableValids: { defaultValidators, moreValidators, builtInValidators },
      fields,
    } = this.state
    let validators = this.transformValid(this.props.data)
    const rules: ReactNode[] = []
    validators = validators.concat()

    defaultValidators && delete defaultValidators['required']

    // 优先渲染默认的顺序
    Object.keys(defaultValidators).forEach((validName: string) => {
      const data = remove(validators, v => v.name === validName)
      rules.push(
        <ValidationItemRefactor
          fields={fields}
          key={validName}
          validator={defaultValidators[validName]}
          data={data.length ? data[0] : { name: validName }}
          classPrefix={classPrefix}
          isDefault={defaultValidators.hasOwnProperty(validName)}
          onEdit={this.handleEditRule}
          onDelete={this.handleRemoveRule}
          onSwitch={this.handleSwitchRule as any}
        />,
      )
    })

    Object.keys(builtInValidators).forEach((validName: string) => {
      const data = remove(validators, v => v.name === validName)
      rules.push(
        <ValidationItemRefactor
          fields={fields}
          key={validName}
          validator={builtInValidators[validName]}
          data={
            data.length
              ? { ...data[0], isBuiltIn: true }
              : { name: validName, value: true, isBuiltIn: true }
          }
          classPrefix={classPrefix}
          isDefault={builtInValidators.hasOwnProperty(validName)}
          onEdit={this.handleEditRule}
          onDelete={this.handleRemoveRule}
          onSwitch={this.handleSwitchRule as any}
        />,
      )
    })
    const newValidators = validators.filter(item => item.name != 'required')
    // 剩余的按顺序渲染
    if (newValidators.length) {
      newValidators.forEach(valid => {
        const validator = moreValidators[valid.name] || getValidator(valid.name)
        if (!validator) {
          return
        }
        rules.push(
          <ValidationItemRefactor
            fields={fields}
            key={valid.name}
            data={valid}
            classPrefix={classPrefix}
            validator={validator}
            isDefault={defaultValidators.hasOwnProperty(valid.name)}
            onEdit={this.handleEditRule}
            onDelete={this.handleRemoveRule}
            onSwitch={this.handleSwitchRule as any}
          />,
        )
      })
    }

    return (
      <div className="ae-ValidationControl-rules" key="rules">
        {rules}
      </div>
    )
  }
}
