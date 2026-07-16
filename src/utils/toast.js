import { notification } from 'antd'
import { backendMessage } from './backendMessage'

notification.config({ placement: 'top', duration: 4, maxCount: 3 })

export const toast = {
  success(message) {
    notification.success({ message, className: 'maylob-toast', placement: 'top' })
  },
  error(message, err) {
    notification.error({
      message,
      description: err ? backendMessage(err, undefined) : undefined,
      className: 'maylob-toast',
      placement: 'top',
    })
  },
}
