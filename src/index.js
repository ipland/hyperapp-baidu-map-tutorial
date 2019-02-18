import { h, app } from 'hyperapp'
import './style.less'

app({}, {}, () => <div>hello world.</div>, document.querySelector('#app'))
