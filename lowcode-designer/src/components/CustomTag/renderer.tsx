import { Tag } from 'amis-ui'
import { createObject, getPropValue } from 'amis-core'
import { resolveVariableAndFilter } from 'amis-core'
import React from 'react'

function AnjiTag(props: any) {
  const { icon, displayMode, color, className, closable, label, style = {} } = props

  function handleClick(nativeEvent: any) {
    const { dispatchEvent, onClick } = props
    const params = getResolvedEventParams()
    dispatchEvent(nativeEvent, params)
    onClick?.(params)
  }

  function handleMouseEnter(e: React.MouseEvent<any>) {
    const { dispatchEvent } = props
    const params = getResolvedEventParams()

    dispatchEvent(e, params)
  }

  function handleMouseLeave(e: React.MouseEvent<any>) {
    const { dispatchEvent } = props
    const params = getResolvedEventParams()

    dispatchEvent(e, params)
  }

  function handleClose(nativeEvent: React.MouseEvent<HTMLElement>) {
    const { dispatchEvent, onClose } = props
    const params = getResolvedEventParams()

    dispatchEvent(
      {
        ...nativeEvent,
        type: 'close',
      },
      params,
    )
    onClose?.(params)
  }

  function resolveLabel() {
    const { label, data } = props
    return getPropValue(props) || (label ? resolveVariableAndFilter(label, data, '| raw') : null)
  }

  function getResolvedEventParams() {
    const { data } = props

    return createObject(data, {
      label: resolveLabel(),
    }) as {
      [propName: string]: any
      label: string
    }
  }

  return (
    <Tag
      className={className}
      displayMode={displayMode}
      color={color}
      icon={icon}
      closable={closable}
      style={style}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClose={handleClose}
    >
      {label}
    </Tag>
  )
}

export default React.forwardRef((props, ref) => <AnjiTag {...props} forwardRef={ref} />)
