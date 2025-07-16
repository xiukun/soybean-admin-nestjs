import ValidationItem from 'amis-editor/lib/renderer/ValidationItem'
import cx from 'classnames'
import { render, SchemaCollection, Switch } from 'amis'
import { i18n } from 'i18n-runtime'
import { getI18nEnabled, tipedLabel } from 'amis-editor'
export default class ValidationItemRefactor extends ValidationItem {
  renderInputControl() {
    const { value, message, checked } = this.state
    const { fields } = this.props
    const i18nEnabled = getI18nEnabled()
    let control: any = []

    if (!checked) {
      return null
    }

    if (this.validator.schema) {
      const newSchema = this.validator.schema.map((item: any) => ({
        ...item,
        label: i18n(item.label),
      }))
      control = control.concat(newSchema as SchemaCollection)
    }

    if (this.validator.message) {
      control.push({
        name: 'message',
        type: i18nEnabled ? 'input-text-i18n' : 'input-text',
        label: tipedLabel('错误提示', `系统默认提示：${this.validator.message}`),
        pipeIn: (_value: string, _data: any) => {
          // value中 $1 会被运算，导致无法正确回显$1。此处从this.props.data中获取该校验项的错误提示
          return this.props.data.message
        },
        placeholder: '默认使用系统定义提示',
      })
    }
    return control.length !== 0 ? (
      <section className={cx('ae-ValidationControl-item-input', 'ae-ExtendMore')}>
        {render(
          {
            type: 'form',
            className: 'w-full',
            wrapWithPanel: false,
            panelClassName: 'border-none shadow-none mb-0',
            bodyClassName: 'p-none',
            actionsClassName: 'border-none mt-2.5',
            wrapperComponent: 'div',
            mode: 'horizontal',
            horizontal: {
              justify: true,
              left: 4,
              right: 8,
            },
            preventEnterSubmit: true,
            submitOnChange: true,
            body: control,
            data: { value, message },
          },
          {
            data: {
              ...this.props.data,
              fields,
            },
            onSubmit: this.handleEdit,
          },
        )}
      </section>
    ) : null
  }
  render() {
    const { classPrefix, data } = this.props
    const { checked, isBuiltIn } = this.state
    return (
      <div
        className={cx('ae-ValidationControl-item', {
          'is-active': checked,
        })}
        key={data.name}
      >
        <section
          className={cx('ae-ValidationControl-item-control', {
            'is-active': checked && data.name !== 'required',
          })}
        >
          <label className={cx(`${classPrefix}Form-label`)}>{i18n(this.validator.label)}</label>
          <div>
            {this.renderActions()}
            <Switch
              key="switch"
              value={checked}
              disabled={isBuiltIn}
              onChange={this.handleSwitch}
            />
          </div>
        </section>

        {this.renderInputControl()}
      </div>
    )
  }
}
