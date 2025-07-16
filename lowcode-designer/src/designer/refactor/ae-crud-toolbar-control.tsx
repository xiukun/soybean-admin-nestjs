import { DSFeature, DSFeatureType, EditorNodeType } from 'amis-editor'
import { CRUDToolbarControl } from 'amis-editor/lib/renderer/crud2-control/CRUDToolbarControl'
import { Button, Icon, TooltipWrapper } from 'amis-ui'
import { i18n } from 'i18n-runtime'

type ActionValue = Extract<DSFeatureType, 'Insert' | 'BulkEdit' | 'BulkDelete'> | 'custom'

interface Option {
  label: string
  value: ActionValue
  nodeId: string
  /** 原始结构 */
  pristine: Record<string, any>
  node?: EditorNodeType
}
export class CRUDToolbarControlRenderer extends CRUDToolbarControl {
  renderHeader() {
    const { classnames: cx, render, env } = this.props
    const options = this.state.options
    const actions = this.collection.concat()

    // options.forEach(item => {
    //   if (actions.includes(item.value)) {
    //     const idx = actions.indexOf(item.value);
    //     if (~idx) {
    //       actions.splice(idx, 1);
    //     }
    //   }
    // });

    const optionValues = options.map(item => item.value)

    return (
      <header className={cx('ae-CRUDConfigControl-header')}>
        <span className={cx('Form-label')}>工具栏</span>
        {render('crud-toolbar-control-dropdown', {
          type: 'dropdown-button',
          closeOnClick: true,
          hideCaret: true,
          level: 'link',
          align: 'right',
          trigger: ['click'],
          popOverContainer: env.getModalContainer ?? this.dom ?? document.body,
          icon: 'column-add',
          label: '添加操作',
          className: cx('ae-CRUDConfigControl-dropdown'),
          disabledTip: {
            content: '暂无可添加操作',
            tooltipTheme: 'dark',
          },
          buttons: actions
            .map((item: any) => ({
              type: 'button',
              label: i18n((DSFeature as any)[item].label),
              disabled: !!~optionValues.findIndex(op => op === item),
              onClick: () => this.handleAddAction(item),
            }))
            .concat({
              type: 'button',
              label: '自定义按钮',
              disabled: false,
              onClick: () => this.handleAddAction('custom'),
            }),
        })}
      </header>
    )
  }
  renderOption(item: Option, index: number) {
    const { classnames: cx, popOverContainer, env } = this.props

    return (
      <li key={index} className={cx('ae-CRUDConfigControl-list-item')}>
        <TooltipWrapper
          tooltip={{
            content: item.label,
            tooltipTheme: 'dark',
            style: { fontSize: '12px' },
          }}
          container={popOverContainer || env?.getModalContainer?.()}
          trigger={['hover']}
          delay={150}
        >
          <div className={cx('ae-CRUDConfigControl-list-item-info')}>
            <span>{i18n(item.label)}</span>
          </div>
        </TooltipWrapper>

        <div className={cx('ae-CRUDConfigControl-list-item-actions')}>
          <Button
            level="link"
            size="sm"
            tooltip={{
              content: '去编辑',
              tooltipTheme: 'dark',
              style: { fontSize: '12px' },
            }}
            onClick={() => this.handleEdit(item)}
          >
            <Icon icon="column-setting" className="icon" />
          </Button>
          <Button level="link" size="sm" onClick={() => this.handleDelete(item, index)}>
            <Icon icon="column-delete" className="icon" />
          </Button>
        </div>
      </li>
    )
  }
}
