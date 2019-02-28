import { h } from 'hyperapp'
import './style.less'

export default function Layout (props, children) {
  return <div class={props.class || 'hym-layout'} {...props}>{children}</div>
}
